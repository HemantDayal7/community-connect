import morgan from "morgan";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ✅ Create a request log stream
const requestLogStream = fs.createWriteStream(path.join(logsDir, "requests.log"), { flags: "a" });

// ✅ Middleware for logging all API requests
const requestLogger = morgan("combined", { stream: requestLogStream });

// ✅ Middleware for logging errors
const errorLogger = (err, req, res, next) => {
  const errorMessage = `${new Date().toISOString()} - ${req.method} ${req.url} - ${err.message}\n`;

  fs.appendFile(path.join(logsDir, "errors.log"), errorMessage, (writeErr) => {
    if (writeErr) console.error("❌ Error writing to log file:", writeErr);
  });

  next(err);
};

export { requestLogger, errorLogger };
