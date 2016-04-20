angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'percalculate', 'dollarcalculate',
    function($scope, $http, $log, lodash, townData, percalculate, dollarcalculate){
        var lo = lodash;

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

            $scope.total_aid = lo
                .chain($scope.towns)
                .map(function(t) { return t.total_aid;})
                .reduce(function(sum, n) { return sum+n }, 0)
                .value();

            $scope.total_population = lo
                .chain($scope.towns)
                .map(function(t) { return t.population; })
                .reduce(function(sum, n) { return sum+n}, 0)
                .value();

            $scope.total_aid_cut = $scope.total_aid - ($scope.total_aid * 0.8);

            $scope.percentModelParems = {
                percent_cut: 20,
                max_cut: 25,
                min_cut: 5,
                gap_cutoff: 0
            };

            // We need to initialize dollar model parameter object here b/c we need total aid
            $scope.dollarModelParems = {
                dollar_cut: $scope.total_aid * .2,
                max_cut: $scope.total_aid * .25,
                min_cut: $scope.total_aid * .05,
                gap_cutoff: 0
            };

            // Initialize slider position to be equivalent to the 20% mark for consistency
            $scope.dollarCutSlider = {
                value: $scope.total_aid * .2
            };

            $scope.dollarCutSliderOptions = {
                min: 0,
                max: $scope.total_aid,
                step: 1,
                precision: 1,
                range: false,
                value: ($scope.total_aid * .2)
            };

            //
            $scope.dollarCutMinmaxSlider = {
                value: [($scope.total_aid_cut / $scope.total_population) * .05, ($scope.total_aid_cut / $scope.total_population) * .25]
            };

            $scope.dollarCutMinmaxSliderOptions = {
                min: 0,
                max: ($scope.total_aid_cut / $scope.total_population),
                step: 1,
                precision: 1,
                range: true,
                value: [($scope.total_aid_cut / $scope.total_population) * .05, ($scope.total_aid_cut / $scope.total_population) * .25]
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
            fV = d3.format("$.2s");
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
                $scope.dollarModelParems.dollar_cut = $scope.dollarCutSlider.value;
                $scope.dollarCutMinmaxSliderOptions.max = $scope.dollarCutSlider.value / $scope.total_population;
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
        // -----------------------------------------
        // End of dollar-cut slider variables
        // -----------------------------------------


        // -----------------------------------------
        // Main watch function.
        // TODO add in watch to trigger on calculation-type changes
        // -----------------------------------------

        $scope.$watch(function() {
            return [$scope.percentModelParems, $scope.dollarModelParems];
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
                    $scope.dollarcalculate($scope.dollarSimulatedTowns, $scope.dollarModelParems);
                    $scope.simulatedTowns = $scope.dollarSimulatedTowns;
                }
            }
        }, true);
}]);
