// server/routes/tutorialRoutes.js
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { YOUTUBE_API_KEY } = process.env;
    const channelId = "UC3-SPfd5eXr634xwk9Acung"; // your fixed channel ID
    const uploadsPlaylistId = "UU" + channelId.substring(2);

    // Step 1: get all videos in uploads playlist
    const playlistRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet,contentDetails",
          playlistId: uploadsPlaylistId,
          maxResults: 20,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const basicVideos = playlistRes.data.items.map((item) => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      publishedAt: item.contentDetails.videoPublishedAt,
    }));

    // Step 2: fetch details for durations
    const ids = basicVideos.map((v) => v.videoId).join(",");
    const detailsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "contentDetails",
          id: ids,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    // Step 3: attach durations and identify shorts
    const durationMap = {};
    detailsRes.data.items.forEach((v) => {
      durationMap[v.id] = v.contentDetails.duration;
    });

    const allVideos = basicVideos.map((v) => {
      const duration = durationMap[v.videoId] || "";
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const mins = match?.[1] ? parseInt(match[1]) : 0;
      const secs = match?.[2] ? parseInt(match[2]) : 0;
      const totalSecs = mins * 60 + secs;
      const isShort = totalSecs <= 60; // mark short videos but include them
      return { ...v, duration, totalSecs, isShort };
    });

    res.json(allVideos);
  } catch (err) {
    console.error("YouTube Fetch Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch YouTube tutorials" });
  }
});

module.exports = router;
