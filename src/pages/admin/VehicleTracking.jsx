import React, { useState } from 'react';
import { Truck, Clock, MapPin, Zap, User, Search } from 'lucide-react';

const initialVehicles = [
  { id: 'V-101', name: "Rescue vehicle 1", status: 'enroute', speed: '48 km/h', lastSeen: '14:36', driver: "Nguyen Van A" },
  { id: 'V-102', name: "Rescue vehicle 2", status: 'idle', speed: '0 km/h', lastSeen: '14:10', driver: "Tran Thi B" },
  { id: 'V-103', name: "Rescue vehicle 3", status: 'on_scene', speed: '6 km/h', lastSeen: '14:22', driver: "Le Minh C" },
];

export default function VehicleTracking() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');

  const filtered = vehicles.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || v.id.toLowerCase().includes(query.toLowerCase()) || v.driver.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Monitor rescue vehicles</h1>
        <p>List of rescue vehicles (interface — realtime backend needs to be integrated later)</p>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="input-group" style={{ maxWidth: 420 }}>
          <Search size={14} className="input-icon" />
          <input className="input" placeholder="Search by ID, name or driver" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="card table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Speed</th>
              <th>Last Seen</th>
              <th>Operation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{v.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.id}</span></div>
                </td>
                <td>{v.driver}</td>
                <td>
                  <span className={`badge ${v.status === 'enroute' ? 'badge-yellow' : v.status === 'on_scene' ? 'badge-orange' : 'badge-green'}`}>{v.status}</span>
                </td>
                <td>{v.speed}</td>
                <td>{v.lastSeen}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => alert(`Show details ${v.id} (simulation)`)}>Detail</button>
                    <button className="btn btn-primary btn-sm" onClick={() => alert(`Call the driver ${v.driver} (simulation)`)}>Call</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
