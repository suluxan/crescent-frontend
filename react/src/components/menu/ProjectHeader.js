import React, { useReducer, useEffect } from 'react'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import { Button, Input, Form, Modal, Dropdown, Popup, Segment, Message, Header, Label } from 'semantic-ui-react'

import { useCrescentContext } from '../../redux/hooks'
import { useProjectDetailsQuery } from '../../apollo/hooks/project'
import { useEditProjectDetailsMutation } from '../../apollo/hooks/project'

function useProjectDetails(projectID) {
  const {
    project: projectQuery,
    editProjectDescription,
    editProjectName,
    changeProjectOwnership,
    loading,
    dataDesc,
    dataName,
    dataOwner
  } = useEditProjectDetailsMutation({ projectID })

  // hold all state (project data, form data, modal open) in reducer
  const [state, dispatch] = useReducer((state, action) => {
    const { type, payload } = action
    if (type === 'resetForm') {
      const form = { name: state.project.name, description: state.project.description, ownerID: state.project.createdBy.userID }
      return { ...state, form }
    } else if (type === 'updateFormName') {
      const { newName } = payload
      const form = { ...state.form, name: newName }
      return { ...state, form }
    } else if (type === 'updateFormDescription') {
      const { newDescription } = payload
      const form = { ...state.form, description: newDescription }
      return { ...state, form }
    } else if (type === 'updateFormOwner') {
      const { newOwnerID } = payload
      const form = { ...state.form, ownerID: newOwnerID }
      return { ...state, form }
    } else if (type === 'setProjectData') {
      const { project } = payload
      const { name, description, sharedWith, createdBy } = project
      const form = { name, description, ownerID: createdBy.userID }
      return { ...state, project, form }
    } else if (type === 'setOpen') {
      const { isOpen } = payload
      const open = isOpen
      return { ...state, open }
    } else if (type === 'mutateName') {
      editProjectName({ variables: { newName: state.form.name } })
      return state
    } else if (type === 'mutateDesc') {
      editProjectDescription({ variables: { newDescription: state.form.description } })
      return state
    } else if (type === 'mutateOwner') {
      changeProjectOwnership({ variables: { userID: state.form.ownerID } })
      return state
    } else {
      return state
    }
  }, {
    project: null,
    form: { name: '', description: '', ownerID: '' },
    open: false
  })

  //useEffect to listen for projectQuery to be non-null (to setProjectData)
  useEffect(() => {
    if (RA.isNotNil(projectQuery)) {
      dispatch({ type: 'setProjectData', payload: { project: projectQuery } })
    }
  }, [projectQuery])

  // when modal is open, set new name, description, owner to match the old ones
  useEffect(() => {
    if (state.open) {
      dispatch({ type: 'resetForm' })
    }
  }, [state.open])

  // close Modal when mutation successful
  useEffect(() => {
    if (R.any(RA.isTrue, [RA.isNotNil(dataDesc), RA.isNotNil(dataName), RA.isNotNil(dataOwner)])) {
      dispatch({ type: 'setOpen', payload: { isOpen: false } })
    }
  }, [dataDesc, dataName, dataOwner])

  return { state, dispatch, loading }
}

const ProjectHeader = ({

}) => {
  const { projectID, userID: currentUserID } = useCrescentContext()
  const { state, dispatch, loading } = useProjectDetails(projectID)

  if (R.isNil(state.project)) {
    return null
  }

  const oldName = state.project.name
  const createdUserID = state.project.createdBy.userID
  const sameName = R.equals(oldName, state.form.name)
  const sameDesc = R.equals(state.project.description, state.form.description)
  const sameOwner = R.equals(createdUserID, state.form.ownerID)
  const disabled = R.or(loading, RA.allEqualTo(true, [sameName, sameDesc, sameOwner])) // disable button when loading or unchanged description/name/owner
  const currentUserIsCreator = R.equals(currentUserID, createdUserID)
  const notShared = R.equals(1, R.length(state.project.sharedWith))

  // call dispatch with appropriate action(s) after Save is clicked
  const submitButtonHandler = () => {
    if (!sameName) { dispatch({ type: 'mutateName' }) }
    if (!sameDesc) { dispatch({ type: 'mutateDesc' }) }
    if (!sameOwner) { dispatch({ type: 'mutateOwner' }) }
  }

  return (
    currentUserIsCreator ? (
      <Modal basic open={state.open} onOpen={() => dispatch({ type: 'setOpen', payload: { isOpen: true } })} onClose={() => dispatch({ type: 'setOpen', payload: { isOpen: false } })}
        trigger={
          <Label as={Button} basic onClick={() => dispatch({ type: 'setOpen', payload: { isOpen: true } })}>
            <Header textAlign="center">{oldName}</Header>
          </Label>
        }
      >
        <Modal.Content>
          <Segment.Group>
            <Segment attatched='top' >
              <Header icon='edit' content={oldName} subheader='Edit the details of this project?' />
            </Segment >
            <Segment attatched='top bottom'>
              <Header as='h4'>Project Name</Header>
              <Input fluid value={state.form.name} onChange={(e, { value }) => { dispatch({ type: 'updateFormName', payload: { newName: value } }) }} />
              <Header as='h4'>Project Description</Header>
              <Form>
                <Form.TextArea
                  value={state.form.description}
                  onChange={(e, { value }) => { dispatch({ type: 'updateFormDescription', payload: { newDescription: value } }) }}
                />
              </Form>
              <Header as='h4'>
                <Header.Content>
                  Project Owner
                  { notShared && 
                    <Header.Subheader>This project is not shared with any other users</Header.Subheader>
                  }
                </Header.Content>
              </Header>
              <Dropdown
                defaultValue={createdUserID}
                fluid
                selection
                onChange={(e, { value }) => {
                  dispatch({ type: 'updateFormOwner', payload: { newOwnerID: value } })
                }}
                options={
                  R.map(
                    ({ name, userID }) => ({
                      key: userID,
                      value: userID,
                      text: name
                    }),
                    state.project.sharedWith
                  )
                }
                disabled={notShared} />
            </Segment>
            <Segment attatched='bottom'>
              <Button color='black' disabled={disabled} loading={loading} fluid content='Save' onClick={submitButtonHandler} />
            </Segment>
          </Segment.Group>
        </Modal.Content>
      </Modal>
    ) : (
      <Header textAlign="center">{oldName}</Header>
    )

  )
}

export default ProjectHeader