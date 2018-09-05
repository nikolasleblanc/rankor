import { default as axios } from 'axios';
// import { differenceInMinutes } from 'date-fns';
import * as R from 'ramda';
import * as React from 'react';
import { arrayMove } from 'react-sortable-hoc';
import * as store from 'store';
import './App.css';
import { PlayerList } from './Components/PlayerList';

// const MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS = 0;
const API_TOKEN = process.env.REACT_APP_TOKEN || '';
const API_PASSWORD = process.env.REACT_APP_PASSWORD || '';
const SEASON = '2017-regular';
const API_URL = 'https://api.mysportsfeeds.com/v2.0/pull/nfl';
const API_PLAYER_URL = `${API_URL}/players.json`;
const API_PLAYER_STATS_URL = `${API_URL}/${SEASON}/player_stats_totals.json`;

const mapPlayerData = R.compose(
  // R.slice(0, 100),
  R.map(R.omit(['height'])),
  R.map(R.prop('player')),
  R.pathOr([], ['data', 'players']),
);

const mapPlayerStatsData = R.compose(
  // R.slice(0, 100),
  // R.map(R.omit(['height'])),
  R.map((player: any) => ({
    id: R.path(['player', 'id'], player),
    ...R.prop('stats', player),
  })),
  R.pathOr([], ['data', 'playerStatsTotals']),
);

const isDataStale = (position: string) => (lastUpdated: Date) => {
  return true;
  // const timeElapsedSinceUpdate = differenceInMinutes(new Date(), lastUpdated);
  // return timeElapsedSinceUpdate > MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS;
};

const setLastUpdated = (position: string) => R.tap((players: any) => {
  store.set('lastUpdated', {
    ...store.get('lastUpdated'),
    [position]: new Date(),
  });
});


const setPlayersIndexedById = (position: string) => R.tap((players: any) => {
  store.set('playersById', {
    ...store.get('playersById'),
    [position]: R.indexBy(R.prop('id'), players),
  });
});

const setPlayerStatsIndexedById = (position: string) => R.tap((players: any) => {
  store.set('playerStatsById', {
    ...store.get('playerStatsById'),
    [position]: R.indexBy(R.prop('id'), players),
  });
});

const setPlayersArray = (position: string) => R.tap((players: any) => {
  store.set('players', {
    ...store.get('players'),
    [position]: players.filter((i: any) => !R.isNil(i)),
  });
});

const setPlayerStatsArray = (position: string) => R.tap((players: any) => {
  store.set('playerStats', {
    ...store.get('playerStats'),
    [position]: players.filter((i: any) => !R.isNil(i)),
  });
});

const setPlayerRanks = (position: string) => R.tap((players: any) => {
  if (R.isEmpty(R.propOr({}, position, store.get('rank')))) {
    store.set('rank', {
      ...store.get('rank'),
      [position]: R.map(R.prop('id'), players),
    });
  }
});

const getPlayersResourceResponse = (TOKEN: string, PASSWORD: string, position: string) =>
  axios.get(`${API_PLAYER_URL}?position=${position}`, {
    headers: {
      'Authorization': `Basic ${btoa(TOKEN.concat(':', PASSWORD))}`,
    },
  });

const getPlayerStatsResourceResponse = (TOKEN: string, PASSWORD: string, position: string) =>
  axios.get(`${API_PLAYER_STATS_URL}?position=${position}`, {
    headers: {
      'Authorization': `Basic ${btoa(TOKEN.concat(':', PASSWORD))}`,
    },
  });

const getPlayerData = (TOKEN: string, PASSWORD: string, position: string) => () =>
  getPlayersResourceResponse(TOKEN, PASSWORD, position)
    .then(mapPlayerData)
    .then(setPlayerRanks(position))
    .then(setPlayersIndexedById(position))
    .then(setPlayersArray(position))
    .then(setLastUpdated(position));

