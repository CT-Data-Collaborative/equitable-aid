angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'calculate',
    function($scope, $http, $log, lodash, townData, calculate){
        var lo = lodash;
        $scope.calculate = calculate.calculate;

        var dataPromise = townData.loadData();
        dataPromise.then(function(results) {
            $scope.towns = results;
            $scope.modelParems = {
                percent_cut: -0.1,
                max_r: 2.5,
                min_r: 0.1,
                baseline_per: 10.0
            };
        });

        $scope.$watchCollection(function() {
            return $scope.modelParems;
        }, function() {
            if (typeof($scope.modelParems) != 'undefined') {
                $scope.simulatedTowns = $scope.towns
                $scope.simulatedTowns = $scope.calculate($scope.simulatedTowns, $scope.modelParems);
                $scope.baseline = calculate.baseline;
            }
        });

}]);
