/** Social Platform service — composes all 20 systems. */
export {
  createProfile, getSocialProfile, listAllProfiles, updateProfile, verifyProfile,
} from "./profiles-friends";

export {
  sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest,
  removeFriend, setFriendCategory, getFriends, getPendingRequests, getSentRequests,
  getMutualFriends, blockUser, muteUser, getBlockedUsers, getMutedUsers,
  isBlocked, isMuted, getFriendshipById, listAllFriendships,
} from "./profiles-friends";

export {
  createClub, getClubById, listClubs, joinClub, leaveClub,
  applyToClub, inviteToClub, getClubApplications, getClubInvitations,
  getClubMembers, getUserClubs, freezeClub, lockClub, verifyClub,
  ROLE_PERMISSIONS, assignRole, getRole, hasPermission,
  createTeam, getTeamById, listTeams, addTeamMember, removeTeamMember,
  transferCaptain, inviteToTeam, getTeamInvitations, addTournamentRef, disbandTeam,
  createChallenge, getChallengeById, listChallenges, joinChallenge,
  updateChallengeProgress, cancelChallenge,
} from "./clubs-teams";

export {
  setPresence, getPresenceForUser, getOnlineUsers, getPresenceByStatus,
  setRichPresence, goOffline, isOnline, getPresenceCount,
  initReputation, getReputationForUser, listAllReputations,
  awardReputation, addReport, addWarning, applyDecay,
  getTopReputableUsers, getReputationByCategory,
} from "./presence-reputation";

export {
  recordActivity, getActivityFeed, getActivityFeedFiltered,
  getFriendsActivityFeed, getRecentActivity,
  generateDiscovery,
  generateSocialAnalytics,
  generateRanking,
} from "./activity-discovery";

export {
  setPrivacySettings, getPrivacy, setProfileVisibility, canViewProfile, setMinorProtections,
  fileReport, getReportById, listReports, reviewReport, escalateReport, dismissReport,
  fileAppeal, reviewAppeal, listAppeals,
  setTeacherControls, getTeacherControlRecord, logTeacherAction,
  generateCommunityDashboard,
  computeClubHealth, getClubHealth, getAllClubHealth,
  getDeveloperIntegration,
} from "./moderation-dashboard";

export {
  subscribeSocialPlatform, unsubscribeSocialPlatform,
  isSocialPlatformSubscribed, getBridgeProcessedCount,
  publishSocialEvent,
  _resetBridgeForTesting,
} from "./event-bus-bridge";

export { _resetRepositoryForTesting } from "./repository";
