

export interface WorkflowStep {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  extract?: Record<string, string>;
  delayMsRange?: [number, number];
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
}

export interface TestSummary {
  totalRequests: number;
  totalErrors: number;
  avgRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
}

// ---------- Outbound: generator -> backend ----------

export interface RegisterMessage {
  type: "register";
  name: string;
  capacity: { maxVirtualUsers: number; cpuCores: number; label?: string };
}

export interface MetricsBatchMessage {
  type: "metrics_batch";
  testId: string;
  timestamp: string;
  activeUsers: number;
  requestCount: number;
  errorCount: number;
  rps: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  raw?: Record<string, unknown>;
}

export interface TestStartedMessage {
  type: "test_started";
  testId: string;
}

export interface TestCompletedMessage {
  type: "test_completed";
  testId: string;
  summary: TestSummary;
}

export interface TestFailedMessage {
  type: "test_failed";
  testId: string;
  error: string;
}

export type OutboundMessage =
  | RegisterMessage
  | MetricsBatchMessage
  | TestStartedMessage
  | TestCompletedMessage
  | TestFailedMessage;

// ---------- Inbound: backend -> generator ----------

export interface RegisteredMessage {
  type: "registered";
  generatorId: string;
}

export interface StartTestMessage {
  type: "start_test";
  testId: string;
  baseUrl: string;
  workflows: { definition: WorkflowDefinition; weight: number }[];
  assignedUsers: number;
  durationSeconds: number;
  rampUpSeconds: number;
}

export interface CancelTestMessage {
  type: "cancel_test";
  testId: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type InboundMessage =
  | RegisteredMessage
  | StartTestMessage
  | CancelTestMessage
  | ErrorMessage;

// ---------- Type guards ----------

export function isRegistered(msg: InboundMessage): msg is RegisteredMessage {
  return msg.type === "registered";
}

export function isStartTest(msg: InboundMessage): msg is StartTestMessage {
  return msg.type === "start_test";
}

export function isCancelTest(msg: InboundMessage): msg is CancelTestMessage {
  return msg.type === "cancel_test";
}

export function isErrorMessage(msg: InboundMessage): msg is ErrorMessage {
  return msg.type === "error";
}