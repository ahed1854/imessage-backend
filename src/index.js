import express from "express";
import cors from "cors";

import "dotenv/config";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhook from "./webhooks/clerk.webhook.js";

const app = express();
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
        origin: "https://imessage-frontend-psi.vercel.app/",
        credentials: true,
    }),
);

// health endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});

// if public directory is there, serve the static files
// this is for production build
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("/{*any}", (req, res, next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    });
}

app.listen(3000, () => {
    console.log(`server is running on port ${PORT}`);
    connectDB();
});
