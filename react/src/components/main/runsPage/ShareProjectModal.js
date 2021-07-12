import React, {useState, useEffect} from 'react';
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import {Divider, Button, Header, Icon, Modal, Label, Segment, Grid, Input} from 'semantic-ui-react'

import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import {queryIsNotNil} from '../../../utils'

import {useCrescentContext} from '../../../redux/hooks'

const ShareProjectModal = ({
  project: {
    name: projectName,
    createdBy: {
      userID: creatorUserID
    }
  }
}) => {
  const {projectID} = useCrescentContext()

  // State variable to keep track of who to add
  const [emailToShare, setEmailToShare] = useState('')
  const [emailError, setEmailError] = useState(false)

  // Project users
  const {
    loading: loadingProjectUsers,
    data: dataProjectUsers,
    error: errorProjectUsers,
    refetch: refetchProjectUsers
  } = useQuery(gql`
    query ProjectUsers($projectID: ID) {
      project(projectID: $projectID) {
        createdBy {
          userID
          name
        }
        sharedWith {
          userID
          name
        }
      }
    }`, {
    fetchPolicy: 'network-only',
      variables: {projectID}
    })
  const sharedWith = R.ifElse(
    queryIsNotNil('project'),
    R.path(['project', 'sharedWith']),
    R.always([])
  )(dataProjectUsers)

  // Share and unshare project GQL mutations
  const [unshareProjectByUserID, {error: unshareProjectByUserIDError}] = useMutation(gql`
    mutation UnshareProjectByUserID($projectID: ID, $userID: ID) {
      unshareProjectByUserID(projectID: $projectID, userID: $userID) {
        projectID
        sharedWith {
          userID
        }
      }
    }
  `, {
    variables: {projectID},
    onCompleted: ({unshareProjectByUserID}) => {
      setEmailToShare('')
      refetchProjectUsers()
    }
  })
  const [shareProjectByEmail, {error: shareProjectByEmailError}] = useMutation(gql`
    mutation ShareProjectByEmail($projectID: ID, $email: Email) {
      shareProjectByEmail(projectID: $projectID, email: $email) {
        projectID
      }
    }
  `, {
    variables: {projectID},
    onCompleted: ({shareProjectByEmail}) => {
      if (R.isNil(shareProjectByEmail)) {
        setEmailError(true)
      }
      setEmailToShare('')
      refetchProjectUsers()
    }
  })


  return (
    <Modal basic size='small'
      trigger={
        <Button
          color='twitter'
          animated='vertical'
        >
          <Button.Content visible><Icon name='add user'/></Button.Content>
          <Button.Content hidden content='Share Project'/>
        </Button>
      }
    >
      <Modal.Content>
        <Segment attached='top'>
          <Header icon='add user' content={projectName} subheader='Share this project with other users?' />
        </Segment>
        <Segment attached='bottom' loading={loadingProjectUsers}>
          <Grid>
            {
              RA.isNotEmpty(sharedWith) &&
              <Grid.Column width={16}>
                <Divider content='Shared with' horizontal />
                <Label.Group size='large'>
                {
                  R.addIndex(R.map)(
                    ({userID, name}, index) => (
                      (creatorUserID !== userID) &&
                      <Label key={index}
                        basic
                        color='grey'
                        content={name}
                        onRemove={
                          () => unshareProjectByUserID({
                            variables: {userID}
                          })
                        }
                      />
                    ),
                    sharedWith
                  )
                }
                </Label.Group>
              </Grid.Column>
            }
            <Grid.Column width={12}>
              <Input 
                placeholder='Enter user email to share'
                fluid
                value={emailToShare}
                onChange={(e, {value}) => {
                  setEmailError(false)
                  setEmailToShare(value)
                }}
                error={emailError}
              />
            </Grid.Column>
            <Grid.Column width={4}>
              <Button fluid content='Add'
                onClick={
                  () => shareProjectByEmail({
                    variables: {email: emailToShare}
                  })
                }
              />
            </Grid.Column>
          </Grid>
        </Segment>
      </Modal.Content>
    </Modal>
  )
}

export default ShareProjectModal