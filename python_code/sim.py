import numpy as np
import json


def categorize(town, baseline, r2=None, max_cut=None):
    if town['gap'] > baseline:
        return 'max'
    if not r2:
        return 'proportional'
    else:
        per_change = (r2 * (-town['gap'])) / town['allocation'] - 1
        if per_change >= max_cut:
            return 'min'
        else:
            return 'proportional'

def get_max_cut(towns, max_cut):
    max_towns = [x for x in towns if x['category'] == 'max']
    return sum([(1+max_cut)*x['total_aid'] for x in max_towns])

def get_min_cut(towns, min_cut):
    min_towns = [x for x in towns if x['category'] == 'min']
    return sum([(1 + min_cut) * x['total_aid'] for x in min_towns])

def get_j_cut(towns, baseline):
    not_max_towns = [x for x in towns if not x['category'] == 'max']
    return sum([(-x['gap'] - baseline)*x['population'] for x in not_max_towns])

def calc_r(towns, total_allocation, max_cut, min_cut, baseline):
    return (total_allocation - get_max_cut(towns, max_cut) - get_min_cut(towns, min_cut)) / get_j_cut(towns, baseline)


def get_cuts(percent_cut=-0.1, max_r=2.5, min_r=0.1, baseline_per=10.0):
    max_cut = max_r * percent_cut
    min_cut = min_r * percent_cut
    with open('data/data.json', 'r') as jsonfile:
        data = json.load(jsonfile)
    total_allocation = sum([x['allocation'] * x['population'] for x in data]) * (1-percent_cut)
    gap_array = [x['gap'] for x in data]
    baseline = np.percentile(gap_array, baseline_per)
    for x in data:
        cat = categorize(x, baseline)
        x.update(dict(category=cat))
    initial_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline)
    current = initial_r2
    r2_equal = False
    while not r2_equal:
        for x in data:
            cat = categorize(x, baseline, r2=current, max_cut=max_cut)
            x.update(dict(category=cat))
        new_r2 = calc_r(data, total_allocation, max_cut, min_cut, baseline)
        print("Previous r2: {}".format(current))
        print("New r2: {}".format(new_r2))
        r2_equal = (current == new_r2)
        print("Equal: {}".format(r2_equal))
        current = new_r2

