angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'percalculate',
    function($scope, $http, $log, lodash, townData, percalculate){
        var lo = lodash;

        // -----------------------------------------
        // Vars and functions for handling calculation type
        // -----------------------------------------
        $scope.percalculate = percalculate.calculate;
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
            var gap_array = $scope.towns.map(function(x) { return x.gap;});
            gap_array.sort(function(a,b) { return b-a;});
            $scope.gapSliderOptions = {
                min: gap_array.slice(-1)[0],
                max: gap_array[0],
                step: 1,
                precision: 1,
                range: false,
                value: 0
            };
            var aid_array = $scope.towns.map(function(x) { return x.total_aid;});
            $scope.total_aid = lo.reduce(aid_array, function(sum, n) { return sum+n }, 0);
            $scope.percentModelParems = {
                percent_cut: 20,
                max_cut: 25,
                min_cut: 5,
                baseline_per: 20.0,
                gap_cutoff: 0
            };
            $scope.total_aid_cut = $scope.total_aid - ($scope.total_aid * (1 - ($scope.percentModelParems.percent_cut/100)));
            $scope.dollarModelParems = {
                dollar_cut: 10000000,
                max_cut: 1000000,
                min_cut: 10000,
                baseline_per: 20.0,
                gap_cutoff: 0
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
        $scope.rangeFormatterFn = function (value) {
            return value[0] + '%' + " - " + value[1] + '%';
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

        $scope.singleVarFormatterFn = function (value, pre, suff) {
            return pre + value + suff;
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
        // Main watch function.
        // TODO add in watch to trigger on calculation-type changes
        // -----------------------------------------
        $scope.$watchCollection(function() {
            return $scope.percentModelParems;
        }, function() {
            if (typeof($scope.percentModelParems) != 'undefined') {
                $scope.simulatedTowns = $scope.towns;
                $scope.simulatedTowns = $scope.percalculate($scope.simulatedTowns, $scope.percentModelParems);
                $scope.total_aid_cut = $scope.total_aid - ($scope.total_aid * (1 - ($scope.percentModelParems.percent_cut/100)));
            }
        });

}]);
