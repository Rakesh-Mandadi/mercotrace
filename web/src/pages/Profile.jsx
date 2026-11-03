import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { isEmail, isMobile, validateNewPassword } from '../../../shared/validators.js';

function Msg({ m }) {
  return m ? <p className={m.ok ? 'ok' : 'error'} role="status">{m.text}</p> : null;
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    username: user.username, fullName: user.fullName || '', email: user.email || '',
    mobile: user.mobile || '', address: user.address || '',
  });
  const [msg, setMsg] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!f.username.trim()) return setMsg({ text: 'Username is required' });
    if (f.email && !isEmail(f.email)) return setMsg({ text: 'Enter a valid email address' });
    if (f.mobile && !isMobile(f.mobile)) return setMsg({ text: 'Enter a valid 10-digit mobile number' });
    try {
      setUser(await api.updateProfile(f));
      setMsg({ ok: true, text: 'Profile saved' });
    } catch (err) { setMsg({ text: err.message }); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const problem = validateNewPassword(pw.next, pw.confirm);
    if (problem) return setPwMsg({ text: problem });
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ ok: true, text: 'Password updated' });
    } catch (err) { setPwMsg({ text: err.message }); }
  };

  return (
    <>
      <h2 className="page-title">Profile</h2>
      <form className="card form-grid" onSubmit={saveProfile}>
        <label>Username<input value={f.username} onChange={set('username')} /></label>
        <label>Full name<input value={f.fullName} onChange={set('fullName')} /></label>
        <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
        <label>Mobile number<input type="tel" maxLength={10} value={f.mobile} onChange={set('mobile')} /></label>
        <label className="full">Address<input value={f.address} onChange={set('address')} /></label>
        <Msg m={msg} />
        <div className="actions full"><button className="primary">Save changes</button></div>
      </form>

      <h3 className="section-title">Change password</h3>
      <form className="card form-grid" onSubmit={savePassword}>
        <label className="full">Current password<input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
        <label>New password<input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        <Msg m={pwMsg} />
        <div className="actions full"><button className="primary">Update password</button></div>
      </form>
    </>
  );
}
