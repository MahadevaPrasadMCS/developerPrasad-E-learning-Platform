import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Tutorials() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/tutorials");
        setVideos(res.data || []);
      } catch (err) {
        console.error("Failed to load tutorials:", err);
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300 text-lg animate-pulse">
        Loading tutorials...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
        🎥 YouLearn Tutorials
      </h1>

      {/* Tutorials Grid */}
      {videos.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No tutorials available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {videos.map((v, index) => (
            <div
              key={v.videoId}
              onClick={() => setActiveVideo(v)}
              className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in"
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

              {/* Video Info */}
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

      {/* Video Modal */}
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

            {/* Embedded Video */}
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

            {/* Modal Info */}
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-teal-600 dark:text-teal-400 mb-3">
                {activeVideo.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {activeVideo.description || "No description available."}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Published: {new Date(activeVideo.publishedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tutorials;
