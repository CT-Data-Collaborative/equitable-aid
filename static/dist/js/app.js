var app = angular.module('app', [
    'ngAnimate',
    'ui.bootstrap',
    'ngLodash'
    ]);

angular.module('app')
    .service('calculate', function() {

        return ({
            calculate: calculate
        });


        // ---
        // PUBLIC API
        // --

        function calculate(data, parems) {
            var percent_cut = parems.percent_cut;
            var max_r = parems.max_r;
            var min_r = parems.min_r;
            var max_cut = max_r * percent_cut;
            var min_cut = min_r * percent_cut;
            baseline_per = parems.baseline_per;
            var allocations = data.map(function(x) { return x.total_aid});
            var total_allocation = allocations.reduce(function (prev, curr) {
                    return prev + curr;}) * (1 + percent_cut);
            var gap_array = data.map(function(x) { return x.gap;});
            gap_array.sort(function(a,b) { return b-a;});
            var baseline = percentile(gap_array, baseline_per/100);
            r2 = get_r2(data, baseline, total_allocation, max_cut, min_cut);
            data.forEach(function(e) {
                if (e.category == 'max') {
                    e.per_change = max_cut;
                } else if (e.category == 'min') {
                    e.per_change = min_cut;
                } else {
                    e.per_change = r2 * (e.gap - baseline) / e.allocation - 1;
                }
                e.adj_allocation = e.allocation * (1 + e.per_change );
            });
            return data;
        }


        // ---
        // Helpers
        // ---

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
        response.data.forEach(function(e) {
            e.gap = -e.gap;
        });
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
                percent_cut: -0.1,
                max_r: 2.5,
                min_r: 0.1,
                baseline_per: 10.0
            };
        });

        $scope.$watchCollection(function() {
            return $scope.modelParems;
        }, function() {
            if (typeof($scope.modelParems) != 'undefined') {
                console.log($scope.modelParems);
                $scope.simulatedTowns = $scope.calculate($scope.towns, $scope.modelParems);
                console.log($scope.simulatedTowns);
            }
        });

}]);

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
