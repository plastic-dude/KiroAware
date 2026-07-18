import type { SystemSnapshot } from '../types/dashboard';

interface DevicePanelProps {
  readonly snapshot: SystemSnapshot;
}

interface PatternItemProps {
  readonly label: string;
  readonly value: string;
}

function PatternItem({ label, value }: PatternItemProps): React.JSX.Element {
  return (
    <div className="pattern-item">
      <span className="pattern-value">{value}</span>
      <span className="pattern-label">{label}</span>
    </div>
  );
}

export default function DevicePanel({ snapshot }: DevicePanelProps): React.JSX.Element {
  const ramGB = Math.round(snapshot.memory.totalBytes / 1024 / 1024 / 1024);
  const hasSSD = snapshot.disk.some((d) => d.mount === '/');

  return (
    <div className="panel">
      <h2>⌘ Device Fingerprint</h2>
      <p className="panel-desc">
        AiAware builds a hardware signature for each device. This fingerprint lets AI
        recognize the same machine across sessions and learn its unique behavior patterns.
      </p>

      <div className="card">
        <div className="detail-row">
          <span>Fingerprint ID</span>
          <span>a7f3e2d9b1c8</span>
        </div>
        <div className="detail-row">
          <span>First Seen</span>
          <span>2026-07-10</span>
        </div>
        <div className="detail-row">
          <span>Last Seen</span>
          <span>Just now</span>
        </div>
        <div className="detail-row">
          <span>Total Sessions</span>
          <span>42</span>
        </div>
      </div>

      <div className="card">
        <h3>Hardware Profile</h3>
        <div className="detail-row">
          <span>CPU</span>
          <span>{snapshot.cpu.brand}</span>
        </div>
        <div className="detail-row">
          <span>Cores</span>
          <span>{snapshot.cpu.cores}</span>
        </div>
        <div className="detail-row">
          <span>RAM</span>
          <span>{ramGB} GB</span>
        </div>
        <div className="detail-row">
          <span>Storage</span>
          <span>{hasSSD ? 'SSD' : 'HDD'}</span>
        </div>
        <div className="detail-row">
          <span>Architecture</span>
          <span>{snapshot.os.arch}</span>
        </div>
      </div>

      <div className="card">
        <h3>Learned Patterns</h3>
        <div className="pattern-grid">
          <PatternItem label="Avg Session" value="95m" />
          <PatternItem label="Peak Memory" value="78%" />
          <PatternItem label="Typical CPU" value="32%" />
          <PatternItem label="Network Issues" value="3x" />
          <PatternItem label="Thermal Issues" value="4x" />
        </div>
      </div>

      <div className="card">
        <h3>Session Timeline</h3>
        <div className="timeline">
          <div className="timeline-bar">
            <div
              className="timeline-segment"
              style={{ left: '0%', width: '15%', background: '#4ecdc4' }}
              title="Jul 10"
            />
            <div
              className="timeline-segment"
              style={{ left: '20%', width: '20%', background: '#4ecdc4' }}
              title="Jul 12"
            />
            <div
              className="timeline-segment"
              style={{ left: '45%', width: '10%', background: '#ff6b6b' }}
              title="Jul 14 — Thermal Issue"
            />
            <div
              className="timeline-segment"
              style={{ left: '60%', width: '25%', background: '#4ecdc4' }}
              title="Jul 16"
            />
            <div
              className="timeline-segment"
              style={{ left: '88%', width: '12%', background: '#ffe66d' }}
              title="Jul 17 — Network Issue"
            />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4ecdc4', borderRadius: '2px', marginRight: '4px' }} />Normal</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ff6b6b', borderRadius: '2px', marginRight: '4px' }} />Thermal</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ffe66d', borderRadius: '2px', marginRight: '4px' }} />Network</span>
        </div>
      </div>
    </div>
  );
}
