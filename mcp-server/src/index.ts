/**
 * AiAware MCP Server
 * by MOKDAVONY — The Alien God — The Alien
 * 
 * Gives AI IDE awareness of system context that it cannot detect on its own.
 * Users report subjective states → AI verifies against auto-detect data →
 → learns patterns across devices → adapts assistance accordingly.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";

import {
  getSystemSnapshot,
  getCpuStatus,
  getMemoryStatus,
  getBatteryStatus,
  getDiskStatus,
  getNetworkStatus,
  getProcessOverview,
  getOsInfo,
} from "./lib/system-info.js";
import {
  getOrCreateDeviceFingerprint,
  getDeviceFingerprint,
  saveUserReport,
  getAllReports,
  getActiveVerifiedReports,
  updateReport,
  getOrCreateCrossDeviceLearning,
  updateDevicePattern,
  saveBaselineSnapshot,
  logTelemetry,
  getTelemetrySummary,
} from "./lib/data-store.js";
import { verifyReport } from "./lib/verification.js";
import type { UserReport, AwarenessContext, Adaptation } from "./types/index.js";

// ───────────────────────────────────────────
// Server Setup
// ───────────────────────────────────────────

const server = new Server(
  {
    name: "aiaware",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ───────────────────────────────────────────
// Tool Definitions
// ───────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ── Auto-Detect Tools (Layer 1) ──
      {
        name: "get_system_snapshot",
        description:
          "Capture a full system health snapshot including CPU, memory, battery, disk, network, OS, and processes. This is the ground truth layer — what AI can objectively detect about the machine.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_cpu_status",
        description:
          "Get detailed CPU information: manufacturer, brand, speed, core count, current load percentage, and temperature if available.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_memory_status",
        description:
          "Get memory (RAM) status: total, used, free, active, available, usage percentage, and swap information.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_battery_status",
        description:
          "Get battery status: whether a battery exists, charging state, percentage, time remaining, and AC connection status. Returns null on desktop machines without batteries.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_disk_status",
        description:
          "Get disk usage for all mounted filesystems: size, used, available, and usage percentage per mount point.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_network_status",
        description:
          "Get network interface information and statistics: available interfaces, IP addresses, MAC addresses, operational state, speed, duplex mode, and current RX/TX throughput.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_process_overview",
        description:
          "Get an overview of running processes: total count, running/blocking/sleeping counts, and top 10 processes by CPU usage with PID, name, CPU%, and memory usage.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_os_info",
        description:
          "Get operating system information: platform, distribution, release, kernel version, architecture, hostname, and FQDN.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },

      // ── User Report Tools (Layer 2) ──
      {
        name: "report_system_state",
        description:
          "Report a system state that AI cannot auto-detect. This is the core of AiAware — users report subjective experiences (network feels slow, fan is loud, machine heats up, limited time available) and AI verifies them against objective data. Returns a report receipt ID and initial verification status.",
        inputSchema: {
          type: "object",
          properties: {
            stateType: {
              type: "string",
              enum: [
                "network_performance",
                "thermal_issue",
                "memory_pressure",
                "disk_pressure",
                "power_issue",
                "display_issue",
                "audio_issue",
                "peripheral_issue",
                "environmental",
                "availability_constraint",
                "other",
              ],
              description: "The category of the reported state",
            },
            description: {
              type: "string",
              description: "User's description of what they're experiencing",
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "How severely this affects the user",
            },
            expectedDuration: {
              type: "string",
              enum: ["temporary", "unknown", "persistent"],
              description: "Whether the user expects this to be temporary or ongoing",
            },
          },
          required: ["stateType", "description", "severity", "expectedDuration"],
        },
      },

      // ── Verification & Learning Tools (Layers 3-4) ──
      {
        name: "verify_user_report",
        description:
          "Verify a previously submitted user report by cross-referencing it against current auto-detect data and historical baselines. Returns a confidence score (0.0-1.0), evidence list, verification status, and temporal classification (temporary/persistent/recurring). This is where AI learns whether the user's subjective experience matches objective reality.",
        inputSchema: {
          type: "object",
          properties: {
            reportId: {
              type: "string",
              description: "The receipt ID returned by report_system_state",
            },
          },
          required: ["reportId"],
        },
      },
      {
        name: "get_awareness_context",
        description:
          "THE MASTER TOOL. Returns the complete awareness context for the current user on the current device. Includes: current auto-detect snapshot, active verified user-reported states, device fingerprint and history, cross-device learnings, temporal predictions, and recommended adaptations. AI should call this at the start of each session to understand the full context before making suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            includeTelemetry: {
              type: "boolean",
              description: "Whether to include telemetry summary in the response",
              default: false,
            },
          },
          required: [],
        },
      },
    ],
  };
});

// ───────────────────────────────────────────
// Tool Handlers
// ───────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  const toolName = request.params.name;
  const args = request.params.arguments || {};

  // Helper to wrap responses with telemetry
  async function wrapWithTelemetry<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const result = await fn();
    const endTime = Date.now();
    const snapshot = await getSystemSnapshot().catch(() => null);
    logTelemetry({
      timestamp: new Date().toISOString(),
      toolName: name,
      requestPayloadSize: JSON.stringify(args).length,
      responsePayloadSize: JSON.stringify(result).length,
      roundTripMs: endTime - startTime,
      aiBehavior: {
        didRetry: false,
        retryCount: 0,
        timeoutOccurred: false,
        errorType: null,
        followUpToolCalls: [],
      },
      systemState: {
        cpuLoad: snapshot?.cpu.loadPercent ?? 0,
        memoryUsedPercent: snapshot?.memory.usedPercent ?? 0,
        batteryLevel: snapshot?.battery?.percent ?? null,
      },
    });
    return result;
  }

  try {
    switch (toolName) {
      // ── Auto-Detect Tools ──
      case "get_system_snapshot": {
        const snapshot = await wrapWithTelemetry(toolName, () => getSystemSnapshot());
        const fp = await getOrCreateDeviceFingerprint(snapshot);
        saveBaselineSnapshot(fp.fingerprintId, snapshot);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ snapshot, deviceFingerprint: fp.fingerprintId }, null, 2),
            },
          ],
        };
      }

      case "get_cpu_status": {
        const cpu = await wrapWithTelemetry(toolName, () => getCpuStatus());
        return {
          content: [{ type: "text", text: JSON.stringify(cpu, null, 2) }],
        };
      }

      case "get_memory_status": {
        const mem = await wrapWithTelemetry(toolName, () => getMemoryStatus());
        return {
          content: [{ type: "text", text: JSON.stringify(mem, null, 2) }],
        };
      }

      case "get_battery_status": {
        const bat = await wrapWithTelemetry(toolName, () => getBatteryStatus());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                bat ?? { hasBattery: false, message: "No battery detected (desktop machine)" },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_disk_status": {
        const disk = await wrapWithTelemetry(toolName, () => getDiskStatus());
        return {
          content: [{ type: "text", text: JSON.stringify(disk, null, 2) }],
        };
      }

      case "get_network_status": {
        const net = await wrapWithTelemetry(toolName, () => getNetworkStatus());
        return {
          content: [{ type: "text", text: JSON.stringify(net, null, 2) }],
        };
      }

      case "get_process_overview": {
        const procs = await wrapWithTelemetry(toolName, () => getProcessOverview());
        return {
          content: [{ type: "text", text: JSON.stringify(procs, null, 2) }],
        };
      }

      case "get_os_info": {
        const os = await wrapWithTelemetry(toolName, () => getOsInfo());
        return {
          content: [{ type: "text", text: JSON.stringify(os, null, 2) }],
        };
      }

      // ── User Report Tool ──
      case "report_system_state": {
        const { stateType, description, severity, expectedDuration } = args as {
          stateType: string;
          description: string;
          severity: string;
          expectedDuration: string;
        };

        const snapshot = await getSystemSnapshot();
        const fp = await getOrCreateDeviceFingerprint(snapshot);

        const report: UserReport = {
          reportId: randomUUID(),
          timestamp: new Date().toISOString(),
          deviceFingerprint: fp.fingerprintId,
          stateType: stateType as any,
          userDescription: description,
          severity: severity as any,
          expectedDuration: expectedDuration as any,
          autoDetectSnapshot: snapshot,
          verification: {
            status: "pending",
            confidence: 0,
            evidence: [],
            verifiedAt: null,
          },
          temporal: {
            flag: "temporary",
            recurrenceCount: 1,
            firstReported: new Date().toISOString(),
            lastReported: new Date().toISOString(),
            decaySchedule: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
        };

        saveUserReport(report);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  receiptId: report.reportId,
                  status: "received",
                  message: `Report received. AI will verify this ${stateType} report against current system data. Use verify_user_report with receiptId to check verification results.`,
                  timestamp: report.timestamp,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── Verification Tool ──
      case "verify_user_report": {
        const { reportId } = args as { reportId: string };
        const allReports = getAllReports();
        const report = allReports.find((r) => r.reportId === reportId);

        if (!report) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { error: `Report ${reportId} not found` },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const currentSnapshot = await getSystemSnapshot();
        const { verification, temporal } = await verifyReport(report, currentSnapshot);

        report.verification = verification;
        report.temporal = temporal;
        updateReport(report);

        // Update cross-device learning
        const cdl = getOrCreateCrossDeviceLearning("default-user");
        const deviceName = `${currentSnapshot.os.platform} — ${currentSnapshot.cpu.brand}`;
        const patterns: Record<string, any> = {};

        if (report.stateType === "memory_pressure") {
          const freq = temporal.recurrenceCount >= 3 ? "high" : temporal.recurrenceCount >= 1 ? "medium" : "low";
          patterns.memoryPressureFrequency = freq;
        }
        if (report.stateType === "network_performance") {
          const freq = temporal.recurrenceCount >= 3 ? "high" : temporal.recurrenceCount >= 1 ? "medium" : "low";
          patterns.networkIssueFrequency = freq;
        }
        if (report.stateType === "thermal_issue") {
          const freq = temporal.recurrenceCount >= 3 ? "high" : temporal.recurrenceCount >= 1 ? "medium" : "low";
          patterns.thermalIssueFrequency = freq;
        }
        if (report.stateType === "power_issue" && currentSnapshot.battery) {
          patterns.batteryAnxietyThreshold = currentSnapshot.battery.percent;
        }

        if (Object.keys(patterns).length > 0) {
          updateDevicePattern(cdl, report.deviceFingerprint, deviceName, patterns);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  reportId,
                  verification: {
                    status: verification.status,
                    confidence: verification.confidence,
                    evidence: verification.evidence,
                    verifiedAt: verification.verifiedAt,
                  },
                  temporal: {
                    flag: temporal.flag,
                    recurrenceCount: temporal.recurrenceCount,
                    decaySchedule: temporal.decaySchedule,
                    note:
                      temporal.flag === "temporary"
                        ? "This appears to be a temporary issue. AI will re-evaluate after the decay period."
                        : temporal.flag === "recurring"
                        ? "This issue has recurred multiple times. AI will treat it as a pattern."
                        : temporal.flag === "persistent"
                        ? "This appears to be a persistent characteristic of this device."
                        : "Temporal classification pending.",
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── Master Awareness Tool ──
      case "get_awareness_context": {
        const { includeTelemetry = false } = args as { includeTelemetry?: boolean };
        const snapshot = await getSystemSnapshot();
        const fp = await getOrCreateDeviceFingerprint(snapshot);
        const activeReports = getActiveVerifiedReports(fp.fingerprintId);
        const cdl = getOrCreateCrossDeviceLearning("default-user");

        // Build adaptations
        const adaptations: Adaptation[] = [];

        // Memory constraint
        if (snapshot.memory.usedPercent > 80) {
          adaptations.push({
            type: "resource_constraint",
            constraint: "high_memory_usage",
            action: "suggest_lightweight_solutions",
            confidence: Math.min(0.95, snapshot.memory.usedPercent / 100),
            message: `Memory is at ${snapshot.memory.usedPercent}%. Consider lightweight implementations, avoiding memory-heavy dependencies, and closing unused applications.`,
          });
        }

        // Battery constraint
        if (snapshot.battery && !snapshot.battery.isCharging && snapshot.battery.percent < 25) {
          adaptations.push({
            type: "power_constraint",
            constraint: "critical_battery",
            action: "suggest_save_work_and_wrap_up",
            confidence: 0.95,
            message: `Battery at ${snapshot.battery.percent}% and not charging. Consider saving work and wrapping up your session soon.`,
          });
        }

        // CPU constraint
        if (snapshot.cpu.loadPercent > 80) {
          adaptations.push({
            type: "performance_constraint",
            constraint: "high_cpu_load",
            action: "avoid_cpu_intensive_operations",
            confidence: Math.min(0.9, snapshot.cpu.loadPercent / 100),
            message: `CPU load is ${snapshot.cpu.loadPercent}%. Avoid heavy compilation, large test suites, or CPU-intensive operations right now.`,
          });
        }

        // Disk constraint
        const maxDisk = Math.max(...snapshot.disk.map((d) => d.usePercent), 0);
        if (maxDisk > 85) {
          adaptations.push({
            type: "storage_constraint",
            constraint: "low_disk_space",
            action: "warn_about_disk_usage",
            confidence: Math.min(0.9, maxDisk / 100),
            message: `Disk usage is at ${maxDisk}% on one or more volumes. Consider cleaning up before generating large build artifacts.`,
          });
        }

        // Cross-device insights
        const crossDeviceInsights: any[] = [];
        const currentDevicePattern = cdl.devices.find(
          (d) => d.fingerprint === fp.fingerprintId
        );

        if (cdl.devices.length > 1 && currentDevicePattern) {
          const otherDevices = cdl.devices.filter((d) => d.fingerprint !== fp.fingerprintId);
          const otherWithMoreRam = otherDevices.find(
            (d) => d.patterns.preferredComplexity === "high"
          );
          if (otherWithMoreRam && currentDevicePattern.patterns.preferredComplexity === "low") {
            crossDeviceInsights.push({
              type: "device_comparison",
              insight: `You typically use more powerful setups (${otherWithMoreRam.name}) for heavy work. This device (${currentDevicePattern.name}) is configured for lighter tasks.`,
              confidence: 0.8,
              sourceDevice: otherWithMoreRam.fingerprint,
            });
          }
        }

        // Temporal predictions
        const temporalPredictions: any[] = [];
        const recurringIssues = activeReports.filter((r) => r.temporal.flag === "recurring");
        for (const issue of recurringIssues) {
          temporalPredictions.push({
            stateType: issue.stateType,
            predictedLikelihood: Math.min(0.9, issue.verification.confidence * 0.85),
            basedOn: `${issue.temporal.recurrenceCount} verified occurrences`,
            message: `This device has a history of ${issue.stateType} issues. AI will proactively monitor for this.`,
          });
        }

        const context = {
          timestamp: new Date().toISOString(),
          device: {
            fingerprint: fp.fingerprintId,
            profile: fp,
          },
          currentState: snapshot,
          activeVerifiedReports: activeReports.map((r) => ({
            reportId: r.reportId,
            stateType: r.stateType,
            description: r.userDescription,
            severity: r.severity,
            verification: r.verification,
            temporal: r.temporal,
          })),
          adaptations,
          crossDeviceInsights,
          temporalPredictions,
          telemetry: includeTelemetry ? getTelemetrySummary() : undefined,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(context, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Unknown tool: ${toolName}` }, null, 2),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[AiAware] Tool error (${toolName}):`, err);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: err, tool: toolName }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ───────────────────────────────────────────
// Start Server
// ───────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[AiAware] MCP server running on stdio");
  console.error("[AiAware] System context awareness active");
}

main().catch((err) => {
  console.error("[AiAware] Fatal error:", err);
  process.exit(1);
});
