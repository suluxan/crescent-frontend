import {useState} from 'react'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import {grapheneClient as client} from '../../clients'
import * as R from 'ramda'


export default function useResultsAvailable(runID) {
  const [plots, setPlots] = useState(null)
  const {loading, data, error} = useQuery(gql`
    query ResultsAvailable($runID: ID) {
      plots(runID: $runID) {
        label
        result
        description
      }
    }
    `, {
    client,
    fetchPolicy: 'cache-and-network',
    variables: {runID},
    onCompleted: ({plots}) => {
      setPlots(plots)
    },
    skip: R.isNil(runID)
  })

  return plots
}