import * as R from 'ramda';
import * as React from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';

const DragHandle = SortableHandle(() => <span className="pointer">:::</span>); // This can be any component you want

export const PlayerIndicator: any = SortableElement((props: any) =>
  !props.smallMode ? (
    <div
      className="ma2 shadow-4 flex justify-center items-center br2"
      style={{height: props.height}}
    >
      <div className="flex-none ma2">{props.rank}</div>
      <div className="flex flex-auto items-center">
        {props.value.officialImageSrc !== null && (
          <img className="mh2" width="50" height="50" src={props.value.officialImageSrc.replace('http:', 'https:')}/>
        )}
        {props.value.firstName} {props.value.lastName} {' '}
        ({props.value.currentTeam ?
          props.value.currentTeam.abbreviation :
          'NA'
        })
        {props.value.primaryPosition === 'RB' && (
          ` ${R.pathOr(0, ['rushing', 'rushAttempts'], props.stats)} / ${R.pathOr(0, ['rushing', 'rushYards'], props.stats)}`
        )}
        {R.or(R.equals('WR'), R.equals('TE'))(props.value.primaryPosition) && (
          ` ${R.pathOr(0, ['receiving', 'receptions'], props.stats)} / ${R.pathOr(0, ['receiving', 'recYards'], props.stats)}`
        )}
        {props.value.fantasyPoints !== 0 && (
          ` ${R.prop('fantasyPoints', props.stats)}`
        )}
      </div>
      <div className="flex-none ma3"><DragHandle/></div>
      <div className="flex-none ma3 pointer" onClick={props.onRemovePlayer(props.value.id)}>x</div>
    </div>
  ) : (
    <div className="flex-auto">{props.firstName} {props.lastName}</div>
  )
);
