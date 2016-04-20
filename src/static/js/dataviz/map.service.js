angular.module('app')
.service('mapService', ['lodash', function(lodash) {
    var mapService = {};
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
        .attr("class", "map-tooltip")
        .direction("n")
        .offset([-8, 0])
        .html(function(d) {
            return d.properties.NAME;
        })

    mapService.chart = function(container, data){
        // Join data to geojson
        var geoJoinedData = {
            "type" : "FeatureCollection",
            "features" : []
        };
        geoJoinedData.features = TOWNGEOJSON.features.map(function(place) {
            var placeData = lo.find(data, {"town" : place.properties.NAME});
            place.properties.DATA = (undefined === placeData ? {} : placeData)
            return place;
        })

        container = d3.select(container);

        // add bootstrap class to container
        container.classed("row", true);

        // clear container
        container.selectAll("*").remove();

        // More debug output
        // container.append("pre")
        //     // .text(JSON.stringify(geoJoinedData, null, 4))
        //     .text(JSON.stringify(geoJoinedData, null, 4))
        // return;

        // helpful debugging output
        // container.append("pre")
        //     // print out data passed to function
        //     .text(JSON.stringify(data, null, 4));
        // return;

        // Draw containers
        mapContainer = container.append("div")
            .attr("class", function() {
                return [
                    "map-container",
                    "col-xs-12",
                    "col-md-8"
                ].join(" ");
            });

        var table = container.append("div")
            .attr("class", function() {
                return [
                    "table-container",
                    "col-xs-12",
                    "col-md-4"
                ].join(" ");
            })
            .append("table")
            .classed("map-table", true);

        var thead = table.append("thead");
        var tbody = table.append("tbody");
        var tfoot = table.append("tfoot");
        // END Draw containers

        // draw Map
        var container_width = 0.6 * d3.select("div.tab-content").node().getBoundingClientRect().width;
        var width = container_width;

        // Calculate height based on width
        var height = container_width * (0.75);
        // if (container_width <= 350) {
        //     height = container_width * (0.6);
        // } else if (container_width <= 768) {
        //     height = container_width * (0.5);
        // }

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
                bottom: 0.22 * height,
                left : 0.24 * width
            };
        } else if (container_width <= 768) {
            margin = {
                top: 0.05 * height,
                right: 0.05 * width,
                bottom: 0.16 * height,
                left : 0.1 * width
            };
        }

        var svg = mapContainer.append("div")
            .classed("map", true)
            .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", "translate(1, 1)");

        // remove margin from height, width
        height = height - (margin.top + margin.bottom);
        width = width - (margin.left + margin.right);

        var map = svg.append("g")
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

        // map.append("rect")
        //     .attr("height", map.attr("height"))
        //     .attr("width", map.attr("width"))
        //     .attr("fill", "blue")
        //     .attr("stroke", "blue")
        //     .attr("stroke-width", "1px")
        //     .attr("fill-opacity", 0)

        var projection = d3.geo.equirectangular()
                .scale(1)
                .translate([0,0]);
        var path = d3.geo.path().projection(projection);
        var bounds  = path.bounds(geoJoinedData);
        var hscale = (bounds[1][0] - bounds[0][0]) / width;
        var vscale = (bounds[1][1] - bounds[0][1]) / height;
        var scale = 1 / Math.max(hscale, vscale);
        var translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

        projection.scale(scale).translate(translate);

        var colors = d3.scale.ordinal()
            .domain([null, "min", "proportional", "max"])
            .range(d3.range(0,4).map(function(c) { return "color_"+c; }));

        var places = map.selectAll("g")
            .data(geoJoinedData.features)
            .enter()
            .append("g")
                .attr("class", function(d) {
                    return [
                        "mapgroup"
                    ];
                })
                .datum(function(d) { return d; })
                .call(tip);

        places.each(function(placeData) {
            var place = d3.select(this);

            place.append("path")
                .attr("d", path)
                .attr("class", function(d) {
                    return [
                        "mappath",
                        colors((d.properties.DATA["category"] || null))
                    ].join(" ");
                })
                .classed("mappath", true);
        })

        // END draw Map

        // hover events
        places
            .on("mouseover", function(d) {
                // tooltip
                tip.show(d);
            })
            .on("mouseout", function(d) {
                // tooltip
                tip.hide(d);
            })
            .on("click", function(d) {
                // Remove existing data (if any) from table
                table.selectAll("tr")
                    .remove();
                
                // Populate table
                tbody.selectAll("tr")
                    .data(lo.pairs(d.properties.DATA))
                    .enter()
                        .append("tr")
                        .selectAll("td")
                        .data(function(d) { return d; })
                        .enter()
                            .append("td")
                            .text(function(d) { return d; })
            })
        // END hover events
    }

    return mapService;
}])
