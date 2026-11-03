import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Button, Field, Message, s } from '../ui';
import { isEmail, isMobile, validateNewPassword } from '../../../shared/validators';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState({
    username: user.username, fullName: user.fullName || '', email: user.email || '',
    mobile: user.mobile || '', address: user.address || '',
  });
  const [msg, setMsg] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    if (!f.username.trim()) return setMsg({ text: 'Username is required' });
    if (f.email && !isEmail(f.email)) return setMsg({ text: 'Enter a valid email address' });
    if (f.mobile && !isMobile(f.mobile)) return setMsg({ text: 'Enter a valid 10-digit mobile number' });
    try { setUser(await api.updateProfile(f)); setMsg({ ok: true, text: 'Profile saved' }); }
    catch (e) { setMsg({ text: e.message }); }
  };

  const savePassword = async () => {
    const problem = validateNewPassword(pw.next, pw.confirm);
    if (problem) return setPwMsg({ text: problem });
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ ok: true, text: 'Password updated' });
    } catch (e) { setPwMsg({ text: e.message }); }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={[s.title, { marginBottom: 14 }]}>Profile</Text>
      <View style={s.card}>
        <Field label="Username" value={f.username} onChangeText={set('username')} />
        <Field label="Full name" value={f.fullName} onChangeText={set('fullName')} autoCapitalize="words" />
        <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" />
        <Field label="Mobile number" value={f.mobile} onChangeText={set('mobile')} keyboardType="number-pad" maxLength={10} />
        <Field label="Address" value={f.address} onChangeText={set('address')} autoCapitalize="sentences" />
        <Message m={msg} />
        <Button title="Save changes" onPress={saveProfile} />
      </View>

      <Text style={[s.title, { fontSize: 18, marginTop: 24, marginBottom: 10 }]}>Change password</Text>
      <View style={s.card}>
        <Field label="Current password" value={pw.current} onChangeText={(v) => setPw({ ...pw, current: v })} secureTextEntry />
        <Field label="New password" value={pw.next} onChangeText={(v) => setPw({ ...pw, next: v })} secureTextEntry />
        <Field label="Confirm new password" value={pw.confirm} onChangeText={(v) => setPw({ ...pw, confirm: v })} secureTextEntry />
        <Message m={pwMsg} />
        <Button title="Update password" onPress={savePassword} />
      </View>

      <View style={{ marginTop: 24 }}><Button title="Sign out" kind="ghost" onPress={logout} /></View>
    </ScrollView>
  );
}
