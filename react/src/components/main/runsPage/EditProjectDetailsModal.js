import React, {useState, useEffect} from 'react'

import {Button, Input, Icon, Modal, Segment, Header} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import {useEditProjectDetailsMutation} from '../../../apollo/hooks/project'

export default function EditProjectDetailsModal ({project}) {
  const [open, setOpen] = useState(false) // whether or not Modal is open
  const {projectID, name: oldName, description: oldDescription} = project // destructuring
  const {editProjectDescription, editProjectName, loadingDesc, dataDesc, loadingName, dataName} = useEditProjectDetailsMutation({projectID})
  // keeping track of what's being typed for description and name
  const [newDescription, setNewDescription] = useState(oldDescription)
  const [newName, setNewName] = useState(oldName)
  
  useEffect(() => {if (open) {setNewDescription(oldDescription)}}, [open]) // when Modal is first opened, set new description and name as their old ones so it's displayed
  useEffect(() => {if (R.or(RA.isNotNil(dataDesc), RA.isNotNil(dataName))) {setOpen(false)}}, [dataDesc, dataName]) // close Modal when mutation successful

  const sameName = R.equals(oldName, newName)
  const sameDesc = R.equals(oldDescription, newDescription)
  const disabled = R.or(R.or(loadingDesc, loadingName), R.and(sameName, sameDesc)) // disable button when loading or unchanged description/name

  // calls appropriate mutate function after button is clicked
  const submitButtonHandler = () => {
    if (!sameName) {editProjectName({variables: {newName}})}
    if (!sameDesc) {editProjectDescription({variables: {newDescription}})}
  }

  return (
    <Modal basic open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
      trigger={
        <Button color='teal' animated='vertical'>
          <Button.Content visible><Icon name='edit'/></Button.Content>
          <Button.Content hidden content='Edit Details'/>
        </Button>
      }
    >
      <Modal.Content>
        <Segment attached='top'>
          <Header icon='edit' content={oldName} subheader='Edit the details of this project?' />
        </Segment>
        <Segment attached>
          <Header as='h4'>Project Name</Header>
          <Input fluid value={newName} onChange={(e, {value}) => {setNewName(value)}}/>
          <Header as='h4'>Project Description</Header>
          <Input fluid value={newDescription} onChange={(e, {value}) => {setNewDescription(value)}} />
        </Segment>
        <Segment attached='bottom'>
          <Button color='green' disabled={disabled} loading={R.or(loadingDesc, loadingName)} fluid content='Save' onClick={submitButtonHandler}/>
        </Segment>
      </Modal.Content>

    </Modal>
  )
}