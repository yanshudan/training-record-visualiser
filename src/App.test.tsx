import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { RecordSerializer, UnitEnum } from './utils/RecordSerializer';

test('movement parser', () => {
  const m = RecordSerializer.parseMovement("卧推 12kg 10 10 10kg 10 10 good");
  expect(m).toBeTruthy();
  expect(m?.name).toBe("卧推");
  expect(m?.comment).toBe("good");
  expect(m?.sets.length).toBe(4);
});
test("movement serializer", () => {
  const m = RecordSerializer.serializeMovement({
    name: "卧推",
    sets: [
      { weight: 12, unit: UnitEnum.kg, reps: 10 },
      { weight: 10, unit: UnitEnum.kg, reps: 10 },
    ],
    comment: "good",
  });
  expect(m).toBe("卧推 12kg 10 10kg 10 good");
});
test('movement parser', () => {
  const m = RecordSerializer.parseMovement("卧推 12kg 0");
  expect(m).toBeTruthy();
  expect(m?.name).toBe("卧推");
  expect(m?.comment).toBe("")
  expect(m?.sets.length).toBe(1);
});
test("movement serializer", () => {
  const m = RecordSerializer.serializeMovement({
    name: "卧推",
    sets: [
      { weight: 12, unit: UnitEnum.kg, reps: 0 },
      { weight: 10, unit: UnitEnum.kg, reps: 10 },
    ],
    comment: "good",
  });
  expect(m).toBe("卧推 12kg 0 10kg 10 good");
});

test('movement parser', () => {
  const m = RecordSerializer.parseMovement("卧推 12kg");
  expect(m).toBeTruthy();
  expect(m?.name).toBe("卧推");
  expect(m?.comment).toBe("");
  expect(m?.sets.length).toBe(0);
});
test("movement serializer", () => {
  const m = RecordSerializer.serializeMovement({
    name: "卧推",
    sets: [],
    comment: "",
  });
  expect(m).toBe("卧推 ");
});
test('movement parser', () => {
  const m = RecordSerializer.parseMovement("卧推 12kg GOOD");
  expect(m).toBeTruthy();
  expect(m?.name).toBe("卧推");
  expect(m?.comment).toBe("GOOD");
  expect(m?.sets.length).toBe(0);
});

test("movement serializer", () => {
  const m = RecordSerializer.serializeMovement({
    name: "卧推",
    sets: [],
    comment: "GOOD",
  });
  expect(m).toBe("卧推 GOOD");
});
