import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import * as RA from 'ramda-adjunct'
import * as R from 'ramda'

export default function useSavePlotQueryMutation(
  runID,
  input,
  updatePlotQueryID
) {
  const [savePlotQuery, {loading, error}] = useMutation(gql`
    mutation SavePlotQuery(
      $runID: ID!,
      $input: PlotQueryInput!
    ) {
      savePlotQuery(
        runID: $runID,
        input: $input
      ) {
        runID
        savedPlotQueries {
          id
        }
      }
    }
  `, {
    variables: {
      runID, input
    },
    onCompleted: ({savePlotQuery}) => {
      if (RA.isNotNil(savePlotQuery)) {
        updatePlotQueryID(R.last(savePlotQuery.savedPlotQueries).id)
      }
    }
  })
  return {savePlotQuery, loading}
}