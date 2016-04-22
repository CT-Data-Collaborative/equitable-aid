angular.module('app')
.directive('map', ['$window', 'mapService', function($window, mapService) {
    var chart = mapService.chart;
    return  {
        restrict: 'E',
        scope: {
            data: "=data",
            selectedTown: "=selectedTown"
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                if (undefined !== scope.data && scope.data.length > 0) {
                    chart(element[0], scope.data, scope.selectedTown);
                }
            };
            // Use the custom dispatch method that we registered in the d3 map chart
            chart.on('customClick', function(d,i) {
                // If we don't call $apply, the digest cycle will lag and we won't
                // see the parent scope updated with this value until we do something (anything)
                // else (click button, modify parameters). We can't update selectedTown directly
                // b/c of angular directive/parent scope rules. Doing so would create a new,
                // local selectedTown object. Accessing the selected property will result in
                // angular correctly going up the scope tree to the controller object that we
                // bound to the directive.
                if (scope.selectedTown.selected == d.properties) {
                    scope.$apply(scope.selectedTown.selected = {DATA: {}, NAME: '', FIPS: ''});
                } else {
                    scope.$apply(scope.selectedTown.selected = d.properties);
                }
            });
            scope.$watch('data', function(data) {
                scope.render();
            }, true);
            angular.element($window).bind('resize', scope.render);
        }
    }
}])
