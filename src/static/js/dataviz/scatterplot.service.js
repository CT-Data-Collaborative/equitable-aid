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
    var shortCurrencyFormat = d3.format("$.0s");
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

        legend.append("h5")
            .classed("legend-title", true)
            .text("Legend");

        legendEntries = legend.selectAll("div.legend-entry")
            .data(["Allocation", "Sim. Allocation", "Even Cut Allocation"])
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
        var container_width = $(container.node()).actual('width')
        var width = container_width;

        // Calculate height based on width
        var height = container_width * (0.30);
        if (container_width <= 350) {
            height = container_width * (0.6);
        } else if (container_width <= 768) {
            height = container_width * (0.5);
        }

        var margin = {
            top: 0.05 * height,
            right: 0.05 * width,
            bottom: 0.1 * height,
            left : 0.05 * width
        };

        if (container_width <= 350) {
            margin = {
                top: 0.05 * height,
                right: 0.08 * width,
                bottom: 0.28 * height,
                left : 0.24 * width
            };
        } else if (container_width <= 768) {
            margin = {
                top: 0.05 * height,
                right: 0.05 * width,
                bottom: 0.24 * height,
                left : 0.1 * width
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

        /*if (container_width <= 350) {
            xAxis
                .ticks(4)
                .tickFormat(shortCurrencyFormat);
        } else */if (container_width <= 500) {
            xAxis
                .ticks(4)
                .tickFormat(shortCurrencyFormat);
        }

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
                        return [
                            o["allocation"],
                            o["sim_allocation"],
                            o["even_cut_allocation"]
                        ]
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

        if (container_width <= 767) {
            xAxisTitle
                .attr("dy", 34)
        }

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(currencyFormat);

        if (container_width <= 350) {
            yAxis
                .ticks(4)
                // .tickFormat(shortCurrencyFormat);
        }/* else if (container_width <= 769) {
            yAxis
                .ticks(4)
                .tickFormat(shortCurrencyFormat);
        }*/

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
            .data(["Allocation", "Even Cut Allocation", "Sim. Allocation"])
            .enter()
                .append("g")
                .classed("point-group", true)
                .datum(function(d) {
                    return d;
                });


            //console.log(y.domain())
            //console.log(y.range())


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
