import { RelevantStats } from "./interface";

export const PASSING_STATS = [
  "pass20Plus",
  "pass40Plus",
  "passAttempts",
  "passAvg",
  "passCompletions",
  "passInt",
  "passIntPct",
  "passLng",
  "passPct",
  "passSacks",
  "passSackY",
  "passTD",
  "passTDPct",
  "passYards",
  "passYardsPerAtt",
  "qbRating",
];

export const RUSHING_STATS = [
  "rushAttempts",
  "rushYards",
  "rushAverage",
  "rushTD",
  "rushLng",
  "rush1stDowns",
  "rush1stDownsPct",
  "rush20Plus",
  "rush40Plus",
  "rushFumbles",
];

export const RECEIVING_STATS = [
  "targets",
  "receptions",
  "recYards",
  "recAverage",
  "recTD",
  "recLng",
  "rec1stDowns",
  "rec20Plus",
  "rec40Plus",
  "recFumbles",
];

export const STATS = {
  'QB': PASSING_STATS,
  'RB': RUSHING_STATS,
  'TE': RECEIVING_STATS,
  'WR': RECEIVING_STATS,
};

// const MAX_ALLOWABLE_AGE_OF_DATA_IN_HOURS = 0;
export const API_TOKEN = process.env.REACT_APP_TOKEN || '';
export const API_PASSWORD = process.env.REACT_APP_PASSWORD || '';
export const SEASON = 'current';
export const API_URL = 'https://api.mysportsfeeds.com/v2.0/pull/nfl';
export const API_PLAYER_URL = `${API_URL}/players.json`;
export const API_PLAYER_STATS_URL = `${API_URL}/${SEASON}/player_stats_totals.json`;

export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
};

export const POINT_VALUES: RelevantStats = {
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
