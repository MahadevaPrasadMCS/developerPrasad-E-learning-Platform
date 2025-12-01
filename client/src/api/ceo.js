// client/src/api/ceo.js
import api from "../utils/api";

// CEO Dashboard stats
export const fetchCeoStats = () => api.get("/ceo/stats");

// CEO – list users with filters / pagination
export const fetchCeoUsers = (params) =>
  api.get("/ceo/users", { params });

// CEO – update user role directly (final promotion/demotion)
export const updateUserRole = (userId, newRole) =>
  api.patch(`/ceo/roles/${userId}/role`, { newRole });

// Promotion queue for CEO
export const fetchPromotionRequests = (params) =>
  api.get("/promotions", { params });

// CEO-initiated promotion flow
export const ceoInitiatePromotion = (userId, requestedRole) =>
  api.post("/promotions/ceo-initiate", { userId, requestedRole });

// CEO – schedule interview
export const schedulePromotionInterview = (requestId, payload) =>
  api.patch(`/promotions/${requestId}/schedule-interview`, payload);

// CEO – set final result (pass/fail)
export const setPromotionResult = (requestId, result, ceoNotes) =>
  api.patch(`/promotions/${requestId}/result`, { result, ceoNotes });
