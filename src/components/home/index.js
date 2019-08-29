import React, {useState, useEffect} from 'react';

import { Icon, Input, Menu, Dropdown, Header, Segment, Button, Label, Grid, Image, Modal, Divider, Step, Card } from 'semantic-ui-react'

import { useMutation, useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

import Expression from '../expression'

import CWLParamsButton from './ParamsButton'
import CWLStatusButton from './StatusButton'
import CWLResultsButton from './ResultsButton'

import UploadModal from './UploadModal'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

const VisHeader = ({
  currentProjectID, currentRunId
}) => {
  const {loading: projectLoading, data: projectData} = useQuery(gql`
    query ProjectDetails($projectID: ID!) {
      project(projectID: $projectID) {
        projectID
        name
      }
    }
  `, {
    variables: {projectID: currentProjectID}
  })
  const {loading: runLoading, data: runData} = useQuery(gql`
    query RunDetails($runID: ID!) {
      run(runID: $runID) {
        runID
        name
      }
    }
  `, {
    variables: {runID: currentRunId},
    skip: R.isNil(currentRunId)
  })
  const isDataReturned = (query, data) => R.both(
    RA.isNotNilOrEmpty,
    R.propSatisfies(RA.isNotNil, query)
  )(data)
  console.log(runData, projectData, 'data')
  return ( 
    <Header block>
      <Header.Content>
        {
          isDataReturned('project', projectData) &&
          `${R.path(['project','name'], projectData)} (ID ${R.path(['project','projectID'], projectData)})`
        }
        {
         isDataReturned('run', runData) &&
          <Header.Subheader
            content={`${R.path(['run','name'], runData)} (ID ${R.path(['run','runID'], runData)})`}
          /> 
        }
      </Header.Content>
    </Header>
  )

}

const VisualizationComponent = ({
  session,
  currentRunId, setCurrentRunId,
  currentProjectID
}) => {
  // PARAMETERS TO SEND TO RPC
  const [singleCell, setSingleCell] = useState('MTX')
  const [resolution, setResolution] = useState(1)
  const [genes, setGenes] = useState(['MALAT1', 'GAPDH'])
  const [opacity, setOpacity] = useState(0.1)
  const [principalDimensions, setPrincipalDimensions] = useState(10)
  const [returnThreshold, setReturnThreshold] = useState(0.01)
  // Uploaded files
  const [uploadedBarcodesFile, setUploadedBarcodesFile] = useState(null)    
  const [uploadedGenesFile, setUploadedGenesFile] = useState(null)    
  const [uploadedMatrixFile, setUploadedMatrixFile] = useState(null)
  const notUploaded = R.any(R.isNil, [uploadedBarcodesFile, uploadedGenesFile, uploadedMatrixFile])
  // Local state for notification the result is done
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    setSubmitted(false)
  }, [singleCell, resolution, genes, opacity, principalDimensions, returnThreshold])
  const [loading, setLoading]= useState(false)
  const [result, setResult] = useState(null)

  const [openRunModal, setOpenRunModal]  = useState(false)

  useEffect(() => {
    session.subscribe(
      'crescent.result',
      (args, {runID}) => {
        console.log('crescent.result')
        setActiveToggle('results')
        setCurrentRunId(runID)
        setLoading(false)
        setSubmitted(false)
      }
    )
  }, [])

  const [visType, setVisType] = useState('tsne')
  const isCurrentVisType = R.equals(visType)
  useEffect(() => {
    RA.isNotNil(currentRunId) && RA.isNotNil(visType) 
    && fetch(`/result?runID=${currentRunId}&visType=${visType}`)
      .then(response => response.blob())
      .then(R.compose(setResult, URL.createObjectURL))
    && setLoading(false)
  }, [currentRunId, visType])

  

  // Button with method to call WAMP RPC (not pure)
  // Modal for entering the run id name
  const SubmitButton = () => {
    const [runName, setRunName] = useState('')
    // GraphQL mutation hook to call mutation and use result
    const [createRun, {loading, data, error}] = useMutation(gql`
      mutation SubmitRun($name: String!, $params: String!, $projectID: ID!) {
        createRun(name: $name, params: $params, projectID: $projectID) {
          runID
          name
          params
        }
      }
    `)
    useEffect(() => {
      if (loading) {
        setLoading(true)
        setSubmitted(true)
        setOpenRunModal(false)
      }
    }, [loading])
    useEffect(() => {
      if (
        R.both(
          RA.isNotNilOrEmpty,
          R.propSatisfies(RA.isNotNil, 'createRun')
        )(data)
      ) {
        console.log(data)
        setLoading(true)
        setSubmitted(true)
      }
    }, [data])
    return   (
      <>
        <Button
          content='Submit'
          icon='cloud upload' labelPosition='right'
          color='blue'
          disabled={submitted || loading || notUploaded}
          // onClick={() => setSubmitted(true)}
          onClick={() => setOpenRunModal(true)}
        />
        <Modal size='small' open={openRunModal}>
          <Modal.Header>Submit Run</Modal.Header>
          <Modal.Content>          
            <Input fluid placeholder='Enter a Run Name' onChange={(e, {value}) => {setRunName(value)}}/>
          </Modal.Content>
          <Modal.Actions>
            <Button content='Close' onClick={() => setOpenRunModal(false)} />
            <Button primary content='Submit'
              onClick={() => {
                console.log(runName)
                const params = JSON.stringify({
                  singleCell,
                  resolution,
                  genes,
                  opacity,
                  principalDimensions,
                  returnThreshold                  
                })
                createRun({variables: {name: runName, params, projectID: currentProjectID}})
              }}
            />
          </Modal.Actions>
        </Modal>
      </>
    )
  }

  const [activeToggle, setActiveToggle] = useState('params')
  const isActiveToggle = R.equals(activeToggle)

  return (
    <Segment basic attached='top' style={{height: '92%'}} as={Grid}>
      <Grid.Column width={12} style={{height: '100%'}}>
      <Segment basic loading={loading} style={{height: '100%'}}>
      <VisHeader {...{currentProjectID, currentRunId}} />
      {
        RA.isNotNil(result) && isActiveToggle('results') ?
        isCurrentVisType('tsne') ? <Expression parentcurrentRunId={currentRunId}></Expression>
        : <Image src={result} size='big' centered />
        : null
      }
      </Segment>
      </Grid.Column>
      <Grid.Column width={4} style={{height: '100%'}}>
        <Segment attached='top'>
          <Button.Group fluid widths={3}>
            <Button compact={true} content='Parameters' color={isActiveToggle('params') ? 'blue' : undefined}
              active={isActiveToggle('params')} onClick={() => setActiveToggle('params')}
            />
            <Button compact={true} content='Status' color={isActiveToggle('status') ? 'teal' : undefined}
              active={isActiveToggle('status')} onClick={() => setActiveToggle('status')}
            />
            <Button compact={true} content='Results' color={isActiveToggle('results') ? 'violet' : undefined}
              active={isActiveToggle('results')} onClick={() => setActiveToggle('results')}
            />
          </Button.Group>
        </Segment>
        <Segment attached style={{height: '83%', overflowY: 'scroll'}}>
          <Step.Group vertical fluid ordered
            items={
              R.map(
                ({step, visType}) => (
                  isActiveToggle('params') ?
                    <CWLParamsButton key={step} step={step}
                      singleCell={singleCell} setSingleCell={setSingleCell}
                      resolution={resolution} setResolution={setResolution}
                      genes={genes} setGenes={setGenes}
                      opacity={opacity} setOpacity={setOpacity}
                      principalDimensions={principalDimensions} setPrincipalDimensions={setPrincipalDimensions}
                      returnThreshold={returnThreshold} setReturnThreshold={setReturnThreshold}
                    />
                  : isActiveToggle('status') ?
                    <CWLStatusButton key={step} step={step} />
                  : isActiveToggle('results') ?
                    <CWLResultsButton key={step} step={step} 
                      onClick={RA.isNotNil(visType) ? () => setVisType(visType) : undefined}
                      active={isCurrentVisType(visType)}
                    />
                  : null
                ),
                [
                  {step: 'Quality Control', visType: 'qc'},
                  {step: 'Normalization', visType: null},
                  {step: 'Dimension Reduction', visType: 'pca'},
                  {step: 'Cell Clustering', visType: 'tsne'},
                  {step: 'Find All Markers', visType: 'markers'},
                  // {step: 'Differential Expression'},
                  // {step: 'Visualizations'},
                  // {step: 'Cell Cluster Labelling'},
                  // {step: 'Gene/Pathway Interactions'},
                ]
              )
            }
          />
        </Segment>
        {
          isActiveToggle('params') ?
          <Button.Group fluid widths={2} attached='bottom' size='big'>
            <UploadModal
              // pass setState stuff here
              uploadedBarcodesFile={uploadedBarcodesFile}
              setUploadedBarcodesFile={setUploadedBarcodesFile}
              uploadedGenesFile={uploadedGenesFile}
              setUploadedGenesFile={setUploadedGenesFile}
              uploadedMatrixFile={uploadedMatrixFile}
              setUploadedMatrixFile={setUploadedMatrixFile}
            />
            <Button.Or text='&' />
            <SubmitButton />

          </Button.Group>

          : isActiveToggle('status') ?
          <Segment attached='bottom' inverted color='teal' content='Current step running is...' />

          : isActiveToggle('results') ?
          <Button fluid attached='bottom' size='big' color='violet' icon='download' content='Download'
            disabled={R.isNil(currentRunId)}
            as='a'
            href={`/download?runID=${currentRunId}`}
            download
          />
          : null
        }
      </Grid.Column>
    </Segment>
  )
}

export default VisualizationComponent
