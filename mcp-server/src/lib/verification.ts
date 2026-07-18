/**
 * AiAware — Verification Engine
 * Cross-references user reports against auto-detect data
 */

import type {
  UserReport,
  SystemSnapshot,
  VerificationResult,
  TemporalMetadata,
  StateType,
} from "../types/index.js";
import { getBaselineSnapshots, getAllReports } from "./data-store.js";

export async function verifyReport(
  report: UserReport,
  currentSnapshot: SystemSnapshot
): Promise<{ verification: VerificationResult; temporal: TemporalMetadata }> {
  const baseline = computeBaseline(report.deviceFingerprint);
  const evidence: string[] = [];
  let confidence = 0.5;
  let status: VerificationResult["status"] = "pending";

  // ── State-type specific verification logic ──
  switch (report.stateType) {
    case "network_performance": {
      const net = currentSnapshot.network;
      const baseNet = baseline.network;

      if (net.stats && baseNet?.stats) {
        const currentRx = net.stats.rx_sec ?? 0;
        const baseRx = baseNet.stats?.rx_sec ?? currentRx;
        if (baseRx > 0 && currentRx < baseRx * 0.5) {
          evidence.push(`bandwidth_drop: ${Math.round(currentRx)} B/s vs baseline ${Math.round(baseRx)} B/s`);
          confidence += 0.25;
        }
      }

      // Check if any interface is down
      const downIfaces = net.interfaces.filter((i) => i.operstate !== "up").length;
      if (downIfaces > 0) {
        evidence.push(`interfaces_down: ${downIfaces}`);
        confidence += 0.15;
      }

      break;
    }

    case "thermal_issue": {
      const currentTemp = currentSnapshot.cpu.temperature;
      const baseTemp = baseline.cpu.temperature;

      if (currentTemp && baseTemp && currentTemp > baseTemp + 15) {
        evidence.push(`cpu_temp_elevated: ${currentTemp}°C vs baseline ${baseTemp}°C`);
        confidence += 0.35;
      } else if (currentTemp && currentTemp > 80) {
        evidence.push(`cpu_temp_critical: ${currentTemp}°C`);
        confidence += 0.30;
      }

      if (currentSnapshot.cpu.loadPercent > 80) {
        evidence.push(`cpu_load_high: ${currentSnapshot.cpu.loadPercent}%`);
        confidence += 0.15;
      }

      break;
    }

    case "memory_pressure": {
      const memPercent = currentSnapshot.memory.usedPercent;
      const baseMem = baseline.memory.usedPercent;

      if (memPercent > 85) {
        evidence.push(`memory_usage_high: ${memPercent}%`);
        confidence += 0.35;
      }
      if (baseMem > 0 && memPercent > baseMem + 20) {
        evidence.push(`memory_spike: ${memPercent}% vs baseline ${baseMem}%`);
        confidence += 0.20;
      }
      if (currentSnapshot.memory.swapUsed > 0) {
        evidence.push(`swap_active: ${Math.round(currentSnapshot.memory.swapUsed / 1024 / 1024)} MB`);
        confidence += 0.15;
      }

      break;
    }

    case "disk_pressure": {
      const maxUsage = Math.max(...currentSnapshot.disk.map((d) => d.usePercent));
      const baseMax = baseline.disk.length > 0
        ? Math.max(...baseline.disk.map((d) => d.usePercent))
        : 0;

      if (maxUsage > 90) {
        evidence.push(`disk_nearly_full: ${maxUsage}%`);
        confidence += 0.35;
      }
      if (baseMax > 0 && maxUsage > baseMax + 15) {
        evidence.push(`disk_usage_spike: ${maxUsage}% vs baseline ${baseMax}%`);
        confidence += 0.20;
      }

      break;
    }

    case "power_issue": {
      const bat = currentSnapshot.battery;
      if (bat && !bat.isCharging && bat.percent < 20) {
        evidence.push(`battery_critical: ${bat.percent}%`);
        confidence += 0.40;
      }
      if (bat && !bat.acConnected && bat.percent < 30) {
        evidence.push(`battery_low_unplugged: ${bat.percent}%`);
        confidence += 0.25;
      }

      break;
    }

    case "display_issue":
    case "audio_issue":
    case "peripheral_issue":
    case "environmental":
    case "availability_constraint":
    case "other": {
      // These are often purely subjective — AI has limited sensors
      // Confidence stays at baseline 0.5 unless indirect evidence exists
      if (currentSnapshot.cpu.loadPercent > 90) {
        evidence.push(`system_stressed: CPU ${currentSnapshot.cpu.loadPercent}%`);
        confidence += 0.10;
      }
      break;
    }
  }

  // ── Determine status ──
  if (evidence.length === 0) {
    confidence = Math.max(0.2, confidence - 0.3);
    status = "inconclusive";
  } else if (confidence >= 0.75) {
    status = "verified";
  } else if (confidence >= 0.5) {
    status = "inconclusive";
  } else {
    status = "rejected";
  }

  // ── Temporal analysis ──
  const temporal = computeTemporal(report);

  const verification: VerificationResult = {
    status,
    confidence: Math.round(confidence * 100) / 100,
    evidence,
    verifiedAt: new Date().toISOString(),
  };

  return { verification, temporal };
}

function computeBaseline(fingerprint: string) {
  const snapshots = getBaselineSnapshots(fingerprint, 10);
  if (snapshots.length === 0) {
    return {
      cpu: { temperature: 0, loadPercent: 0 },
      memory: { usedPercent: 0 },
      network: { stats: null },
      disk: [],
    };
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    cpu: {
      temperature: avg(snapshots.map((s) => s.cpu.temperature || 0)),
      loadPercent: avg(snapshots.map((s) => s.cpu.loadPercent)),
    },
    memory: {
      usedPercent: avg(snapshots.map((s) => s.memory.usedPercent)),
    },
    network: {
      stats: {
        rx_sec: avg(snapshots.map((s) => s.network.stats?.rx_sec || 0)),
      },
    },
    disk: snapshots[0].disk.map((d, i) => ({
      usePercent: avg(snapshots.map((s) => s.disk[i]?.usePercent || 0)),
    })),
  };
}

function computeTemporal(report: UserReport): TemporalMetadata {
  const allReports = getAllReports();
  const sameTypeReports = allReports.filter(
    (r) =>
      r.deviceFingerprint === report.deviceFingerprint &&
      r.stateType === report.stateType &&
      r.verification.status === "verified"
  );

  const recurrenceCount = sameTypeReports.length + 1;
  const now = new Date();
  let flag: TemporalMetadata["flag"] = "temporary";
  let decaySchedule: string;

  if (report.expectedDuration === "persistent") {
    flag = "persistent";
    decaySchedule = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (recurrenceCount >= 5) {
    // Check if 5+ reports in last 14 days
    const recent = sameTypeReports.filter(
      (r) => new Date(r.timestamp) > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    );
    if (recent.length >= 4) {
      flag = "recurring";
      decaySchedule = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      flag = "temporary";
      decaySchedule = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
  } else {
    flag = "temporary";
    decaySchedule = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  }

  return {
    flag,
    recurrenceCount,
    firstReported: sameTypeReports[0]?.timestamp || report.timestamp,
    lastReported: report.timestamp,
    decaySchedule,
  };
}
