angular.module('app').filter('bigcurrency', ['$filter', function($filter) {
    fV = d3.format("$.2s");
    return function(input) {
        return fV(input);
    };
}]);