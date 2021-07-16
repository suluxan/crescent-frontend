const mongoose = require('mongoose')

const SecondaryRunSchema = new mongoose.Schema({
  // MinIO object name
  wesID: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'completed', 'failed'],
    default: 'pending'
  },  
  submittedOn: {
    type: Date,
    default: null
  },
  completedOn: {
    type: Date,
    default: null
  },
  // uploadName: {
  //   type: String,
  //   default: null
  // }
})

const UploadNamesSchema = new mongoose.Schema ({
  gsva: {
    type: String,
    default: null
  },
  metadata: {
    type: String,
    default: null
  }
})

const PlotQuerySchema = new mongoose.Schema ({
  activeResult: {
    type: String,
    default: null
  },
  selectedQC: {
    type: String,
    default: null
  },
  selectedFeature: {
    type: String,
    default: null
  },
  selectedFeatures: {
    type: [String],
    default: null
  },
  selectedScaleBy: {
    type: String,
    default: null
  },
  selectedExpRange: {
    type: [String],
    default: null
  },
  selectedGroup: {
    type: String,
    default: null
  },
  selectedAssay: {
    type: String,
    default: null
  },
  selectedDiffExpression: {
    type: String,
    default: null
  },
  selectedQCDataset: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
})

const RunSchema = new mongoose.Schema({
  runID: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  // params: {
  //   type: String,
  //   // required: true
  // },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  projectID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  datasetIDs: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true
  },
  referenceDatasetIDs: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },

  status: {
    type: String,
    enum: ['pending', 'submitted', 'completed', 'failed'],
    default: 'pending'
  },

  downloadable: {
    type: Boolean,
    default: true
  },

  wesID: {
    type: String,
    default: null
  },
  secondaryRuns: {
    type: [SecondaryRunSchema],
    default: [],
  },
  submittedOn: {
    type: Date,
    default: null
  },

  completedOn: {
    type: Date,
    default: null
  },

  uploadNames: {
    type: UploadNamesSchema,
    default: {metadata: null, gsva: null},
  },

  savedPlotQueries: {
    type: [PlotQuerySchema],
    default: []
  }
})

module.exports = RunSchema