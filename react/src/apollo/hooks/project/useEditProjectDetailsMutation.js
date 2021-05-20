import {useState, useEffect} from 'react';

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

// custom hook to edit project details
export default function useEditProjectDetailsMutation({projectID}) {
  
  // using the useMutation hook to get a mutate function (editProjectDescription) that we can call to execute the mutation
  const [editProjectDescription, {loading, data, error}] = useMutation(gql`
    mutation UpdateProjectDescription($projectID: ID, $newDescription: String) {
      updateProjectDescription(projectID: $projectID, newDescription: $newDescription) {
        description
      }
    }
  `, {
    variables: {projectID}
  })

  return {editProjectDescription, loading, data}
}