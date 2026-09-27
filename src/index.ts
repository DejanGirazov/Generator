import { loadConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { createBackendConnection } from "./ws/connection.js";
import {
  isRegistered,
  isStartTest,
  isCancelTest,
  isErrorMessage,
} from "./ws/types.js";

const config = loadConfig();
const connection = createBackendConnection(config);

connection.onMessage((msg) => {
  if (isRegistered(msg)) {
    logger.info(`Registered with backend as generatorId=${msg.generatorId}`);
    return;
  }

  if (isStartTest(msg)) {
    logger.info(`Received start_test for testId=${msg.testId}`, {
      assignedUsers: msg.assignedUsers,
      durationSeconds: msg.durationSeconds,
      rampUpSeconds: msg.rampUpSeconds,
      workflowCount: msg.workflows.length,
    });
    return;
  }

  if (isCancelTest(msg)) {
    logger.info(`Received cancel_test for testId=${msg.testId}`);
    return;
  }

  if (isErrorMessage(msg)) {
    logger.error(`Backend error: ${msg.message}`);
    return;
  }

  logger.warn("Received unrecognized message shape", msg);
});

connection.connect();

process.on("SIGINT", () => {
  logger.info("Shutting down...");
  connection.close();
  process.exit(0);
});