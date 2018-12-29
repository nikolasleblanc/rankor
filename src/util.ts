import { default as axios } from 'axios';
import { format } from 'date-fns';
import * as R from 'ramda';
import * as store from 'store';
import { API_PASSWORD, API_PLAYER_STATS_URL, API_PLAYER_URL, API_TOKEN, POINT_VALUES, STATS } from './constants';
import { PlayerPositions, StatType } from './interface';

export const mapPlayerData = R.compose(
  // R.slice(0, 100),
  R.filter(R.compose(R.not, R.isNil)),
  R.map(R.omit(['height'])),
  R.map(R.prop('player')),
  R.pathOr([], ['data', 'players']),
);

const calculateFantasyPoints = (statSet: any, playerStatType: string) => (playerStats: any): number => {
  const totalPointsByStat: number[] =
    R.map(
      (statType: string) =>
        R.pathOr(0, [statType], playerStats) *
        R.pathOr(0, [statType], POINT_VALUES[playerStatType]),
      statSet
    );
  const totalPoints: number = totalPointsByStat.reduce((acc: number, item: number) => acc + item, 0);
  return totalPoints;
};

export const getStatType = (position: PlayerPositions): string => {
  const playerStatTypeMap: {[k: string]: string} = {
    'QB': 'passing',
    'RB': 'rushing',
    'TE': 'receiving',
    'WR': 'receiving',
  };
  return playerStatTypeMap[position];
};

export const getStatSet = (playerPosition: PlayerPositions, playerStatType: StatType): any => {
  const relevantStats = R.intersection<any>(STATS[playerPosition], R.keys(R.prop(playerStatType, POINT_VALUES)));
  return relevantStats;
}

export const mapPlayerStatsData = (statSet: any) =>
  R.compose(
    R.tap((players: any) => {
      store.set(
        'sort',
        R.compose(
          R.map(R.prop('id')),
          R.sortWith([
            R.descend(R.prop('fantasyPoints')),
          ]),
        )(players),
      );
    }),
    R.map((player: any) => {
      const position = R.pathOr('', ['player', 'primaryPosition'], player);
      return {
        fantasyPoints: calculateFantasyPoints(statSet, getStatType(position))(R.path(['stats', getStatType(position)], player)),
        id: R.path(['player', 'id'], player),
        playerPosition: R.path(['player', 'primaryPosition'], player),
        ...R.prop('stats', player),
      };
    }),
    R.pathOr([], ['data', 'playerStatsTotals']),
  );

export const isDataStale = (position: string) => (lastUpdated: Date) => {
  return true;
  // const timeElapsedSinceUpdate = differenceInMinutes(new Date(), lastUpdated);
  // return timeElapsedSinceUpdate > MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS;
};

export const setLocalStorage = (key: string, position: string, value: any) => store.set(key, R.assocPath([position], value, store.get(key)));

export const setLastUpdated = (position: string) =>
  R.tap((_: any) =>
    setLocalStorage('lastUpdated', position, new Date()),
  );

export const setPlayersIndexedById = (position: string) =>
  R.tap((players: any) =>
    setLocalStorage('playersById', position, R.indexBy(R.prop('id'), players)),
  );

export const setPlayerStatsIndexedById = (position: string) =>
  R.tap((players: any) =>
    setLocalStorage('playerStatsById', position, R.indexBy(R.prop('id'), players)),
  );

export const setPlayersArray = (position: string) =>
  R.tap((players: any) =>
    setLocalStorage('players', position, players),
  );

export const setPlayerStatsArray = (position: string) =>
  R.tap((players: any) =>
    setLocalStorage('playerStats', position, players),
  );

export const processPlayerData = (position: string) =>
  R.compose(
    setLastUpdated(position),
    setPlayersArray(position),
    setPlayersIndexedById(position),
    mapPlayerData,
  );

export const processPlayerStatsData = (position: string, statSet: any) =>
  R.compose(
    setLastUpdated(position),
    setPlayerStatsArray(position),
    setPlayerStatsIndexedById(position),
    mapPlayerStatsData(statSet),
  );

export const fetch = (url: string) => axios.get(url, {
  headers: {
    'Authorization': `Basic ${btoa(API_TOKEN.concat(':', API_PASSWORD))}`,
  }
});



export const getPlayerData = (position: string) => () =>
  fetch(`${API_PLAYER_URL}?position=${position}`)
    .then(processPlayerData(position));

export const getPlayerStatsData = (position: string, statSet: any, date: Date[]) => () =>
  fetch(`${API_PLAYER_STATS_URL}?position=${position}&date=${date.length &&
    date.reverse().map(i => format(i, 'YYYYMMDD')).join('-')}`)
    .then(processPlayerStatsData(position, statSet));

export const setupStore = () => {
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
  if (R.isNil(store.get('week'))) {
    store.set('week', 1);
  }
}

export const setupState = (position: PlayerPositions, week: number = 1) => (
  {
    isLoading: true,
    loggedIn: false,
    playerSelected: 0,
    playerStats: [],
    players: [],
    position,
    rank: [],
    summaries: [],
    week,
  }
);

export const movePlayerToIndex = (playerId: number, index: number, rank: any[]) => {
  return R.insert(index, playerId, R.filter(R.compose(R.not, R.equals(playerId)), rank));
}
