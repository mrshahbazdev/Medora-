import { useState } from 'react';
import { uid } from '../lib/model.js';
import { payslipHtml } from '../lib/docsHtml.js';

export default function StaffPanel({ store, update }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));

  const staff = store.staff || [];
  const attendance = store.attendance || [];
  const payroll = store.payroll || [];
  const mark = (staffId, present) => update(s => {
    s.attendance = s.attendance || [];
    const ex = s.attendance.find(a => a.staffId === staffId && a.date === date);
    const timeIn = new Date().toTimeString().slice(0, 5);
    if (ex) { ex.present = present; if (present && !ex.timeIn) ex.timeIn = timeIn; }
    else s.attendance.push({ id: uid(), staffId, date, present, timeIn: present ? timeIn : '' });
  });
  const statusOf = (id) => attendance.find(a => a.staffId === id && a.date === date)?.present;
  const timeOf = (id) => attendance.find(a => a.staffId === id && a.date === date)?.timeIn;

  return (
    <div className="panel">
      <h2 className="ptitle">Staff</h2>
      <div className="frow">
        <input className="in" id="staffname" placeholder="Name" />
        <input className="in" id="staffrole" placeholder="Role (receptionist / nurse / compounder)" />
        <button className="btn" onClick={() => {
          const n = document.getElementById('staffname').value.trim();
          const r = document.getElementById('staffrole').value.trim();
          if (!n) return;
          update(s => { s.staff = s.staff || []; s.staff.push({ id: uid(), name: n, role: r, phone: '' }); });
          document.getElementById('staffname').value = ''; document.getElementById('staffrole').value = '';
        }}>+ Staff</button>
      </div>
      {staff.length === 0 && <p className="muted">Add receptionist, nurse, dispenser etc. to track attendance and payroll.</p>}
      <table className="grid">
        <tbody>
          {staff.map(m => (
            <tr key={m.id}>
              <td><input className="in" value={m.name} onChange={e => update(s => { s.staff.find(x => x.id === m.id).name = e.target.value; })} /></td>
              <td><input className="in" value={m.role} onChange={e => update(s => { s.staff.find(x => x.id === m.id).role = e.target.value; })} /></td>
              <td><input className="in" placeholder="Phone" value={m.phone || ''} onChange={e => update(s => { s.staff.find(x => x.id === m.id).phone = e.target.value; })} /></td>
              <td><button className="icon" onClick={() => update(s => { s.staff = s.staff.filter(x => x.id !== m.id); s.attendance = (s.attendance || []).filter(a => a.staffId !== m.id); })} aria-label="Remove">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {staff.length > 0 && (
        <>
          <h2 className="ptitle">Attendance — <input type="date" className="in" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} /></h2>
          <table className="grid">
            <thead><tr><th>Staff</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {staff.map(m => {
                const st = statusOf(m.id);
                return (
                  <tr key={m.id}>
                    <td><b>{m.name}</b></td><td>{m.role}</td>
                    <td>{st === undefined ? <span className="muted">Not marked</span> : st ? <span className="badge ok">Present</span> : <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Absent</span>}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn small ghost" onClick={() => mark(m.id, true)}>✓ Present</button>
                      <button className="btn small ghost" onClick={() => mark(m.id, false)}>✗ Absent</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="ptitle">Payroll — <input type="month" className="in" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} /></h2>
          <table className="grid">
            <thead><tr><th>Staff</th><th>Days present this month</th><th>Salary paid</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {staff.map(m => {
                const days = attendance.filter(a => a.staffId === m.id && a.date.startsWith(month) && a.present).length;
                const pay = payroll.find(p => p.staffId === m.id && p.month === month);
                return (
                  <tr key={m.id}>
                    <td><b>{m.name}</b></td>
                    <td>{days}</td>
                    <td>{pay ? `Rs ${pay.amount}` : <span className="muted">—</span>}</td>
                    <td><input className="in" type="number" style={{ width: 110 }} placeholder="Rs" defaultValue={pay?.amount || ''}
                      onBlur={e => {
                        const amt = Number(e.target.value) || 0;
                        update(s => {
                          s.payroll = s.payroll || [];
                          const ex = s.payroll.find(p => p.staffId === m.id && p.month === month);
                          if (ex) ex.amount = amt; else if (amt) s.payroll.push({ id: uid(), staffId: m.id, month, amount: amt, note: '' });
                        });
                      }} /></td>
                    <td>
                      {pay && <button className="icon" title="Print salary slip" onClick={() => window.api.export.print({ html: payslipHtml({ store, staff: m, month, salary: pay.amount, present: days }) })}>🧾</button>}
                      {pay && <button className="icon" onClick={() => update(s => s.payroll = s.payroll.filter(p => p.id !== pay.id))} aria-label="Clear">✕</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
