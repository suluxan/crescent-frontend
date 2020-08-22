#!/bin/python3

import json
import loompy

from get_data.get_client import get_minio_client
from get_data.gradient import polylinear_gradient
from get_data.helper import COLOURS, return_error, set_IDs, sort_traces
from get_data.minio_functions import get_first_line, get_obj_as_2dlist, object_exists

colour_dict = {}

def add_barcode(plotly_obj, barcode, label, opacities):
    """ add a new barcode to the plotly object and add its label group if it doesn't exist yet """
    global colour_dict
    if (label in plotly_obj):
        plotly_obj[label]['text'].append(barcode)
        plotly_obj[label]['marker']['opacity'].append(opacities[barcode])
        plotly_obj[label]['marker']['color'].append(colour_dict[label])
    else:
        # label not seen yet
        colour_dict[label] = COLOURS[len(colour_dict.keys())%len(COLOURS)]
        plotly_obj[label] = {
            "name": label,
            "text": [barcode],
            "marker": {
                'opacity': [opacities[barcode]],
                'color': [colour_dict[label]]
            }
        }

def add_barcodes(plotly_obj, barcode_values, group, opacities):
    # continuous scale, add all barcodes
    colours = ['#2a0d82', '#4f0e90', '#6e129e', '#8b1aaa', '#a625b5', '#c034be', '#d846c5', '#ed5bc8', '#ff72c7']
    gradient = polylinear_gradient(colours,len(barcode_values)+1)['hex']
    template_obj = {
        "text": [],
        "hovertext": [],
        "marker": {
            "color": [], # put sorted markers' colours here
            'colorscale': [[0, gradient[0]],[1, gradient[-1]]],
            'opacity': [], # put marker's opacity here
            'showscale': True
        },
    }

    gradient_iter = 0
    for barcode, value in barcode_values:
        template_obj["text"].append(barcode)
        template_obj["hovertext"].append(str(value)+" ("+group+")")
        template_obj["marker"]["color"].append(int(value))
        template_obj["marker"]["opacity"].append(opacities[barcode])
        gradient_iter += 1

    plotly_obj["barcodes"] = template_obj

def sort_barcodes(opacities, group, paths, minio_client):
    """ given the opacities for the barcodes, sorts them into the specified groups and returns a plotly object """
    plotly_obj = {}
    
    metadata = paths["metadata"]
    groups = paths["groups"]

    metadata_exists = object_exists(metadata["bucket"], metadata["object"], minio_client)

    if (group in get_first_line(groups["bucket"], groups["object"], minio_client)):
        groups_tsv = get_obj_as_2dlist(groups["bucket"], groups["object"], minio_client)

        label_idx = groups_tsv[0].index(str(group))
        group_type = groups_tsv[1][label_idx]

        if group_type == 'group':
            for row in groups_tsv[2:]:
                barcode = str(row[0])
                label = str(row[label_idx])
                add_barcode(plotly_obj, barcode, label, opacities)
        elif group_type == 'numeric':
            # colour by gradient
            barcode_values = []
            all_ints = True
            for row in groups_tsv[2:]:
                num_value = float(row[label_idx])
                all_ints = False if not num_value.is_integer() else all_ints
                barcode_values.append((str(row[0]), num_value))
            barcode_values = sorted(barcode_values, key=lambda x: x[1])
            barcode_values = [(x,int(y)) for x, y in barcode_values] if all_ints else [(x,round(y, 2)) for x, y in barcode_values]
            add_barcodes(plotly_obj, barcode_values, group, opacities)
        else:
            return_error(group + " does not have a valid data type (must be 'group' or 'numeric')")
    elif (metadata_exists and (group in get_first_line(metadata["bucket"], metadata["object"], minio_client))):
        # use the metadata
        metadata_tsv = get_obj_as_2dlist(metadata["bucket"], metadata["object"], minio_client)

        label_idx = metadata_tsv[0].index(str(group))
        group_type = metadata_tsv[1][label_idx]

        if group_type == 'group':
            all_barcodes = {key: True for key in opacities}
            for row in metadata_tsv[2:]:
                barcode = str(row[0])
                if all_barcodes.pop(barcode, None):
                    # exists in all barcodes, ok to add (skipped otherwise)
                    label = str(row[label_idx])
                    add_barcode(plotly_obj, barcode, label, opacities)
            # add remaining barcodes that weren't defined in the metadata file
            for barcode in all_barcodes.keys():
                label = 'unlabelled'
                add_barcode(plotly_obj, barcode, label, opacities)
        elif group_type == 'numeric':
            # colour by gradient
            barcode_values = []
            all_ints = True
            for row in metadata_tsv[2:]:
                num_value = float(row[label_idx])
                all_ints = False if not num_value.is_integer() else all_ints
                barcode_values.append((str(row[0]),num_value))
            barcode_values = sorted(barcode_values, key=lambda x: x[1])
            barcode_values = [(x,int(y)) for x, y in barcode_values] if all_ints else [(x,round(y, 2)) for x, y in barcode_values]
            add_barcodes(plotly_obj, barcode_values, group, opacities)
        else:
            return_error(group + " does not have a valid data type (must be 'group' or 'numeric')")
        pass
    else:
        return_error(group + " is not an available group in groups.tsv or metadata.tsv")

    return list(plotly_obj.values())

def calculate_opacities(feature_row):
    """ given the normalized expression row, calculate and return the opacities """
    min_opac = 0.05 # no expression 
    exp_values = [float(x) for x in feature_row]
    max_exp = max(exp_values)
    opacities = [min_opac if val==0.0 else round((val*0.95/max_exp + min_opac), 2) for val in exp_values]    
    return opacities    

def get_opacities(feature, normalised_counts_path):
    """ parses the normalized count matrix to get an expression value for each barcode """
    with loompy.connect(normalised_counts_path) as ds:
        barcodes = ds.ca.CellID
        features = ds.ra.Gene
        feature_idx = next((i for i in range(len(features)) if features[i] == feature), -1)
        if feature_idx >= 0:
            opacities = calculate_opacities(ds[feature_idx, :])
            return dict(zip(barcodes, opacities))
        else:
            return_error("Feature Not Found")
    
def get_opacity_data(feature, group, runID):
    """ given a feature and group, returns the expression opacities of the feature of interest for each barcode """
    
    global colour_dict

    paths = {}
    with open('get_data/paths.json') as paths_file:
        paths = json.load(paths_file)
    paths = set_IDs(paths, runID, ["groups", "metadata", "normalised_counts"], findDatasetID=True)

    minio_client = get_minio_client()
    
    opacities = get_opacities(feature, paths["normalised_counts"])
    plotly_obj = sort_barcodes(opacities, group, paths, minio_client)
    try:
        sort_traces(plotly_obj)
    except:
        pass # not sortable, (o.k.)

    colour_dict = {}

    return plotly_obj