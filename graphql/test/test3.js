// apollo-gql: users, projects, datasets, runs | python-gql: results 

// Simple test to try apollo-server-testing which is what the Apollo Docs recommend.

require('dotenv').config()
const mongoose = require('mongoose')
const { createTestClient } = require('apollo-server-testing')
const R = require('ramda')

const apolloServer = require('../server')
const Schemas = require('../../database/schema')

const { query, mutate } = createTestClient(apolloServer);

// const MONGO_URL = "mongodb://localhost:27017"; //"mongodb://mongo/crescent";
console.log("Querying ...")
query({
  query: `{
    users {
      userID
      email
      name
      sessionToken
    }
  }`
}).then(resp => {console.log(resp.data)}).catch(console.log);

// MONCON 2021 !!
// const moncon = mongoose.createConnection("mongodb://localhost:27017", {
//   useNewUrlParser: true,
//   useFindAndModify: false,
//   useCreateIndex: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log("Connected to MongoDB at", MONGO_URL)
//   const Models = {};
//   for (let schema in Schemas) {
//     const model = schema.slice(0, -"Schema".length);
//     Models[model] = moncon.model(model.toLowerCase(), Schemas[schema]);
//     console.log("Created MongoDB model", model);
//   }
  
// }).catch(console.log);

