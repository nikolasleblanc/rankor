import * as R from 'ramda';
import * as React from 'react';
import { SortableElement } from 'react-sortable-hoc';

export const PlayerIndicator: any = SortableElement((props: any) => {
  return (
    <div
      className="ma2 shadow-4 flex justify-center items-center br2 pointer"
      style={{height: props.height}}
    >
      <div className="flex-none ma2">{props.rank}</div>
      <div className="flex flex-auto items-center">
        {props.value.officialImageSrc !== null && (
          <img className="mh2" width="50" height="50" src={props.value.officialImageSrc}/>
        )}
        {props.value.firstName} {props.value.lastName} {' '}
        ({props.value.currentTeam ?
          props.value.currentTeam.abbreviation :
          'NA'
        })
        {props.value.primaryPosition === 'RB' && (
          `${R.path(['rushing', 'rushAttempts'], props.stats)} / ${R.path(['rushing', 'rushYards'], props.stats)}`
        )}
        {R.or(R.equals('WR'), R.equals('TE'))(props.value.primaryPosition) && (
          `${R.path(['receiving', 'receptions'], props.stats)} / ${R.path(['receiving', 'recYards'], props.stats)}`
        )}
      </div>
    </div>
  );
});