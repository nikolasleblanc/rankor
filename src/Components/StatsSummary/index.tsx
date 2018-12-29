import * as React from 'react';

export const StatsSummary: React.SFC<any> = ({
  stats: {
    fantasyPoints,
    gamesPlayed,
    passing: { passAttempts, passCompletions, passYards, passAvg, passTD },
    receiving: { targets, receptions, recYards, recAverage, recTD },
    rushing: { rushAttempts, rushYards, rushAverage, rushTD }
  }
}) => (
  <>
    <p>Fantasy Points: {fantasyPoints}</p>
    <p>Games Played: {gamesPlayed}</p>
    <p>Pass Attempts: {passAttempts}</p>
    <p>Pass Completions: {passCompletions}</p>
    <p>Pass Yards: {passYards}</p>
    <p>Pass Avg: {passAvg}</p>
    <p>Pass TD: {passTD}</p>
    <p>Targets: {targets}</p>
    <p>Receptions: {receptions}</p>
    <p>Receiving Yards: {recYards}</p>
    <p>Receiving Avg: {recAverage}</p>
    <p>Receiving TD: {recTD}</p>
    <p>Rush Attempts: {rushAttempts}</p>
    <p>Rush Yards: {rushYards}</p>
    <p>Rush Avg: {rushAverage}</p>
    <p>Rush TD: {rushTD}</p>
  </>
);
