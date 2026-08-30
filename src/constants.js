export const SPECS = {
  MNQ: { pointValue: 2, tickSize: 0.25 },
  NQ: { pointValue: 20, tickSize: 0.25 }
};

export function toPoints(value, unit, contract) {
  const spec = SPECS[contract];
  return unit === 'ticks' ? value * spec.tickSize : value;
}
