const { gql } = require('apollo-server')

const typeDefs = gql`
  scalar Date
  type Url {
    label: String
    link: String
    type: String
  }
  type Project {
    projectID: ID
    kind: String #'uploaded', 'curated'
    name: String
    description: String
    accession: String
    externalUrls: [Url]
    sharedWith: [User]
    createdBy: User
    createdOn: Date

    archived: Date

    runs: [Run]

    mergedProjectIDs: [ID]
    mergedProjects: [Project]

    uploadedDatasetIDs: [ID]
    uploadedDatasets: [Dataset]

    allDatasets: [Dataset]
  }
  type Query {
    project(projectID: ID): Project

    curatedProjects: [Project]

    projects(userID: ID): [Project]
  }
 
  #  Make datasets separately for scaling reasons
  # input DatasetDirectory {
  #   directoryName: String!
  #   matrix: Upload!
  #   features: Upload!
  #   barcodes: Upload!
  #   metadata: Upload
  # }

  type Mutation {
    createMergedProject(
      userID: ID
      name: String
      description: String
      projectIDs: [ID]!
      datasetIDs: [ID]!
    ): Project
    
    
    shareProjectByEmail(
      projectID: ID
      email: Email
    ): Project
    unshareProjectByUserID(
      projectID: ID
      userID: ID
    ): Project


    # Sets 'sharedWith' property to whatever array of IDs is passed
    shareProject(
      projectID: ID
      sharedWith: [ID]
    ): Project

    # Archive project by setting archive property to a current date
    archiveProject(
      projectID: ID
    ): Project

    # Add external links to project
    addExternalUrl(
      projectID: ID
      label: String
      link: String
      type: String
    ): Project

    # Update the project's description
    updateProjectDescription(projectID: ID, newDescription: String): Project
  }
`

module.exports = typeDefs