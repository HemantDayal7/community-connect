const fs = require("fs");
const path = require("path");

// ✅ Ensure log directory exists
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// ✅ Log file path
const logFile = path.join(logDir, "server.log");

// ✅ Function to log messages
const log = (level, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;

  // ✅ Print to console
  console.log(logMessage);

  // ✅ Append to log file
  fs.appendFileSync(logFile, logMessage);
};

// ✅ Logging levels
const logger = {
  info: (msg) => log("info", msg),
  warn: (msg) => log("warn", msg),
  error: (msg) => log("error", msg),
};

module.exports = logger;
