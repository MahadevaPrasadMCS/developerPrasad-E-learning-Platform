// client/src/config/roles.js

export const ROLES = {
  CEO: "ceo",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  MODERATOR: "moderator",
  STUDENT: "student",
};

// System Permissions
export const PERMISSIONS = {
  MANAGE_ADMINS: "manageAdmins",
  MANAGE_ROLES: "manageRoles",
  MANAGE_WALLET_SYSTEM: "manageWalletSystem",
  MANAGE_REWARDS: "manageRewards",
  VIEW_ADMIN_LOGS: "viewAdminLogs",
  VIEW_ANALYTICS: "viewAnalytics",
  MANAGE_USERS: "manageUsers",
  MANAGE_PROFILE_REQUESTS: "manageProfileRequests",
  APPROVE_CONTENT: "approveContent",
  MANAGE_QUIZZES: "manageQuizzes",
  MANAGE_RESOURCES: "manageResources",
  MANAGE_ANNOUNCEMENTS: "manageAnnouncements",
  MANAGE_COMMUNITY: "manageCommunity",
};

// Role defaults
export const DEFAULT_PERMISSIONS_BY_ROLE = {
  [ROLES.CEO]: {
    [PERMISSIONS.MANAGE_ADMINS]: true,
    [PERMISSIONS.MANAGE_ROLES]: true,
    [PERMISSIONS.MANAGE_WALLET_SYSTEM]: true,
    [PERMISSIONS.MANAGE_REWARDS]: true,
    [PERMISSIONS.VIEW_ADMIN_LOGS]: true,
    [PERMISSIONS.VIEW_ANALYTICS]: true,
  },

  [ROLES.ADMIN]: {
    [PERMISSIONS.MANAGE_USERS]: true,
    [PERMISSIONS.MANAGE_PROFILE_REQUESTS]: true,
    [PERMISSIONS.APPROVE_CONTENT]: true,
    [PERMISSIONS.VIEW_ANALYTICS]: true,
    [PERMISSIONS.VIEW_ADMIN_LOGS]: true,
  },

  [ROLES.INSTRUCTOR]: {
    [PERMISSIONS.MANAGE_QUIZZES]: true,
    [PERMISSIONS.MANAGE_RESOURCES]: true,
  },

  [ROLES.MODERATOR]: {
    [PERMISSIONS.MANAGE_COMMUNITY]: true,
  },

  [ROLES.STUDENT]: {},
};
