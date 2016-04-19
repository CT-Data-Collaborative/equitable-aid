fs = require('fs')

const args = process.argv;

data = JSON.parse(fs.readFileSync(args[2]));

var exclude = ['town', 'planning_region', 'fips'];
data.forEach(function(d) {
    var keys = Object.keys(d);
    var difference = keys.filter(x => exclude.indexOf(x) == -1);
    difference.forEach(function(k) {
        d[k] = +d[k];
    });
});

fs.writeFile(args[3], JSON.stringify(data, null, 4))