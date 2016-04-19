angular.module('app')
.controller('DataVizController',
    ['$scope', '$http', '$log', 'lodash', 'townData', 'calculate',
    function($scope, $http, $log, lodash, townData, calculate){
        var lo = lodash;
        $scope.calculate = calculate.calculate;
        $scope.calctype = 'percentage';

        var dataPromise = townData.loadData();
        dataPromise.then(function(results) {
            $scope.towns = results;
            $scope.modelParems = {
                percent_cut: 10,
                max_cut: 15,
                min_cut: 5,
                baseline_per: 20.0
            };
        });

        $scope.$watch(function() {
            return $scope.calctype;
        }, function() {
            console.log($scope.calctype);
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
