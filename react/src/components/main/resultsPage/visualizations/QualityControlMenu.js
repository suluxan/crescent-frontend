import React, {useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Button, Form, Dropdown, Segment, Popup, Label, Icon, Header, Grid, Divider } from 'semantic-ui-react'
import { Fade } from 'react-reveal'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import * as R_ from 'ramda-extension'

import {useDispatch} from 'react-redux'
import {useCrescentContext, useResultsPage} from '../../../../redux/hooks'
import {setSelectedQC, setSelectedQCDataset} from '../../../../redux/actions/resultsPage'
import {useQCAvailableQuery, useQCMetricsQuery, useMachineService} from '../../../../apollo/hooks/results'
import {useRunDatasetsDropdownQuery} from '../../../../apollo/hooks/run/useRunDatasetsQuery'

const QualityControlMenu = ({
  
}) => {    
  const {runID} = useCrescentContext()
  const dispatch = useDispatch()
  const {selectedQCDataset, selectedQC} = useResultsPage()
  const datasetsOptions = useRunDatasetsDropdownQuery(runID, {
    onNonEmptyOptions: options => {
      const [{value}] = options
      if (!selectedQCDataset) dispatch(setSelectedQCDataset({value}))
    }
  })
  const [current, send] = useMachineService()

  const availableQc = useQCAvailableQuery({runID, datasetID: selectedQCDataset})
  const qcMetrics = useQCMetricsQuery({runID, datasetID: selectedQCDataset})

  if (R.any(R.isNil, [datasetsOptions, availableQc])) {
    return null
  }


  return (
    <Fade>
      <>
        <Divider horizontal content='Datasets' />
        <Dropdown selection fluid labeled search
          disabled = {R.test(/.*Loading/, current.value)}
          loading={R.isNil(datasetsOptions)}
          options={datasetsOptions || []}
          value={selectedQCDataset}
          onChange={(e, {value}) => dispatch(setSelectedQCDataset({value, send}))}
        />
        <Divider horizontal content='QC Plot Type' />
        <Dropdown selection fluid labeled
          disabled = {R.test(/.*Loading/, current.value)}
          options={availableQc}
          value={selectedQC}
          onChange={(e, {value}) => dispatch(setSelectedQC({value, send}))}
        />

        {
          R.ifElse(
            R.isNil,
            R_.alwaysNull,
            ({cellcounts: {Before, After}, qcSteps}) => (
              <>
              <Divider horizontal content='QC Metrics' />
              <Segment basic textAlign='center'>
              <Label basic color={'blue'} size={'medium'}
                content='Cells Before QC:'
                detail={Before}
              />
              <Label basic color={'orange'} size={'medium'}
                content='Cells After QC:'
                detail={After}
              />
              </Segment>
              {
                R.addIndex(R.map)(
                  ({filtertype, numRemoved, min, max}, index) => (
                    <Segment key={index}>
                      <Label attached='top' content={filtertype}/>
                      <Label basic size={'small'} content={`Filter Min: ${min}`} color='grey' />
                      <Label basic size={'small'} content={`Filter Max: ${max}`} color='grey' />
                      <Label basic size={'small'} content={`Cells Removed: ${numRemoved}`} color={R.ifElse(R.equals(0),R.always('grey'),R.always('red'))(numRemoved)} />
                    </Segment>
                  ),
                  qcSteps
                )
              }
              </>
            )
          )(qcMetrics)
        }
      </>
    </Fade>
  )
}

export default QualityControlMenu