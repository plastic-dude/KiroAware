import type { UserReport } from '../types/dashboard';

interface VerificationPanelProps {
  readonly reports: readonly UserReport[];
}

export default function VerificationPanel({ reports }: VerificationPanelProps): React.JSX.Element {
  const verified = reports.filter((r) => r.verification.status === 'verified');
  const inconclusive = reports.filter((r) => r.verification.status === 'inconclusive');
  const rejected = reports.filter((r) => r.verification.status === 'rejected');

  const avgConfidence = reports.length > 0
    ? Math.round((reports.reduce((s, r) => s + r.verification.confidence, 0) / reports.length) * 100)
    : 0;

  return (
    <div className="panel">
      <h2>✓ Verification Center</h2>
      <p className="panel-desc">
        Where AI cross-references your subjective reports against objective system data.
        Every claim has evidence. Every verification has a confidence score.
      </p>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{verified.length}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{inconclusive.length}</div>
          <div className="stat-label">Inconclusive</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{rejected.length}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgConfidence}%</div>
          <div className="stat-label">Avg Confidence</div>
        </div>
      </div>

      <div className="card">
        <h3>Verification Flow</h3>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-num">1</div>
            <div className="step-content">
              <strong>User Reports</strong>
              <p>&ldquo;My network feels slow&rdquo; — subjective, no sensor</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <div className="step-content">
              <strong>AI Auto-Detects</strong>
              <p>Captures current system snapshot as ground truth</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <div className="step-content">
              <strong>Cross-Reference</strong>
              <p>Compares current vs historical baseline</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <div className="step-content">
              <strong>Confidence Score</strong>
              <p>0.0–1.0 based on evidence strength</p>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">5</div>
            <div className="step-content">
              <strong>Temporal Flag</strong>
              <p>temporary / recurring / persistent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">Detailed Verifications</div>
      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <p>No verifications yet. Submit a report to see the engine work.</p>
        </div>
      ) : (
        reports.map((r) => (
          <div key={r.reportId} className="report-card">
            <div className="vd-header">
              <span className="vd-type">{r.stateType}</span>
              <div className="confidence-bar">
                <div className="confidence-bar-bg">
                  <div
                    className="confidence-bar-fill"
                    style={{ width: `${r.verification.confidence * 100}%` }}
                  />
                </div>
                <span className="confidence-value">
                  {Math.round(r.verification.confidence * 100)}%
                </span>
              </div>
            </div>
            <p className="vd-desc">&ldquo;{r.description}&rdquo;</p>
            <div className="vd-evidence">
              {r.verification.evidence.map((e, i) => (
                <span key={i} className="evidence-tag">{e}</span>
              ))}
            </div>
            <div className="vd-meta">
              <span className={`badge ${r.verification.status}`}>{r.verification.status}</span>
              <span className={`badge temporal ${r.temporal.flag}`}>{r.temporal.flag}</span>
              <span>Recurrence: {r.temporal.recurrenceCount}x</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
