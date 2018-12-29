export interface RelevantPassingStats {
  passInt: number;
  passSacks: number;
  passTD: number;
  passYards: number;
}

export interface RelevantRushingStats {
  rushFumbles: number;
  rushTD: number;
  rushYards: number;
}

export interface RelevantReceivingStats {
  recFumbles: number;
  recTD: number;
  recYards: number;
  receptions: number;
}

export interface RelevantStats {
  passing: RelevantPassingStats;
  receiving: RelevantReceivingStats;
  rushing: RelevantRushingStats;
}

export type PlayerPositions = 'WR' | 'QB' | 'RB' | 'TE';
export type StatType = 'passing' | 'rushing' | 'receiving';
