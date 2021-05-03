const mongoose = require('mongoose');
const Schemas = require('./schema');

// My attempts at a fix for Mongo. *Exhales loudly

// require('dotenv').config();
// process.env.MONGO_URL is undefined. Runnning the above statement does nothing

// Passing "mongodb://mongo/crescent"  gives a timeout with  getaddrinfo ENOTFOUND mongo mongo:27017 

// Passing "mongodb://localhost:27017" successfully prints "Connected to MongoDB at ..."
// but the graphql query doesn't return anything anyway ¯\_(ツ)_/¯

mongoose.createConnection("mongodb://localhost:27017", {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB at", process.env.MONGO_URL)).catch(console.log);

const Models = {};
for (let schema in Schemas) {
    const model = schema.slice(0, -"Schema".length);
    Models[model] = mongoose.model(model.toLowerCase(), Schemas[schema]);
    console.log("Created MongoDB model", model);
}

module.exports = Models;
