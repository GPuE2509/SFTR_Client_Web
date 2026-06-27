import React, { useState } from 'react';
import { Key, Plus, Trash2 } from 'lucide-react';

const initialClients = [
  { id: 'C-001', name: 'Web Client', clientId: 'web-frontend', redirectUri: 'https://localhost:5173/auth/callback' },
];

export default function OAuthClients() {
  const [clients, setClients] = useState(initialClients);
  const [name, setName] = useState('');
  const [redirect, setRedirect] = useState('');

  const add = () => {
    if (!name || !redirect) return alert("Enter a name and redirect URI");
    const id = `C-${Date.now()}`;
    setClients(prev => [{ id, name, clientId: name.toLowerCase().replace(/\s+/g, '-'), redirectUri: redirect }, ...prev]);
    setName(''); setRedirect('');
  };

  const remove = (id) => setClients(prev => prev.filter(c => c.id !== id));

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Manage OAuth Clients</h1>
        <p>OAuth client management interface (FE-only). Secrets are not saved on the client.</p>
      </div>

      <div className="card p-6" style={{ maxWidth: 900 }}>
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <input className="input" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Redirect URI" value={redirect} onChange={(e) => setRedirect(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={add}><Plus size={12} /> Add client</button>
          </div>
        </div>

        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client ID</th>
                <th>Redirect URI</th>
                <th>Operation</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.clientId}</td>
                  <td>{c.redirectUri}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => remove(c.id)}><Trash2 size={12} /> Erase</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
