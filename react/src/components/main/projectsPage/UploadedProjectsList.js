import React, {useState, useEffect} from 'react';

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import {Form, Card, Header, Transition, Button, Container, Modal, Label, Divider, Icon, Image, Popup, Segment} from 'semantic-ui-react'

import {useUserProjectsQuery} from '../../../apollo/hooks'
import {useCrescentContext} from '../../../redux/hooks'

import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'

import Fade from 'react-reveal/Fade'
import {ClimbingBoxLoader} from 'react-spinners'

const UploadedProjectsList = ({
}) => {
  // GQL query to find all projects of which user is a member of
  const {userID} = useCrescentContext()
  const userProjects = useUserProjectsQuery(userID)
  if (R.isNil(userProjects)) {
    return (
      <Fade>
      <Segment basic>
        <Segment placeholder>
          <Header textAlign='center' icon>
            <ClimbingBoxLoader />
          </Header>
        </Segment>
      </Segment>
      </Fade>
    )
  }

  return (
    <>
    
    <NewProjectModal />
    
    <Divider horizontal />
    {
      R.isEmpty(userProjects) ?
        <Fade>
        <Segment basic>
          <Segment placeholder>
            <Header icon>
              <Icon name='exclamation' />
              No Projects
            </Header>
          </Segment>
        </Segment>
        </Fade>
      :
        <Card.Group itemsPerRow={3}>
        {
          R.addIndex(R.map)(
            (project, index) => (
              <ProjectCard key={index} {...{project}} />
            ),
            userProjects
          )
        }
        </Card.Group>
    }
    </>
  )
}


export default UploadedProjectsList