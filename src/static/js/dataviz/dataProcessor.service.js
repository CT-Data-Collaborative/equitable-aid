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
                   .map(function(d) { return d[key]; })
                   .reduce(function(total, value) { return total + value; })
                   .value();
           })

        return stateTotals;
    }

    dataProcessor.processGrantCuts = function(selectedTown) {
        var grantData = {};

        [
            "Colleges & Hospitals PILOT",
            "DECD PILOT Grant",
            "DECD Tax Abatement",
            "Disability Exemption",
            "Elderly Circuit Breaker",
            "Elderly Freeze",
            "LoCIP",
            "Pequot Grants",
            "State Property PILOT",
            "Town Aid Road",
            "Veterans' Exemption",
            "total_aid"
        ].map(function(grant) {
            grantData[grant] = {
                "FY 15" : selectedTown.selected.DATA[grant],
                "Simulated Cut" : selectedTown.selected.DATA[grant] * (1 + selectedTown.selected.DATA["per_change"])
            }
        })

        return grantData;
    }

    return dataProcessor;
}]);