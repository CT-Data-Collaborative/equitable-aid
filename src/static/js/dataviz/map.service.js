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

    function toggleTowns(oldTown, newTown) {
        var allTowns = d3.selectAll("path.mappath");

        // if no old town - lowlight all, highlight new
        if (oldTown.size() === 0) {
            allTowns.classed({
                "highlight" : false,
                "lowlight" : true
            });

            newTown.classed({
                "highlight" : true,
                "lowlight" : false
            });
        } else if (oldTown.attr("data-town") !== newTown.attr("data-town")) {
            // if old town != new town - lowlight old, highlight new
            oldTown.classed({
                "highlight" : false,
                "lowlight" : true
            });

            newTown.classed({
                "highlight" : true,
                "lowlight" : false
            });
        } else {
            // if old town == new town - remove all highlight/lowlight
            allTowns.classed({
                "highlight" : false,
                "lowlight" : false
            });
        }
    }


    // Declare custom dispatch. We will need to bind this back to
    // the mapService.chart function before returning mapService
    var dispatch = d3.dispatch('customClick');
    mapService.chart = function(container, data, selectedTown){
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


        // clear container
        container.selectAll("*").remove();

        // Draw containers
        mapContainer = container.append("div")
            .attr("class", function() {
                return [
                    "map-container"
                ].join(" ");
            });

        var legend = mapContainer.append("div")
            .classed("legend-container", true)
                .append("div")
                .classed("legend", true);


        // draw Map
        var container_width = $(container.node()).actual('width');
        var width = container_width * 1.25;

        // Calculate height based on width
        var height = container_width * (0.5);

        var margin = {
            top: 0.05 * height,
            right: 0.05 * width,
            bottom: 0.05 * height,
            left : 0.05 * width
        };



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
        var translate = [(width/1.5 - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

        projection.scale(scale).translate(translate);

        var colors = d3.scale.ordinal()
            .domain([null, "min", "proportional", "max"])
            .range(d3.range(0,4).map(function(c) { return "color_"+c; }));

        // draw legend
        //legend.append("h5")
        //    .classed("legend-title", true)
        //    .text("Category");

        legend.selectAll("div.legend-entry")
            .data(["min", "proportional", "max"])
            .enter()
            .append("div")
                .classed("legend-entry", true)
                .datum(function(d) { return d; })
                .each(function(entryData) {
                    var entry = d3.select(this);

                    entry.append("span")
                        .attr("class", function() {
                            return [
                                "color",
                                colors(entryData)
                            ].join(" ");
                        })

                    entry.append("span")
                        .classed("title", true)
                        .append("p").text(entryData);
                })

        var places = map.selectAll("g.mapgroup")
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
                    var classes = [
                        "mappath",
                        colors((d.properties.DATA["category"] || null))
                    ];

                    // If there is a town already selected (ie this is a redraw due to screen size change etc)
                    // add the appropriate highlight/lowlight classes
                    if (selectedTown.selected.NAME !== "") {
                        if (selectedTown.selected.NAME == d.properties.NAME) {
                            classes.push("highlight");
                        } else {
                            classes.push("lowlight");
                        }
                    }

                    return classes.join(" ");
                })
                .attr("data-town", function(d) {
                    return d.properties.NAME;
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
            // If we didn't need to do additional path highlighting
            // we register our custom dispatch like so...
            //.on("click", dispatch.customClick);
            .on("click", function(d) {
                // handle highlight/lowlight 
                var oldTown = d3.selectAll("path.highlight");
                var newTown = d3.select(this)
                    .selectAll("path.mappath");

                toggleTowns(oldTown, newTown);

                // Call our custom dispatch method and pass the town
                // object up to our angular directive
                dispatch.customClick(d);
                //table.call(makeTownTable, townData);
            })
        // END hover events
    }
    // Register our dispatch method that we declared at the start
    d3.rebind(mapService.chart, dispatch, 'on');
    return mapService;
}])
