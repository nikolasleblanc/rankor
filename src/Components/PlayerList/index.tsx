import * as React from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import { PlayerIndicator } from '../PlayerIndicator';

const PLAYER_CELL_HEIGHT = 100;

export const PlayerList: React.ComponentClass<any, any> = SortableContainer(
  props => (
    <div className="list">
      {props.players.map((player: any, index: number) => {
        return (
          <PlayerIndicator
            key={player.id}
            index={index}
            value={player}
            rank={index + 1}
            height={PLAYER_CELL_HEIGHT}
            stats={props.playerStats[player.id]}
            onRemovePlayer={props.onRemovePlayer(player.id)}
            onSelectPlayer={props.onSelectPlayer(player.id)}
          />
        );
      })}
    </div>
  )
);
