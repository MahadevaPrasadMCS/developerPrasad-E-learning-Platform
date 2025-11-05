import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Community() {
  const { token, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState("");

  const fetchThreads = async () => {
    const res = await api.get("/community");
    setThreads(res.data);
  };

  useEffect(() => { fetchThreads(); }, []);

  const handlePost = async () => {
    if (!token) return alert("Login to post!");
    await api.post(
      "/community",
      { message: newThread },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewThread("");
    fetchThreads();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center text-teal-600 mb-6">
        💬 Community Discussion
      </h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-8">
        <textarea
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          rows="3"
          placeholder="Share your thoughts..."
          value={newThread}
          onChange={(e) => setNewThread(e.target.value)}
        />
        <button
          onClick={handlePost}
          className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
        >
          Post
        </button>
      </div>

      {threads.length === 0 ? (
        <p className="text-center text-gray-500">No discussions yet.</p>
      ) : (
        <div className="space-y-4">
          {threads.map((t) => (
            <div key={t._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
              <p className="font-semibold text-teal-600">{t.user.name}</p>
              <p className="text-gray-800 dark:text-gray-200">{t.message}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Community;
