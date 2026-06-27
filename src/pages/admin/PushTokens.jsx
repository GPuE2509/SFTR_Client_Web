import React, { useState } from 'react';
import { Smartphone, Trash2 } from 'lucide-react';

const initialTokens = [
  { id: 'TKN-001', user: "Nguyen Van An", platform: 'Android', created: '2026-03-10', lastUsed: '14:30' },
  { id: 'TKN-002', user: "Tran Thi Binh", platform: 'iOS', created: '2026-04-02', lastUsed: '13:58' },
  { id: 'TKN-003', user: "Le Minh Chau", platform: 'Web', created: '2026-05-01', lastUsed: '12:20' },
];

export default function PushTokens() {
  const [tokens, setTokens] = useState(initialTokens);

  const revoke = (id) => {
    if (!confirm("Confirmed token revocation?")) return;
    setTokens(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Manage Push Tokens</h1>
        <p>List of available push tokens (FE-only)</p>
      </div>

      <div className="card table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Foundation</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Operation</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{t.id}</td>
                <td>{t.user}</td>
                <td>{t.platform}</td>
                <td>{t.created}</td>
                <td>{t.lastUsed}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => revoke(t.id)}><Trash2 size={12} /> Recall</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
