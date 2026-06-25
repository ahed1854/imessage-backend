import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";

const router = express.Router();

// router.post("/", async (req, res) => {
//     try {
//         const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
//         if (!signingSecret) {
//             res.status(503).json({ message: "Webhook secret is not provided" });
//             return;
//         }

//         // clerk's verifier expects a Web Request with the raw body; express.raw gives a Buffer.
//         const payload = Buffer.isBuffer(req.body)
//             ? req.body.toString("utf8")
//             : String(req.body);
//         const request = new Request("http://internal/webhooks/clerk", {
//             method: "POST",
//             headers: new Headers(req.headers),
//             body: payload,
//         });

//         // throws if the signature is wrong or the body was tampered with; only then do we trust evt.
//         const evt = await verifyWebhook(request, { signingSecret });

//         if (evt.type === "user.created" || evt.type === "user.updated") {
//             const u = evt.data;

//             const email =
//                 u.email_addresses?.find(
//                     (e) => e.id === u.primary_email_address_id,
//                 )?.email_address ?? u.email_addresses?.[0]?.email_address;

//             const fullName =
//                 [u.first_name, u.last_name].filter(Boolean).join(" ") ||
//                 u.username ||
//                 email?.split("@")[0];

//             await User.findOneAndUpdate(
//                 { clerkId: u.id },
//                 { clerkId: u.id, email, fullName, profilePic: u.image_url },
//                 { new: true, upsert: true, setDefaultsOnInsert: true },
//             );
//         }

//         if (evt.type === "user.deleted") {
//             if (evt.data.id)
//                 await User.findOneAndDelete({ clerkId: evt.data.id });
//         }

//         res.status(200).json({ received: true });
//     } catch (error) {
//         console.error("Error in Clerk webhook:", error);
//         res.status(400).json({ message: "Webhook verification failed" });
//     }
// });

router.post("/", async (req, res) => {
    console.log("✅ Webhook route hit"); // <-- confirm the route is called

    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        console.log("🔑 Signing secret exists?", !!signingSecret);
        if (!signingSecret) {
            console.error("❌ Missing signing secret");
            return res
                .status(503)
                .json({ message: "Webhook secret is not provided" });
        }

        // Log headers to see if Clerk sends the signature headers
        console.log("📨 Headers:", req.headers);

        const payload = Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : String(req.body);
        console.log("📦 Raw body length:", payload.length);

        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        let evt;
        try {
            evt = await verifyWebhook(request, { signingSecret });
            console.log("✅ Verification succeeded, event type:", evt.type);
        } catch (verifyError) {
            console.error("❌ Verification failed:", verifyError.message);
            // Log the full error to see what went wrong
            console.error(verifyError);
            return res
                .status(400)
                .json({ message: "Webhook verification failed" });
        }

        // --- continue with your event handling ---
        router.post("/", async (req, res) => {
            console.log("✅ Webhook route hit"); // <-- confirm the route is called

            try {
                const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
                console.log("🔑 Signing secret exists?", !!signingSecret);
                if (!signingSecret) {
                    console.error("❌ Missing signing secret");
                    return res
                        .status(503)
                        .json({ message: "Webhook secret is not provided" });
                }

                // Log headers to see if Clerk sends the signature headers
                console.log("📨 Headers:", req.headers);

                const payload = Buffer.isBuffer(req.body)
                    ? req.body.toString("utf8")
                    : String(req.body);
                console.log("📦 Raw body length:", payload.length);

                const request = new Request("http://internal/webhooks/clerk", {
                    method: "POST",
                    headers: new Headers(req.headers),
                    body: payload,
                });

                let evt;
                try {
                    evt = await verifyWebhook(request, { signingSecret });
                    console.log(
                        "✅ Verification succeeded, event type:",
                        evt.type,
                    );
                } catch (verifyError) {
                    console.error(
                        "❌ Verification failed:",
                        verifyError.message,
                    );
                    // Log the full error to see what went wrong
                    console.error(verifyError);
                    return res
                        .status(400)
                        .json({ message: "Webhook verification failed" });
                }

                if (
                    evt.type === "user.created" ||
                    evt.type === "user.updated"
                ) {
                    const u = evt.data;

                    const email =
                        u.email_addresses?.find(
                            (e) => e.id === u.primary_email_address_id,
                        )?.email_address ??
                        u.email_addresses?.[0]?.email_address;

                    const fullName =
                        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                        u.username ||
                        email?.split("@")[0];

                    await User.findOneAndUpdate(
                        { clerkId: u.id },
                        {
                            clerkId: u.id,
                            email,
                            fullName,
                            profilePic: u.image_url,
                        },
                        { new: true, upsert: true, setDefaultsOnInsert: true },
                    );
                }
                res.status(200).json({ received: true });
            } catch (error) {
                console.error("❌ Unexpected error:", error);
                res.status(400).json({
                    message: "Webhook verification failed",
                });
            }
        });
        // ...
        res.status(200).json({ received: true });
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        res.status(400).json({ message: "Webhook verification failed" });
    }
});

export default router;
