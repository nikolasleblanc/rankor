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
const API_PLAYER_URL = 'https://api.mysportsfeeds.com/v2.0/pull/nfl/players.json';

const mapPlayerData = R.compose(
  R.slice(0, 100),
  R.map(R.omit(['height'])),
  R.map(R.prop('player')),
  R.pathOr([], ['data', 'players']),
);

const isDataStale = (lastUpdated: Date) => {
  return true;
  // const timeElapsedSinceUpdate = differenceInMinutes(new Date(), lastUpdated);
  // return timeElapsedSinceUpdate > MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS;
};

const setLastUpdated = R.tap((players: any) => {
  store.set('lastUpdated', new Date());
});


const setPlayersIndexedById = R.tap((players: any) => {
  store.set('playersById', R.indexBy(R.prop('id'), players));
});

const setPlayersArray = R.tap((players: any) => {
  store.set('players', players);
});

const getPlayersResourceResponse = (TOKEN: string, PASSWORD: string, position: string) =>
  axios.get(`${API_PLAYER_URL}?position=${position}`, {
    headers: {
      'Authorization': `Basic ${btoa(TOKEN.concat(':', PASSWORD))}`,
    },
  });

const getData = (TOKEN: string, PASSWORD: string, position: string) => () =>
  getPlayersResourceResponse(TOKEN, PASSWORD, position)
    .then(mapPlayerData)
    .then(setPlayersIndexedById)
    .then(setPlayersArray)
    .then(setLastUpdated);



class App extends React.Component<any, { players: any[], isLoading: boolean, position: string }> {
  public SortableList: any;

  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      players: [],
      position: 'RB',
    };
    this.onSortEnd = this.onSortEnd.bind(this);
    this.changePosition = this.changePosition.bind(this);
    this.loadPlayersIntoState = this.loadPlayersIntoState.bind(this);
  }

  public componentDidMount() {
    this.loadPlayersIntoState(this.state.position);
  }

  public changePosition(position: string) {
    return () => {
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
      R.or(isDataStale, () => override === true),
      getData(API_TOKEN, API_PASSWORD, position),
      () => Promise.resolve(store.get('players'))
    )(store.get('lastUpdated'))
    .then((players: any) => {
      this.setState({
        ...this.state,
        isLoading: false,
        players,
        position,
      });
    });
  }

  public onSortEnd({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) {
    if (oldIndex !== newIndex) {
      const { players } = this.state;

      this.setState({
        ...this.state,
        players: arrayMove(players, oldIndex, newIndex),
      });
    }
  };

  public render() {
    const { players } = this.state;

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
        <PlayerList
          players={players}
          onSortEnd={this.onSortEnd}
        />
      </>
    );
  }
}

export default App;
