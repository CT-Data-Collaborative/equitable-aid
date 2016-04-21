angular.module('app')
.service('dataProcessor', ['$http', 'lodash', function($http, lodash) {
    // --
    // METHODS
    // --
    var lo = lodash;
    var dataProcessor = {};

    dataProcessor.getStateTotals = function(data) {
        var stateTotals = {
           "total_aid" : 0,
           "even_cut_allocation" : 0,
           "sim_allocation" : 0
        };

        lo.keys(stateTotals)
           .map(function(key) {
               stateTotals[key] = lo.chain(data)
                   .map(function(d) {
                       if (key != 'total_aid') {
                            return d[key] * d.population;
                       } else {
                           return d[key];
                       }
                   })
                   .reduce(function(total, value) { return total + value; })
                   .value();
           })

        return stateTotals;
    }

    dataProcessor.processGrantCuts = function(selectedTown, grants) {
        var grantData = {};
        var totalGrant = {
            "Grant" : "Total Aid",
            "FY 15" : 0,
            "Simulated Cut" : 0
        }

        grantData = grants.map(function(grant) {
            totalGrant["FY 15"] += selectedTown.selected.DATA[grant],
            totalGrant["Simulated Cut"] += selectedTown.selected.DATA[grant] * (1 + selectedTown.selected.DATA["per_change"]);

            return {
                "Grant" : grant,
                "FY 15" : selectedTown.selected.DATA[grant],
                "Simulated Cut" : selectedTown.selected.DATA[grant] * (1 + selectedTown.selected.DATA["per_change"])
            }
        })

        grantData.push(totalGrant);

        return grantData.sort(function(a, b) {
            if (a.Grant == "Total Aid") {
                return 1;
            } else if (b.Grant == "Total Aid") {
                return -1;
            } else {
              return (a < b ? 1 : -1)
            }
        });
    }

    return dataProcessor;
}]);