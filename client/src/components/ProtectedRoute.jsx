import React from "react";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ element }) {
  const { token } = useAuth();

  if (!token)
    return (
      <p className="text-center mt-10 text-gray-500">
        Please login to access this page.
      </p>
    );

  return element;
}

export default ProtectedRoute;
