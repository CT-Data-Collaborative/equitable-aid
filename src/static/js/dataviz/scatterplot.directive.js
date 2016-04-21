angular.module('app')
.directive('scatterplot', ['$window', 'scatterplotService', function($window, scatterplotService) {
    var chart = scatterplotService.chart;

    return  {
        restrict: 'E',
        scope: {
            data: "=data"
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                if (undefined !== scope.data && scope.data.length > 0) {
                    chart(element[0], scope.data);
                }
            }
            
            scope.$watch('data', function(data) {
                scope.render();
            }, true);

            angular.element($window).bind('resize', scope.render);
        }
    }
}])
