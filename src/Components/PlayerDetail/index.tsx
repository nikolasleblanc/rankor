import * as React from 'react';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

export interface PlayerDetailProps {
  player: any;
  stats: any;
  onClose: () => void,
  summary: any;
}

export const PlayerDetail: React.SFC<PlayerDetailProps> = ({
  onClose,

  player: {
    firstName, 
    lastName,
    primaryPosition,
    jerseyNumber,
    officialImageSrc: img
  },
  player,
  stats: {

  },
  stats,
  summary
}) => (
  <div className="list pa2" style={{width: 1000}}>
    <h1>{firstName} {lastName} ({primaryPosition}) #{jerseyNumber}</h1>
    {img && <img className="mh2" width="50" height="50" src={(img || '').replace('http:', 'https:')}/>}
    <p>{JSON.stringify(player)}</p>
    <p>{JSON.stringify(stats)}</p>
    <p>{img}</p>
    <hr/>
    <h2>Summary</h2>
    <TextField
      id="summary"
      value={summary}
      margin="normal"
      variant="outlined"
      multiline={true}
      rows="4"
      rowsMax="5"
      fullWidth={true}
    />
    <hr/>
    <h2>Entries</h2>
    <hr/>
    <h2>New Entry</h2>
    <hr/>
    <Button variant={'contained'} color={'secondary'} onClick={onClose}>Close</Button>
  </div>
);