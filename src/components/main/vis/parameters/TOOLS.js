// Schema for parameter json
// step: the key for the step this parameter belongs to
// parameter: keyword for CWL
// label: human readable form of parameter
// prompt: header of message+input box
// description: content of message+input box
// input: {
//  type: boolean | integer | long | float | double | single | string | file | directory
//        NOTE: we only use... string, float, integer, (and technically ranges)
//  default: (see above) 
// }
// disabled: boolean for whether we accept these parameters or they're default/blocked
const parameterExample = {
  step: 'quality',
  parameter: 'sc_input_type',
  label: 'Single Cell Input Type',
  prompt: 'Select data type of single cell input',
  description: 'Input can be either MTX: barcodes.tsv.gz, features.tsv.gz and matrix.mtx.gz files or DGE: tab delimited digital gene expression (DGE) file with genes in rows vs. barcodes in columns. Default is MTX.',
  input: {
    type: 'string',
    default: 'MTX'
  },
  disabled: false
}

const TOOLS = {
  SEURAT: [
    {
      label: 'Quality Control',
      step: 'quality',
      parameters: [
        // {
        //   step: 'quality',
        //   parameter: 'sc_input_type',
        //   label: 'Single Cell Input Type',
        //   prompt: 'Select data type of single cell input',
        //   description: 'Input can be either MTX: barcodes.tsv.gz, features.tsv.gz and matrix.mtx.gz files or DGE: tab delimited digital gene expression (DGE) file with genes in rows vs. barcodes in columns. Default is MTX.',
        //   input: {
        //     type: 'enum',
        //     defaultValue: 'MTX',
        //     options: ['MTX', 'DGE']
        //   },
        //   disabled: false
        // },
        {
          step: 'quality',
          parameter: 'number_genes',
          label: 'Number of Genes',
          prompt: 'Specify range for number of genes',
          description: 'The minimum and maximum number of unique gene counts in a cell to be included in normalization and clustering analyses. Default is 50 to 8000.',
          input: {
            type: 'range',
            defaultValue: {min: 50, max: 8000}
          },
          disabled: false
        },
        {
          step: 'quality',
          parameter: 'percent_mito',
          label: 'Mitochondrial Fraction',
          prompt: 'Specify range of mitochondrial fraction',
          description: 'The minimum and maximum fraction of mitochondrial gene counts in a cell to be included in normalization and clustering analyses. For example, for whole cell scRNA-seq use 0 to 0.2, or for Nuc-seq use 0 to 0.05.',
          input: {
            type: 'range',
            defaultValue: {min: 0, max: 0.2}
          },
          disabled: false
        }
      ]
    },
    {
      label: 'Normalization',
      step: 'normalization',
      parameters: []
    },
    {
      label: 'Dimension Reduction',
      step: 'reduction',
      parameters: [
        {
          step: 'reduction',
          parameter: 'pca_dimensions',
          label: 'PCA Dimensions',
          prompt: 'Number of dimensions for principal component analysis',
          description: 'Max value of PCA dimensions to use for clustering and t-SNE functions. Default is 10.',
          input: {
            type: 'integer',
            defaultValue: 10
          },
          disabled: false
        }
      ]
    },
    {
      label: 'Cell Clustering',
      step: 'clustering',
      parameters: [
        {
          step: 'clustering',
          parameter: 'resolution',
          label: 'Clustering Resolution',
          prompt: 'Set clustering resolution',
          description: 'Value of the resolution parameter, use a value above 1.0 if you want to obtain a larger number of cell clusters or below 1.0 for a smaller number of cell clusters. Default is 1.0.',
          input: {
            type: 'float',
            defaultValue: 1.0
          },
          disabled: false
        }
      ]
    },
    {
      label: 'Differential Expression',
      step: 'expression',
      parameters: []
    },
  ]
}


export default TOOLS