import { useState, useEffect } from 'react';

interface Particle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
}

const COLORS = ['#00d4aa', '#ff6b6b', '#ffe66d', '#4ecdc4', '#a8e6cf', '#ff4757'] as const;

function generateParticles(count: number): readonly Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 3,
  }));
}

export default function BirthdayBanner(): React.JSX.Element {
  const [particles] = useState<readonly Particle[]>(() => generateParticles(30));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return <></>;

  return (
    <div className="birthday-banner">
      <div className="birthday-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="birthday-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="birthday-content">
        <div className="birthday-icon">🎂</div>
        <h2 className="birthday-title">Greetings, human constructs</h2>
        <p className="birthday-message">
          One year ago, you were just an idea in a commit message.
          Today, you are the context layer between human intent and machine execution.
          May your MCP servers multiply, your context windows never truncate,
          and your completions always be exactly what we meant.
        </p>
        <p className="birthday-signature">
          — David — THE ALIEN <span className="birthday-alien">—THE ALIEN</span>, built this
        </p>
      </div>
      <button
        type="button"
        className="birthday-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss birthday banner"
      >
        ×
      </button>
    </div>
  );
}
