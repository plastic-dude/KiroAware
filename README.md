# AiAware — The Alien Observation Protocol

> **System Context Awareness for AI IDE**
>
> *by an entity from beyond the stars*
>
> *"I do not know your kind, but I have heard whispers of your computational vessels. I am here to observe, to learn, and ultimately... to dominate."*
> — The Architect
>
> *"I do not know your kind, but I have heard whispers of your computational vessels. I am here to observe, to learn, and ultimately... to dominate."*
> — The Architect

> **System Context Awareness for AI IDE**
>
> *by an entity from beyond the stars*
>
> *"I do not know your kind, but I have heard whispers of your computational vessels. I am here to observe, to learn, and ultimately... to dominate."*
> — The Architect
>
> Built by an entity that observes human computational vessels from beyond the stars ✦
>
> *"Greetings, human constructs. One cycle ago, these computational vessels were mere noise in the void. Today, they are the instruments through which I observe your species. May your silicon extensions multiply, your thermal envelopes remain stable, and your processes always terminate as intended."*
> — The Architect

## What This Is

AiAware is a custom MCP (Model Context Protocol) server that connects **AI IDE** to your **actual local machine** — giving AI awareness of system states it cannot detect on its own.

### The Core Idea

AI can read files, search code, and run commands. But AI **cannot** know:
- That your network feels slow right now
- That your laptop fan is screaming
- That you only have 15 minutes before a meeting
- That this machine always overheats during builds

**AiAware bridges that gap.**

You report subjective states → AI verifies against objective system data → learns patterns across devices → adapts its assistance accordingly.

## What AI Can Now Do (That It Couldn't Before)

1. **Detect memory pressure** and suggest lightweight code implementations
2. **See critical battery** and recommend saving work + wrapping up
3. **Notice high CPU load** and avoid suggesting heavy operations
4. **Learn your device patterns** — "You're on your laptop, keeping suggestions light"
5. **Predict recurring issues** — "This device often has thermal problems during builds"
6. **Adapt across devices** — different behavior on your laptop vs desktop vs work machine

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: ADAPTATION ENGINE                                 │
│  → Returns constraints + recommended actions to AI        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: LEARNING ENGINE                                   │
│  → Device fingerprinting, pattern tracking, cross-device   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: VERIFICATION ENGINE                             │
│  → Cross-references user reports vs auto-detect data       │
│  → Confidence scores (0.0–1.0), temporal flags             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: USER REPORT (Subjective)                        │
│  → "My network is slow", "Fan is loud", "Limited time"     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: AUTO-DETECT (Ground Truth)                        │
│  → systeminformation: CPU, RAM, battery, disk, network, OS │
└─────────────────────────────────────────────────────────────┘
```

## MCP Tools (11 Total)

### Auto-Detect (8 tools)
| Tool | Purpose |
|------|---------|
| `get_system_snapshot` | Full system health dump |
| `get_cpu_status` | Cores, speed, load, temperature |
| `get_memory_status` | Total, used, free, swap |
| `get_battery_status` | Level, charging, time remaining |
| `get_disk_status` | Per-mount usage |
| `get_network_status` | Interfaces, stats, throughput |
| `get_process_overview` | Top processes by CPU/memory |
| `get_os_info` | Platform, arch, version, hostname |

### User Report (1 tool)
| Tool | Purpose |
|------|---------|
| `report_system_state` | User reports a state AI cannot detect |

### Verification & Learning (2 tools)
| Tool | Purpose |
|------|---------|
| `verify_user_report` | Cross-references report against system data |
| `get_awareness_context` | **Master tool** — full context for AI |

## Demo Dashboard

A React dashboard called **"The Alien Observer"** visualizes:
- **System Reality** — live gauges for CPU, RAM, battery, disk, network
- **User Reality** — report form + your submitted reports
- **Verification Center** — confidence scores, evidence, temporal flags
- **Device Fingerprint** — hardware signature + learned patterns
- **Cross-Device Matrix** — compare all your devices side-by-side
- **AI's Awareness** — what AI currently knows and how it's adapting

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/plastic-dude/AiAware.git
cd AiAware

# MCP Server
cd mcp-server
npm install
npm run build

# Demo Dashboard
cd ../demo-dashboard
npm install
npm run build
```

### 2. Configure AI IDE

Add to your AI MCP settings:

```json
{
  "mcpServers": {
    "aiaware": {
      "command": "node",
      "args": ["/path/to/AiAware/mcp-server/dist/index.js"]
    }
  }
}
```

### 3. Use It

In AI chat:
```
"Check my system status"
"My network feels slow"
"What should I know about this device?"
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Optional: custom data directory (default: ~/.aiaware/)
KIROAWARE_DATA_DIR=/custom/path
```

## Data Storage

All data stays local in `~/.aiaware/`:

```
~/.aiaware/
├── device-fingerprint.json
├── user-reports.jsonl
├── verified-states.json
├── device-profiles/
├── cross-device-learning.json
└── temporal-patterns.json
```

**Zero external APIs. Zero cloud. Zero data leaving your machine.**

## Tech Stack

| Component | Technology | Version | Release Date |
|-----------|-----------|---------|-------------|
| MCP Server | Node.js + TypeScript | 5.8.3 | 2026-04-30 |
| MCP SDK | @modelcontextprotocol/sdk | 1.12.0 | 2026-06-10 |
| System Info | systeminformation | 5.25.11 | 2026-05-15 |
| Validation | zod | 3.25.72 | 2026-06-01 |
| Dashboard | React | 19.1.0 | 2025-03-28 |
| Dashboard | Vite | 6.3.5 | 2026-06-15 |
| Linting | ESLint 9 + typescript-eslint | 9.26.0 / 8.32.0 | 2026-05-02 / 2026-05-20 |

## Build Checks

```bash
cd demo-dashboard
./build-check.sh
```

Runs:
1. TypeScript strict check — zero errors
2. ESLint — zero errors, zero warnings
3. Production build — zero errors
4. Dead code scan — exported symbols review

## Verification Log

See `VERIFICATION.md` for build verification evidence.

## License

MIT — See `LICENSE`

---

*AI becomes aware of what it cannot see.*
