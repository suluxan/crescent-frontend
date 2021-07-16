import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import * as RA from 'ramda-adjunct'

export default function useRemoveSavedPlotQueryMutation(
  runID,
  plotQueryID,
  updatePlotQueryID
) {
  const [removeSavedPlotQuery, {loading, error}] = useMutation(gql`
    mutation RemoveSavedPlotQuery(
      $runID: ID!,
      $plotQueryID: ID!
    ) {
      removeSavedPlotQuery(
        runID: $runID,
        plotQueryID: $plotQueryID
      ) {
        runID
        savedPlotQueries {
          id
        }
      }
    }
  `, {
    variables: {
      runID, plotQueryID
    },
    onCompleted: ({removeSavedPlotQuery}) => {
      if (RA.isNotNil(removeSavedPlotQuery)) {
        updatePlotQueryID()
      }
    }
  })
  return {removeSavedPlotQuery, loading}
}