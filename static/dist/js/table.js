function tableChart() {
    // Vars
    var colspan = null;
    var formatters = {
        "String" : function(val) {return val; },
        "string" : function(val) {return val; },
        "Rating": function(val) {return val },
        "Area": function(val) { return val + " sq. mi."},
        "Currency" : d3.format("$,.0f"),
        "Ratio": d3.format((",2f")),
        "Number" : d3.format(",0f"),
        "Decimal" : d3.format(",2f"),
        "Percent" : d3.format(".1%")
    };

    function chart(selection) {
        selection.each(function(dataset) {
            // console.log(dataset);
            var table = d3.select(this).select("table").remove();
            var config = dataset['config'];
            var rawdata = dataset['data'];
            var grouping = config.grouping;
            // var grouping = ['Variable'];
            nestedData = d3.nest();
            grouping.forEach(function(key) {
                nestedData.key(function (d) { return d[key]; });
            });
            var data = nestedData.entries(rawdata);
            if (data.length > 0) {
                if (grouping.length > 1) {
                    // Sort Nested

                    // Sort the inner most object for each column
                    data.forEach(function(o) {
                        // console.log(o);
                        var key = o.key;
                        var values = o.values;
                        values = values.forEach(function(vals) {
                            vals.values = vals.values.sort(function(a,b) {
                                if (a.Geotype=='Town') {
                                    return -1;
                                } else if (a.Geotype=='County') {
                                    return 1;
                                } else if (a.Geotype=='State') {
                                    return 1000;
                                }
                            });
                        });
                        return {'key': key, 'values': values}
                    });

                    // Stick Totals at the end
                    data.sort(function(a,b) {
                        if (a.key == 'Total') {
                            return 1000;
                        } else {
                            var akey = a.key.split(' ')[0];
                            var bkey = b.key.split(' ')[0];
                            return akey - bkey;
                        }
                    });

                    // Set up the column names
                    var columns = [{'value':'', 'colspan': 1}];
                    data.forEach(function(r) {
                        if (r.key=='Total') {
                            columns.push({'value': r.key, 'colspan': 1})
                        } else {
                            columns.push({'value': r.key, 'colspan': 2})
                        }
                        return r
                    });

                    // Pull out the totals in order to generate percentages
                    var totals = {};
                    data.forEach(function(r) {
                        if (r.key=='Total') {
                            var totalVals = r.values[0].values;
                            totalVals.forEach(function(t) {
                                totals[t.Geo] = +t.Value;
                            });
                        }
                    });

                    // Alternate Row Generation - should be faster - 13ms
                    var rows = {};
                    data[0].values[0].values.forEach(function(r){
                        rows[r.Geo] = [{'value': r.Geo, type: 'string', colspan: 1}];
                    });

                    data.forEach(function(col) {
                        var vals = col.values[0];
                        vals.values.forEach(function(c) {
                            rows[c.Geo].push({'value': +c.Value, type: c['Measure Type'], colspan: 1});
                            if (!(col.key == 'Total')) {
                                rows[c.Geo].push({'value': +c.Value/totals[c.Geo], type: 'Percent', colspan: 1});
                            } else {}
                        });
                    });
                    var rowData = Object.keys(rows).map(function(r) { return rows[r]});

                    var table = d3.select(this).append('table').attr("class", "profile-table");

                    // var thead = table.append('thead');
                    var tbody = table.append('tbody');

                    tbody.append('tr')
                      .selectAll('th').data(columns).enter()
                      .append('th')
                      .attr("class", "col-name")
                      .attr("colspan", function(c) { return c.colspan;})
                      .text(function(d) { return d.value;});

                    var rows = tbody.selectAll('tr')
                      .data(rowData).enter()
                      .append('tr');

                    var cells = rows.selectAll('td')
                        .data(function(r) {
                            return r.map(function(c) {
                                // console.log(c);
                                return {'variable': c.name, 'value': c.value, 'type': c.type}
                            });
                        })
                        .enter().append('td')
                        .attr("class", function(c) {
                            // console.log(c);
                            if (c.type == "String") {
                                return "name";
                            } else {
                                return "value"
                            }
                        })
                        .html(function(c) {
                            var val = c.value;
                            var type = c.type;
                            return (formatters[type](val));
                        });

                } else {
                    data.forEach(function(o) {
                        o.values = o.values.sort(function(a,b) {
                            if (a.Geotype=='Town') {
                                return -1;
                            } else if (a.Geotype=='County') {
                                return 1;
                            } else if (a.Geotype=='State') {
                                return 1000;
                            }
                        });
                    });
                    // console.log(data);
                    var columns = [''];
                    data.forEach(function(r) {
                        r.values.forEach(function(c) {
                            g = c.Geo;
                            var inCol = false;
                            columns.forEach(function(col) {
                                if (col==g) {
                                    inCol = true;
                                }
                            });
                            if (inCol===false) {
                                columns.push(g);
                            }
                        });
                    });

                    // console.log(columns);

                    var rowData = [];
                    data.forEach(function(v) {
                        row = [];
                        row.push({'name': 'Variable', 'value': v.key, 'type': 'string'});
                        v.values.forEach(function(r) {
                            var o = {};
                            o['name'] = r.Geo;
                            o['value'] = +r.Value;
                            o['type'] = r['Measure Type'];
                            row.push(o);
                        });
                        rowData.push(row);
                    });
                    var table = d3.select(this).append('table').attr("class", "profile-table");

                    // var thead = table.append('thead');
                    var tbody = table.append('tbody');

                    tbody.append('tr')
                      .selectAll('th').data(columns).enter()
                      .append('th')
                      .attr("class", "col-name")
                      .text(function(d) { return d;});

                    var rows = tbody.selectAll('tr')
                      .data(rowData).enter()
                      .append('tr');

                    var cells = rows.selectAll('td')
                        .data(function(r) {
                            return r.map(function(c) {
                                // console.log(c);
                                return {'variable': c.name, 'value': c.value, 'type': c.type}
                            });
                        })
                        .enter().append('td')
                        .attr("class", function(c) {
                            // console.log(c);
                            if (c.variable == "Variable") {
                                return "name";
                            } else {
                                return "value"
                            }
                        })
                        .html(function(c) {
                            var val = c.value;
                            var type = c.type;
                            // console.log(type);
                            if (type == "Percent") {
                                val = val / 100;
                            }
                            return (formatters[type](val));
                        });
                }
            } else {
                console.log("no data yet");
            }
        });
    }
    return chart;
}
