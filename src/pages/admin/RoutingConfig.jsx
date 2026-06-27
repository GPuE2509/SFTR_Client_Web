import React, { useState } from 'react';
import { MapPin, Layers, Settings, Zap } from 'lucide-react';

export default function RoutingConfig() {
  const [provider, setProvider] = useState('osrm');
  const [avoidFlood, setAvoidFlood] = useState(true);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState(15);

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Configuring Routing/Navigation</h1>
        <p>Select route provider and customize flood avoidance policy (FE-only)</p>
      </div>

      <div className="card p-6" style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Routing service provider</label>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="osrm">OSRM (self-hosted)</option>
            <option value="graphhopper">GraphHopper</option>
            <option value="google">Google Directions API</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={avoidFlood} onChange={(e) => setAvoidFlood(e.target.checked)} />
            <span style={{ fontSize: '0.9rem' }}>Avoid flooded areas when calculating routes</span>
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Maximum allowable deviation (minutes)</label>
          <input type="range" min={1} max={45} value={maxDetourMinutes} onChange={(e) => setMaxDetourMinutes(Number(e.target.value))} />
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{maxDetourMinutes} minute</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Note: This is the interface configuration; Integrate backend routing for practical operation.</div>
          <button className="btn btn-primary btn-sm" onClick={() => alert("Save routing configuration (simulation)")}>Save</button>
        </div>
      </div>
    </div>
  );
}
