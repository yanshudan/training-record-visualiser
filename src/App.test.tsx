import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { RecordSerializer } from './utils/RecordSerializer';

test('serializer', () => {
  const record=RecordSerializer.parseRecord("2020-12-31 General\n卧推 12kg 10 10 10kg 10 10\nPullups 10 10 10 10 10");
  expect(record?.topic ==="General").toBeTruthy();
});
