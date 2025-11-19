// db.js
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    console.log("⏳ Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://mahadevaprasadcs23_db_user:Coder%402026@cluster0.zz0shxl.mongodb.net/?appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    console.log("🔁 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
}

export default mongoose;
