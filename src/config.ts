import "dotenv/config";

export interface GeneratorConfig {
  backendWsUrl: string;
  generatorName: string;
  capacity: {
    maxVirtualUsers: number;
    cpuCores: number;
    label?: string;
  };
  metricsBatchIntervalMs: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Env var ${name} must be a positive integer, got "${raw}"`);
  }
  return parsed;
}

export function loadConfig(): GeneratorConfig {
  return {
    backendWsUrl: requireEnv("BACKEND_WS_URL"),
    generatorName: requireEnv("GENERATOR_NAME"),
    capacity: {
      maxVirtualUsers: optionalInt("MAX_VIRTUAL_USERS", 500),
      cpuCores: optionalInt("CPU_CORES", 4),
      label: process.env.LABEL || undefined,
    },
    metricsBatchIntervalMs: optionalInt("METRICS_BATCH_INTERVAL_MS", 2000),
  };
}