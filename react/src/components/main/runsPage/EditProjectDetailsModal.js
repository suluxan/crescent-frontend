import React, {useState, useEffect} from 'react'

import {Button, Input, Icon, Modal, Segment, Header} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import {useEditProjectDetailsMutation} from '../../../apollo/hooks/project'

export default function EditProjectDetailsModal ({project}) {
  const [open, setOpen] = useState(false)
  const {projectID, name: projectName, description: oldDescription} = project
  const {editProjectDescription, loading, data} = useEditProjectDetailsMutation({projectID})

  const [newDescription, setNewDescription] = useState(oldDescription)
  useEffect(() => {if (open) {setNewDescription(oldDescription)}}, [open])

  useEffect(() => {if (RA.isNotNil(data)) {setOpen(false)}}, [data])

  const disabled = R.or(loading, R.equals(oldDescription, newDescription))
  const submitButtonProps = {disabled, loading, fluid: true, content: 'Edit', onClick: () => editProjectDescription({variables: {newDescription}})}

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
          <Header icon='edit' content={projectName} subheader='Are you sure you want to edit this project?' />
        </Segment>
        <Segment attached>
          <Input fluid value={newDescription} onChange={(e, {value}) => {setNewDescription(value)}} />
        </Segment>
        <Segment attached='bottom'>
          <Button {...submitButtonProps} />
        </Segment>
      </Modal.Content>

    </Modal>
  )
}