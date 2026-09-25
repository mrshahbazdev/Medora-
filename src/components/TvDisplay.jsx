import { useEffect, useRef, useState } from 'react';

// Waiting-room TV board: open on a second screen.
// Reads the same saved store file every 3s, so it follows whatever the reception desk does.
export default function TvDisplay() {
  const [store, setStore] = useState(null);
  const lastServe = useRef('');
  useEffect(() => {
    const load = () => window.api.store.load().then(d => {
      const ok = d && Array.isArray(d.patients) ? d : null;
      if (ok) {
        const today = new Date().toISOString().slice(0, 10);
        const serve = (ok.queue || []).filter(q => q.at === today && (q.status === 'in' || q.status === 'in-progress' || q.status === 'called')).map(q => q.tokenNo).join(',');
        if (lastServe.current && serve !== lastServe.current) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination); o.frequency.value = 880;
            g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o.start(); o.stop(ctx.currentTime + 0.6);
          } catch (e) {}
        }
        lastServe.current = serve;
      }
      setStore(ok);
    }).catch(() => {});
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);
  if (!store) return <div className="tvroot"><div className="tvbrand">Medora</div><div className="tvmut">Waiting for data…</div></div>;

  const today = new Date().toISOString().slice(0, 10);
  const queue = (store.queue || []).filter(q => q.at === today && q.status !== 'done').sort((a, b) => (a.tokenNo || 0) - (b.tokenNo || 0));
  const serving = queue.filter(q => q.status === 'in' || q.status === 'in-progress' || q.status === 'called');
  const nextUp = queue.filter(q => q.status === 'waiting');
  const p = (id) => store.patients.find(x => x.id === id);

  return (
    <div className="tvroot">
      <div className="tvtop">
        <div className="tvbrand">{store.settings.clinicName || 'Clinic'}</div>
        <div className="tvtime">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div className="tvgrid">
        <div className="tvcol tvnow">
          <div className="tvhead">NOW SERVING</div>
          {serving.length === 0 && nextUp.length === 0 && <div className="tvmut">No tokens yet</div>}
          {serving.map(q => (
            <div key={q.id} className="tvserve">
              <div className="tvtoken">{q.tokenNo}</div>
              <div className="tvroom">{q.room || '—'}</div>
              <div className="tvname">{p(q.patientId)?.name || ''}</div>
            </div>
          ))}
        </div>
        <div className="tvcol">
          <div className="tvhead">UP NEXT</div>
          {nextUp.slice(0, 8).map(q => (
            <div key={q.id} className="tvnext">
              <span className="tvnum">{q.tokenNo}</span>
              <span className="tvname">{p(q.patientId)?.name || ''}</span>
              <span className="tvroom small">{q.room}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
