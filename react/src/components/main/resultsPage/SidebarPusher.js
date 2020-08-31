import React, {useEffect, useRef, useState} from 'react'
import * as R from 'ramda'

import { Segment, Transition, Grid, Image, Message, Label,   Checkbox,
  Header,
  Icon,
  Menu,
  Sidebar,
  Button,
  Container,
  Form,
  Dimmer,
  Ref,
  Sticky,
  Popup,
  Divider, } from 'semantic-ui-react'

import SidebarComponent from './sidebar'
import ParametersComponent from './parameters'
import VisualizationsComponent from './visualizations'

import {useResultsPage} from '../../../redux/hooks'
import {resetResultsPage} from '../../../redux/actions/resultsPage'
import {useCrescentContext} from '../../../redux/hooks'
import {useDispatch} from 'react-redux'

import Fade from 'react-reveal/Fade'
import Tada from 'react-reveal/Tada'
import Logo from '../../login/logo.svg'

const ResultsPageSidebarPusher = ({

}) => {
  const dispatch = useDispatch()
  const {runID} = useCrescentContext()
  useEffect(() => {dispatch(resetResultsPage())}, [runID])
  const {activeSidebarTab, sidebarVisible} = useResultsPage()

  // Move this into redux
  const [visible, setVisible] = React.useState(true)

  const stickyRef = useRef()

  const [showScroll, setShowScroll] = useState(false)

  window.addEventListener('scroll', 
    () => {
      if (!showScroll && window.pageYOffset > 200){
        setShowScroll(true)
      } else if (showScroll && window.pageYOffset <= 200){
        setShowScroll(false)
      }
    }
  )

  return (
    <Ref innerRef={stickyRef}>
    <Grid>
      <Grid.Column width={visible ? 10 : 15} stretched>
      {
        R.cond([
          [R.equals('parameters'), R.always(<ParametersComponent />)],
          [R.equals('visualizations'), R.always(<VisualizationsComponent />)]
        ])(activeSidebarTab)
      }
      </Grid.Column>

      
      <Grid.Column width={1} stretched>
      <Sticky context={stickyRef}>
        <Popup
          position='left center'
          inverted
          on='hover'
          trigger={
            <Button fluid
              animated='fade'
              color='black' basic
              onClick={() => setVisible(!visible)}
            >
              <Button.Content visible content={<Icon name={visible ? 'right arrow' : 'left arrow'} />} />
              <Button.Content hidden content={<Icon name={visible ? 'eye slash' : 'eye'} />} />
            </Button>
          }
          content={visible ? 'Hide menu' : 'Show menu'}
        />

        <Divider horizontal />
        {
          showScroll &&
          <Popup
            position='bottom center'
            inverted
            on='hover'
            trigger={
              <Button fluid
                animated='fade'
                color='black' basic
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              >
                <Button.Content visible content={<Icon name={'up arrow'} />} />
                <Button.Content hidden content={<Icon name={'window maximize outline'} />} />
              </Button>
            }
            content={'Click to scroll to top'}
          />
        }

      </Sticky>

      
      </Grid.Column>
      

      {
        visible && 
        <Grid.Column width={5} stretched>
          <Fade right>
          <SidebarComponent />
          </Fade>
        </Grid.Column>
      }
    </Grid>
    </Ref>
  )
}

export default ResultsPageSidebarPusher