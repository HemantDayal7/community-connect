const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error: ", err.stack || err.message); // Logs full error in development mode

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined, // Shows stack trace only in dev mode
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`❌ Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export { errorHandler, notFound };
