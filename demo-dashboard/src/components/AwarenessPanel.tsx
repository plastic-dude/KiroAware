import type { SystemSnapshot, UserReport } from '../types/dashboard';

interface AwarenessPanelProps {
  readonly snapshot: SystemSnapshot;
  readonly reports: readonly UserReport[];
}

interface Adaptation {
  readonly type: string;
  readonly constraint: string;
  readonly message: string;
  readonly confidence: number;
}

function buildAdaptations(snapshot: SystemSnapshot, reports: readonly UserReport[]): readonly Adaptation[] {
  const adaptations: Adaptation[] = [];

  if (snapshot.memory.usedPercent > 80) {
    adaptations.push({
      type: 'resource_constraint',
      constraint: 'high_memory_usage',
      message: `Memory is at ${snapshot.memory.usedPercent.toFixed(1)}%. Consider lightweight implementations, avoiding memory-heavy dependencies, and closing unused applications.`,
      confidence: Math.min(0.95, snapshot.memory.usedPercent / 100),
    });
  }

  if (snapshot.battery && !snapshot.battery.isCharging && snapshot.battery.percent < 25) {
    adaptations.push({
      type: 'power_constraint',
      constraint: 'critical_battery',
      message: `Battery at ${snapshot.battery.percent}% and not charging. Consider saving work and wrapping up your session soon.`,
      confidence: 0.95,
    });
  }

  if (snapshot.cpu.loadPercent > 80) {
    adaptations.push({
      type: 'performance_constraint',
      constraint: 'high_cpu_load',
      message: `CPU load is ${snapshot.cpu.loadPercent.toFixed(1)}%. Avoid heavy compilation, large test suites, or CPU-intensive operations right now.`,
      confidence: Math.min(0.9, snapshot.cpu.loadPercent / 100),
    });
  }

  const maxDisk = Math.max(...snapshot.disk.map((d) => d.usePercent), 0);
  if (maxDisk > 85) {
    adaptations.push({
      type: 'storage_constraint',
      constraint: 'low_disk_space',
      message: `Disk usage is at ${maxDisk.toFixed(1)}% on one or more volumes. Consider cleaning up before generating large build artifacts.`,
      confidence: Math.min(0.9, maxDisk / 100),
    });
  }

  const recurringNetwork = reports.find(
    (r) => r.stateType === 'network_performance' && r.temporal.flag === 'recurring'
  );
  if (recurringNetwork) {
    adaptations.push({
      type: 'predictive',
      constraint: 'recurring_network_issues',
      message: 'This device has a history of network performance issues. AI will proactively monitor bandwidth and suggest offline-friendly workflows.',
      confidence: 0.78,
    });
  }

  const recurringThermal = reports.find(
    (r) => r.stateType === 'thermal_issue' && r.temporal.flag === 'recurring'
  );
  if (recurringThermal) {
    adaptations.push({
      type: 'predictive',
      constraint: 'recurring_thermal_issues',
      message: 'This device often overheats during intensive tasks. AI will suggest staggered builds and cooling breaks.',
      confidence: 0.82,
    });
  }

  return adaptations;
}

export default function AwarenessPanel({ snapshot, reports }: AwarenessPanelProps): React.JSX.Element {
  const adaptations = buildAdaptations(snapshot, reports);
  const activeReports = reports.filter((r) => r.verification.status === 'verified');

  return (
    <div className="panel">
      <h2>◐ AI's Awareness</h2>
      <p className="panel-desc">
        Everything AI currently knows about your system, your reports, and how it is adapting
        its behavior to serve you better on this device.
      </p>

      <div className="card">
        <h3>Current System State</h3>
        <div className="grid-2">
          <div className="detail-row">
            <span>CPU Load</span>
            <span>{snapshot.cpu.loadPercent.toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span>Memory Used</span>
            <span>{snapshot.memory.usedPercent.toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span>Battery</span>
            <span>
              {snapshot.battery
                ? `${snapshot.battery.percent}% ${snapshot.battery.isCharging ? '(charging)' : '(discharging)'}`
                : 'No battery'}
            </span>
          </div>
          <div className="detail-row">
            <span>Disk /</span>
            <span>{snapshot.disk[0]?.usePercent.toFixed(1) ?? 'N/A'}%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Active Verified Reports</h3>
        {activeReports.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <div className="empty-state-icon">◉</div>
            <p>No active verified reports. Everything looks stable.</p>
          </div>
        ) : (
          activeReports.map((r) => (
            <div key={r.reportId} className="adaptation-card">
              <div className="adaptation-type">{r.stateType}</div>
              <div className="adaptation-message">
                &ldquo;{r.description}&rdquo; — Verified at {Math.round(r.verification.confidence * 100)}% confidence.
                Flagged as <span className={`badge temporal ${r.temporal.flag}`}>{r.temporal.flag}</span>.
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3>Recommended Adaptations</h3>
        {adaptations.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <div className="empty-state-icon">◐</div>
            <p>No adaptations needed. Your system is running optimally.</p>
          </div>
        ) : (
          adaptations.map((a, i) => (
            <div key={i} className="adaptation-card">
              <div className="adaptation-type">{a.type}</div>
              <div className="adaptation-message">{a.message}</div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Confidence: {Math.round(a.confidence * 100)}%
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3>Device Context</h3>
        <div className="detail-row">
          <span>Current Device</span>
          <span>MacBook Pro (M1, 16GB)</span>
        </div>
        <div className="detail-row">
          <span>Known Devices</span>
          <span>2</span>
        </div>
        <div className="detail-row">
          <span>Cross-Device Patterns</span>
          <span>3 learned</span>
        </div>
        <div className="detail-row">
          <span>Session History</span>
          <span>42 sessions tracked</span>
        </div>
      </div>
    </div>
  );
}
