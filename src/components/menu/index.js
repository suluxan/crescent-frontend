import React, {useState, useEffect} from 'react';

import {Menu, Card, Header, Segment, Button, Grid, Modal, Label, Divider, Icon, Image, Popup, Message} from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import withRedux from '../../redux/hoc'

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
    view: {main, isGuest}
  },
  actions: {
    // logout,
    toggleInfo,
    toggleProjects,
    toggleRuns,
    toggleLogin
  }
}) => {
  const isMainView = R.equals(main)
  return (
    <Segment attached='top' style={{height: '5rem'}} as={Grid}>
      <Grid.Column width={2} verticalAlign='middle'>
      {
        <Button.Group fluid size='mini'>
          <Popup inverted size='large'
            trigger={
              <Button icon basic inverted color='grey' size='large'
                onClick={() => toggleProjects(isGuest ? 'published' : 'uploaded')}
              >
                {/* <Icon color='black' name='home' size='large'/> */}
                <Icon size='big'>
                  <Image src={Logo} centered/>
                </Icon>
              </Button>
            }
            content={
              isMainView('projects') ? "You're already home..." : 'Go to projects'
            }
            position='bottom center'
          />
          <Popup inverted size='large'
            trigger={
              <Button icon basic inverted color='grey' size='large'
                onClick={() => {
                  if (isMainView('runs')) {
                    toggleProjects()
                  } else if (isMainView('vis')) {
                    toggleRuns()
                  } else if (isMainView('login')) {
                    // Go back to projects for now
                    toggleProjects()
                  } else if (isMainView('info')) {
                    // Go back to projects for now
                    toggleProjects()
                  }
                }}
                disabled={R.or(isMainView('projects'), R.isNil(project))}
              >
                <Icon color='black' name='left arrow' size='large'/>
              </Button>
            }
            content={isMainView('runs') ? 'Go back to projects' : 'Go back to runs'}
            position='bottom center'
          />
        </Button.Group>
      }
      </Grid.Column>
      <Grid.Column width={12} verticalAlign='middle' textAlign='center' style={{padding: 0}}>
        {
          isMainView('projects')  ? 
            <Header
              // size='large'
              content={'CReSCENT: CanceR Single Cell ExpressioN Toolkit'}
            />
          : isMainView('runs')  ?
            <Header textAlign='center'
              // size='large'
              content={R.prop('name', project)}
            />
          : isMainView('login') ?
            <Header textAlign='center'
              size='large'
            >
              {
                RA.isNotNil(user) ? 
                  <>
                    <Icon name='user circle' />
                    User
                  </>
                :
                  <>
                    <Icon name='sign in' />
                    Log In
                  </>
              }
            </Header>
          : isMainView('vis') ?
            <Header textAlign='center'
              // size='large'
              content={R.prop('name', project)}
              subheader={R.prop('name', run)}
            />
          : <Image src={Logo} size='tiny' centered/>
        }
      </Grid.Column>
      <Grid.Column width={2} verticalAlign='middle'>
        <Button.Group fluid widths={2} size='mini'>
          <Popup inverted size='large'
            trigger={
              <Button color='grey' inverted basic icon size='large'
                onClick={() => toggleInfo()}
              >
                <Icon color='black' size='large' name='info circle' />
              </Button>
            }
            content={
              'Click For Info/Help'
            }
          />
          <Popup inverted size='large'
            trigger={
              <Button basic inverted icon color='grey' size='large'
                onClick={() => toggleLogin()}
              >
                <Icon color='black' size='large' name={'user circle'} />
              </Button>
            }
            content={
              'Log in/out'
            }
          />
        </Button.Group>
      </Grid.Column>
    </Segment>
  )
})

export default MenuComponent