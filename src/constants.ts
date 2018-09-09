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
