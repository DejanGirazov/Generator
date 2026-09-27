import WebSocket from "ws";
import { logger } from "../utils/logger.js";
import { createBackoff } from "../utils/backoff.js";
import type { GeneratorConfig } from "../config.js";
import type { InboundMessage, OutboundMessage } from "./types.js";

type MessageHandler = (msg: InboundMessage) => void;

// Owns the single persistent WebSocket connection to the backend.
// Module-level-style state, scoped to one connection instance via closure
// (mirrors the pattern in backend/ws/registry.ts) rather than a class —
// there's only ever one connection per generator process, so there's
// nothing here that benefits from being instantiable.
export function createBackendConnection(config: GeneratorConfig) {
  const backoff = createBackoff();
  let ws: WebSocket | null = null;
  let messageHandler: MessageHandler | null = null;
  let closedIntentionally = false;

  function onMessage(handler: MessageHandler): void {
    messageHandler = handler;
  }

  function connect(): void {
    closedIntentionally = false;
    logger.info(`Connecting to ${config.backendWsUrl} ...`);

    const socket = new WebSocket(config.backendWsUrl);
    ws = socket;

    socket.on("open", () => {
      logger.info("Connected. Sending register...");
      backoff.reset();
      send({
        type: "register",
        name: config.generatorName,
        capacity: config.capacity,
      });
    });

    socket.on("message", (raw) => {
      let parsed: InboundMessage;
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        logger.warn("Received non-JSON message from backend, ignoring", raw.toString());
        return;
      }
      messageHandler?.(parsed);
    });

    socket.on("close", (code, reason) => {
      logger.warn(`Connection closed (code ${code})`, reason.toString());
      ws = null;
      if (!closedIntentionally) scheduleReconnect();
    });

    socket.on("error", (err) => {
      logger.error("WebSocket error", err.message);
      // "close" fires after "error" for a failed connection attempt, so
      // reconnect scheduling happens there — nothing to do here but log.
    });
  }

  function send(message: OutboundMessage): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Dropped outbound "${message.type}" — socket not open`);
      return false;
    }
    ws.send(JSON.stringify(message));
    return true;
  }

  function close(): void {
    closedIntentionally = true;
    ws?.close();
  }

  function scheduleReconnect(): void {
    const delayMs = backoff.next();
    logger.info(`Reconnecting in ${delayMs}ms...`);
    setTimeout(connect, delayMs);
  }

  return { connect, send, close, onMessage };
}