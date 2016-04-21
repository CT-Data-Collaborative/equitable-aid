angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'percalculate', 'dollarcalculate',
    function($scope, $http, $log, lodash, townData, percalculate, dollarcalculate){
        var lo = lodash;

        // Need to nest actual town data object one level deeper than expected
        // to handle directive scoping issues. See comments in directive for more.
        $scope.selectedTown = {selected: {DATA: {}, NAME: 'test', FIPS: ''}};
        // -----------------------------------------
        // Vars and functions for handling calculation type
        // -----------------------------------------
        $scope.percalculate = percalculate.calculate;
        $scope.dollarcalculate = dollarcalculate.calculate;
        $scope.calctype = 'percentage';

        $scope.whichCalc = function() {
            return ($scope.calctype=='percentage')
        };
        // ----------------------------------------------
        // end calculation type variables and functions
        // ----------------------------------------------


        // -----------------------------------------
        // Load and initialize data
        // -----------------------------------------

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

            $scope.dollarModelParems = {
                existing_aid: $scope.total_aid,
                state_population: $scope.total_population,
                dollar_cut: $scope.total_aid * .2,
                max_cut: $scope.total_aid * 1.5,
                min_cut: $scope.total_aid * .5,
                gap_cutoff: 0
            };

            // Initialize slider position to be equivalent to the 20% mark for consistency
            $scope.dollarCutSlider = {
                value: (($scope.total_aid / $scope.total_population) * .2)
            };

            $scope.dollarCutSliderOptions = {
                min: 1,
                max: $scope.total_aid / $scope.total_population,
                step:.25,
                precision: .25,
                range: false,
                value: (($scope.total_aid / $scope.total_population) * .2)
            };

            $scope.dollarCutMinmaxSlider = {
                value: [($scope.total_aid_cut / $scope.total_population) * .05, ($scope.total_aid_cut / $scope.total_population) * .25]
            };

            $scope.dollarCutMinmaxSliderOptions = {
                min: 0,
                max: ($scope.total_aid_cut / $scope.total_population) * 3,
                step:.25,
                precision:.25,
                range: true,
                value: [($scope.total_aid_cut / $scope.total_population) * .5, ($scope.total_aid_cut / $scope.total_population) * 1.5]
            };

            $scope.dollarCutMinimumSlider = {
                value: $scope.statewide_minimum_aid / 2
            };

            $scope.dollarCutMinimumSliderOptions = {
                min: 0,
                max: $scope.statewide_minimum_aid,
                step:.25,
                precision:.25,
                range: false,
                value: $scope.statewide_minimum_aid / 2
            };
        });
        // -----------------------------------------
        // End data load
        // -----------------------------------------


        // Slider configs

        // -----------------------------------------
        // Percentage-based cut slider variables
        // -----------------------------------------
        //

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
        // Percent-cut slider variables
        //
        $scope.cutSlider = {
            value: 20
        };

        $scope.cutSliderOptions = {
            min: 0,
            max: 100,
            step: 1,
            precision: 1,
            range: false,
            value: 20
        };

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

        $scope.$watchCollection(function() {
            return $scope.cutSlider;
        }, function() {
            if ($scope.percentModelParems) {
                $scope.percentModelParems.percent_cut = $scope.cutSlider.value;
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
        // End of percent-cut slider variables
        // -----------------------------------------

        // -----------------------------------------
        // Dollar cut slider variables
        // -----------------------------------------

        //
        // Dollar-cut slider. Declared here, but set using variables from town data
        //
        $scope.dollarCutSlider;
        $scope.dollarCutSliderOptions;
        $scope.$watchCollection(function() {
            return $scope.dollarCutSlider;
        }, function() {
            if ($scope.dollarModelParems) {
                var rangeVals = $scope.dollarCutMinmaxSlider.value;
                $scope.dollarModelParems.dollar_cut = $scope.dollarCutSlider.value;
                $scope.dollarCutMinmaxSliderOptions.max = $scope.dollarCutSlider.value * 3;
                if (rangeVals[1] == 0 && $scope.dollarCutSlider.value != 0) {
                    $scope.dollarCutMinmaxSlider.value = [$scope.dollarCutSlider.value *.5, $scope.dollarCutSlider.value * 2.5];
                } else {
                    if (rangeVals[1] >= ($scope.dollarCutSlider.value * 3)) {
                        $scope.dollarCutMinmaxSlider.value = [rangeVals[0], ($scope.dollarCutSlider.value * 3)]
                    } else {
                        $scope.dollarCutMinmaxSlider.value = rangeVals;
                    }
                }
            }
        });

        // -----------------------------------------
        // Dollar-cut gap slider variables
        // -----------------------------------------

        // We can use the same slider element.
        // But we will declare a second watch to update additional model parems
        $scope.$watchCollection(function() {
            return $scope.gapSlider;
        }, function() {
            $scope.gap_cutoff = $scope.gapSlider.value;
            if ($scope.dollarModelParems) {
                $scope.dollarModelParems.gap_cutoff = $scope.gapSlider.value;
            }
        });

        // -----------------------------------------
        // Dollar cut min max slider variables
        // -----------------------------------------

        //
        // Dollar-cut min max slider. Declared here, but set using variables from town data
        //
        $scope.dollarCutMinmaxSlider;
        $scope.dollarCutMinmaxSliderOptions;
        $scope.$watchCollection(function() {
            return $scope.dollarCutMinmaxSlider;
        }, function() {
            if ($scope.dollarModelParems) {
                $scope.dollarModelParems.max_cut = $scope.dollarCutMinmaxSlider.value[1];
                $scope.dollarModelParems.min_cut = $scope.dollarCutMinmaxSlider.value[0];
            }

        });
        $scope.dollarCutMinimumSlider;
        $scope.dollarCutMinimumSliderOptions;
        $scope.$watchCollection(function() {
            return $scope.dollarCutMinimumSlider;
        }, function() {
            if ($scope.dollarModelParems) {
                $scope.dollarModelParems.min_aid = $scope.dollarCutMinimumSlider.value;
            }
        });

        // -----------------------------------------
        // End of dollar-cut slider variables
        // -----------------------------------------


        // -----------------------------------------
        // Main watch function.
        // TODO add in watch to trigger on calculation-type changes
        // -----------------------------------------

        // Main watch driving calculation dispatching. Unclear if this will fire correctly when a user
        // toggles. The correct behavior here is to update simulatedTowns with the correct output data based on
        // the calctype that the user has selected. Might need to add in a promise. Will know more after I implement
        // the dollar calculation.
        $scope.$watch(function() {
            return [$scope.percentModelParems, $scope.dollarModelParems, $scope.calctype];
        }, function() {
            if ($scope.calctype == 'percentage') {
                if (typeof($scope.percentModelParems) != 'undefined') {
                    $scope.percentSimulatedTowns = $scope.towns;
                    $scope.percentSimulatedTowns = $scope.percalculate($scope.percentSimulatedTowns, $scope.percentModelParems);
                    $scope.simulatedTowns = $scope.percentSimulatedTowns;
                }
            } else {
                if (typeof($scope.dollarModelParems) != 'undefined') {
                    $scope.dollarSimulatedTowns = $scope.towns;
                    $scope.dollarSimulatedTowns = $scope.dollarcalculate($scope.dollarSimulatedTowns, $scope.dollarModelParems);
                    $scope.simulatedTowns = $scope.dollarSimulatedTowns;
                }
            }
        }, true);
}]);
