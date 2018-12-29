import * as React from 'react';

import Button from '@material-ui/core/Button';

import * as yup from 'yup';

import * as ReactMarkdown from 'react-markdown';

import { useDebounce } from 'use-debounce';

import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikBag,
  FormikProps,
  FormikValues
} from 'formik';

export interface PlayerDetailProps {
  player: any;
  stats: any;
  onClose: () => void;
  summary: any;
}

const PlayerSummary: React.SFC<any> = ({
  player: {
    firstName,
    lastName,
    primaryPosition,
    jerseyNumber,
    officialImageSrc: img,
    weight,
    age,
    currentTeam: { abbreviation: teamAbbreviation },
    drafted: { year: draftYear, round, overallPick }
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

const StatsSummary: React.SFC<any> = ({
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

const schema = yup.object().shape({
  summary: yup.string().required()
});

export const PlayerDetail: React.SFC<PlayerDetailProps> = ({
  onClose,
  player,
  stats
  // summary
}) => {
  const handleChange = (
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  ) => (e: any) => {
    setSummary(e.currentTarget.value);
    setFieldValue('summary', e.currentTarget.value);
  };
  const [summary, setSummary] = React.useState('');
  const debounceSummary = useDebounce(summary, 150);
  return (
    <div className="list pa2" style={{ width: 1000 }}>
      <PlayerSummary player={player} />
      <StatsSummary stats={stats} />
      <hr />
      <h2>Summary</h2>
      <Formik
        initialValues={{ summary }}
        validationSchema={schema}
        onSubmit={(
          values: FormikValues,
          { setSubmitting }: FormikBag<any, any>
        ) => {
          console.log(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, setFieldValue }: FormikProps<any>) => (
          <Form>
            <Field
              style={{ width: '100%' }}
              rows="5"
              component="textarea"
              name="summary"
              onChange={handleChange(setFieldValue)}
            />
            <ErrorMessage name="summary" component="div" />
            <div>
              <Button type="submit" disabled={isSubmitting}>
                Submit
              </Button>
            </div>
          </Form>
        )}
      </Formik>
      <ReactMarkdown source={debounceSummary} />
      <hr />
      <h2>Entries</h2>
      <hr />
      <h2>New Entry</h2>
      <hr />
      <Button variant={'contained'} color={'secondary'} onClick={onClose}>
        Close
      </Button>
    </div>
  );
};
