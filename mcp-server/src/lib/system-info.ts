/**
 * AiAware — System Information Wrapper
 * Wraps systeminformation library with our types
 */

import si from "systeminformation";
import type {
  SystemSnapshot,
  CpuStatus,
  MemoryStatus,
  BatteryStatus,
  DiskStatus,
  NetworkStatus,
  OsInfo,
  ProcessOverview,
} from "../types/index.js";

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [
    cpu,
    mem,
    battery,
    disk,
    networkInterfaces,
    networkStats,
    os,
    processes,
  ] = await Promise.all([
    getCpuStatus(),
    getMemoryStatus(),
    getBatteryStatus(),
    getDiskStatus(),
    si.networkInterfaces(),
    si.networkStats(),
    getOsInfo(),
    getProcessOverview(),
  ]);

  const defaultIface = Array.isArray(networkStats) && networkStats.length > 0
    ? networkStats[0].iface
    : null;

  const stats = Array.isArray(networkStats) && networkStats.length > 0
    ? {
        iface: networkStats[0].iface,
        rx_bytes: networkStats[0].rx_bytes,
        tx_bytes: networkStats[0].tx_bytes,
        rx_sec: networkStats[0].rx_sec ?? null,
        tx_sec: networkStats[0].tx_sec ?? null,
        ms: networkStats[0].ms,
      }
    : null;

  const interfaces = Array.isArray(networkInterfaces)
    ? networkInterfaces
        .filter((ni: any) => !ni.internal)
        .map((ni: any) => ({
          iface: ni.iface,
          ip4: ni.ip4,
          ip6: ni.ip6,
          mac: ni.mac,
          internal: ni.internal,
          virtual: ni.virtual || false,
          operstate: ni.operstate,
          speed: ni.speed ?? null,
          duplex: ni.duplex,
        }))
    : [];

  return {
    timestamp: new Date().toISOString(),
    cpu,
    memory: mem,
    battery,
    disk,
    network: {
      interfaces,
      defaultInterface: defaultIface,
      stats,
    },
    os,
    processes,
  };
}

export async function getCpuStatus(): Promise<CpuStatus> {
  const [cpuData, loadData, tempData] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.cpuTemperature().catch(() => ({ main: null })),
  ]);

  return {
    manufacturer: cpuData.manufacturer,
    brand: cpuData.brand,
    speed: cpuData.speed,
    cores: cpuData.cores,
    physicalCores: cpuData.physicalCores,
    loadPercent: Math.round(loadData.currentLoad * 100) / 100,
    temperature: tempData.main ?? undefined,
  };
}

export async function getMemoryStatus(): Promise<MemoryStatus> {
  const mem = await si.mem();
  return {
    total: mem.total,
    used: mem.used,
    free: mem.free,
    active: mem.active,
    available: mem.available,
    usedPercent: Math.round((mem.used / mem.total) * 1000) / 10,
    swapTotal: mem.swaptotal,
    swapUsed: mem.swapused,
  };
}

export async function getBatteryStatus(): Promise<BatteryStatus | null> {
  const bat = await si.battery();
  if (!bat.hasBattery) return null;
  return {
    hasBattery: true,
    isCharging: bat.isCharging,
    percent: bat.percent,
    timeRemaining: bat.timeRemaining,
    acConnected: bat.acConnected,
  };
}

export async function getDiskStatus(): Promise<DiskStatus[]> {
  const fs = await si.fsSize();
  return fs.map((d: any) => ({
    fs: d.fs,
    type: d.type,
    size: d.size,
    used: d.used,
    available: d.available,
    usePercent: Math.round(d.use * 10) / 10,
    mount: d.mount,
  }));
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const [ifaces, stats] = await Promise.all([
    si.networkInterfaces(),
    si.networkStats(),
  ]);

  const interfaces = Array.isArray(ifaces)
    ? ifaces
        .filter((ni: any) => !ni.internal)
        .map((ni: any) => ({
          iface: ni.iface,
          ip4: ni.ip4,
          ip6: ni.ip6,
          mac: ni.mac,
          internal: ni.internal,
          virtual: ni.virtual || false,
          operstate: ni.operstate,
          speed: ni.speed ?? null,
          duplex: ni.duplex,
        }))
    : [];

  const defaultIface = Array.isArray(stats) && stats.length > 0
    ? stats[0].iface
    : null;

  const netStats = Array.isArray(stats) && stats.length > 0
    ? {
        iface: stats[0].iface,
        rx_bytes: stats[0].rx_bytes,
        tx_bytes: stats[0].tx_bytes,
        rx_sec: stats[0].rx_sec ?? null,
        tx_sec: stats[0].tx_sec ?? null,
        ms: stats[0].ms,
      }
    : null;

  return {
    interfaces,
    defaultInterface: defaultIface,
    stats: netStats,
  };
}

export async function getProcessOverview(): Promise<ProcessOverview> {
  const procs = await si.processes();
  const list = procs.list
    .sort((a: any, b: any) => (b.cpu || 0) - (a.cpu || 0))
    .slice(0, 10)
    .map((p: any) => ({
      pid: p.pid,
      name: p.name,
      cpu: Math.round((p.cpu || 0) * 100) / 100,
      mem: Math.round((p.mem || 0) * 100) / 100,
      memVsz: p.memVsz || 0,
      memRss: p.memRss || 0,
    }));

  return {
    all: procs.all,
    running: procs.running,
    blocked: procs.blocked,
    sleeping: procs.sleeping,
    list,
  };
}

export async function getOsInfo(): Promise<OsInfo> {
  const os = await si.osInfo();
  return {
    platform: os.platform,
    distro: os.distro,
    release: os.release,
    codename: os.codename,
    kernel: os.kernel,
    arch: os.arch,
    hostname: os.hostname,
    fqdn: os.fqdn,
  };
}
