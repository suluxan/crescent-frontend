import {useState, useEffect} from 'react';

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

export default function useEditProjectDetailsMutation({projectID}) {
  
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