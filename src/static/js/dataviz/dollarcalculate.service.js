angular.module('app')
    .service('dollarcalculate', function() {

        var calcObj = {calculate: calculate};
        return (calcObj);


        // ---
        // PUBLIC API
        // --

        function calculate(data, parems) {
            var dollar_cut = -parems.dollar_cut;
            var max_cut = -parems.max_cut;
            var min_cut = -parems.min_cut;
            var min_aid = parems.min_aid;
            var gap_cutoff = parems.gap_cutoff;
            var total_allocation = parems.existing_aid + (dollar_cut * parems.state_population);
            if (total_allocation > parems.existing_aid) {
                console.log("ERROR!")
            }
            r2 = get_r2(data, gap_cutoff, total_allocation, max_cut, min_cut, min_aid);
            data.forEach(function(e) {
                if (e.category == 'max') {
                    // this doesn't seem quite right
                    e.dollar_change = Math.max((-e.allocation+min_aid),max_cut)
                } else if (e.category == 'min') {
                    e.dollar_change = Math.max((-e.allocation+min_aid),min_cut)
                } else {
                    e.dollar_change = Math.max((r2 * (e.gap - gap_cutoff) - e.allocation), (-e.allocation+min_aid));
                }
                e.sim_allocation = e.allocation + e.dollar_change;
                e.even_cut_allocation = 0;
                e.even_cut_allocation_difference = 0;
            });
            return data;
        }


        // ---
        // Helpers
        // ---

        function get_r2(data, gap_cutoff, total_allocation, max_cut, min_cut, min_aid) {
            data.forEach(function(e) {
                e.category = categorize(e, gap_cutoff);
            });
            var init_r2 = calc_r(data, total_allocation, min_aid, max_cut, min_cut, gap_cutoff);
            data.forEach(function(e) {
                e.category = categorize(e, gap_cutoff, max_cut, min_cut, init_r2);
            });
            //return init_r2;
            var new_r2 = calc_r(data, total_allocation, min_aid, max_cut, min_cut, gap_cutoff);
            //console.log(new_r2);
            data.forEach(function(e) {
                e.category = categorize(e, gap_cutoff, max_cut, min_cut, new_r2);
            });
            new_r2 = calc_r(data, total_allocation, min_aid, max_cut, min_cut, gap_cutoff);
            //console.log(new_r2);
            data.forEach(function(e) {
                e.category = categorize(e, gap_cutoff, max_cut, min_cut, new_r2);
            });
            return new_r2;
        }

        function categorize(town, gap_cutoff, max_cut, min_cut, r2) {
            if (typeof r2 == 'undefined') {
                if (town.gap <= gap_cutoff) {
                    return 'max';
                } else {
                    return 'proportional';
                }
            }
            else {
                var test = (r2 * (town.gap - gap_cutoff)) - town.allocation;
                if ((town.gap <= gap_cutoff) || (test < max_cut)) {
                    return 'max';
                } else if ((town.gap > gap_cutoff) && (test >= min_cut)) {
                    return 'min';
                } else {
                    return 'proportional';
                }
            }
        }

        function town_filter(comparator) {
            return function(element) {
                return (element.category == comparator);
            };
        }

        function aid_sum(aid_array) {
            return aid_array.reduce(function (prev, curr) {
                return prev + curr;
            }, 0);
        }

        function sum_towns(type) {
            return function(towns, cut, min_aid) {
                var filtered_towns = towns.filter(town_filter(type));
                var aid = filtered_towns.map(function (e) {
                    return (Math.max(min_aid, e.allocation - cut)) * e.population
                });
                return aid_sum(aid);
            };
        }


        function get_proportional_cut(towns, gap_cutoff) {
            var prop_towns = towns.filter(town_filter('proportional'));
            var aid = prop_towns.map(function(e) {
                return (e.gap - gap_cutoff) * e.population;
            });
            return aid_sum(aid);
        }

        function calc_r(towns, total_allocation, min_aid, max_cut, min_cut, gap_cutoff) {
            var max_town_sum = sum_towns('max')(towns, max_cut, min_aid);
            var min_town_sum = sum_towns('min')(towns, min_cut, min_aid);
            console.log(total_allocation - max_town_sum - min_town_sum);
            return (total_allocation - sum_towns('max')(towns, max_cut, min_aid) - sum_towns('min')(towns, min_cut, min_aid)) / get_proportional_cut(towns, gap_cutoff);
        }


    });