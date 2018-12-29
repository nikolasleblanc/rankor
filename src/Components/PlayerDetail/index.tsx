import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import * as yup from 'yup';

import Button from '@material-ui/core/Button';
import { useDebounce } from 'use-debounce';

import { PlayerSummary } from './../PlayerSummary';
import { StatsSummary } from './../StatsSummary';
import { PlayerDetailProps } from './interface';

import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikBag,
  FormikProps,
  FormikValues
} from 'formik';

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
