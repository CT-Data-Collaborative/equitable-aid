angular.module('app')
    .service('calculate', function() {

        var calcObj = {calculate: calculate};
        return (calcObj);


        // ---
        // PUBLIC API
        // --

        function calculate(data, parems) {
            var percent_cut = parems.percent_cut/-100;
            var max_cut = parems.max_cut/-100;
            var min_cut = parems.min_cut/-100;
            baseline_per = 100 - parems.baseline_per;
            var allocations = data.map(function(x) { return x.total_aid});
            var total_allocation = allocations.reduce(function (prev, curr) {
                    return prev + curr;}) * (1 + percent_cut);
            var gap_array = data.map(function(x) { return x.gap;});
            gap_array.sort(function(a,b) { return b-a;});
            var baseline = percentile(gap_array, baseline_per/100);
            calcObj.baseline = baseline;
            r2 = get_r2(data, baseline, total_allocation, max_cut, min_cut);
            data.forEach(function(e) {
                if (e.category == 'max') {
                    e.per_change = max_cut;
                } else if (e.category == 'min') {
                    e.per_change = min_cut;
                } else {
                    e.per_change = r2 * (e.gap - baseline) / e.allocation - 1;
                }
                e.sim_allocation = e.allocation * (1 + e.per_change );
                e.sim_allocation_difference = e.sim_allocation - e.allocation;
                e.even_cut_allocation = e.allocation * (1 + percent_cut);
                e.even_cut_allocation_difference = e.even_cut_allocation - e.allocation;
                e.sim_better = (e.sim_allocation - e.even_cut_allocation) >= 0;
            });
            return data;
        }


        // ---
        // Helpers
        // ---

        function isBetter(v) {
            if(v <= 0) {
                return false;
            } else {
                return true;
            }
        }
        function percentile(arr, p) {
            if (arr.length === 0) return 0;
            if (typeof p !== 'number') throw new TypeError('p must be a number');
            if (p <= 0) return arr[0];
            if (p >= 1) return arr[arr.length - 1];

            var index = arr.length * p,
                lower = Math.floor(index),
                upper = lower + 1,
                weight = index % 1;

            if (upper >= arr.length) return arr[lower];
            return arr[lower] * (1 - weight) + arr[upper] * weight;
        }


        function categorize(town, baseline, max_cut, min_cut, r2) {
            if (typeof r2 == 'undefined') {
                if (town.gap <= baseline) {
                    return 'max';
                } else {
                    return 'proportional';
                }
            }
            else {
                var per_change = ((r2 * (town.gap - baseline)) / town.allocation) - 1;
                if ((town.gap <= baseline) || (per_change < max_cut)) {
                    return 'max';
                } else if ((town.gap > baseline) && (per_change >= min_cut)) {
                    return 'min';
                } else {
                    return 'proportional';
                }
            }
        }

        function town_filter(comparator) {
            "use strict";
            return function(element) {
                return (element.category == comparator);
            };
        }

        function sum_towns(type) {
            return function(towns, threshold) {
                var filtered_towns = towns.filter(town_filter(type));
                var aid = filtered_towns.map(function (e) {
                    return (1 + threshold) * e.total_aid;
                });
                return aid.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0);
            };
        }


        function get_proportional_cut(towns, baseline) {
            var prop_towns = towns.filter(town_filter('proportional'));
            var aid = prop_towns.map(function(e) {
                return (e.gap - baseline) * e.population;
            });
            return aid.reduce(function(prev, curr) {
                return prev + curr;
            }, 0);
        }

        function calc_r(towns, total_allocation, max_cut, min_cut, baseline) {
            "use strict";
            return (total_allocation - sum_towns('max')(towns, max_cut) - sum_towns('min')(towns, min_cut)) / get_proportional_cut(towns, baseline);
        }

        function get_r2(data, baseline, total_allocation, max_cut, min_cut) {
            data.forEach(function(e) {
                e.category = categorize(e, baseline);
            });
            var init_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
            data.forEach(function(e) {
                e.category = categorize(e, baseline, max_cut, min_cut, init_r2);
            });
            var new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
            data.forEach(function(e) {
                e.category = categorize(e, baseline, max_cut, min_cut, new_r2);
            });
            return new_r2;
        }
    });
