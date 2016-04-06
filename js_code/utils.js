
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
  }
}

var get_max_cut = sum_towns('max');
var get_min_cut = sum_towns('min');

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
  return (total_allocation - get_max_cut(towns, max_cut) - get_min_cut(towns, min_cut)) / get_proportional_cut(towns, baseline);
}

function get_r2(data, baseline, total_allocation, max_cut, min_cut) {
  data.forEach(function(e) {
    e.category = categorize(e, baseline);
  });
  var init_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
  data.forEach(function(e) {
    e.category = categorize(e, baseline, max_cut, min_cut, init_r2);
  });
  var new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
  data.forEach(function(e) {
    e.category = categorize(e, baseline, max_cut, min_cut, new_r2);
  });
  return new_r2;
}

function allocate(data, percent_cut, max_r, min_r, baseline_per) {
  percent_cut = typeof percent_cut !== 'undefined' ? percent_cut : -0.1;
  max_r = typeof max_r !=='undefined' ? max_r : 2.5;
  min_r = typeof min_r !=='undefined' ? min_r : 0.1;
  var max_cut = max_r * percent_cut;
  var min_cut = min_r * percent_cut;
  baseline_per = typeof baseline_per !== 'undefined' ? baseline_per : 10.0;
  var allocations = data.map(function(x) { return x.total_aid});
  var total_allocation = allocations.reduce(function (prev, curr) {
        return prev + curr;}) * (1 + percent_cut);
  var gap_array = data.map(function(x) { return x.gap;});
  gap_array.sort(function(a,b) { return b-a;});
  var baseline = percentile(gap_array, baseline_per/100);
  r2 = get_r2(data, baseline, total_allocation, max_cut, min_cut);
  data.forEach(function(e) {
    if (e.category == 'max') {
      e.per_change = max_cut;
    } else if (e.category == 'min') {
      e.per_change = min_cut;
    } else {
      e.per_change = r2 * (e.gap - baseline) / e.allocation - 1;
    }
    e.adj_allocation = e.allocation * (1 + e.per_change );
  });
  return data;
}

function prep_data(towns) {
  towns.forEach(function(e){
    e.gap = -e.gap;
  });
}

data = require('../data/data.json');
prep_data(data);

function print(data, type) {
  data.forEach(function(e) { if (e.category == type ) { console.log(e);}});
}

cut = -0.35;
adj_data = allocate(data, cut);

total_adj_allocation = adj_data.map(function(e) { return e.adj_allocation * e.population;});
total_year2_allocation = total_adj_allocation.reduce(function(p, c) {
  return p + c;
});

var allocations = data.map(function(x) { return x.total_aid});
var total_allocation = allocations.reduce(function (prev, curr) {
      return prev + curr;}) * (1 + cut);

var actual_cut = ((total_allocation / (1+cut)) - total_year2_allocation) / (total_allocation / (1+cut));

console.log("Total Y2 Allocation Input: " + total_allocation + ", Total Y2 Allocation calc: " + total_year2_allocation);
print(adj_data, 'max')
print(adj_data, 'min')
print(adj_data, 'proportional')
