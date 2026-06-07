import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const server1Url = process.env.SERVER1_URL || "http://localhost:4001";
const server2Url = process.env.SERVER2_URL || "http://localhost:4002";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ service: "hotelhub-gateway", ok: true });
});

app.use(
  "/api/v1",
  createProxyMiddleware({
    target: server1Url,
    changeOrigin: true,
    ws: true
  })
);

app.use(
  "/socket.io",
  createProxyMiddleware({
    target: server1Url,
    changeOrigin: true,
    ws: true,
    pathRewrite: (_path, req) => req.originalUrl
  })
);

app.use(
  "/graphql",
  createProxyMiddleware({
    target: server2Url,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl
  })
);

app.listen(port, () => {
  console.log(`HotelHub gateway listening on ${port}`);
});
