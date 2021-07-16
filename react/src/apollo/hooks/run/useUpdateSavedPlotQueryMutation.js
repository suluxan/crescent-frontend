import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

export default function useUpdateSavedPlotQueryMutation(
  runID,
  input,
) {
  const [updateSavedPlotQuery, {loading, error}] = useMutation(gql`
    mutation UpdateSavedPlotQuery(
      $runID: ID!,
      $input: PlotQueryInput!
    ) {
      updateSavedPlotQuery(
        runID: $runID,
        input: $input
      ) {
        runID
      }
    }
  `, {
    variables: {
      runID, input
    },
  })
  return {updateSavedPlotQuery, loading}
}