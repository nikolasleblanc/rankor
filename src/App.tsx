import * as firebase from 'firebase';
// import { differenceInMinutes } from 'date-fns';
import * as R from 'ramda';
import * as React from 'react';
import { arrayMove } from 'react-sortable-hoc';
import * as store from 'store';
import './App.css';
import { PlayerList } from './Components/PlayerList';
import { API_PASSWORD, API_TOKEN, FIREBASE_CONFIG } from './constants';
import { PlayerPositions } from './interface';

import { default as Select } from 'react-select';
import { getPlayerData, getPlayerStatsData, getStatSet, getStatType, isDataStale, movePlayerToIndex, setupState, setupStore } from './util';

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const provider = new firebase.auth.GoogleAuthProvider();

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
  public handleOnAddPlayer = (e: any) => {
    getRankRef(this.state.position, store.get('user').uid)
      .set(movePlayerToIndex(e.value, 24, this.state.rank));
  }

  public handleOnRemovePlayer = (playerId: any) => () => {
    getRankRef(this.state.position, store.get('user').uid)
      .set(movePlayerToIndex(playerId, 25, this.state.rank));
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
          getPlayerData(position)(),
          getPlayerStatsData(position, statSet)(),
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
                  label: R.path([playerId, 'firstName'], playersById) + ' ' + R.path([playerId, 'lastName'], playersById),
                  value: playerId,
                }))}
                onChange={this.handleOnAddPlayer}
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
                  onRemovePlayer={this.handleOnRemovePlayer}
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
