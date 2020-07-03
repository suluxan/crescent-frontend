import React, {useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import withRedux from '../../../../redux/hoc'
import { Button, Form, Divider, Segment, Popup, Label, Icon, Header, Grid } from 'semantic-ui-react'


import {useDispatch} from 'react-redux'
import {useCrescentContext, useResultsPage} from '../../../../redux/hooks'
import {useAvailableGroupsQuery, useTopExpressedQuery} from '../../../../apollo/hooks'
import reduxThunks from '../../../../redux/actions/thunks'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

const VisualizationMenu = ({
}) => { 
  const {changeActiveGroup, changeSelectedFeature} = reduxThunks
  const [currentSearch, changeSearch] = useState('')
  const [currentOptions, changeCurrentOptions] = useState([])
  
  const {runID} = useCrescentContext()
  const dispatch = useDispatch()
 // console.log("use results: ", useResultsPage())
  const {selectedFeature, selectedGroup} = useResultsPage()
  //available groups & top expressed must be queries
  
  const groups = useAvailableGroupsQuery(runID)
  const topExpressed = useTopExpressedQuery(runID)

  if (R.any(R.isNil, [groups, topExpressed])) {
    console.log(groups, topExpressed)
    return null
  }

    
  const availableGroupsArray = R.compose(
    R.head,
    R.values
  )(groups)

  const topExpressedArray = R.compose(
    R.head,
    R.values
  )(topExpressed)

  console.log("SELECTED GROUP: ", selectedGroup) 
  console.log("SELECTED FEATURE: ", selectedFeature) 
 

  //HERE CHECK RESPONSE, HANDLE SEARCH CHANGE, SELECT FEATURE
  //RESET FEATURE, FEATURE BUTTON


  const checkResponse = (resp) => {
    if(!resp.ok){throw Error(resp.statusText);}
    return resp
  }

 
  //UNSURE
  const handleSearchChange = (event, {searchQuery}) => {
    changeSearch(searchQuery)
    console.log("SEARCH QUERY:", searchQuery)
    if (RA.isNotEmpty(searchQuery)) {
      const isOption = gene => R.startsWith(searchQuery, gene)
      console.log(" ALL GENE: ", R.map(R.prop('gene'), topExpressedArray))
      const allGenes = R.map(R.prop('gene'), topExpressedArray)
      const options =  R.filter(isOption, allGenes)
      console.log("OPTIONS:", options)
      console.log("TEST:", isOption('CAN'))
      changeCurrentOptions(options)
      console.log("CURR OP", currentOptions)
    }
  }

  const handleSelectFeature = (event, {value}) => {
    changeSearch('') // reset search
    dispatch(changeSelectedFeature(value)) // store
  }

  const resetSelectFeature = () => {
    changeSearch('')
    changeCurrentOptions([])
    dispatch(changeSelectedFeature(null))
  }

  console.log("TOPEXPrESED ARR: ", topExpressedArray) 

  const featureButton = ({gene, pVal, avgLogFc, cluster}) => {
    return (
      <Popup
        size={'tiny'}
        inverted
        trigger={
          <Button value={gene}
            onClick={handleSelectFeature}
            color='violet'
            style={{margin: '0.25rem'}}
            basic={R.not(R.equals(selectedFeature,gene))}
          >
            {gene}
          </Button>
        }
      >
        <Popup.Content>
          {'p-value: '+pVal}<br></br>
          {'avg. log fold change: '+avgLogFc}<br></br>
          {'cluster: '+cluster}
        </Popup.Content>
      </Popup>
    )
  }

  
  // format a list for a dropdown
  const formatList = R.addIndex(R.map)((val, index) => ({key: index, text: val, value: val}))

  console.log("AVAILABLE GROUPS:", availableGroupsArray)
  console.log("SELECTED GROUPS:", selectedGroup)

  
  return(
    <Form>
      <Divider horizontal content='Colour By' />
        <Form.Field>
            <Form.Dropdown
              fluid
              selection
              labeled
              defaultValue={RA.isNotNil(selectedGroup) ? selectedGroup : availableGroupsArray[0]}
              options={formatList(groups)}
              onChange={(event, {value}) => dispatch(changeActiveGroup({value}))}
            />
          </Form.Field>
        <Divider horizontal />
        <Form.Field>
        {/* Reset feature selection */}
        <Form.Button
          fluid
          animated='vertical'
          color='violet'
          disabled={R.isNil(selectedFeature)}
          onClick={resetSelectFeature}
        >
          <Button.Content visible>
          {
            RA.isNotNil(selectedFeature) ? selectedFeature : 'Select or Search for a Gene'
          }
          </Button.Content>
          <Button.Content hidden>
          {
            RA.isNotNil(selectedFeature) && 'Click to Reset'
          }
          </Button.Content>
        </Form.Button>
      </Form.Field>
      <Divider horizontal content='Search Genes' />
      <Form.Dropdown
        placeholder={"Enter Gene Symbol"}
        fluid
        search
        searchQuery={currentSearch}
        selection
        options={currentOptions}
        value={selectedFeature}
        onSearchChange={handleSearchChange}
        onChange={handleSelectFeature}
      />
      <Divider horizontal content='Top Differentially Expressed Genes' />
      {
        RA.isNotEmpty(topExpressedArray) &&
        <Segment basic
          style={{maxHeight: '40vh', overflowY: 'scroll'}}
        >
          {
            R.compose(
              R.map(
                ([cluster, features]) => (
                  <Segment key={cluster} compact>
                    <Label attached='top' content={`Cluster ${cluster}`} />
                    {R.map(featureButton, features)}
                  </Segment>
                )
             ),
              R.toPairs,
              R.groupBy(R.prop('cluster'))
            )(topExpressedArray)
          }
        </Segment>
      }
      </Form>
  )
}


 export default VisualizationMenu 