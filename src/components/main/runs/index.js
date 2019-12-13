import React, {useState, useEffect} from 'react';

import {Container, Card, Divider, Button, Header, Icon, Modal, Dropdown, Label, Segment, Grid, Step, Transition} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import moment from 'moment'
import filesize from 'filesize'

import withRedux from '../../../redux/hoc'

import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import {queryIsNotNil} from '../../../utils'

import RunCard from './RunCard'
import NewRunModal from './NewRunModal'

import ArchiveProjectModal from '../projects/ArchiveProjectModal'
import ShareProjectModal from '../projects/ShareProjectModal'



const RunsStatusLegend = ({
  projectRuns,
  runsBySize,
  runFilter,
  setRunFilter
}) => {
  const {pending: pendingCount, submitted: submittedCount, completed: completedCount, failed: failedCount} = R.reduce(
    (runCountsByStatus, {status}) => R.over(R.lensProp(status), R.inc, runCountsByStatus),
    {pending: 0, submitted: 0, completed: 0, failed: 0},
    projectRuns
  )
  const totalCount = R.length(projectRuns)
  const totalSize = R.compose(
    R.sum,
    R.values
  )(runsBySize)

  return (
    <Step.Group fluid widths={5}>
      {
        R.compose(
          R.map(
            ({key, icon, color, title, description}) => (
              <Step key={key}
                active={R.equals(key, runFilter)}
                onClick={() => setRunFilter(key)}
              >
                <Icon name={icon} color={color}
                  loading={R.and(R.equals('submitted', key), R.not(R.equals(0, submittedCount)))}
                />
                <Step.Content
                  title={title}
                  description={description}
                />
              </Step>
            )
          )    
        )([
          {
            key: 'all',
            icon: 'file',
            color: 'black',
            title: `${totalCount} Total`,
            description: `${filesize(totalSize)}`
          },
          {
            key: 'pending',
            icon: 'circle outline',
            color: 'orange',
            title: `${pendingCount} Pending`,
            description: 'To Submit'
          },
          {
            key: 'submitted',
            icon: 'circle notch',
            color: 'yellow',
            title: `${submittedCount} Submitted`,
            description: 'Computing'
          },
          {
            key: 'completed',
            icon: 'circle outline check',
            color: 'green',
            title: `${completedCount} Completed`,
            description: 'Successfully'
          },
          {
            key: 'failed',
            icon: 'circle exclamation',
            color: 'red',
            title: `${failedCount} Failed`,
            description: 'Errored'
          }
        ])
      }
    </Step.Group>
  )
}

const RunsCardList = withRedux(({
  app: {
    user: {
      userID: currentUserID
    },
    project: {
      projectID,
      name: projectName,
      kind: projectKind,
      description,
      createdOn: projectCreatedOn,
      createdBy: {name: creatorName, userID: creatorUserID}
    },
    view: {
      isGuest
    }
  },
}) => {
  const {loading, data, error, refetch} = useQuery(gql`
    query ProjectRuns($projectID: ID) {
      runs(projectID: $projectID) {
        runID
        createdOn
        createdBy {
          userID
          name
        }
        name
        params
        status

        submittedOn
        completedOn
      }
    }
  `, {
    fetchPolicy: 'cache-and-network',
    variables: {projectID},
  })
  const projectRuns = R.ifElse(
    queryIsNotNil('runs'),
    R.prop('runs'),
    R.always([])
  )(data)
  const [runsBySize, setRunsBySize] = useState({})
  useEffect(() => {
    Promise.all(
      R.compose(
        R.map(runID => fetch(`size/${runID}`).then(res => res.json())),
        R.pluck('runID')
      )(projectRuns)
    ).then(
      R.compose(
        setRunsBySize,
        R.zipObj(R.pluck('runID', projectRuns)),
        R.pluck('size')
      )
    )
  }, [projectRuns])

  const [runFilter, setRunFilter] = useState('all')
  const isUploadedProject = R.equals('uploaded', projectKind)
  const currentUserIsProjectCreator = R.equals(creatorUserID, currentUserID)

  const filteredProjectRuns = R.compose(
    R.reject(
      R.compose(
        R.and(R.not(isUploadedProject)),
        R.propEq('status', 'pending')
      )
    ),
    R.filter(
      R.compose(
        R.or(R.equals('all', runFilter)),
        R.propEq('status', runFilter)
      )
    )
  )(projectRuns)
  return (
    <Container>
      <Segment attached='top'>
        <Divider horizontal>
          <Header size='large' content={`${isUploadedProject ? 'User Uploaded' : 'Curated'} Project Details`} />
        </Divider>
        <Header
          content={projectName}
          subheader={`Created by ${creatorName} on ${moment(projectCreatedOn).format('D MMMM YYYY')}`}
        />
        <Divider horizontal />
        {description}
      </Segment>
      {/* ADD USERS TO PROJECT OR ARCHIVE PROJECT ONLY IF NOT PUBLIC PROJECT*/}
      {
        R.and(isUploadedProject, currentUserIsProjectCreator) && 
          <Button.Group attached widths={2}>
            <ShareProjectModal />
            <ArchiveProjectModal />
          </Button.Group>
      }
      <Segment attached='bottom'>
        <Divider horizontal>
          <Header size='large' content={'Project Runs'} />
        </Divider>
        {
          isUploadedProject &&
            <RunsStatusLegend {...{projectRuns, runsBySize, runFilter, setRunFilter}} />
        }
        <NewRunModal {...{refetch}} />
        {/* LIST OF EXISTING RUNS FOR PROJECT */}
        {
          R.isEmpty(filteredProjectRuns) ?
            <Segment attached='bottom'>
              <Segment placeholder>
                <Header icon>
                  <Icon name='exclamation' />
                  {`No Runs`}
                </Header>
              </Segment>
            </Segment>
          :
            <Segment attached='bottom'>
              <Card.Group itemsPerRow={3}>
              {
                R.map(
                  run => <RunCard key={R.prop('runID', run)} {...{run, refetch}} />,
                  filteredProjectRuns
                )
              }
              </Card.Group>
            </Segment>
        }
      </Segment>
    </Container>
  )
})

export default RunsCardList