import {useState} from 'react'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

export default function useRunDetails(runID) {
  const [run, setRun] = useState(null)
  const {loading, data, error} = useQuery(gql`
    query RunDetails($runID: ID) {
      run(runID: $runID) {
        runID
        createdOn
        createdBy {
          userID
          name
        }
        name
        description
        # params

        parameters

        status

        savedPlotQueries {
          id
          activeResult
          selectedQC
          selectedFeature
          selectedFeatures
          selectedGroup
          selectedAssay
          selectedDiffExpression
          selectedQCDataset
          selectedScaleBy
          selectedExpRange
        }

        secondaryRuns {
          wesID
          status
          submittedOn
          completedOn
        }
        uploadNames {
          gsva
          metadata
        }

        submittedOn
        completedOn

        datasets {
          datasetID
          name
          size
          hasMetadata
          cancerTag
        }

        project {
          name
          createdBy {
            userID
            name
          }
        }
      }
    }
  `, {
    fetchPolicy: 'cache-and-network',
    variables: {runID},
    onCompleted: ({run}) => {
      setRun(run)
    }
  })

  return run
}
