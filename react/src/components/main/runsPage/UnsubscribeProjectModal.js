import React, { useState, useEffect } from 'react';

import { Container, Card, Divider, Button, Header, Icon, Modal, Dropdown, Label, Segment, Grid } from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import { useDispatch } from 'react-redux'

import { useCrescentContext } from '../../../redux/hooks'
import { goBack } from '../../../redux/actions/context'

const UnsubscribeProjectModal = ({
    // Props
    project: {
        name: projectName
    }
}) => {
    const dispatch = useDispatch()
    const { projectID, userID } = useCrescentContext()

    const [unshareProjectByUserID, { error: unshareProjectByUserIDError }] = useMutation(gql`
    mutation UnshareProjectByUserID($projectID: ID, $userID: ID) {
      unshareProjectByUserID(projectID: $projectID, userID: $userID) {
        projectID
        sharedWith {
          userID
        }
      }
    }
  `, {
        variables: { projectID },
        onCompleted: data => {
            dispatch(goBack())
        }
    })

    return (
        <Modal basic size='small'
            trigger={
                <Button
                    color='red'
                    animated='vertical'
                >
                    <Button.Content visible><Icon name='x' /></Button.Content>
                    <Button.Content hidden content='Unsubscribe from project' />
                </Button>
            }
        >
            <Modal.Content>
                <Segment attached='top'>
                    <Header icon='x' content={projectName} subheader='Are you sure you want to unsubscribe from this project?' />
                </Segment>
                <Segment attached='bottom'>
                    <Button fluid color='red' inverted onClick={() => unshareProjectByUserID({ variables: { userID } })}>
                        <Icon name='checkmark' />
                        Yes, unsubscribe from this project
                    </Button>
                </Segment>
            </Modal.Content>
        </Modal>
    )
}

export default UnsubscribeProjectModal