angular.module('app')
.service('townData', function($http) {
    // --
    // METHODS
    // --

    var dataProvider = {};

    dataProvider.loadData = function() {
        var request = $http({
            method: "get",
            url: '../data/data.json'
        });
        return( request.then(handleSuccess, handleError) );
    };

    function handleError( response ) {
        // The API response from the server should be returned in a
        // nomralized format. However, if the request was not handled by the
        // server (or what not handles properly - ex. server error), then we
        // may have to normalize it on our end, as best we can.
        if (
            ! angular.isObject( response.data ) ||
            ! response.data.message
        ) {
            return( $q.reject( "An unknown error occurred." ) );
        }
        // Otherwise, use expected error message.
        return( $q.reject( response.data.message ) );
    }

    function handleSuccess( response ) {
        return( response.data );
    }
    return dataProvider;
});
angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'calculate',
    function($scope, $http, $log, lodash, townData, calculate){
        var lo = lodash;
        $scope.calculate = calculate.calculate;

        var dataPromise = townData.loadData();
        dataPromise.then(function(results) {
            $scope.towns = results;
            $scope.modelParems = {
                percent_cut: 10,
                max_cut: 15,
                min_cut: 5,
                baseline_per: 20.0
            };
        });

        $scope.$watchCollection(function() {
            return $scope.modelParems;
        }, function() {
            if (typeof($scope.modelParems) != 'undefined') {
                $scope.simulatedTowns = $scope.towns
                $scope.simulatedTowns = $scope.calculate($scope.simulatedTowns, $scope.modelParems);
                $scope.baseline = calculate.baseline;
            }
        });

}]);

angular.module('app').filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
        return $filter('number')(input * 100, decimals) + '%';
    };
}]);
angular.module('app')
.directive('scatterplot', ['$window', 'scatterplotService', function($window, scatterplotService) {
    var chart = scatterplotService.chart;

    return  {
        restrict: 'E',
        scope: {
            data: "=data"
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                if (undefined !== scope.data && scope.data.length > 0) {
                    chart(element[0], scope.data);
                }
            }
            
            scope.$watch('data', function(data) {
                scope.render();
            }, true);

            $window.onresize = scope.render;
        }
    }
}])

