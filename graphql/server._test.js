// apollo-gql: users, projects, datasets, runs | python-gql: results 

// Once I get test3.js to work I can automate it with tests here

const server = require('./server')
const { createTestClient } = require('apollo-server-testing');

const { query, mutate } = createTestClient(server);

// email regex from https://emailregex.com/ as per RFC 5322
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

test('Users', () => 
  query({
    query: `{
      users {
        userID
        email
        name
        sessionToken
      }
    }`
  }).then(resp => {
    const users = resp["data"]["users"]
    console.log(users)
    // Check if users is an array
    expect(Array.isArray(users)).toBe(true)

    users.array.forEach(user => {
      // userID is 24 character lowercase alphanumeric
      expect(user["userID"]).toMatch(/[a-z\d]{24}/)
      
      expect(user["email"]).toMatch(emailRegex)
    })
  })
)
