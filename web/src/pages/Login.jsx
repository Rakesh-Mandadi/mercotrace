import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import { isEmail, isMobile, isOtp } from '../../../shared/validators.js';

const RESEND_SECONDS = 30;

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMode = (m) => {
    setMode(m); setError(''); setInfo(''); setOtp(''); setOtpSent(false);
  };

  const run = async (fn) => {
    setBusy(true); setError(''); setInfo('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const sendOtp = () => {
    if (!isMobile(mobile)) return setError('Enter a valid 10-digit mobile number');
    run(async () => {
      await api.sendOtp(mobile.trim());
      setOtpSent(true); setOtp(''); setCooldown(RESEND_SECONDS);
      setInfo(`If ${mobile} is registered, a 6-digit code was sent to it.`);
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'email') {
      if (!isEmail(email)) return setError('Enter a valid email address');
      if (!password) return setError('Enter your password');
      return run(async () => { await login(email.trim(), password); nav('/dashboard'); });
    }
    if (!otpSent) return sendOtp();
    if (!isOtp(otp)) return setError('Enter the 6-digit code');
    run(async () => { await loginWithOtp(mobile.trim(), otp.trim()); nav('/dashboard'); });
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Sign in to Mercotrace</h1>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'email'} className={mode === 'email' ? 'on' : ''} onClick={() => switchMode('email')}>Email</button>
          <button type="button" role="tab" aria-selected={mode === 'mobile'} className={mode === 'mobile' ? 'on' : ''} onClick={() => switchMode('mobile')}>Mobile number</button>
        </div>

        {mode === 'email' ? (
          <>
            <label>Email address
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>Password
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label>Mobile number
              <input type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" disabled={otpSent}
                value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
            </label>
            {otpSent && (
              <label>6-digit code
                <input inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              </label>
            )}
            {otpSent && (
              <div className="otp-links">
                <button type="button" className="link-btn" onClick={() => { setOtpSent(false); setOtp(''); setInfo(''); setError(''); }}>
                  Change number
                </button>
                <button type="button" className="link-btn" disabled={cooldown > 0 || busy} onClick={sendOtp}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            )}
          </>
        )}

        {info && <p className="ok" role="status">{info}</p>}
        {error && <p className="error" role="alert">{error}</p>}

        <button className="primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'email' ? 'Sign in' : otpSent ? 'Verify and sign in' : 'Send code'}
        </button>
      </form>
    </div>
  );
}