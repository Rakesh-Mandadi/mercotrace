// Commodity form helpers + validation, shared by web and mobile.
const s = (v) => (v == null ? '' : String(v));
const n = (v) => (v === '' || v == null ? null : Number(v));
const t = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
const cents = (x) => Math.round(x * 100);

export const emptyCommodity = () => ({
  name: '', unitKg: '', minWeight: '', maxWeight: '',
  commissionPercent: '0', userFeePercent: '0',
  gstApplicable: false, hsnCode: '', gstType: 'GST', gstPercent: '', sgstPercent: '', cgstPercent: '',
  prefix: '', deductionEnabled: false, roundOffEnabled: false,
  deductionRules: [], roundBands: [],
  coolieEnabled: false, coolieRatePerKg: '', hamaliEnabled: false, weighingCharge: '',
});

export const emptyRule = () => ({ minKg: '', maxKg: '', deductKg: '' });
export const emptyBand = () => ({ fromDecimal: '', toDecimal: '', target: '' });

// API object -> form strings
export const fromApi = (c) => ({
  name: s(c.name), unitKg: s(c.unitKg), minWeight: s(c.minWeight), maxWeight: s(c.maxWeight),
  commissionPercent: s(c.commissionPercent ?? 0), userFeePercent: s(c.userFeePercent ?? 0),
  gstApplicable: !!c.gstApplicable, hsnCode: s(c.hsnCode), gstType: c.gstType || 'GST',
  gstPercent: s(c.gstPercent), sgstPercent: s(c.sgstPercent), cgstPercent: s(c.cgstPercent),
  prefix: s(c.prefix), deductionEnabled: !!c.deductionEnabled, roundOffEnabled: !!c.roundOffEnabled,
  deductionRules: (c.deductionRules || []).map((r) => ({ minKg: s(r.minKg), maxKg: s(r.maxKg), deductKg: s(r.deductKg) })),
  roundBands: (c.roundBands || []).map((b) => ({ fromDecimal: s(b.fromDecimal), toDecimal: s(b.toDecimal), target: s(b.target) })),
  coolieEnabled: !!c.coolieEnabled, coolieRatePerKg: s(c.coolieRatePerKg),
  hamaliEnabled: !!c.hamaliEnabled, weighingCharge: s(c.weighingCharge),
});

// form strings -> API payload
export function toPayload(f) {
  const gst = f.gstApplicable;
  const split = gst && f.gstType === 'GST';
  return {
    name: f.name.trim(), unitKg: n(f.unitKg), minWeight: n(f.minWeight), maxWeight: n(f.maxWeight),
    commissionPercent: n(f.commissionPercent) ?? 0, userFeePercent: n(f.userFeePercent) ?? 0,
    gstApplicable: gst, hsnCode: gst ? t(f.hsnCode) : null, gstType: gst ? f.gstType : null,
    gstPercent: gst ? n(f.gstPercent) : null,
    sgstPercent: split ? n(f.sgstPercent) : null, cgstPercent: split ? n(f.cgstPercent) : null,
    prefix: t(f.prefix),
    deductionEnabled: f.deductionEnabled, roundOffEnabled: f.roundOffEnabled,
    deductionRules: f.deductionEnabled
      ? f.deductionRules.map((r) => ({ minKg: n(r.minKg), maxKg: n(r.maxKg), deductKg: n(r.deductKg) })) : [],
    roundBands: f.roundOffEnabled
      ? f.roundBands.map((b) => ({ fromDecimal: n(b.fromDecimal), toDecimal: n(b.toDecimal), target: n(b.target) })) : [],
    coolieEnabled: f.coolieEnabled, coolieRatePerKg: f.coolieEnabled ? n(f.coolieRatePerKg) : null,
    hamaliEnabled: f.hamaliEnabled, weighingCharge: n(f.weighingCharge),
  };
}

// Returns the first problem as a message, or null when the form is valid.
export function validateCommodity(f) {
  const p = toPayload(f);
  const fin = Number.isFinite;
  if (!p.name) return 'Commodity name is required';
  if (!(p.unitKg > 0)) return 'Rate per unit (kg) is required and must be above 0';
  if (p.minWeight != null && p.maxWeight != null && p.minWeight > p.maxWeight)
    return 'Minimum weight cannot be above maximum weight';
  for (const [label, v] of [['Commission %', p.commissionPercent], ['User fee %', p.userFeePercent]])
    if (!(v >= 0 && v <= 100)) return `${label} must be between 0 and 100`;

  if (p.gstApplicable) {
    if (!/^(\d{6}|\d{8})$/.test(p.hsnCode || '')) return 'HSN must be 6 digits (goods) or SAC 8 digits (services)';
    if (!(p.gstPercent >= 0 && p.gstPercent <= 100) || p.gstPercent == null) return 'GST % is required (0 to 100)';
    if (p.gstType === 'GST' && (p.sgstPercent != null || p.cgstPercent != null)) {
      if (p.sgstPercent == null || p.cgstPercent == null || cents(p.sgstPercent + p.cgstPercent) !== cents(p.gstPercent))
        return 'SGST + CGST must add up to the GST %';
    }
  }

  if (p.deductionEnabled) {
    const r = p.deductionRules;
    if (!r.length) return 'Add at least one deduction rule or turn deduction off';
    if (r.some((x) => ![x.minKg, x.maxKg, x.deductKg].every(fin))) return 'Fill Min kg, Max kg and Deduct kg in every deduction rule';
    if (r.some((x) => x.minKg > x.maxKg)) return 'In a deduction rule, Min kg cannot be above Max kg';
    if (r.some((x) => x.deductKg < 0)) return 'Deduct kg cannot be negative';
    const sorted = [...r].sort((a, b) => a.minKg - b.minKg);
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].minKg <= sorted[i - 1].maxKg) return 'Deduction ranges must not overlap';
  }

  if (p.roundOffEnabled) {
    const b = [...p.roundBands].sort((x, y) => x.fromDecimal - y.fromDecimal);
    if (!b.length) return 'Add round-off bands covering 0 to 1';
    if (b.some((x) => ![x.fromDecimal, x.toDecimal, x.target].every(fin))) return 'Fill every field in the round-off bands';
    if (b.some((x) => x.fromDecimal < 0 || x.toDecimal > 1 || x.fromDecimal > x.toDecimal)) return 'Each band must go from a lower to a higher value between 0 and 1';
    if (b.some((x) => x.target < 0 || x.target > 1)) return 'Round-off target must be between 0 and 1';
    if (cents(b[0].fromDecimal) !== 0) return 'Round-off bands must start at 0';
    if (cents(b[b.length - 1].toDecimal) !== 100) return 'Round-off bands must end at 1';
    for (let i = 1; i < b.length; i++)
      if (cents(b[i].fromDecimal) !== cents(b[i - 1].toDecimal) + 1)
        return 'Round-off bands must cover 0 to 1 with no gaps or overlaps (the next band starts 0.01 after the previous one)';
  }
  return null;
}
