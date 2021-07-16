import React, {useState, useEffect, useRef} from 'react';

import { Segment, Button, Icon, Step, Header, Dropdown, Form, Divider, Menu, Label, Popup } from 'semantic-ui-react'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import {useDispatch} from 'react-redux'
import {useCrescentContext, useResultsPage} from '../../../../redux/hooks'
import {useRunDetailsQuery, useSavePlotQueryMutation, useRemoveSavedPlotQueryMutation, useUpdateSavedPlotQueryMutation} from '../../../../apollo/hooks/run'
import {useResultsAvailableQuery} from '../../../../apollo/hooks/results'
import {useResultsPagePlotQuery} from '../../../../redux/hooks/useResultsPage';
import {setActiveResult, addPlot, setActivePlot, setPlotQueryID} from '../../../../redux/actions/resultsPage'

import VisualizationMenu from '../../resultsPage/visualizations/VisualizationMenu'
import DotPlotVisualizationMenu from '../../resultsPage/visualizations/DotPlotVisualizationMenu'
import HeatmapVisualizationMenu from '../../resultsPage/visualizations/HeatmapVisualizationMenu'
import QualityControlMenu from '../../resultsPage/visualizations/QualityControlMenu'

const MultiPlotSelector = ({
  runID
}) => {
  const [numPlots, setNumPlots] = useState(1)
  
  const dispatch = useDispatch()
  const {activePlot, plotQueries} = useResultsPage()
  const {plotQueryID} = useResultsPagePlotQuery(activePlot)
  const {savePlotQuery, loading: savePlotQueryLoading} = useSavePlotQueryMutation(
    runID, 
    R.compose(
      R.over(R.lensProp('selectedExpRange'), R.map(num => num.toString()), R.__),
      R.omit(['plotQueryID'])
    )(plotQueries[activePlot]),
    (id) => dispatch(setPlotQueryID({value: id}))
  )
  const { removeSavedPlotQuery, loading: removePlotQueryLoading } = useRemoveSavedPlotQueryMutation(runID, plotQueryID, () => dispatch(setPlotQueryID({value: null})))
  const { updateSavedPlotQuery, loading: updatePlotQueryLoading } = useUpdateSavedPlotQueryMutation(
    runID,
    R.over(R.lensProp('selectedExpRange'), R.map(num => num.toString()), plotQueries[activePlot])
  )

  return (
    <>
      <Menu attached='top' color='violet'>
        {
          R.compose(
            R.addIndex(R.map)((plot, idx) => (
              <Menu.Item key={idx} active={R.equals(activePlot, idx)} onClick={() => dispatch(setActivePlot({value: idx}))}>
                {R.inc(idx)}
                {plot.plotQueryID && (
                  <Label floating color="violet" style={{ paddingRight: 0, paddingLeft: "-9px" }} icon={<Icon name='pin'/>}/>
                )}
              </Menu.Item>
            ))
          )(plotQueries)
        }
        <Menu.Item icon='plus' onClick={() => dispatch(addPlot())} />
      </Menu>
      { plotQueryID ? (
        <Button.Group fluid attached="bottom">
          <Button color='violet' animated='vertical' style={{borderRadius: 0}} onClick={updateSavedPlotQuery} loading={updatePlotQueryLoading}>
            <Button.Content visible><Icon name='sync'/></Button.Content>
            <Button.Content hidden content="Update saved plot"/>
          </Button>
          <Button color='red' animated='vertical'  style={{borderRadius: 0}} onClick={removeSavedPlotQuery} loading={removePlotQueryLoading}>
            <Button.Content visible><Icon name='trash'/></Button.Content>
            <Button.Content hidden content="Remove plot"/>
          </Button>
        </Button.Group>
      ) : (
        <Button color="violet" animated='vertical' fluid style={{borderRadius: 0}} onClick={savePlotQuery} loading={savePlotQueryLoading}>
          <Button.Content visible><Icon name='save'/></Button.Content>
          <Button.Content hidden content="Save plot"/>
        </Button>
      )}
    </>
  )
}

const VisualizationsSidebar = ({
}) => {    
  const {runID} = useCrescentContext()

  const run = useRunDetailsQuery(runID)

  const dispatch = useDispatch()
  const {activeResult} = useResultsPage()
  const isActiveResult = R.equals(activeResult)

  const plots = useResultsAvailableQuery(runID)
  
  const DetailedDescription = () => {
    const plot = R.find(({result}) => result === activeResult, plots)
    return R.isNil(plot) ? <></> : <p>{plot.detailedDescription}</p>
  }

  if (R.any(R.isNil, [run, plots])) {
    return null
  }
  const {status: runStatus} = run
  const runStatusEquals = R.equals(runStatus)
  if (runStatusEquals('failed')) {
    return (
      <Segment placeholder>
        <Header icon>
          <Icon name='times circle' />
          The pipeline has failed.
        </Header>
      </Segment>
    )
  }

  return (
    <>
    {
      R.isNil(activeResult) ? (
        <Step.Group vertical fluid size='small'>
        {
          R.ifElse(
            R.isEmpty,
            R.always(<Step key={"noresults"}><Step.Content title={"No Results Available"} description={"Check logs above to see progress. Refresh to see available results."}/></Step>),
            R.addIndex(R.map)(
              ({result, label, description}, index) => (
                <Step key={index} onClick={() => dispatch(setActiveResult({result}))} >
                  {isActiveResult(result) && <Icon name='eye' color='violet'/>}
                  <Step.Content title={label} description={description} />
                </Step>
              )
            )
          )(plots)
        }
        </Step.Group>
      ) : (
        <>
          <MultiPlotSelector {...{runID}}/>
          <Segment as={Form} attached>
            <Divider horizontal content='Plots' />
            <Form.Group>
              <Form.Field width={16}>
                <Dropdown fluid selection labeled
                  value={activeResult}
                  options={R.compose(R.map(({result, label, description}) => ({key: result, value: result, text: label})))(plots)}
                  onChange={(e, {value}) => dispatch(setActiveResult({result: value}))}
                />
              </Form.Field>
              <Popup
                trigger={ 
                  <Button icon >
                    <Icon name='help circle'/>
                  </Button>
                }
                content={
                  <>
                    <DetailedDescription/>
                    <Button icon style={{padding:'5px'}} fluid>
                      <a target="_blank" href={`https://pughlab.github.io/crescent-frontend/#item-4-${R.equals(activeResult, 'qc') ? "1" : "2"}`} style={{textDecoration: 'none', color: "inherit"}}>
                        Go to documentation
                        <Icon name='external'/>
                      </a>
                    </Button>
                  </>
                }
                hoverable
                wide
              />
            </Form.Group>
          </Segment>
          <Segment attached='bottom'>
            {
              R.cond([
                [R.equals('qc'),   R.always(<QualityControlMenu/>)],
                [R.equals('dot'), R.always(<DotPlotVisualizationMenu/>)],
                [R.equals('heatmap'), R.always(<HeatmapVisualizationMenu/>)],
                [R.T,            R.always(<VisualizationMenu/>)]
              ])(activeResult)
            }
          </Segment>
        </>
      )
    }
    </>
  )
}

export default VisualizationsSidebar