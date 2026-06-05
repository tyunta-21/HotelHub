import http from "node:http";
import axios from "axios";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import jwt from "jsonwebtoken";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { z } from "zod";

dotenv.config();

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4001;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const io = new Server(server, {
  cors: { origin: clientOrigin, credentials: true }
});

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());

const accessSecret = process.env.JWT_ACCESS_SECRET || "access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";

function signTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: process.env.ACCESS_TOKEN_TTL || "15m" });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: process.env.REFRESH_TOKEN_TTL || "7d" });
  return { accessToken, refreshToken };
}

async function storeSession(userId, refreshToken) {
  await redis.set(`session:${userId}`, refreshToken, "EX", 60 * 60 * 24 * 7);
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Missing bearer token" });

  try {
    req.user = jwt.verify(token, accessSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.join(`user:${userId}`);
});

app.get("/health", (_req, res) => {
  res.json({ service: "hotelhub-server1", ok: true });
});

app.post("/auth/register", async (req, res) => {
  const schema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });
  const data = schema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash: await bcrypt.hash(data.password, 10) },
    select: { id: true, name: true, email: true, role: true }
  });
  const tokens = signTokens(user);
  await storeSession(user.id, tokens.refreshToken);
  return res.status(201).json({ user, ...tokens });
});

app.post("/auth/login", async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const data = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const tokens = signTokens(safeUser);
  await storeSession(user.id, tokens.refreshToken);
  return res.json({ user: safeUser, ...tokens });
});

app.post("/auth/refresh", async (req, res) => {
  const schema = z.object({ refreshToken: z.string().min(1) });
  const { refreshToken } = schema.parse(req.body);

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const storedToken = await redis.get(`session:${decoded.sub}`);
    if (storedToken !== refreshToken) return res.status(401).json({ message: "Refresh session is invalid" });

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const tokens = signTokens(user);
    await storeSession(user.id, tokens.refreshToken);
    return res.json({ user, ...tokens });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

app.post("/bookings", requireAuth, async (req, res) => {
  const schema = z.object({
    userId: z.string(),
    hotelId: z.string(),
    hotelName: z.string(),
    roomId: z.string(),
    roomName: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number().int().positive(),
    totalAmount: z.number().positive()
  });
  const data = schema.parse(req.body);
  if (data.userId !== req.user.sub && req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  const cachedAvailability = await redis.get(`room:${data.roomId}:available`);
  if (cachedAvailability === "false") return res.status(409).json({ message: "Room is no longer available" });

  const booking = await prisma.booking.create({
    data: {
      ...data,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      totalAmount: data.totalAmount,
      status: "CONFIRMED"
    }
  });

  await redis.set(`room:${data.roomId}:available`, "false", "EX", 60 * 15);
  await axios.post(process.env.SERVER2_INTERNAL_URL || "http://localhost:4002/internal/rooms/availability", {
    roomId: data.roomId,
    isAvailable: false
  });

  io.to(`user:${data.userId}`).emit("booking:confirmed", booking);
  return res.status(201).json(booking);
});

app.get("/bookings/:userId", requireAuth, async (req, res) => {
  if (req.params.userId !== req.user.sub && req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const bookings = await prisma.booking.findMany({
    where: { userId: req.params.userId },
    include: { payment: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(bookings);
});

app.get("/bookings", requireAuth, async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const bookings = await prisma.booking.findMany({
    include: { payment: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  return res.json(bookings);
});

app.patch("/bookings/:id", requireAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]) });
  const { status } = schema.parse(req.body);
  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Booking not found" });
  if (existing.userId !== req.user.sub && req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status } });
  if (status === "CANCELLED") {
    await redis.set(`room:${booking.roomId}:available`, "true", "EX", 60 * 15);
    await axios.post(process.env.SERVER2_INTERNAL_URL || "http://localhost:4002/internal/rooms/availability", {
      roomId: booking.roomId,
      isAvailable: true
    });
  }
  io.to(`user:${booking.userId}`).emit("booking:updated", booking);
  return res.json(booking);
});

app.delete("/bookings/:id", requireAuth, async (req, res) => {
  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Booking not found" });
  if (existing.userId !== req.user.sub && req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
  await redis.set(`room:${booking.roomId}:available`, "true", "EX", 60 * 15);
  await axios.post(process.env.SERVER2_INTERNAL_URL || "http://localhost:4002/internal/rooms/availability", {
    roomId: booking.roomId,
    isAvailable: true
  });
  io.to(`user:${booking.userId}`).emit("booking:cancelled", booking);
  return res.json(booking);
});

app.delete("/bookings/:id/permanent", requireAuth, async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.userId !== req.user.sub && req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  await redis.set(`room:${booking.roomId}:available`, "true", "EX", 60 * 15);
  await axios.post(process.env.SERVER2_INTERNAL_URL || "http://localhost:4002/internal/rooms/availability", {
    roomId: booking.roomId,
    isAvailable: true
  });
  await prisma.booking.delete({ where: { id: req.params.id } });
  io.to(`user:${booking.userId}`).emit("booking:deleted", booking);
  return res.json({ id: booking.id, deleted: true });
});

app.post("/payments", requireAuth, async (req, res) => {
  const schema = z.object({ bookingId: z.string(), amount: z.number().positive() });
  const data = schema.parse(req.body);
  const payment = await prisma.payment.upsert({
    where: { bookingId: data.bookingId },
    update: { amount: data.amount, status: "PAID" },
    create: { bookingId: data.bookingId, amount: data.amount, status: "PAID" }
  });
  return res.status(201).json(payment);
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation error", issues: error.issues });
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});

server.listen(port, () => {
  console.log(`HotelHub server1 listening on ${port}`);
});
