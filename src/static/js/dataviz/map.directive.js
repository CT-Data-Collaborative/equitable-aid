angular.module('app')
.directive('map', ['$window', 'mapService', function($window, mapService) {
    var chart = mapService.chart;
    return  {
        restrict: 'E',
        scope: {
            data: "=data",
            updateFn: "=update",
            selectedtown: "=selectedTown",
            clicked: "&clicked"
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                if (undefined !== scope.data && scope.data.length > 0) {
                    chart(element[0], scope.data);
                }
            };
            chart.on('customClick', function(d,i) {
                scope.updateFn(d.properties.NAME, scope.selectedTown);
            });
            scope.$watch('data', function(data) {
                scope.render();
            }, true);
            
            $window.onresize = scope.render;
        }
    }
}])
