import { default as axios } from 'axios';
import * as firebase from 'firebase';
// import { differenceInMinutes } from 'date-fns';
import * as R from 'ramda';
import * as React from 'react';
import { arrayMove } from 'react-sortable-hoc';
import * as store from 'store';
import './App.css';
import { PlayerList } from './Components/PlayerList';
import { STATS } from './constants';

import { default as Select } from 'react-select';

// const MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS = 0;
const API_TOKEN = process.env.REACT_APP_TOKEN || '';
const API_PASSWORD = process.env.REACT_APP_PASSWORD || '';
const SEASON = '2017-regular';
const API_URL = 'https://api.mysportsfeeds.com/v2.0/pull/nfl';
const API_PLAYER_URL = `${API_URL}/players.json`;
const API_PLAYER_STATS_URL = `${API_URL}/${SEASON}/player_stats_totals.json`;

export const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
};

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

const mapPlayerData = R.compose(
  // R.slice(0, 100),
  R.map(R.omit(['height'])),
  R.map(R.prop('player')),
  R.pathOr([], ['data', 'players']),
);


const FIX_ME = '';

const mapPlayerStatsData = (statSet: any) => R.compose(
  R.tap((players: any) => {
    const getPlayerIdsSortedByFantasyPoints = R.compose(
      R.map(R.prop('id')),
      R.sortWith([
        R.descend(R.prop('fantasyPoints')),
      ]),
    );
    store.set('sort', getPlayerIdsSortedByFantasyPoints(players));
  }),
  R.map((player: any) => {
    const position = R.pathOr(FIX_ME, ['player', 'primaryPosition'], player);
    // tslint:disable-next-line
    console.log(player, statSet);
    return {
      fantasyPoints: calculateFantasyPoints(statSet, getStatType(position))(R.path(['stats', getStatType(position)], player)),
      id: R.path(['player', 'id'], player),
      playerPosition: R.path(['player', 'primaryPosition'], player),
      ...R.prop('stats', player),
    };
  }),
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

// const setPlayerRanks = (position: string) => R.tap((players: any) => {
//   if (R.isEmpty(R.propOr({}, position, store.get('rank')))) {
//     store.set('rank', {
//       ...store.get('rank'),
//       [position]: R.map(R.prop('id'), players),
//     });
//   }
// });

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
    // .then(setPlayerRanks(position))
    .then(setPlayersIndexedById(position))
    .then(setPlayersArray(position))
    .then(setLastUpdated(position));

const getPlayerStatsData = (TOKEN: string, PASSWORD: string, position: string, statSet: any) => () =>
  getPlayerStatsResourceResponse(TOKEN, PASSWORD, position)
    .then(mapPlayerStatsData(statSet))
    .then(setPlayerStatsIndexedById(position))
    .then(setPlayerStatsArray(position))
    .then(setLastUpdated(position));

const provider = new firebase.auth.GoogleAuthProvider();

interface RelevantPassingStats {
  passInt: number;
  passSacks: number;
  passTD: number;
  passYards: number;
}

interface RelevantRushingStats {
  rushFumbles: number;
  rushTD: number;
  rushYards: number;
}

interface RelevantReceivingStats {
  recFumbles: number;
  recTD: number;
  recYards: number;
  receptions: number;
}

interface RelevantStats {
  'passing': RelevantPassingStats;
  'receiving': RelevantReceivingStats;
  'rushing': RelevantRushingStats;
}

const POINT_VALUES: RelevantStats = {
  'passing': {
    'passInt': -2,
    'passSacks': -2,
    'passTD': 6,
    'passYards': 0.04,
  },
  'receiving': {
    'recFumbles': -2,
    'recTD': 6,
    'recYards': .1,
    'receptions': 0,
  },
  'rushing': {
    'rushFumbles': -2,
    'rushTD': 6,
    'rushYards': .1,
  },
};

// type StatType = 'passing' | 'rushing' | 'receiving';

const getStatType = (position: PlayerPositions): string => {
  const playerStatTypeMap: {[k: string]: string} = {
    'QB': 'passing',
    'RB': 'rushing',
    'TE': 'receiving',
    'WR': 'receiving',
  };
  return playerStatTypeMap[position];
}

const fuckConsole = (msg: any) => {
  // tslint:disable-next-line
  console.log(msg)
}


const getStatSet = (playerPosition: 'RB' | 'WR' | 'TE' | 'QB', playerStatType: 'rushing' | 'receiving' | 'passing'): any => {
  const relevantStats = R.intersection<any>(STATS[playerPosition], R.keys(R.prop(playerStatType, POINT_VALUES)));
  fuckConsole(`relevantStaats ${playerStatType}, ${relevantStats}`);
  return relevantStats;
}

type PlayerPositions = 'WR' | 'QB' | 'RB' | 'TE';


  // now we have the keys we need


const calculateFantasyPoints = (statSet: any, playerStatType: string) => (playerStats: any): number => {
  // tslint:disable-next-line
  console.log('yeah', statSet, playerStats);

  const totalPointsByStat: number[] =
    R.map(
      (statType: string) =>
        R.pathOr(0, [statType], playerStats) *
        R.pathOr(0, [statType], POINT_VALUES[playerStatType]),
      statSet
    );
  const totalPoints: number = totalPointsByStat.reduce((acc: number, item: number) => acc + item, 0);
  // tslint:disable-next-line
  return totalPoints;
};

const setupStore = () => {
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
  if (R.isNil(store.get('user'))) {
    store.set('user', undefined);
  }
  if (R.isNil(store.get('token'))) {
    store.set('token', undefined);
  }
}

const setupState = (position: PlayerPositions) => (
  {
    isLoading: true,
    loggedIn: false,
    playerStats: [],
    players: [],
    position,
    rank: [],
  }
);

const getRankRef = (position: string, uid: string) => firebase.database().ref('ranks/' + position + '/' + uid);

class App extends React.Component<any, { loggedIn: boolean, players: any[], playerStats: any[], isLoading: boolean, position: PlayerPositions, rank: any[] }> {
  public SortableList: any;

  public token: string;
  public user: any;
  public errorCode: any;
  public errorMessage: any;
  public email: any;
  public credential: any;
  public rankRef: any;

  constructor(props: any) {
    super(props);

    setupStore();
    this.state = setupState(store.get('position'));

    this.onSortEnd = this.onSortEnd.bind(this);
    this.changePosition = this.changePosition.bind(this);
    this.loadPlayersIntoState = this.loadPlayersIntoState.bind(this);
    this.doLogin = this.doLogin.bind(this);
    this.doLogout = this.doLogout.bind(this);
    this.authenticateUser = this.authenticateUser.bind(this);
    this.removePlayer = this.removePlayer.bind(this);
  }

  public authenticateUser() {
    firebase.auth().getRedirectResult()
      .then((result: any) => {
        store.set('token', result.credential.accessToken);
        store.set('user', result.user);
        this.setState({
          ...this.state,
          loggedIn: true,
        });
        this.rankRef = getRankRef(this.state.position, store.get('user').uid);
        this.rankRef.once('value').then((snapshot: any) => {
          if (R.not(R.isNil(snapshot.val()))) {
            this.setState({
              ...this.state,
              rank: snapshot.val() || store.get('sort'),
            });
          }
        });
      })
      .catch((error) => {
        this.errorCode = error.code;
        this.errorMessage = error.message;
        this.email = error.email;
        this.credential = error.credential;
      });
  }

  public componentDidMount() {
    this.loadPlayersIntoState(this.state.position, true);
    // tslint:disable-next-line
    if (R.or(
      R.isNil(store.get('token')),
      R.isNil(store.get('user')),
    )) {
      this.authenticateUser();
    } else {
      this.setState({
        ...this.state,
        loggedIn: true,
      });
    }
    if (store.get('user') !== undefined) {
      this.rankRef = getRankRef(this.state.position, store.get('user').uid);
      this.rankRef.once('value').then((snapshot: any) => {
        if (R.not(R.isNil(snapshot.val()))) {
          this.setState({
            ...this.state,
            rank: snapshot.val() || store.get('sort'),
          });
        }
      });
      this.rankRef.on('value', (snapshot: any) => {
        // tslint:disable-next-line
        this.setState({
          ...this.state,
          rank: snapshot.val() || store.get('sort'),
        });
      });
    }
  }

  public doLogin() {
    firebase.auth().signInWithRedirect(provider);
  }

  public doLogout() {
    // tslint:disable-next-line
    console.log('here');
    store.set('user', undefined);
    store.set('token', undefined);
    this.setState({
      ...this.state,
      loggedIn: false,
    });
    firebase.auth().signOut();
  }

  public changePosition(position: PlayerPositions) {
    return () => {
      store.set('position', position);
      this.loadPlayersIntoState(position, true);
    }
  }

  // tslint:disable-next-line
  public handleChange = (e: any) => {
    // tslint:disable-next-line
    console.log('hey', e);
    this.addPlayer(e.value);
  }

  public addPlayer = (playerId: number) => {
    const newRank = R.insert(24, playerId, this.state.rank.filter((playerId2: number) => playerId2 !== playerId));
    getRankRef(this.state.position, store.get('user').uid).set(newRank);
  }

  public removePlayer = (removedPlayerId: number) => () => {
    const newRank = R.insert(25, removedPlayerId, this.state.rank.filter((playerId: number) => playerId !== removedPlayerId));
    // tslint:disable-next-line
    console.log('god damn');
    getRankRef(this.state.position, store.get('user').uid).set(newRank);
  }

  public loadPlayersIntoState(position: PlayerPositions, override: boolean = false) {
    const statType: any = getStatType(position);
    const statSet = getStatSet(position, statType);
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
          getPlayerStatsData(API_TOKEN, API_PASSWORD, position, statSet)(),
          store.get('user') !== undefined ?
            getRankRef(position, store.get('user').uid).once('value') :
            Promise.resolve(undefined)
        ])
      ,
      // TODO: this is no longer relevant until we start caching data again
      () => Promise.resolve([store.get('players'), store.get('playerStats')])
    )(R.prop(position, store.get('lastUpdated')))
    .then((response: any) => {
      const players = response[0];
      const playerStats = response[1];
      const rank = (response[2] && response[2].val()) || store.get('sort') || this.state.rank;
      this.setState({
        ...this.state,
        isLoading: false,
        playerStats,
        players,
        position,
        rank,
      });
      if (store.get('user') !== undefined) {
        getRankRef(position, store.get('user').uid).on('value', (snapshot: any) => {
          this.setState({
            ...this.state,
            rank: snapshot.val() || rank,
          });
        })
      }
    });
  }

  public onSortEnd({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) {
    if (oldIndex !== newIndex) {
      const newRank = arrayMove(this.state.rank, oldIndex, newIndex);
      // store.set('rank', {
      //   ...store.get('rank'),
      //   [this.state.position]: newRank,
      // });
      // this.setState({
      //   ...this.state,
      //   // players: newPlayers,
      //   rank: newRank,
      // });
      if (this.state.loggedIn) {
        getRankRef(this.state.position, store.get('user').uid).set(newRank);
      }
      this.setState({
        ...this.state,
        rank: newRank,
      })
    }
  };

  public isLoggedIn() {
    return R.not(R.or(R.isNil(store.get('token')), R.isNil(store.get('user'))));
  }

  public render() {
    const rank = this.state && this.state.rank;

    const playersById = R.propOr({}, this.state.position, store.get('playersById'));
    const playerStatsById = R.propOr({}, this.state.position, store.get('playerStatsById'));

    const players = R.slice(0, 25, rank.map((id: any) => playersById[id]));

    // tslint:disable-next-line
    return (
      <>
        <div className="flex flex-column vh-100">
          <div className="flex-none header">
            <h1 className="f4 bold ma2">Rankor Monster</h1>
            <div className="flex justify-between ma2">
              <div>
                <button onClick={this.changePosition('QB')} className="bg-transparent ba b--none underline">QB</button>
                <button onClick={this.changePosition('RB')} className="bg-transparent ba b--none underline">RB</button>
                <button onClick={this.changePosition('TE')} className="bg-transparent ba b--none underline">TE</button>
                <button onClick={this.changePosition('WR')} className="bg-transparent ba b--none underline">WR</button>
              </div>
              <div>
                {!this.state.loggedIn ? (
                  <button onClick={this.doLogin} className="bg-transparent ba b--none underline">Login</button>
                ) : (
                  <button onClick={this.doLogout} className="bg-transparent ba b--none underline">Logout</button>
                )}
              </div>
            </div>
            <div className="ma2">
              <Select
                placeholder={'Add Player to top 25...'}
                controlShouldRenderValue={false}
                isSearchable={true}
                options={R.drop(25, this.state.rank).map((playerId: number) => ({
                  label: playersById[playerId].firstName + ' ' + playersById[playerId].lastName,
                  value: playerId,
                }))}
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div className="flex-auto relative">
            {this.state.isLoading ? (
              <p>Loading</p>
            ) : (
              <div className="absolute bottom-0 top-0 left-0 right-0 overflow-scroll">
                <PlayerList
                  useDragHandle={true}
                  lockAxis={'y'}
                  players={players}
                  playerStats={playerStatsById}
                  onSortEnd={this.onSortEnd}
                  onRemovePlayer={(playerId: any) => () => {
                    // tslint:disable-next-line
                    console.log('asdasdasdas', playerId);
                    this.removePlayer(playerId)();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
}

export default App;
