import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Tutorials() {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/tutorials");
        setVideos(res.data || []);
        setFilteredVideos(res.data || []);
      } catch (err) {
        console.error("Failed to load tutorials:", err);
        setError("Unable to load tutorials. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const getDurationLabel = (duration) => {
    if (!duration) return "";
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    const mins = match?.[1] ? match[1] : "0";
    const secs = match?.[2] ? match[2].padStart(2, "0") : "00";
    return `${mins}:${secs}`;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "All") setFilteredVideos(videos);
    else if (tab === "Videos") setFilteredVideos(videos.filter((v) => !v.isShort));
    else if (tab === "Shorts") setFilteredVideos(videos.filter((v) => v.isShort));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300 text-lg animate-pulse">
        Loading tutorials...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-8 py-5 rounded-xl shadow-lg text-center">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-6">
          🎥 YouLearn Tutorials
        </h1>

        {/* 🧭 Tabs */}
        <div className="flex justify-center mb-10">
          {["All", "Videos", "Shorts"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 mx-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                activeTab === tab
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tutorials Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-md max-w-3xl mx-auto">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              No {activeTab.toLowerCase()} available.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Check back soon for more uploads!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((v, index) => (
              <div
                key={v.videoId}
                onClick={() => setActiveVideo(v)}
                className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity"></div>

                  <span
                    className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-md font-semibold ${
                      v.isShort
                        ? "bg-yellow-400 text-black"
                        : "bg-teal-600 text-white"
                    }`}
                  >
                    {v.isShort ? "SHORT" : getDurationLabel(v.duration)}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400 mb-1 line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {v.description || "No description available."}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    📅 {new Date(v.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎬 Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative bg-white/95 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all duration-500 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-4 text-2xl text-red-500 font-bold hover:text-red-600 transition"
              onClick={() => setActiveVideo(null)}
            >
              ✕
            </button>

            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                title={activeVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-semibold text-teal-600 dark:text-teal-400 mb-3">
                {activeVideo.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                {activeVideo.description || "No description provided."}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Published:{" "}
                {new Date(activeVideo.publishedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tutorials;
