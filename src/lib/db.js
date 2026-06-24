import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is required !!");
        }

        const conn = await mongoose.connect(mongoUri);

        // checking
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection Error: ", error.message);
        process.exit(1);
    }
}
