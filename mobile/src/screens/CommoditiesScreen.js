import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Field, Message, colors, s } from '../ui';
import { emptyBand, emptyCommodity, emptyRule, fromApi, toPayload, validateCommodity } from '../../../shared/commodity';

const Sec = ({ title, hint, tint = '#f6f7fa', action, children }) => (
  <View style={{ backgroundColor: tint, borderRadius: 14, padding: 14, marginBottom: 14 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ fontWeight: '700', color: colors.ink }}>{title}</Text>
        {hint ? <Text style={[s.muted, { fontSize: 12, marginTop: 2 }]}>{hint}</Text> : null}
      </View>
      {action}
    </View>
    <View style={{ marginTop: 10 }}>{children}</View>
  </View>
);

const Tog = ({ label, hint, value, onChange }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={{ fontSize: 15, color: colors.ink, fontWeight: '600' }}>{label}</Text>
      {hint ? <Text style={[s.muted, { fontSize: 12 }]}>{hint}</Text> : null}
    </View>
    <Switch value={!!value} onValueChange={onChange} />
  </View>
);

const Num = (p) => <Field keyboardType="decimal-pad" {...p} />;

function RowEditor({ rows, fields, onChange, onDelete, preview }) {
  return rows.map((r, i) => (
    <View key={i} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {fields.map(([k, ph]) => (
          <TextInput key={k} style={[s.input, { flex: 1, paddingHorizontal: 8 }]} placeholder={ph} keyboardType="decimal-pad"
            value={r[k]} onChangeText={(v) => onChange(i, k, v)} />
        ))}
        <Pressable onPress={() => onDelete(i)} hitSlop={8}><Text style={{ color: colors.danger }}>Remove</Text></Pressable>
      </View>
      <Text style={[s.muted, { fontSize: 12, marginTop: 4 }]}>{preview(r, i)}</Text>
    </View>
  ));
}

