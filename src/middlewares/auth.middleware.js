import { getAuth } from "@clerk/express";
import User from "../models/user.model.js";

export async function protectRoute(req, res, next) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await User.findOne({ clerkId: userId });

        if (!userId) {
            res.status(404).json({ message: "User profile is not synced" });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Something is wrong in the protectRoute middleware");
        res.status(500).json({ message: "Enternal Server Error !" });
    }
}
