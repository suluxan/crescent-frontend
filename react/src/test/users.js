// Small experiment with trying to query apollo gql as a client to test it

const {
  ApolloClient,
  gql,
  InMemoryCache
} = require('@apollo/client');

const cache = new InMemoryCache({})

const client = new ApolloClient({
  cache,
  uri: "http://localhost:5000"
});

client.query({
  query: gql`query Test {
    users {
      userID
      email
      name
      sessionToken
    }
  }`
}).then(console.log)