angular.module('app')
.service('scatterplotService', ['lodash', function(lodash) {
    var scatterplotService = {};
    var lo = lodash;

    var sluggify = function(text) {
        if (d3.range(0,10).indexOf(text.slice(0,1)) !== -1) {
            text = "_" + text;
        }

        return text
            .toLowerCase()
            .replace(/[^0-9a-zA-Z_-]/ig, "_")
            .replace(/_+/ig, "_");
    }

    var currencyFormat = d3.format("$,.0f");
    var percentFormat = d3.format(",.0%");
    var changeFormat = function(val) {
        if (val > 0) {
            return "+" + percentFormat(val);
        } else {
            return percentFormat(val);
        }
    };

    var tip = d3.tip()
        .attr("class", "scatterplot-tooltip")
        .direction("n")
        .offset([-8, 0])
        .html(function(d) {
            var content = [
                d["town"],
                "Category: " + d["category"],
                "Gap: " + currencyFormat(d["gap"])
            ];

            if (d["type"] != "Allocation") {
                // calculate and append percent change
                var change = (d[sluggify(d["type"])] / d["allocation"]) - 1;
                content.push(
                    d["type"] + ": " + currencyFormat(d[sluggify(d["type"])]) + " (" + changeFormat(change) + ")"
                );
            } else {
                content.push(d["type"] + ": " + currencyFormat(d[sluggify(d["type"])]));
            }

            return content.join("<br/>");
        })

    scatterplotService.chart = function(container, data){
        container = d3.select(container);

        // clear container
        container.selectAll("*").remove();

        // helpful debugging output
        // container.append("pre")
        //     // print out data passed to function
        //     .text(JSON.stringify(data, null, 4));
        // return;


        // Draw legend
        var legend = container.append("div")
            .classed("legend-container", true)
            .append("div")
                .classed("legend", true);

        legendEntries = legend.selectAll("div.legend-entry")
            .data(["Allocation", "Adj. Allocation"])
            .enter()
            .append("div")
                .attr("class", function(d) {
                    return [
                        "legend-entry",
                        sluggify(d)
                    ].join(" ");
                })

        legendEntries.each(function(d) {
            d3.select(this).append("span")
                .attr("class", function(d) {
                    return [
                        "color",
                        sluggify(d)
                    ].join(" ");
                })

            d3.select(this).append("span")
                .classed("title", true)
                .text(d);
        });
        // END draw legend

        // draw Chart
        var container_width = d3.select("div.tab-content").node().getBoundingClientRect().width;
        var width = container_width;
        var height = container_width * (0.45);

        var margin = {
            top: 0.05 * height,
            right: 0.05 * width,
            bottom: 0.1 * height,
            left : 0.05 * width
        };

        if (container_width < 768) {
            margin = {
                top: 0.05 * height,
                right: 0.05 * width,
                bottom: 0.15 * height,
                left : 0.1 * width
            };
        } if (container_width < 350) {
            margin = {
                top: 0.05 * height,
                right: 0.05 * width,
                bottom: 0.2 * height,
                left : 0.18 * width
            };
        }

        var svg = container.append("div")
            .classed("chart", true)
            .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", "translate(1, 1)");

        // remove margin from height, width
        height = height - (margin.top + margin.bottom);
        width = width - (margin.left + margin.right);

        var chart = svg.append("g")
            .attr("height", height)
            .attr("width", width)
            .attr("transform", "translate(" + margin.left + ", " + margin.top +")");

        // // debug code - draws red rectangle around svg, blue rect around chart
        // svg.append("rect")
        //     .attr("height", svg.attr("height"))
        //     .attr("width", svg.attr("width"))
        //     .attr("fill", "red")
        //     .attr("stroke", "red")
        //     .attr("stroke-width", "1px")
        //     .attr("fill-opacity", 0)

        // chart.append("rect")
        //     .attr("height", chart.attr("height"))
        //     .attr("width", chart.attr("width"))
        //     .attr("fill", "blue")
        //     .attr("stroke", "blue")
        //     .attr("stroke-width", "1px")
        //     .attr("fill-opacity", 0)

        var x = d3.scale.linear()
            .range([0, width])
            .domain(d3.extent(
                data.map(function(o) {
                        return o["gap"];
                    })
            ))
            .nice();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(currencyFormat);

        xAxis = chart.append("g")
            .classed({
                "axis" : true,
                "xAxis" : true
            })
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis);

        var y = d3.scale.linear()
            .range([height, 0])
            .domain(d3.extent(
                lo.chain(data)
                    .map(function(o) {
                        return [o["allocation"], o["adj_allocation"]]
                    })
                    .flatten()
                    .value()
            ))
            .nice();

        var xAxisTitle = xAxis.append("text")
            .attr("dx", width)
            .attr("dy", -6)
            .attr("text-anchor", "end")
            .text("Per Capita Gap");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(currencyFormat);

        var yAxis = chart.append("g")
            .classed({
                "axis" : true,
                "yAxis" : true
            })
            .call(yAxis);

        var yAxisTitle = yAxis.append("text")
            .attr("dx", 6)
            .attr("dy", 8)
            .text("Per Capita Aid");

        // draw points
        var pointGroups = chart.selectAll("g.point-group")
            .data(["Allocation", "Adj. Allocation"])
            .enter()
                .append("g")
                .classed("point-group", true)
                .datum(function(d) {
                    return d;
                });

            pointGroups.each(function(pointType, pointGroupIndex) {
                group = d3.select(this);
                pointData = data.map(function(d) {
                    return lo.extend({"type" : pointType}, d);
                })

                group.selectAll("path.point")
                    .data(pointData)
                    .enter()
                    .append("path")
                        .attr("class", function(d) {
                            return [
                                "point",
                                sluggify(pointType)
                            ].join(" ");
                        })
                        .attr("d", d3.svg.symbol("circle").size(18))
                        .attr("transform", function(d) {
                            return "translate(" + x(d["gap"]) + ", "+ y(d[sluggify(pointType)]) +")";
                        })
                        .call(tip)
                        .on("mouseover", tip.show)
                        .on("mouseout", tip.hide);
            });

        // END draw Chart
    }

    return scatterplotService;
}])

angular.module('app')
.directive('simpletable', function() {
    // This function should reflect whatever your d3 table function is called.
    var chart = tableChart();
    return  {
        restrict: 'E',
        scope: {
            data: "=data" // We can call this w/e we want.
        },
        link: function(scope, element, attrs) {
            scope.$watchCollection('data', function(data) {
                d3.select(element[0]).datum(data).call(chart);
            });
        }
    }
})
>>>>>>> Changed js/css script inclusions to point to npm installed packages. will remove bower folder later. Augmented index.html so that more screen real estate is used for output and less for the form - will also collapse to full width rows around ipad screen size. Implemented angular-ui-bootstrap based pill nav to toggle between table and scatterplot, and other panes in the future. Added scatterplot directive, service, and scss files.:static/dist/js/app.js
