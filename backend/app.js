const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  null
].filter(Boolean);

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || "");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MultiMart API is healthy"
  });
});

// Mount all routes under /api
app.use("/api", routes);
app.use("/api/public", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
