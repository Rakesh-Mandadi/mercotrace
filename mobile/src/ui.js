import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = { blue: '#3b6df0', purple: '#8b3cf0', ink: '#1d2433', muted: '#667085', line: '#e4e7ee', bg: '#f5f6fb', danger: '#d92d20', ok: '#12805c' };

export function Field({ label, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor="#98a2b3" autoCapitalize="none" {...props} />
    </View>
  );
}

export function Button({ title, onPress, disabled, kind = 'primary' }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.btn, kind === 'primary' ? s.btnPrimary : s.btnGhost, disabled && { opacity: 0.6 }]}>
      <Text style={[s.btnText, kind !== 'primary' && { color: kind === 'danger' ? colors.danger : colors.ink }]}>{title}</Text>
    </Pressable>
  );
}

export const Message = ({ m }) => m ? <Text style={{ color: m.ok ? colors.ok : colors.danger, marginVertical: 6 }}>{m.text}</Text> : null;

export const s = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink, backgroundColor: '#fff' },
  btn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.blue },
  btnGhost: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  muted: { color: colors.muted },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line },
});