const getPlayerStatsData = (TOKEN: string, PASSWORD: string, position: string) => () =>
  getPlayerStatsResourceResponse(TOKEN, PASSWORD, position)
    .then(mapPlayerStatsData)
    .then(setPlayerStatsIndexedById(position))
    .then(setPlayerStatsArray(position))
    .then(setLastUpdated(position));

class App extends React.Component<any, { players: any[], playerStats: any[], isLoading: boolean, position: string, rank: any[] }> {
  public SortableList: any;

  constructor(props: any) {
    super(props);
    if (R.isNil(store.get('rank'))) {
      store.set('rank', {});
    }
    if (R.isNil(store.get('position'))) {
      store.set('position', 'RB');
    }
    if (R.isNil(store.get('players'))) {
      store.set('players', {});
    }
    if (R.isNil(store.get('playersById'))) {
      store.set('playersById', {});
    }
    if (R.isNil(store.get('playerStats'))) {
      store.set('players', {});
    }
    if (R.isNil(store.get('playerStatsById'))) {
      store.set('playerStatsById', {});
    }
    if (R.isNil(store.get('lastUpdated'))) {
      store.set('lastUpdated', {});
    }
    this.state = {
      isLoading: true,
      playerStats: [],
      players: [],
      position: store.get('position'),
      rank: [],
    };
    this.onSortEnd = this.onSortEnd.bind(this);
    this.changePosition = this.changePosition.bind(this);
    this.loadPlayersIntoState = this.loadPlayersIntoState.bind(this);
  }

  public componentDidMount() {
    this.loadPlayersIntoState(this.state.position, true);
  }

  public changePosition(position: string) {
    return () => {
      store.set('position', position);
      this.loadPlayersIntoState(position, true);
    }
  }

  public loadPlayersIntoState(position: string, override: boolean = false) {
    if (API_TOKEN === '' || API_PASSWORD === '') {
      throw new Error('MISSING TOKEN OR PASSWORD');
    }
    this.setState({
      ...this.state,
      isLoading: true,
    });
    R.ifElse(
      R.or(isDataStale(position), () => override === true),
      () =>
        Promise.all([
          getPlayerData(API_TOKEN, API_PASSWORD, position)(),
          getPlayerStatsData(API_TOKEN, API_PASSWORD, position)(),
        ])
      ,
      () => Promise.resolve([store.get('players'), store.get('playerStats')])
    )(R.prop(position, store.get('lastUpdated')))
    .then((response: any) => {
      // tslint:disable-next-line
      this.setState({
        ...this.state,
        isLoading: false,
        playerStats: response[1],
        players: response[0],
        position,
      });
      // tslint:disable-next-line
      console.log(response[0].map((i: any) => i.id));
    });
  }

  public onSortEnd({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) {
    if (oldIndex !== newIndex) {
      const newRank = arrayMove(store.get('rank')[this.state.position], oldIndex, newIndex);
      store.set('rank', {
        ...store.get('rank'),
        [this.state.position]: newRank,
      });
      this.setState({
        ...this.state,
        // players: newPlayers,
        rank: newRank,
      });
    }
  };

  public render() {
    const rank: any[] = R.propOr([], this.state.position, store.get('rank'));
    const playersById = R.propOr({}, this.state.position, store.get('playersById'));
    const playerStatsById = R.propOr({}, this.state.position, store.get('playerStatsById'));

    const players = rank.map((id: any) => playersById[id]);

    return this.state.isLoading ? (
      <p>Loading</p>
    ) : (
      <>
        <div className="flex justify-between">
          <button onClick={this.changePosition('QB')}>QB</button>
          <button onClick={this.changePosition('RB')}>RB</button>
          <button onClick={this.changePosition('TE')}>TE</button>
          <button onClick={this.changePosition('WR')}>WR</button>
        </div>
        {players && (
          <PlayerList
            useDragHandle={true}
            lockAxis={'y'}
            players={R.slice(0, 25, players)}
            playerStats={playerStatsById}
            onSortEnd={this.onSortEnd}
          />
        )}
      </>
    );
  }
}

export default App;
