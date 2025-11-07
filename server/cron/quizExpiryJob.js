// cron/quizExpiryJob.js
import cron from "node-cron";
import Quiz from "../models/Quiz.js";

/**
 * This job runs every hour and automatically unpublishes
 * all quizzes whose endTime has already passed.
 */
export function startQuizExpiryJob() {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();

    try {
      const expiredQuizzes = await Quiz.find({
        status: "published",
        endTime: { $lt: now },
      });

      if (expiredQuizzes.length > 0) {
        const ids = expiredQuizzes.map((q) => q._id);
        await Quiz.updateMany({ _id: { $in: ids } }, { status: "draft" });

        console.log(`⏳ Auto-unpublished ${expiredQuizzes.length} expired quizzes.`);
      } else {
        console.log("✅ No expired quizzes found this hour.");
      }
    } catch (err) {
      console.error("❌ Error running quiz expiry job:", err.message);
    }
  });

  console.log("🚀 Quiz expiry cron job scheduled (runs every hour).");
}
