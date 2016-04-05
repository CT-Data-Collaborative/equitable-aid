
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


function categorize(town, baseline, r2, max_cut) {
  "use strict";
  if (town.gap > baseline) {
    return 'max';
  }
  if (r2 == 'undefined') {
    return 'proportional';
  } else {
    var per_change = ((r2 * -town.gap) / town.allocation) - 1;
    if (per_change > max_cut) {
      return 'min';
    } else {
      return 'proportional';
    }
  }
}

function town_filter(comparator) {
  "use strict";
  return function(element) {
    if (element.category == comparator) {
      return true;
    } else {
      return false;
    }
  };
}

function prop_filter(element) {
  "use strict";
  if (!(element.category == 'max') && !(element.category == 'min')) {
    return true;
  } else {
    return false;
  }
}

function sum_towns(type) {
  return function(towns, threshold) {
    var filtered_towns = towns.filter(town_filter(type));
    var aid = filtered_towns.map(function(e) { return (1 + threshold) * e.total_aid;});
    return aid.reduce(function(prev, curr) {
      return prev + curr;
    });
  };
}

var get_max_cut = sum_towns('max');
var get_min_cut = sum_towns('min');

function get_proportional_cut(towns, baseline) {
  "use strict";
  var prop_towns = towns.filter(prop_filter);
  var aid = prop_towns.map(function(e) {
    return (-e.gap - baseline) ( e.population);
  });
  return aid.reduce(function(prev, curr) {
    return prev + curr;
  });
}

function calc_r(towns, total_allocation, max_cut, min_cut, baseline) {
  "use strict";
  return (total_allocation - get_max_cut(towns, max_cut) - get_min_cut(towns, min_cut)) / get_proportional_cut(towns, baseline);
}

function get_cuts(data, percent_cut, max_r, min_r, baseline_per) {
  percent_cut = typeof percent_cut !== 'undefined' ? percent_cut : -0.1;
  max_r = typeof max_r !=='undefined' ? max_r : 2.5;
  min_r = typeof min_r !=='undefined' ? min_r : 0.1;
  baseline_per = typeof baseline_per !== 'undefined' ? baseline_per : 10.0;
  var max_cut = max_r * percent_cut;
  var min_cut = min_r * percent_cut;
  var allocations = data.map(function(x) { return x.total_aid});
  var total_allocation = allocations.reduce(function (prev, curr) {
    return prev + curr;}) * (1 + percent_cut);
  var gap_array = data.map(function(x) { return x.gap;});
  var baseline = percentile(gap_array, baseline_per/100);
  data.forEach(function(e) {
    e.category = categorize(e, baseline);
  });
  var init_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
  var current = init_r2;
  var r2_equal = false;
  while (!r2_equal) {
    data.forEach(function(e) {
      e.category = categorize(e, baseline, current, max_cut);
    });
    var new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline);
    console.log("Previous r2: " + current);
    console.log("Current r2: " + new_r2);
    r2_equal = (current == new_r2);
    console.log("Equal: " + r2_equal);
    current = new_r2;
  }
}

