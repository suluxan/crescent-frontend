import React, {useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import withRedux from '../../../../redux/hoc'
import { Button, Form, Dropdown, Segment, Popup, Label, Icon, Header, Grid } from 'semantic-ui-react'

import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

const QualityControlMenu = withRedux(
  ({
  app: {
    run: { runID },
  },
  actions: {
    toggle: {
      setSelectedQC
    },
    thunks: {
      fetchAvailableQC,
    }
  }
}) => {

  const [AvailableQCPlots, setAvailableQCPlots] = useState([])

  useEffect(() => {
    fetchAvailableQC(runID).then((data) => {
      R.ifElse(
        R.has('error'),
        R.always(console.log(data['error'])),
        setAvailableQCPlots
      )(data)
    });
  }, [])

  return (
    <Dropdown
      selection
      fluid
      options={AvailableQCPlots}
      onChange={(e, {value}) => setSelectedQC(value)}
      defaultValue={'Before_After_Filtering'}
      // why doesn't this work?
      //defaultValue={RA.isNotNilOrEmpty(AvailableQCPlots) ? AvailableQCPlots[0]['key'] : ''}
    />
  )
})

export default QualityControlMenu