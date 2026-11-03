import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { emptyBand, emptyCommodity, emptyRule, fromApi, toPayload, validateCommodity } from '../../../shared/commodity.js';
import { finalPrice, isOutlier, netWeight } from '../../../shared/pricing.js';

const Sec = ({ tone, title, hint, action, children }) => (
  <section className={`sec ${tone}`}>
    <div className="sec-head">
      <div><h4>{title}</h4>{hint && <p>{hint}</p>}</div>
      {action}
    </div>
    {children}
  </section>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="toggle-row">
    <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
    <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

const Num = ({ label, value, onChange, ...rest }) => (
  <label>{label}
    <input type="number" step="any" min="0" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
  </label>
);

function RowEditor({ rows, fields, onChange, onDelete, preview }) {
  return rows.map((r, i) => (
    <div key={i} className="row-block">
      <div className="rule-row">
        {fields.map(([k, ph]) => (
          <input key={k} type="number" step="any" min="0" placeholder={ph} aria-label={ph}
            value={r[k]} onChange={(e) => onChange(i, k, e.target.value)} />
        ))}
        <button type="button" className="ghost danger" onClick={() => onDelete(i)}>Remove</button>
      </div>
      <div className="preview">{preview(r, i)}</div>
    </div>
  ));
}

function CommodityForm({ initial, onSaved }) {
  const [f, setF] = useState(initial ? fromApi(initial) : emptyCommodity());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [w, setW] = useState('');
  const [rate, setRate] = useState('');

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (list) => (i, k, v) => setF((p) => ({ ...p, [list]: p[list].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (list, row) => () => setF((p) => ({ ...p, [list]: [...p[list], row] }));
  const delRow = (list) => (i) => setF((p) => ({ ...p, [list]: p[list].filter((_, j) => j !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateCommodity(f);
    if (problem) return setError(problem);
    setBusy(true); setError('');
    try {
      const payload = toPayload(f);
      if (initial) await api.updateCommodity(initial.id, payload); else await api.createCommodity(payload);
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  // "Try it" calculator, only when the form is valid
  let trial = null;
  if (w && validateCommodity(f) === null) {
    const p = toPayload(f);
    trial = {
      net: netWeight(Number(w), p),
      price: rate ? finalPrice(Number(w), Number(rate), p) : null,
      outlier: isOutlier(Number(w), p),
    };
  }

  return (
    <form className="cc-body" onSubmit={submit}>
      <Sec tone="grey" title="Commodity name">
        <input value={f.name} onChange={(e) => set('name')(e.target.value)} aria-label="Commodity name" />
      </Sec>

      <Sec tone="blue" title="Rate per unit (kg) *" hint="All calculations use this as the denominator: Final price = (Weight ÷ Unit) × Rate">
        <Num label="Unit (kg)" placeholder="e.g. 90 for rate per 90kg" value={f.unitKg} onChange={set('unitKg')} />
      </Sec>

      <Sec tone="amber" title="Weight alarm range" hint="A weight outside this range raises an outlier alert. It does not block the transaction.">
        <div className="grid2">
          <Num label="Min weight (kg)" placeholder="e.g. 10" value={f.minWeight} onChange={set('minWeight')} />
          <Num label="Max weight (kg)" placeholder="e.g. 500" value={f.maxWeight} onChange={set('maxWeight')} />
        </div>
      </Sec>

      <Sec tone="green" title="Commission and user fee">
        <div className="grid2">
          <Num label="Commission %" max="100" value={f.commissionPercent} onChange={set('commissionPercent')} />
          <Num label="User fee %" max="100" value={f.userFeePercent} onChange={set('userFeePercent')} />
        </div>
      </Sec>

      <Sec tone="grey" title="GST">
        <Toggle label="GST applicable to this commodity" checked={f.gstApplicable} onChange={set('gstApplicable')} />
        {f.gstApplicable && (
          <>
            <label>HSN (6 digits) or SAC (8 digits) *
              <input inputMode="numeric" maxLength={8} placeholder="e.g. 070310 or 99831412" value={f.hsnCode}
                onChange={(e) => set('hsnCode')(e.target.value.replace(/\D/g, ''))} />
            </label>
            <div className="grid3">
              <div className="radios" role="radiogroup" aria-label="GST type">
                {['GST', 'IGST'].map((t) => (
                  <label key={t} className="check">
                    <input type="radio" name={`gst-${initial?.id ?? 'new'}`} checked={f.gstType === t} onChange={() => set('gstType')(t)} /> {t}
                  </label>
                ))}
              </div>
              <Num label="GST % *" placeholder="e.g. 5, 12, 18" max="100" value={f.gstPercent} onChange={set('gstPercent')} />
              {f.gstType === 'GST' && (
                <div className="grid2">
                  <Num label="SGST % (optional)" placeholder="e.g. 2.5" value={f.sgstPercent} onChange={set('sgstPercent')} />
                  <Num label="CGST % (optional)" placeholder="e.g. 2.5" value={f.cgstPercent} onChange={set('cgstPercent')} />
                </div>
              )}
            </div>
          </>
        )}
      </Sec>

      <Sec tone="grey" title="Bill prefix" hint="Bill format: prefix + serial (e.g. PK 123456)">
        <input placeholder="e.g. ON, DC, PK" maxLength={10} value={f.prefix} onChange={(e) => set('prefix')(e.target.value)} aria-label="Bill prefix" />
      </Sec>

      <Sec tone="violet" title="Calculation type">
        <Toggle label="Deduction" hint="Subtract kg by weight slab (can combine with round-off)" checked={f.deductionEnabled} onChange={set('deductionEnabled')} />
        <Toggle label="Round-off" hint="Decimal bands from 0 to 1 (no gaps). Applied after deduction when both are on." checked={f.roundOffEnabled} onChange={set('roundOffEnabled')} />
      </Sec>

      {f.deductionEnabled && (
        <Sec tone="amber" title="Deduction rules" hint="Weight-range based rules. Ranges must not overlap."
          action={<button type="button" className="ghost" onClick={addRow('deductionRules', emptyRule())}>Add rule</button>}>
          {f.deductionRules.length === 0 && <p className="muted">No deduction rules yet. Add one.</p>}
          <RowEditor rows={f.deductionRules} fields={[['minKg', 'Min kg'], ['maxKg', 'Max kg'], ['deductKg', 'Deduct kg']]}
            onChange={setRow('deductionRules')} onDelete={delRow('deductionRules')}
            preview={(r, i) => `Rule #${i + 1}: If ${r.minKg || '?'} ≤ W ≤ ${r.maxKg || '?'} → Net = W − ${r.deductKg || '?'}kg`} />
        </Sec>
      )}

      {f.roundOffEnabled && (
        <Sec tone="cyan" title="Round-off decimal bands" hint="Bands cover 0 to 1 with no gaps (step 0.01). Target 0 = lower whole kg, 1 = next whole kg, 0.5 = half kg."
          action={<button type="button" className="ghost" onClick={addRow('roundBands', emptyBand())}>Add band</button>}>
          {f.roundBands.length === 0 && <p className="muted">No bands yet. Example: 0 to 0.5 → 0.5, then 0.51 to 1 → 1.</p>}
          <RowEditor rows={f.roundBands} fields={[['fromDecimal', 'From'], ['toDecimal', 'To'], ['target', 'Target']]}
            onChange={setRow('roundBands')} onDelete={delRow('roundBands')}
            preview={(b) => `Decimal ${b.fromDecimal || '?'} to ${b.toDecimal || '?'} → round to ${b.target || '?'}`} />
        </Sec>
      )}

      <Sec tone="pink" title="Other charges">
        <Toggle label="Coolie / unloading (auto-calculated)" hint={f.coolieEnabled ? 'Charged per kg' : 'Disabled. Set a fixed price instead.'}
          checked={f.coolieEnabled} onChange={set('coolieEnabled')} />
        {f.coolieEnabled && <Num label="Coolie rate per kg" value={f.coolieRatePerKg} onChange={set('coolieRatePerKg')} />}
        <Toggle label="Hamali" checked={f.hamaliEnabled} onChange={set('hamaliEnabled')} />
        <Num label="Weighing charge (fixed)" value={f.weighingCharge} onChange={set('weighingCharge')} />
      </Sec>

      <Sec tone="grey" title="Try the calculation" hint="Checks your deduction and round-off rules before charges, commission and GST.">
        <div className="grid2">
          <Num label="Actual weight (kg)" value={w} onChange={setW} />
          <Num label="Rate" value={rate} onChange={setRate} />
        </div>
        {trial && (
          <div className="preview">
            Net weight: {trial.net} kg{trial.price != null && ` · Final price: ${trial.price}`}
            {trial.outlier && ' · Outlier alert: weight is outside the alarm range'}
          </div>
        )}
      </Sec>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save commodity'}</button>
      </div>
    </form>
  );
}

function CommodityCard({ item, open, onToggle, onSaved, onDelete }) {
  const title = item ? item.name : 'New commodity';
  return (
    <li className="cc">
      <div className="cc-head">
        <button type="button" className="toggle-btn" onClick={onToggle} aria-expanded={open}>
          <div className="avatar">{title[0].toUpperCase()}</div>
          <div>
            <strong>{title}</strong>
            <div className="muted">
              {item ? `Rate: ${item.unitKg ? `per ${item.unitKg}kg` : 'Not set'} · Prefix: ${item.prefix || 'Not set'}` : 'Fill in the details below'}
            </div>
          </div>
        </button>
        {item && <button type="button" className="ghost danger" onClick={onDelete}>Delete</button>}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </div>
      {open && <CommodityForm key={item?.id ?? 'new'} initial={item} onSaved={onSaved} />}
    </li>
  );
}

export default function Commodities() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null); // null | 'new' | id
  const [error, setError] = useState('');

  const load = () => api.listCommodities().then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const saved = () => { setOpenId(null); load(); };
  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try { await api.deleteCommodity(c.id); load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="row-between">
        <div>
          <h2 className="page-title">Commodity settings</h2>
          <p className="muted">{items.length} commodities configured. Rates, deductions and charges.</p>
        </div>
        {openId !== 'new' && <button className="primary" onClick={() => setOpenId('new')}>Add commodity</button>}
      </div>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {openId === 'new' && <CommodityCard item={null} open onToggle={() => setOpenId(null)} onSaved={saved} />}
        {items.map((c) => (
          <CommodityCard key={c.id} item={c} open={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)} onSaved={saved} onDelete={() => remove(c)} />
        ))}
      </ul>
      {items.length === 0 && !error && openId !== 'new' && <p className="empty">No commodities yet. Add one to get started.</p>}
    </>
  );
}