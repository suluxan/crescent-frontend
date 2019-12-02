import React, {useState, useEffect} from 'react';

import {Menu, Card, Header, Segment, Button, Grid, Modal, Label, Divider, Icon, Image, Popup} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import withRedux from '../../redux/hoc'

import InfoModal from './InfoModal'

import Logo from '../landing/logo.jpg'

import Marquee from 'react-marquee'

const CrescentIcon = () => (
  <Icon.Group style={{marginTop: -3}} >
    <Icon name='cloud' size='big'  />
    <Icon name='moon' size='small' inverted style={{marginTop: 2, marginLeft: -2}} />
  </Icon.Group>
)


const MenuComponent = withRedux(({
  app: {
    user,
    project,
    run,
    view: {main}
  },
  actions: {
    // logout,
    toggleProjects,
    toggleRuns,
    toggleLogin
  }
}) => {
  const isMainView = R.equals(main)
  const [hoverInfo, setHoverInfo] = useState(null)
  return (
    <Segment attached='top' style={{height: '9%'}} as={Grid}>
      <Grid.Column width={2} verticalAlign='middle'>
      {
        RA.isNotNil(project) &&
        <Button.Group fluid size='mini'>

          <Button icon basic inverted color='grey'
            onClick={() => toggleProjects()}
            disabled={isMainView('projects')}
          >
            <div
              onMouseEnter={() => setHoverInfo('Go To Projects?')}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <Icon color='black' name='folder open' size='large'/>
            </div>
          </Button>
          <Button icon basic inverted color='grey'
            onClick={() => toggleRuns()}
            disabled={isMainView('runs') || R.isNil(project) || R.and(RA.isNotNil(project), isMainView('projects'))}
          >
            <div
              onMouseEnter={() => setHoverInfo('Go To Runs?')}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <Icon color='black' name='file' size='large'/>
            </div>
          </Button>
        </Button.Group>
      }
      </Grid.Column>
      <Grid.Column width={12} verticalAlign='middle' textAlign='center' style={{padding: 0}}>
        {
          RA.isNotNil(hoverInfo) ?
            <Header content={hoverInfo} />
          : isMainView('projects')  ? 
            <Image src={Logo} size='tiny' centered/>
          : isMainView('runs')  ?
            <Image src={Logo} size='tiny' centered/>
          : isMainView('login') ?
            <Header textAlign='center'>
              {
                RA.isNotNil(user) ? 
                  <>
                    <Icon name='user circle' />
                    User
                  </>
                :
                  <>
                    <Icon name='sign in' />
                    Sign In
                  </>
              }
            </Header>
          : isMainView('vis') ?
            <Header textAlign='center' size='small'
              content={R.prop('name', project)}
              subheader={R.prop('name', run)}
            />
          : <Image src={Logo} size='tiny' centered/>
        }
      </Grid.Column>
      <Grid.Column width={2} verticalAlign='middle'>
        <Button.Group fluid widths={2} size='mini'>
          <InfoModal />
          <Button basic inverted icon
            basic
            color='grey'
            onClick={() => toggleLogin()}
          >
            <div
              onMouseEnter={() => setHoverInfo(RA.isNotNil(user) ? 'Go To User Details?' : 'Sign In?')}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <Icon color='black' size='large' name={'user circle'} />
            </div>
          </Button>
        </Button.Group>
      </Grid.Column>
    </Segment>
  )
})

export default MenuComponent