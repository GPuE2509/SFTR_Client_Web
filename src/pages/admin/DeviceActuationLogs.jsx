import React, { useState } from 'react';
import { History, Zap, CheckCircle } from 'lucide-react';

const initialLogs = [
  { id: 'L-001', deviceId: 'IOT-QU12-001', command: 'reboot', user: 'admin', time: '14:10', result: 'ok' },
  { id: 'L-002', deviceId: 'IOT-HM-047', command: 'calibrate', user: 'ops1', time: '13:58', result: 'queued' },
  { id: 'L-003', deviceId: 'IOT-BT-034', command: 'ping', user: 'admin', time: '12:20', result: 'timeout' },
];

export default function DeviceActuationLogs() {
  const [logs, setLogs] = useState(initialLogs);

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Device command log</h1>
        <p>List of commands sent to device (FE-only)</p>
      </div>

      <div className="card table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Device</th>
              <th>Command</th>
              <th>Sender</th>
              <th>Time</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{l.id}</td>
                <td>{l.deviceId}</td>
                <td>{l.command}</td>
                <td>{l.user}</td>
                <td>{l.time}</td>
                <td><span className={`badge ${l.result === 'ok' ? 'badge-green' : l.result === 'queued' ? 'badge-yellow' : 'badge-red'}`}>{l.result}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
