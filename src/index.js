import express from "express";
import cors from "cors";

import "dotenv/config";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhook from "./webhooks/clerk.webhook.js";

const app = express();

app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

const PORT = process.env.PORT;

const publicDir = path.join(process.cwd(), "public");

// raw is to make sure to not parse webhook event data, and keep it in the raw format
app.use(
    "/api/webhooks/clerk",
    express.raw({ type: "application/json" }),
    clerkWebhook,
);

// middlewares
app.use(express.json());
app.use(clerkMiddleware());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }),
);

// health endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});

app.get("/", (req, res) => {
    res.send("Backend is running successfully!");
});

// if public directory is there, serve the static files
// this is for production build
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("/{*any}", (req, res, next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    });
}

const listenPort = PORT || 3000;
app.listen(listenPort, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${listenPort}`);
    console.log(`🔗 Public URL: ${process.env.REPLIT_URL || "unknown"}`);
    connectDB();
});
