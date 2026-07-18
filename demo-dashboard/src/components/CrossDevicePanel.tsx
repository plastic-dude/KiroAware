import { useState } from 'react';

interface DeviceProfile {
  readonly id: string;
  readonly name: string;
  readonly cpu: string;
  readonly ramGB: number;
  readonly sessions: number;
  readonly memoryPressure: 'never' | 'low' | 'medium' | 'high';
  readonly batteryThreshold: number | null;
  readonly complexity: 'low' | 'medium' | 'high';
  readonly sessionLength: number;
  readonly networkIssues: 'never' | 'low' | 'medium' | 'high';
  readonly thermalIssues: 'never' | 'low' | 'medium' | 'high';
}

const DEVICES: readonly DeviceProfile[] = [
  {
    id: 'a7f3e2d9b1c8',
    name: 'MacBook Pro (M1)',
    cpu: 'Apple M1 Pro',
    ramGB: 16,
    sessions: 42,
    memoryPressure: 'high',
    batteryThreshold: 30,
    complexity: 'low',
    sessionLength: 90,
    networkIssues: 'medium',
    thermalIssues: 'medium',
  },
  {
    id: 'b8c4f1e2a3d5',
    name: 'Ryzen Workstation',
    cpu: 'AMD Ryzen 9 5900X',
    ramGB: 32,
    sessions: 18,
    memoryPressure: 'never',
    batteryThreshold: null,
    complexity: 'high',
    sessionLength: 240,
    networkIssues: 'low',
    thermalIssues: 'low',
  },
] as const;

const FREQUENCY_COLORS: Record<string, string> = {
  never: '#2ed573',
  low: '#4ecdc4',
  medium: '#ffa502',
  high: '#ff4757',
};

const COMPLEXITY_COLORS: Record<string, string> = {
  low: '#4ecdc4',
  medium: '#ffa502',
  high: '#ff4757',
};

export default function CrossDevicePanel(): React.JSX.Element {
  const [selectedDevice, setSelectedDevice] = useState<string>(DEVICES[0]!.id);
  const current = DEVICES.find((d) => d.id === selectedDevice);

  return (
    <div className="panel">
      <h2>⇄ Cross-Device Matrix</h2>
      <p className="panel-desc">
        AiAware learns your patterns across every device you use. When you open AI on
        any machine, it already knows what to expect and how to adapt.
      </p>

      <div className="card">
        <h3>Your Devices</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDevice(d.id)}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: `1px solid ${selectedDevice === d.id ? '#00d4aa' : '#1a1a24'}`,
                background: selectedDevice === d.id ? '#00d4aa22' : '#111118',
                color: selectedDevice === d.id ? '#00d4aa' : '#a0a0b8',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 150ms ease',
              }}
            >
              {d.name}
            </button>
          ))}
        </div>

        {current && (
          <div className="grid-2">
            <div>
              <div className="detail-row">
                <span>Device</span>
                <span>{current.name}</span>
              </div>
              <div className="detail-row">
                <span>CPU</span>
                <span>{current.cpu}</span>
              </div>
              <div className="detail-row">
                <span>RAM</span>
                <span>{current.ramGB} GB</span>
              </div>
              <div className="detail-row">
                <span>Sessions</span>
                <span>{current.sessions}</span>
              </div>
            </div>
            <div>
              <div className="detail-row">
                <span>Memory Pressure</span>
                <span style={{ color: FREQUENCY_COLORS[current.memoryPressure] }}>
                  {current.memoryPressure}
                </span>
              </div>
              <div className="detail-row">
                <span>Battery Anxiety</span>
                <span>
                  {current.batteryThreshold !== null ? `${current.batteryThreshold}%` : 'N/A (desktop)'}
                </span>
              </div>
              <div className="detail-row">
                <span>Preferred Complexity</span>
                <span style={{ color: COMPLEXITY_COLORS[current.complexity] }}>
                  {current.complexity}
                </span>
              </div>
              <div className="detail-row">
                <span>Typical Session</span>
                <span>{current.sessionLength} min</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Cross-Device Insights</h3>
        <div className="adaptation-card">
          <div className="adaptation-type">Device Comparison</div>
          <div className="adaptation-message">
            You typically use more powerful setups (Ryzen Workstation, 32GB RAM) for heavy work.
            This device (MacBook Pro, 16GB) is configured for lighter tasks. AI will suggest
            lightweight implementations and avoid memory-heavy dependencies on this machine.
          </div>
        </div>
        <div className="adaptation-card">
          <div className="adaptation-type">Pattern Transfer</div>
          <div className="adaptation-message">
            Your break preference (every 45 minutes) is consistent across devices. AI will
            remind you to take breaks regardless of which machine you are on.
          </div>
        </div>
        <div className="adaptation-card">
          <div className="adaptation-type">Predictive Adaptation</div>
          <div className="adaptation-message">
            Based on 4 recurring thermal issues on your MacBook Pro, AI will proactively
            warn you about CPU-intensive operations when temperature is elevated.
          </div>
        </div>
      </div>
    </div>
  );
}
