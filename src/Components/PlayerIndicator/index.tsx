import * as React from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';

const DragHandle = SortableHandle(() => <span className="pointer">:::</span>); // This can be any component you want

export interface PlayerIndicatorProps {
  height: number;
  rank: number;
  smallMode: boolean;
  id: string;
  value: {
    officialImageSrc: string;
    firstName: string;
    lastName: string;
    currentTeam: {
      abbreviation: string;
    }
  }
  onRemovePlayer: () => any;
  onSelectPlayer: () => any;
}

// smallMode, 
//   height, 
//   rank, 
//   value: { 
//     officialImageSrc, 
//     firstName, 
//     lastName, 
//     currentStream: { 
//       default, 
//       abbreviation 
//     },
//   }, 
//   onRemovePlayer

export const PlayerIndicator: any = SortableElement(({
  smallMode, 
  height, 
  rank, 
  value: { 
    officialImageSrc, 
    firstName, 
    lastName, 
    currentTeam,
    currentTeam: { 
      abbreviation 
    },
  }, 
  onRemovePlayer,
  onSelectPlayer,
  id
}: PlayerIndicatorProps) =>
  !smallMode ? (
    <div
      className="shadow-4 flex justify-center items-center br2 ma2"
      style={{height}}
      onClick={onSelectPlayer}
    >
      <div className="flex-none ma2">{rank}</div>
      <div className="flex flex-auto items-center">
        {officialImageSrc !== null && (
          <img className="mh2" width="50" height="50" src={officialImageSrc.replace('http:', 'https:')}/>
        )}
        {firstName} {lastName} {' '}
        ({currentTeam ?
          abbreviation :
          'NA'
        })
      </div>
      <div className="flex-none ma3"><DragHandle/></div>
      <div className="flex-none ma3 pointer" onClick={onRemovePlayer}>x</div>
    </div>
  ) : (
    <div className="flex-auto">{firstName} {lastName}</div>
  )
);
