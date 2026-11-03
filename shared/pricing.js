// Calculation rules (deduction first, then round-off), same for web and mobile.
const r2 = (x) => Math.round(x * 100) / 100;

export function applyDeduction(w, rules = []) {
  const rule = rules.find((x) => w >= x.minKg && w <= x.maxKg);
  return rule ? r2(w - rule.deductKg) : w;
}

export function applyRoundOff(net, bands = []) {
  const whole = Math.floor(net);
  const dec = r2(net - whole);
  const band = bands.find((b) => dec >= b.fromDecimal && dec <= b.toDecimal);
  return band ? r2(whole + band.target) : net;
}

export function netWeight(w, c) {
  let net = w;
  if (c.deductionEnabled) net = applyDeduction(net, c.deductionRules);
  if (c.roundOffEnabled) net = applyRoundOff(net, c.roundBands);
  return net;
}

// Final Price = (Net Weight / Unit) x Rate
export const finalPrice = (w, rate, c) => r2((netWeight(w, c) / c.unitKg) * rate);

// Weight alarm: raises an alert only, never blocks the transaction
export const isOutlier = (w, c) =>
  (c.minWeight != null && w < c.minWeight) || (c.maxWeight != null && w > c.maxWeight);
