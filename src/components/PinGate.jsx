import { useState } from 'react';

export default function PinGate({ store, onLogin }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const users = store.settings.users || [];
  const tryPin = (v) => {
    const u = users.find(x => x.pin === v);
    if (u) onLogin(u);
    else if (v.length >= 4) { setErr('Wrong PIN'); setPin(''); }
    else setErr('');
  };
  return (
    <div className="pingate">
      <div className="pinbox">
        <div className="pmark">✚</div>
        <div className="pname">{store.settings.clinicName || 'Medora'}</div>
        <div className="muted" style={{ marginBottom: 14 }}>Enter your PIN</div>
        <input className="in pin" type="password" inputMode="numeric" autoFocus value={pin}
          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setPin(v); tryPin(v); }} />
        {err && <div className="allergy" style={{ marginTop: 8 }}>{err}</div>}
        <div className="muted" style={{ marginTop: 12, fontSize: 11.5 }}>{users.map(u => u.name).join(' · ')}</div>
      </div>
    </div>
  );
}
