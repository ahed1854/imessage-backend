import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";

const router = express.Router();

router.post("/", async (req, res) => {
    console.log("✅ Webhook route hit"); // now you'll see this

    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        if (!signingSecret) {
            console.error("❌ Missing signing secret");
            return res
                .status(503)
                .json({ message: "Webhook secret is not provided" });
        }

        const payload = Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : String(req.body);
        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        const evt = await verifyWebhook(request, { signingSecret });
        console.log(`📌 Event type: ${evt.type}`);

        if (evt.type === "user.created" || evt.type === "user.updated") {
            const u = evt.data;
            const email =
                u.email_addresses?.find(
                    (e) => e.id === u.primary_email_address_id,
                )?.email_address ?? u.email_addresses?.[0]?.email_address;
            const fullName =
                [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                u.username ||
                email?.split("@")[0];

            console.log(
                `📝 Saving user: clerkId=${u.id}, email=${email}, fullName=${fullName}`,
            );

            const result = await User.findOneAndUpdate(
                { clerkId: u.id },
                { clerkId: u.id, email, fullName, profilePic: u.image_url },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            );
            console.log(`✅ User saved/updated: ${result}`);
        }

        if (evt.type === "user.deleted") {
            if (evt.data.id) {
                await User.findOneAndDelete({ clerkId: evt.data.id });
                console.log(`🗑️ Deleted user: ${evt.data.id}`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("❌ Error in Clerk webhook:", error);
        // log full error stack
        console.error(error);
        res.status(400).json({ message: "Webhook verification failed" });
    }
});

export default router;