function CommodityModal({ visible, initial, onClose, onSaved }) {
  const [f, setF] = useState(emptyCommodity());
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (visible) { setF(initial ? fromApi(initial) : emptyCommodity()); setMsg(null); setBusy(false); }
  }, [visible, initial]);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (list) => (i, k, v) => setF((p) => ({ ...p, [list]: p[list].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (list, row) => () => setF((p) => ({ ...p, [list]: [...p[list], row] }));
  const delRow = (list) => (i) => setF((p) => ({ ...p, [list]: p[list].filter((_, j) => j !== i) }));

  const save = async () => {
    const problem = validateCommodity(f);
    if (problem) return setMsg({ text: problem });
    setBusy(true);
    try {
      const payload = toPayload(f);
      if (initial?.id) await api.updateCommodity(initial.id, payload); else await api.createCommodity(payload);
      onSaved();
    } catch (e) { setMsg({ text: e.message }); setBusy(false); }
  };

  const small = <Pressable onPress={() => {}} />;
  const AddBtn = ({ title, onPress }) => (
    <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ color: colors.ink, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
          <Text style={[s.title, { marginBottom: 14 }]}>{initial?.id ? 'Edit commodity' : 'Add commodity'}</Text>

          <Field label="Commodity name" value={f.name} onChangeText={set('name')} autoCapitalize="words" />

          <Sec tint="#eef3ff" title="Rate per unit (kg) *" hint="Final price = (Weight ÷ Unit) × Rate">
            <Num label="Unit (kg)" placeholder="e.g. 90 for rate per 90kg" value={f.unitKg} onChangeText={set('unitKg')} />
          </Sec>

          <Sec tint="#fff7e6" title="Weight alarm range" hint="Outside this range raises an alert. It does not block the transaction.">
            <Num label="Min weight (kg)" value={f.minWeight} onChangeText={set('minWeight')} />
            <Num label="Max weight (kg)" value={f.maxWeight} onChangeText={set('maxWeight')} />
          </Sec>

          <Sec tint="#eafaf1" title="Commission and user fee">
            <Num label="Commission %" value={f.commissionPercent} onChangeText={set('commissionPercent')} />
            <Num label="User fee %" value={f.userFeePercent} onChangeText={set('userFeePercent')} />
          </Sec>

          <Sec title="GST">
            <Tog label="GST applicable to this commodity" value={f.gstApplicable} onChange={set('gstApplicable')} />
            {f.gstApplicable && (
              <>
                <Field label="HSN (6 digits) or SAC (8 digits) *" value={f.hsnCode} keyboardType="number-pad" maxLength={8}
                  onChangeText={(v) => set('hsnCode')(v.replace(/\D/g, ''))} />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  {['GST', 'IGST'].map((t) => (
                    <Pressable key={t} onPress={() => set('gstType')(t)}
                      style={{ flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1,
                        borderColor: f.gstType === t ? colors.blue : colors.line, backgroundColor: f.gstType === t ? '#eef3ff' : '#fff' }}>
                      <Text style={{ fontWeight: '600', color: colors.ink }}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
                <Num label="GST % *" placeholder="e.g. 5, 12, 18" value={f.gstPercent} onChangeText={set('gstPercent')} />
                {f.gstType === 'GST' && (
                  <>
                    <Num label="SGST % (optional)" value={f.sgstPercent} onChangeText={set('sgstPercent')} />
                    <Num label="CGST % (optional)" value={f.cgstPercent} onChangeText={set('cgstPercent')} />
                  </>
                )}
              </>
            )}
          </Sec>

          <Sec title="Bill prefix" hint="Bill format: prefix + serial (e.g. PK 123456)">
            <Field label="Prefix" value={f.prefix} onChangeText={set('prefix')} maxLength={10} autoCapitalize="characters" />
          </Sec>

          <Sec tint="#f4efff" title="Calculation type">
            <Tog label="Deduction" hint="Subtract kg by weight slab" value={f.deductionEnabled} onChange={set('deductionEnabled')} />
            <Tog label="Round-off" hint="Decimal bands 0 to 1, applied after deduction" value={f.roundOffEnabled} onChange={set('roundOffEnabled')} />
          </Sec>

          {f.deductionEnabled && (
            <Sec tint="#fff7e6" title="Deduction rules" hint="Ranges must not overlap."
              action={<AddBtn title="Add rule" onPress={addRow('deductionRules', emptyRule())} />}>
              {f.deductionRules.length === 0 && <Text style={s.muted}>No deduction rules yet. Add one.</Text>}
              <RowEditor rows={f.deductionRules} fields={[['minKg', 'Min kg'], ['maxKg', 'Max kg'], ['deductKg', 'Deduct kg']]}
                onChange={setRow('deductionRules')} onDelete={delRow('deductionRules')}
                preview={(r, i) => `Rule #${i + 1}: If ${r.minKg || '?'} ≤ W ≤ ${r.maxKg || '?'} → Net = W − ${r.deductKg || '?'}kg`} />
            </Sec>
          )}

          {f.roundOffEnabled && (
            <Sec tint="#e9f9fd" title="Round-off decimal bands" hint="Cover 0 to 1, no gaps (step 0.01). Target 0 = lower kg, 1 = next kg."
              action={<AddBtn title="Add band" onPress={addRow('roundBands', emptyBand())} />}>
              {f.roundBands.length === 0 && <Text style={s.muted}>No bands yet. Example: 0 to 0.5 → 0.5, then 0.51 to 1 → 1.</Text>}
              <RowEditor rows={f.roundBands} fields={[['fromDecimal', 'From'], ['toDecimal', 'To'], ['target', 'Target']]}
                onChange={setRow('roundBands')} onDelete={delRow('roundBands')}
                preview={(b) => `Decimal ${b.fromDecimal || '?'} to ${b.toDecimal || '?'} → round to ${b.target || '?'}`} />
            </Sec>
          )}

          <Sec tint="#fff0f5" title="Other charges">
            <Tog label="Coolie / unloading (auto-calculated)" hint={f.coolieEnabled ? 'Charged per kg' : 'Disabled. Set a fixed price instead.'}
              value={f.coolieEnabled} onChange={set('coolieEnabled')} />
            {f.coolieEnabled && <Num label="Coolie rate per kg" value={f.coolieRatePerKg} onChangeText={set('coolieRatePerKg')} />}
            <Tog label="Hamali" value={f.hamaliEnabled} onChange={set('hamaliEnabled')} />
            <Num label="Weighing charge (fixed)" value={f.weighingCharge} onChangeText={set('weighingCharge')} />
          </Sec>

          <Message m={msg} />
          <View style={{ gap: 10, marginTop: 4 }}>
            <Button title={busy ? 'Saving…' : 'Save commodity'} onPress={save} disabled={busy} />
            <Button title="Cancel" kind="ghost" onPress={onClose} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function CommoditiesScreen() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ visible: false, item: null });

  const load = useCallback(async () => {
    try { setItems(await api.listCommodities()); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (c) => Alert.alert('Delete commodity', `Delete ${c.name}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deleteCommodity(c.id); load(); } catch (e) { setError(e.message); } } },
  ]);

  return (
    <View style={s.screen}>
      <FlatList
        contentContainerStyle={[s.pad, { gap: 10 }]}
        data={items}
        keyExtractor={(c) => String(c.id)}
        ListHeaderComponent={
          <View style={{ marginBottom: 6, gap: 10 }}>
            <Text style={s.title}>Commodity settings</Text>
            <Text style={s.muted}>{items.length} commodities configured</Text>
            <Button title="Add commodity" onPress={() => setModal({ visible: true, item: null })} />
            {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={!error ? <Text style={s.muted}>No commodities yet. Add one to get started.</Text> : null}
        renderItem={({ item: c }) => (
          <View style={s.card}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.ink }}>{c.name}</Text>
            <Text style={s.muted}>
              Rate: {c.unitKg ? `per ${c.unitKg}kg` : 'Not set'} · Prefix: {c.prefix || 'Not set'}
            </Text>
            {(c.deductionEnabled || c.roundOffEnabled || c.gstApplicable) && (
              <Text style={{ color: colors.blue, marginTop: 4 }}>
                {[c.gstApplicable && `${c.gstType} ${c.gstPercent}%`, c.deductionEnabled && 'Deduction', c.roundOffEnabled && 'Round-off']
                  .filter(Boolean).join(' · ')}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}><Button title="Edit" kind="ghost" onPress={() => setModal({ visible: true, item: c })} /></View>
              <View style={{ flex: 1 }}><Button title="Delete" kind="danger" onPress={() => remove(c)} /></View>
            </View>
          </View>
        )}
      />
      <CommodityModal visible={modal.visible} initial={modal.item}
        onClose={() => setModal({ visible: false, item: null })}
        onSaved={() => { setModal({ visible: false, item: null }); load(); }} />
    </View>
  );
}