import React, {useEffect} from 'react'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import moment from 'moment'


import ArchiveProjectModal from './ArchiveProjectModal'
import ShareProjectModal from './ShareProjectModal'
import EditProjectDetailsModal from './EditProjectDetailsModal'

import MergedProjectsDetails from './MergedProjectsDetails'
import UploadedDatasetsDetails from './UploadedDatasetsDetails'

import NewRunModal from './NewRunModal'
import RunsStatusLegend from './RunsStatusLegend'
import ProjectRunsList from './ProjectRunsList'


import {Segment, Container, Button, Divider, Header, Popup, Label, Grid} from 'semantic-ui-react'

import Fade from 'react-reveal/Fade'

import {useProjectDetailsQuery} from '../../../apollo/hooks/project'
import {useCrescentContext} from '../../../redux/hooks'

import {useDispatch} from 'react-redux'
import {resetRunsPage} from '../../../redux/actions/runsPage'


const RunsPageComponent = ({

}) => {
  const dispatch = useDispatch()
  const {userID: currentUserID, projectID} = useCrescentContext()
  useEffect(() => () => dispatch(resetRunsPage()), [projectID])
  const project = useProjectDetailsQuery(projectID)

  if (R.isNil(project)) {
    return null
  }

  // es6 destructuring
  const {
    name: projectName,
    kind: projectKind,
    createdBy: {
      name: creatorName,
      userID: creatorUserID
    },
    createdOn: projectCreatedOn,
    description,
    accession,
    externalUrls,

    uploadedDatasets,
    mergedProjects
  } = project

  const isUploadedProject = R.equals(projectKind, 'uploaded')
  const currentUserIsCreator = R.equals(currentUserID, creatorUserID)
  return (
    <Fade duration={2000}>
    <Segment basic>
    <Container>
      {/* PROJECT CREATOR ACTIONS */}
      {
        R.and(isUploadedProject, currentUserIsCreator) &&
        <Button.Group attached='top' widths={3} size='large'>
          <ShareProjectModal {...{project}} />
          <EditProjectDetailsModal {...{project}} />
          <ArchiveProjectModal {...{project}} />
        </Button.Group>
      }

      {/* PROJECT ABSTRACT AND DETAILS */}
      <Segment attached>
        <Divider horizontal>
          <Header content={'Project Details'} />
        </Divider>
        {
            RA.isNotNil(accession) &&
            <Label as='a' ribbon content='ID' detail={accession} />
        }
        <Header
          content={projectName}
          subheader={`Created by ${creatorName} on ${moment(projectCreatedOn).format('D MMMM YYYY')}`}
        />
        <Divider horizontal />
        {description}
        {
          RA.isNotEmpty(externalUrls) && 
          <>
          <Divider horizontal />
          {
            R.map(
              ({label, link, type}) => (
                <Popup key={label}
                  inverted
                  trigger={<Label as='a' href={link} icon={type} target="_blank" content={label}/>}
                  content={link}
                />
              ),
              externalUrls
            )
            }
          </>
        }
      </Segment>

      {
        R.and(R.isEmpty(uploadedDatasets), RA.isNotEmpty(mergedProjects)) ?
          // {/* LIST OF MERGED PROJECTS  */}
          <MergedProjectsDetails />
        : R.and(R.isEmpty(mergedProjects), RA.isNotEmpty(uploadedDatasets)) ?
          // {/* LIST OF UPLOADED DATASETS */}
          <UploadedDatasetsDetails />
        :
          <Segment attached as={Grid} columns={2}>
            <Grid.Column>  
              <MergedProjectsDetails />
            </Grid.Column>
            <Grid.Column>
              <UploadedDatasetsDetails />
            </Grid.Column>
          </Segment>
      }


      <Segment attached='bottom'>
        <Divider horizontal>
          <Header content={'Project Runs'} />
        </Divider>
        {/* CREATE NEW RUN MODAL */}
        <NewRunModal {...{project}} />
        {/* SHOW RUNS BY STATUS */}
        {/* {isUploadedProject && <RunsStatusLegend />} */}
        { <RunsStatusLegend />}

        <ProjectRunsList />

      </Segment>
      
    </Container>
    </Segment>
    </Fade>
  )
}

export default RunsPageComponent