angular.module('app')
    .service('percalculate', function() {

        var calcObj = {calculate: calculate};
        return (calcObj);


        // ---
        // PUBLIC API
        // --

        function calculate(data, parems) {
            var percent_cut = parems.percent_cut/-100;
            var max_cut = parems.max_cut/-100;
            var min_cut = parems.min_cut/-100;
            baseline_per = 100 - parems.baseline_per;
            var allocations = data.map(function(x) { return x.total_aid});
            var total_allocation = allocations.reduce(buildSum) * (1 + percent_cut);
            var baseline = parems.gap_cutoff;
            calcObj.baseline = baseline;
            r2 = get_r2(data, baseline, total_allocation, max_cut, min_cut);
            data.forEach(function(e) {
                if (e.category == 'max') {
                    e.per_change = max_cut;
                } else if (e.category == 'min') {
                    e.per_change = min_cut;
                } else {
                    e.per_change = r2 * (e.gap - baseline) / e.allocation - 1;
                }
                e.sim_allocation = e.allocation * (1 + e.per_change );
                e.sim_allocation_difference = e.sim_allocation - e.allocation;
                e.even_cut_allocation = e.allocation * (1 + percent_cut);
                e.even_cut_allocation_difference = e.even_cut_allocation - e.allocation;
                e.sim_better = (e.sim_allocation - e.even_cut_allocation) >= 0;
            });
            return data;
        }


        // ---
        // Helpers
        // ---

        function buildSum(prev, curr) {
            "use strict";
            return prev + curr;
        };

        function isBetter(v) {
            if(v <= 0) {
                return false;
            } else {
                return true;
            }
        }
        function percentile(arr, p) {
            if (arr.length === 0) return 0;
            if (typeof p !== 'number') throw new TypeError('p must be a number');
            if (p <= 0) return arr[0];
            if (p >= 1) return arr[arr.length - 1];

            var index = arr.length * p,
                lower = Math.floor(index),
                upper = lower + 1,
                weight = index % 1;

            if (upper >= arr.length) return arr[lower];
            return arr[lower] * (1 - weight) + arr[upper] * weight;
        }


        function categorize(town, baseline, max_cut, min_cut, r2) {
            if (typeof r2 == 'undefined') {
                if (town.gap <= baseline) {
                    return 'max';
                } else {
                    return 'proportional';
                }
            }
            else {
                var per_change = ((r2 * (town.gap - baseline)) / town.allocation) - 1;
                if ((town.gap <= baseline) || (per_change < max_cut)) {
                    return 'max';
                } else if ((town.gap > baseline) && (per_change >= min_cut)) {
                    return 'min';
                } else {
                    return 'proportional';
                }
            }
        }

        function town_filter(comparator) {
            "use strict";
            return function(element) {
                return (element.category == comparator);
            };
        }

        function sum_towns(type) {
            return function(towns, threshold) {
                var filtered_towns = towns.filter(town_filter(type));
                var aid = filtered_towns.map(function (e) {
                    return (1 + threshold) * e.total_aid;
                });
                return aid.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0);
            };
        }


        function get_proportional_cut(towns, baseline) {
            var prop_towns = towns.filter(town_filter('proportional'));
            var aid = prop_towns.map(function(e) {
                return (e.gap - baseline) * e.population;
            });
            return aid.reduce(function(prev, curr) {
                return prev + curr;
            }, 0);
        }

        function calc_r(towns, total_allocation, max_cut, min_cut, baseline) {
            "use strict";
            return (total_allocation - sum_towns('max')(towns, max_cut) - sum_towns('min')(towns, min_cut)) / get_proportional_cut(towns, baseline);
        }

        function get_r2(data, baseline, total_allocation, max_cut, min_cut) {
            // round 1
            data.forEach(function(e) {
                e.category = categorize(e, baseline);
            });
            var init_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
            // round 2
            data.forEach(function(e) {
                e.category = categorize(e, baseline, max_cut, min_cut, init_r2);
            });
            var new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
            // round 3
            data.forEach(function(e) {
                e.category = categorize(e, baseline, max_cut, min_cut, new_r2);
            });
            var new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
            // round 4
            return new_r2;
        }

    });