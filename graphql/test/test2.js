// apollo-gql: users, projects, datasets, runs | python-gql: results 

// Tried an approach similar to what graphql/index.js was doing 

require('dotenv').config()
const mongooseConnection = require('mongoose').connection
const {ToolStep} = require('../../database/mongo')
const apolloServer = require('../server')
const { createTestClient } = require('apollo-server-testing')
const { gql } = require('@apollo/client');

// For loading seurat tool info into mongo
const R = require('ramda')
const TOOLS = require('../TOOLS')
const seuratToolSteps = R.compose(
  R.flatten,
  R.pluck('parameters'),
  R.prop('SEURAT')
)(TOOLS)

// Load SEURAT tool steps into database then start GQL server
mongooseConnection.once('open', () => {
  console.log("STARTING TOOLSTEP")
  const loadSeuratPromise = new Promise((resolve, reject) => {
    ToolStep.deleteMany({}, (err) => {
      ToolStep.collection.insertMany(seuratToolSteps, (err, docs) => {
        if (err) {
          reject()
        } else {
          console.log('Loaded SEURAT tool details')
          resolve(docs) 
        }
      })
    })
  })

  loadSeuratPromise.then(() => {
    const { query, mutate } = createTestClient(apolloServer);
    query({
      query: gql`{
        users {
          userID
          email
          name
          sessionToken
        }
      }`
    }).then(resp => {console.log(resp)})
  })
})
