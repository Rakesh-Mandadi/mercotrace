import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Button, Field, Message, colors, s } from '../ui';
import { isEmail, isMobile, isOtp } from '../../../shared/validators';

const RESEND_SECONDS = 30;

export default function LoginScreen() {
  const { login, loginWithOtp } = useAuth();
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMode = (m) => { setMode(m); setMsg(null); setOtp(''); setOtpSent(false); };

  const run = async (fn) => {
    setBusy(true); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: e.message }); }
    setBusy(false);
  };

  const sendOtp = () => {
    if (!isMobile(mobile)) return setMsg({ text: 'Enter a valid 10-digit mobile number' });
    run(async () => {
      await api.sendOtp(mobile.trim());
      setOtpSent(true); setOtp(''); setCooldown(RESEND_SECONDS);
      setMsg({ ok: true, text: `If ${mobile} is registered, a 6-digit code was sent to it.` });
    });
  };

  const submit = () => {
    if (mode === 'email') {
      if (!isEmail(email)) return setMsg({ text: 'Enter a valid email address' });
      if (!password) return setMsg({ text: 'Enter your password' });
      return run(() => login(email.trim(), password));
    }
    if (!otpSent) return sendOtp();
    if (!isOtp(otp)) return setMsg({ text: 'Enter the 6-digit code' });
    run(() => loginWithOtp(mobile.trim(), otp.trim()));
  };

  return (
    <KeyboardAvoidingView style={[s.screen, { backgroundColor: colors.blue }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={[s.card, { padding: 22 }]}>
          <Text style={[s.title, { marginBottom: 16 }]}>Sign in to Mercotrace</Text>

          <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 10, padding: 4, marginBottom: 16 }}>
            {[['email', 'Email'], ['mobile', 'Mobile number']].map(([k, label]) => (
              <Pressable key={k} onPress={() => switchMode(k)}
                style={{ flex: 1, padding: 9, borderRadius: 8, alignItems: 'center', backgroundColor: mode === k ? '#fff' : 'transparent' }}>
                <Text style={{ fontWeight: mode === k ? '700' : '400', color: mode === k ? colors.ink : colors.muted }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'email' ? (
            <>
              <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            </>
          ) : (
            <>
              <Field label="Mobile number" value={mobile} onChangeText={(v) => setMobile(v.replace(/\D/g, ''))}
                keyboardType="number-pad" maxLength={10} editable={!otpSent} />
              {otpSent && (
                <>
                  <Field label="6-digit code" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
                    keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" autoFocus />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Pressable onPress={() => { setOtpSent(false); setOtp(''); setMsg(null); }}>
                      <Text style={{ color: colors.blue }}>Change number</Text>
                    </Pressable>
                    <Pressable disabled={cooldown > 0 || busy} onPress={sendOtp}>
                      <Text style={{ color: cooldown > 0 ? colors.muted : colors.blue }}>
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}

          <Message m={msg} />
          <Button
            title={busy ? 'Please wait…' : mode === 'email' ? 'Sign in' : otpSent ? 'Verify and sign in' : 'Send code'}
            onPress={submit} disabled={busy} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}