import * as React from 'react';

export const PlayerSummary: React.SFC<any> = ({
  player: {
    firstName,
    lastName,
    primaryPosition,
    jerseyNumber,
    officialImageSrc: img,
    weight,
    age,
    currentTeam: { abbreviation: teamAbbreviation },
    drafted: {
      year: draftYear,
      round: draftRound,
      overallPick: draftOverallPick
    }
  }
}) => (
  <>
    <p>
      Name: {firstName} {lastName}
    </p>
    <p>Position: {primaryPosition}</p>
    <p>Jersey Number: {jerseyNumber}</p>
    <p>Team: {teamAbbreviation}</p>
    <p>Age: {age}</p>
    <p>Weight: {weight}</p>
    <p>Draft Year: {draftYear}</p>
    <p>Draft Round: {draftRound}</p>
    <p>Draft Overall Pick: {draftOverallPick}</p>
    {img && (
      <img
        className="mh2"
        width="50"
        height="50"
        src={(img || '').replace('http:', 'https:')}
      />
    )}
  </>
);
