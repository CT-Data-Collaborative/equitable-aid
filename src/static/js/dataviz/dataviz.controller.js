angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'dataProcessor', 'percalculate',
    function($scope, $http, $log, lodash, townData, dataProcessor, percalculate){
        var lo = lodash;


        $scope.gaptooltiptext = "The municipal gap is the difference between a municipalities capacity to raise revenue and its costs. Capacity is determined by multiplying equalized net grand list by the standard mill rate. Gap is not a reflection of actual spending and revenue, rather it is a measure of the underlying structures in a given municipality.";


        // Need to nest actual town data object one level deeper than expected
        // to handle directive scoping issues. See comments in directive for more.
        $scope.selectedTown = {selected: {DATA: {}, NAME: '', FIPS: ''}};

        // Keep list of grants in one place
        $scope.grants = [
            "Colleges & Hospitals PILOT",
            "DECD PILOT Grant",
            "DOH Tax Abatement",
            "Disability Exemption",
            "Elderly Circuit Breaker",
            "Elderly Freeze",
            "LoCIP",
            "Pequot Grants",
            "State Property PILOT",
            "Town Aid Road",
            "Veterans' Exemption"
        ];

        // -----------------------------------------
        // Vars and functions for handling calculation type
        // -----------------------------------------
        $scope.percalculate = percalculate.calculate;

        var dataPromise = townData.loadData();
        dataPromise.then(function(results) {
            $scope.towns = results;

            // Gap sliders depend on data from this dataset.
            var gap_array = $scope.towns.map(function(x) { return x.gap;});
            $scope.gapSliderOptions = {
                min: lo.min(gap_array),
                max: lo.max(gap_array),
                step: 1,
                precision: 1,
                range: false,
                value: 0
            };

            // Initial previous year aid total
            $scope.total_aid = lo
                .chain($scope.towns)
                .map(function(t) { return t.total_aid;})
                .reduce(function(sum, n) { return sum+n }, 0)
                .value();

            // mimimum aid
            $scope.statewide_minimum_aid = lo
                .chain($scope.towns)
                .map(function(t) { return t.allocation;})
                .min()
                .value();

            $scope.total_population = lo
                .chain($scope.towns)
                .map(function(t) { return t.population; })
                .reduce(function(sum, n) { return sum+n}, 0)
                .value();

            // Initialize aid cut at 20% to correspond with values set in sliders.
            // TODO Refactor this to use common value for multiplier
            $scope.total_aid_cut = $scope.total_aid - ($scope.total_aid * 0.8);

            // Initial values for percent cut model. These models correspond to values
            // being set within the sliders. Need to tie these together more directly
            $scope.percentModelParems = {
                percent_cut: 20,
                max_cut: 25,
                min_cut: 5,
                gap_cutoff: 0
            };
        });
        // -----------------------------------------
        // End data load
        // -----------------------------------------

        // -----------------------------------------
        // Sort Data
        // -----------------------------------------
        $scope.sortCol = "town";
        $scope.sortDesc = false;
        $scope.sortIcons = {
            true : "fa-sort-desc",
            false : "fa-sort-asc"
        };
        $scope.toggleSortDesc = function(sortCol) {
            if ($scope.sortCol === sortCol) {
                $scope.sortDesc = !$scope.sortDesc;
            } else {
                $scope.sortCol = sortCol;
                $scope.sortDesc = false;
            }
        }
        // -----------------------------------------
        // End Sort Data
        // -----------------------------------------

        // -----------------------------------------
        // Colorize Gap (surplus/deficit)
        // -----------------------------------------
        $scope.colorGap = function(gap) {
            // NOTE: "negative" gap is a surplus
            if (gap < 0) {
                return "green"
            } else if (gap > 0) {
                return "red"
            }

            return;
        }
        // -----------------------------------------
        // End Colorize Gap (surplus/deficit)
        // -----------------------------------------

        // Slider configs

        // -----------------------------------------
        // Percentage-based cut slider variables
        // -----------------------------------------
        //

        //
        // Percent-cut slider variables
        //

        $scope.cutSlider = {
            value: 20
        };

        $scope.cutSliderOptions = {
            min: 0,
            max: 100,
            step: .25,
            precision: .25,
            range: false,
            value: 20
        };

        $scope.$watchCollection(function() {
            return $scope.cutSlider;
        }, function() {
            if ($scope.percentModelParems) {
                $scope.percentModelParems.percent_cut = $scope.cutSlider.value;
            }
        });

        //
        // Min-max range slider variables
        //
        $scope.minmaxSlider = {
            value: [5, 25]
        };
        $scope.minmaxSliderOptions = {
            min: 0,
            max: 100,
            step: 1,
            precision: 1,
            range: true,
            value: [5, 25]
        };

        $scope.$watchCollection(function() {
            return $scope.minmaxSlider;
        }, function() {
            if ($scope.percentModelParems) {
                $scope.percentModelParems.max_cut = $scope.minmaxSlider.value[1];
                $scope.percentModelParems.min_cut = $scope.minmaxSlider.value[0];
            }
        });

        //
        // Gap slider variables
        //
        $scope.gapSlider = {
            value: 0
        };

        $scope.$watchCollection(function() {
            return $scope.gapSlider;
        }, function() {
            $scope.gap_cutoff = $scope.gapSlider.value;
            if ($scope.percentModelParems) {
                $scope.percentModelParems.gap_cutoff = $scope.gapSlider.value;
            }
        });

        // -----------------------------------------
        // Helpers for formatting
        // -----------------------------------------

        $scope.singleVarFormatterFn = function (value, type) {
            fV = d3.format("$.4s");
            if (type=='currency') {
                return fV(value);
            } else {
                return value + '%'
            }
        };

        $scope.rangeFormatterFn = function (value, type) {
            return $scope.singleVarFormatterFn(value[0], type) + " - " + $scope.singleVarFormatterFn(value[1], type);
        };


        // -----------------------------------------
        // End of percent-cut slider variables
        // -----------------------------------------

        // -----------------------------------------
        // Watch function on selected Town
        //  and processing function for grant data
        // -----------------------------------------
        $scope.updateGrantData = function() {
            //console.log("Updating grant data")
            if ($scope.selectedTown.selected.NAME !== "") {
                $scope.selectedTown.selected.DATA.grants = dataProcessor.processGrantCuts($scope.selectedTown, $scope.grants);
            }
        };

        $scope.$watchCollection(function() {
            return $scope.selectedTown;
        }, function() {
            $scope.updateGrantData();
        });
        // -----------------------------------------
        // End of Watch function on selected Town, processing function for grant data
        // -----------------------------------------

        // -----------------------------------------
        // Main watch function.
        // TODO add in watch to trigger on calculation-type changes
        // -----------------------------------------

        // Main watch driving calculation dispatching.

        $scope.$watch(function() {
            return $scope.percentModelParems;
        }, function () {
            if (typeof($scope.percentModelParems) != 'undefined') {
                $scope.percentSimulatedTowns = $scope.towns;
                $scope.percentSimulatedTowns = $scope.percalculate($scope.percentSimulatedTowns, $scope.percentModelParems);
                $scope.simulatedTowns = $scope.percentSimulatedTowns;
                $scope.stateTotals = dataProcessor.getStateTotals($scope.simulatedTowns);
                $scope.updateGrantData();
            }
        }, true);

}]);
