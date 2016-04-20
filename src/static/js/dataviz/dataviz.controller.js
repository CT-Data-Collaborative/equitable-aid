angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'percalculate',
    function($scope, $http, $log, lodash, townData, percalculate){
        var lo = lodash;

        // Vars and functions for handling calculation type
        $scope.percalculate = percalculate.calculate;
        $scope.calctype = 'percentage';

        $scope.whichCalc = function() {
            "use strict";
            return ($scope.calctype=='percentage')
        };

        // Slider configs

        // Percentage-based cut threshold variables
        $scope.slider = {
            value: [5, 15]
        };
        $scope.testOptions = {
            min: 0,
            max: 100,
            step: 1,
            precision: 1,
            range: true,
            value: [5, 15]
        };
        $scope.rangeFormatterFn = function (value) {
            return value[0] + '%' + " - " + value[1] + '%';
        };

        $scope.$watchCollection(function() {
            "use strict";
            return $scope.slider;
        }, function() {
            "use strict";
            if ($scope.percentModelParems) {
                $scope.percentModelParems.max_cut = $scope.slider.value[1];
                $scope.percentModelParems.min_cut = $scope.slider.value[0];
            }
        });

        // Percent-cut slider variables
        $scope.cutslider = {
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
            "use strict";
            return $scope.cutslider;
        }, function() {
            "use strict";
            if ($scope.percentModelParems) {
                $scope.percentModelParems.percent_cut = $scope.cutslider.value;
            }
        });

        // Gap slider variables
        $scope.gapslider = {
            value: 0
        };

        $scope.$watchCollection(function() {
            "use strict";
            return $scope.gapslider;
        }, function() {
            "use strict";
            if ($scope.percentModelParems) {
                $scope.gap_cutoff = $scope.gapslider.value;
                $scope.percentModelParems.gap_cutoff = $scope.gapslider.value;
            }
        });

        // Load and initialize data
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
            $scope.percentModelParems = {
                percent_cut: 20,
                max_cut: 15,
                min_cut: 5,
                baseline_per: 20.0,
                gap_cutoff: 0
            };
            $scope.dollarModelParems = {
                dollar_cut: 10000000,
                max_cut: 1000000,
                min_cut: 10000,
                baseline_per: 20.0,
                gap_cutoff: 0
            };
        });

        // Update model on parem changes
        $scope.$watchCollection(function() {
            return $scope.percentModelParems;
        }, function() {
            if (typeof($scope.percentModelParems) != 'undefined') {
                $scope.simulatedTowns = $scope.towns
                $scope.simulatedTowns = $scope.percalculate($scope.simulatedTowns, $scope.percentModelParems);
            }
        });

}]);
