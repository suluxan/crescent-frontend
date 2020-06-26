import React, {useState, useEffect, useReducer} from 'react';

import {Transition, Segment, Card, Header, Form, Button, Modal, Label, Divider, Icon, Popup, List} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import withRedux from '../../../../redux/hoc'

import { useMutation, useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import {queryIsNotNil} from '../../../../utils'

const ProjectDatasetSelect = ({
  projectID, name,
  // 
  datasetsState, datasetsDispatch
}) => {
  const {loading, data, error, refetch} = useQuery(gql`
    query ProjectDatasets($projectID: ID) {
      project(projectID: $projectID) {
        projectID

        allDatasets {
          datasetID
          name
        }
      }
    }
  `, {
    fetchPolicy: 'cache-and-network',
    variables: {projectID},
  })

  const allDatasets = R.ifElse(
    queryIsNotNil('project'),
    R.path(['project', 'allDatasets']),
    R.always([])
  )(data)

  const selectedDatasets = R.intersection(
    R.pluck('datasetID', allDatasets),
    datasetsState
  )
  return (
    <Segment loading={loading}>

      <Header sub content={name} />
      <Label.Group>
        {
          R.map(
            ({datasetID, name}) => (
              <Label key={datasetID} content={name}
                as={Button}
                color={R.includes(datasetID, datasetsState) ? 'black' : undefined}
                onClick={() => datasetsDispatch({type: 'TOGGLE_DATASET', datasetID})}
              />
            ),
            allDatasets
          )
        }
      </Label.Group>

      <Divider horizontal />
      <Label attached='bottom' as={Button} size='small'
        color={
          RA.isNotEmpty(selectedDatasets) ? 'black' : undefined
          
        }
        onClick={() => datasetsDispatch({
          type: 'TOGGLE_MANY_DATASETS',
          datasetIDs: R.pluck('datasetID', allDatasets)
        })}
        animated='vertical'
      >
        <Button.Content visible>
        {`${R.length(selectedDatasets)}/${R.length(allDatasets)}`}
        </Button.Content>
        <Button.Content hidden>
          Select all datasets from this project
        </Button.Content>
      </Label>
    </Segment>
  )
}


const DataForm = withRedux(({
  app: {
    user: {userID},
    project: {projectID, mergedProjects, uploadedDatasets}
  },

  // Props
  datasetsState, datasetsDispatch
}) => {
  const selectedUploadedDatasets = R.intersection(
    R.pluck('datasetID', uploadedDatasets),
    datasetsState
  )
  return (
    <>
      {
        RA.isNotEmpty(uploadedDatasets) &&
        <Segment>
          <Header sub content={'Datasets uploaded with this project'}/>
          <Label.Group>
            {
              R.map(
                ({datasetID, name}) => (
                  <Label key={datasetID} content={name}
                    as={Button}
                    color={R.includes(datasetID, datasetsState) ? 'black' : undefined}
                    onClick={() => datasetsDispatch({type: 'TOGGLE_DATASET', datasetID})}
                  />
                ),
                uploadedDatasets
              )
            }
          </Label.Group>

          <Divider horizontal />
          <Label attached='bottom' as={Button} size='small'
            color={
              RA.isNotEmpty(selectedUploadedDatasets) ? 'black' : undefined
              
            }
            onClick={() => datasetsDispatch({
              type: 'TOGGLE_MANY_DATASETS',
              datasetIDs: R.pluck('datasetID', uploadedDatasets)
            })}
            animated='vertical'
          >
            <Button.Content visible>
            {`${R.length(selectedUploadedDatasets)}/${R.length(uploadedDatasets)}`}
            </Button.Content>
            <Button.Content hidden>
              Select all datasets from this project
            </Button.Content>
          </Label>
        </Segment>
      }
      {
        RA.isNotEmpty(mergedProjects) &&
          R.map(
            ({projectID, name}) => (
              <ProjectDatasetSelect key={projectID}
                {...{
                  projectID, name,
                  datasetsState, datasetsDispatch
                }}
              />
            ),
            mergedProjects
          )
      }
    </>
  )
})

export default DataForm