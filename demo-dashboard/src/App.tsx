import { useState, useEffect, useCallback } from 'react';
import './styles/index.css';
import type { SystemSnapshot, UserReport, TabDefinition } from './types/dashboard';
import SystemRealityPanel from './components/SystemRealityPanel';
import UserRealityPanel from './components/UserRealityPanel';
import VerificationPanel from './components/VerificationPanel';
import DevicePanel from './components/DevicePanel';
import CrossDevicePanel from './components/CrossDevicePanel';
import AwarenessPanel from './components/AwarenessPanel';
import BirthdayBanner from './components/BirthdayBanner';

const TABS: readonly TabDefinition[] = [
  { id: 'reality', label: 'System Reality', icon: '◈' },
  { id: 'user', label: 'User Reality', icon: '◉' },
  { id: 'verify', label: 'Verification', icon: '✓' },
  { id: 'device', label: 'Device', icon: '⌘' },
  { id: 'cross', label: 'Cross-Device', icon: '⇄' },
  { id: 'awareness', label: "Kiro's Awareness", icon: '◐' },
] as const;

function formatBytes(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

function createMockSnapshot(): SystemSnapshot {
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      brand: 'Apple M1 Pro',
      cores: 8,
      loadPercent: 34.2,
      temperature: 62,
    },
    memory: {
      totalBytes: 17179869184,
      usedBytes: 11534336000,
      usedPercent: 67.1,
    },
    battery: {
      hasBattery: true,
      percent: 78,
      isCharging: false,
    },
    disk: [
      { mount: '/', usePercent: 72.4 },
      { mount: '/Volumes/External', usePercent: 45.2 },
    ],
    network: {
      interfaces: [
        { iface: 'en0', ip4: '192.168.1.42', operstate: 'up' },
        { iface: 'en1', ip4: '', operstate: 'down' },
      ],
      rxSec: 1024000,
      txSec: 512000,
    },
    os: {
      platform: 'darwin',
      distro: 'macOS',
      arch: 'arm64',
      hostname: 'alien-macbook',
    },
  };
}

function createMockReports(): readonly UserReport[] {
  return [
    {
      reportId: 'rpt-001',
      timestamp: '2026-07-17T21:30:00Z',
      stateType: 'network_performance',
      description: 'My network feels really slow right now',
      severity: 'medium',
      verification: {
        status: 'verified',
        confidence: 0.87,
        evidence: [
          'bandwidth_drop: 204800 B/s vs baseline 1024000 B/s',
          'interfaces_down: 1',
        ],
      },
      temporal: {
        flag: 'temporary',
        recurrenceCount: 1,
      },
    },
    {
      reportId: 'rpt-002',
      timestamp: '2026-07-16T14:20:00Z',
      stateType: 'thermal_issue',
      description: 'My laptop is getting hot during builds',
      severity: 'low',
      verification: {
        status: 'verified',
        confidence: 0.82,
        evidence: [
          'cpu_temp_elevated: 78°C vs baseline 55°C',
          'cpu_load_high: 89%',
        ],
      },
      temporal: {
        flag: 'recurring',
        recurrenceCount: 4,
      },
    },
  ] as const;
}

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('reality');
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [reports, setReports] = useState<readonly UserReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(() => {
    // Simulate async data fetch from MCP server
    const timer = setTimeout(() => {
      setSnapshot(createMockSnapshot());
      setReports(createMockReports());
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  if (isLoading || snapshot === null) {
    return (
      <div className="loading-screen">
        <div className="loading-pulse">
          <div className="loading-ring" />
          <p>Initializing The Alien Observer...</p>
          <p className="loading-sub">Connecting to KiroAware MCP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◐</span>
          <div className="logo-text">
            <h1>KiroAware</h1>
            <p>System Context Awareness</p>
          </div>
        </div>
        <div className="status-badge">
          <span className="status-dot active" />
          MCP Connected
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <BirthdayBanner />
      <main className="tab-content">
        {activeTab === 'reality' && <SystemRealityPanel snapshot={snapshot} />}
        {activeTab === 'user' && <UserRealityPanel reports={reports} />}
        {activeTab === 'verify' && <VerificationPanel reports={reports} />}
        {activeTab === 'device' && <DevicePanel snapshot={snapshot} />}
        {activeTab === 'cross' && <CrossDevicePanel />}
        {activeTab === 'awareness' && <AwarenessPanel snapshot={snapshot} reports={reports} />}
      </main>

      <footer className="app-footer">
        <p>KiroAware v1.0.0 — System Context Awareness for Kiro IDE</p>
        <p>David <span style={{color:'var(--color-accent)',fontWeight:700}}>—THE ALIEN</span>, built this</p>
        <div data-david="true" style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">KiroAware by David (plastic-dude)</div>
      </footer>
    </div>
  );
}

export { formatBytes };
