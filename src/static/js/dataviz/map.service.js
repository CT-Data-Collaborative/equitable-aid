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

    //var makeTownTable = function(selection, data, makeGrants) {
    //    selection.selectAll("div.town, div.grants").remove();
    //
    //    var townData = [
    //        {"title" : "FY15 Aid", "value" : currencyFormat(data["total_aid"])},
    //        {"title" : "Even Cut Allocation", "value" : currencyFormat(data["even_cut_allocation"])},
    //        {"title" : "Simulated Allocation", "value" : currencyFormat(data["sim_allocation"])},
    //        {"title" : "Simulated Percent Cut", "value" : changeFormat(data["per_change"])},
    //        {"title" : "Category", "value" : data["category"]}
    //    ];
    //
    //    var town = selection.append("div")
    //        .classed({
    //            "town" : true/*,
    //            "col-xs-6" : true,
    //            "col-sm-4" : true*/
    //        })
    //        .attr("data-town", data["town"]);
    //
    //    town.append("h4")
    //        .text(data["town"]);
    //
    //    town.selectAll("p")
    //        .data(townData)
    //        .enter()
    //        .append("p")
    //            .selectAll("span")
    //            .data(function(d) {
    //                return lo.values(d);
    //            })
    //            .enter()
    //            .append("span")
    //                .text(function(d) { return d; })
    //
    //    // accumulator for grant totals
    //    var grantTotal = 0;
    //
    //    var grantData = [
    //        "Colleges & Hospitals PILOT",
    //        "DECD PILOT Grant",
    //        "DECD Tax Abatement",
    //        "Disability Exemption",
    //        "Elderly Circuit Breaker",
    //        "Elderly Freeze",
    //        "LoCIP",
    //        "Pequot Grants",
    //        "State Property PILOT",
    //        "Town Aid Road",
    //        "Veterans' Exemption"
    //    ].map(function(grant) {
    //        grantTotal += data[grant];
    //        return {
    //            "Grant" : grant,
    //            "FY 15" : currencyFormat(data[grant]),
    //            "Simulated Cut" : currencyFormat(data[grant] * (1 + data["per_change"]))
    //        }
    //    })
    //
    //    grantTotal = {
    //        "Grant" : "Total",
    //        "FY 15" : currencyFormat(grantTotal),
    //        "Simulated Cut" : currencyFormat(grantTotal * (1 + data["per_change"]))
    //    };
    //
    //    grantData.push(grantTotal);
    //
    //    var grantCols = [
    //        "Grant",
    //        "FY 15",
    //        "Simulated Cut"
    //    ];
    //
    //    var grants = selection.append("div")
    //        .classed({
    //            "grants" : true/*,
    //            "col-xs-12" : true,
    //            "col-sm-4" : true*/
    //        });
    //
    //    grants.append("h4")
    //        .text(data["town"] + " Grants");
    //
    //    grantTable = grants.append("table")
    //        .classed("ctdata-table", true);
    //    grantThead = grantTable.append("thead");
    //    grantTbody = grantTable.append("tbody");
    //
    //    grantThead.append("tr")
    //        .selectAll("th")
    //        .data(grantCols)
    //        .enter()
    //            .append("th")
    //            .classed("col-name", true)
    //            .text(function(d) { return d; })
    //
    //    grantTbody.selectAll("tr")
    //        .data(grantData)
    //        .enter()
    //            .append("tr")
    //            .datum(function(d) { return d; })
    //            .each(function(rowData) {
    //                var row = d3.select(this);
    //
    //                row.selectAll("td")
    //                    .data(grantCols)
    //                    .enter()
    //                    .append("td")
    //                        .attr("class", function(d, i) {
    //                            return (i === 0 ? "name" : "value");
    //                        })
    //                        .text(function(d) { return rowData[d]; })
    //            });
    //}
    // Declare custom dispatch. We will need to bind this back to
    // the mapService.chart function before returning mapService
    var dispatch = d3.dispatch('customClick');
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

        // if there is already a table drawn, we don't want to lose that
        // get town and redraw "table"
        //var tableTown = d3.select("div.table-container div.town");
        //if (tableTown.size() > 0) {
        //    var tableTown = tableTown.attr("data-town");
        //} else {
        //    tableTown = false;
        //}

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
                    "col-sm-8",
                    "col-xs-12"
                ].join(" ");
            });

        var legend = mapContainer.append("div")
            .classed("legend-container", true)
                .append("div")
                .classed("legend", true);

        //var table = container.append("div")
        //    .attr("class", function() {
        //        return [
        //            "table-container",
        //            "col-sm-4",
        //            "col-xs-12"
        //        ].join(" ");
        //    });
        // END Draw containers

        // draw Map
        var container_width = 0.6 * d3.select("div.tab-content").node().getBoundingClientRect().width;
        var width = container_width;

        // Calculate height based on width
        var height = container_width * (0.5);
        // if (container_width <= 350) {
        //     height = container_width * (0.6);
        // } else if (container_width <= 768) {
        //     height = container_width * (0.5);
        // }

        var margin = {
            top: 0.05 * height,
            right: 0.05 * width,
            bottom: 0.05 * height,
            left : 0.05 * width
        };

        // if (container_width <= 350) {
        //     margin = {
        //         top: 0.05 * height,
        //         right: 0.08 * width,
        //         bottom: 0.22 * height,
        //         left : 0.24 * width
        //     };
        // } else if (container_width <= 768) {
        //     margin = {
        //         top: 0.05 * height,
        //         right: 0.05 * width,
        //         bottom: 0.16 * height,
        //         left : 0.1 * width
        //     };
        // }

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

        // draw legend
        legend.append("h5")
            .classed("legend-title", true)
            .text("Category");

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
                        .text(entryData);
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
                    return [
                        "mappath",
                        colors((d.properties.DATA["category"] || null))
                    ].join(" ");
                })
                .classed("mappath", true);
        })

        // END draw Map

        // Draw "table"
        // State values
        //var stateValues = [
        //    {"key" : "total_aid", "title" : "FY15 Aid", "value" : 0},
        //    {"key" : "even_cut_allocation", "title" : "Even Cut Allocation", "value" : 0},
        //    {"key" : "sim_allocation", "title" : "Simulated Allocation", "value" : 0}
        //];

        //stateValues = lo.chain(stateValues)
        //    .map(function(o) {
        //        o.value = lo.chain(data)
        //            .map(function(d) { return d[o.key]; })
        //            .reduce(function(total, value) { return total + value; })
        //            .value();
        //
        //        o.value = currencyFormat(o.value);
        //
        //        return o;
        //    })
        //    .value()

        //var state = table.append("div")
        //    .classed({
        //        "state" : true/*,
        //        "col-xs-6" : true,
        //        "col-sm-4" : true*/
        //    });
        //
        //state.append("h4")
        //    // .text("Connecticut Totals");
        //    .text("Connecticut Totals");

        //state.selectAll("p")
        //    .data(stateValues)
        //    .enter()
        //        .append("p")
        //        .selectAll("span")
        //        .data(function(d) { return [d.title, d.value]; })
        //        .enter()
        //        .append("span")
        //            .text(function(d) { return d; })

        // Town values - only if we have a town already
        //if (false !== tableTown) {
        //    var townData = lo.find(data, {"town" : tableTown});
        //
        //    table.call(makeTownTable, townData);
        //}
        // END Draw "table"

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
                // TODO Add click handler to deactive town
                // add highlight to town
                d3.selectAll("path.highlight")
                    .classed("highlight", false);

                d3.select(this)
                    .selectAll("path.mappath")
                    .classed("highlight", true);

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
