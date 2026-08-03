/**
 * EduBek — Collaboration feature barrel export.
 *
 * Phase 4F.4: Collaborative Learning — Study Groups, Discussions,
 * Collaborative Notes, Classroom Intelligence, Organization
 * Intelligence, Peer Recommendations, Team Challenges, AI Teacher
 * Assistant, Mentorship, Announcements, Interventions, and the
 * Learning Network Graph.
 *
 * Everything is additive — no breaking changes to prior phases.
 */
// Study Groups
export {
  createStudyGroup,
  getStudyGroup,
  listStudyGroups,
  updateStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  listStudyGroupMembers,
  updateMemberRole,
  inviteUser,
  acceptInvitation,
  declineInvitation,
  listInvitations,
  getGroupLeaderboard,
  awardGroupXp,
} from "./study-groups";

// Discussions
export {
  createDiscussion,
  getDiscussion,
  listDiscussions,
  updateDiscussion,
  generateDiscussionSummary,
  createReply,
  listReplies,
  editReply,
  deleteReply,
  acceptAnswer,
  addReaction,
  removeReaction,
} from "./discussions";

// Collaborative Notes
export {
  createNote,
  getNote,
  listNotes,
  updateNote,
  listNoteVersions,
  getNoteVersion,
  revertToVersion,
  generateNoteSummary,
  addActiveEditor,
  removeActiveEditor,
} from "./notes";

// Network Graph
export {
  addCollaborationEdge,
  removeCollaborationEdge,
  getCollaborationNeighborhood,
  findTeachersForTopic,
  findUserStudyGroups,
} from "./network-graph";

// Classroom Intelligence
export {
  computeClassInsight,
  getClassInsight,
} from "./classroom-intelligence";

// Organization Intelligence
export {
  computeOrganizationInsight,
  getOrganizationInsight,
} from "./org-intelligence";

// Peer Recommendations
export {
  generatePeerRecommendations,
  listPeerRecommendations,
  updatePeerRecommendationStatus,
  requestMentorship,
} from "./peer-recommendations";

// Challenges
export {
  createChallenge,
  getChallenge,
  listChallenges,
  updateChallenge,
  joinChallenge,
  updateProgress,
  getChallengeLeaderboard,
  finalizeChallenge,
} from "./challenges";

// AI Teacher Assistant
export {
  generateTeacherRecommendations,
  listTeacherRecommendations,
  applyTeacherRecommendation,
  dismissTeacherRecommendation,
  createIntervention,
  listInterventions,
  resolveIntervention,
  createAnnouncement,
  listAnnouncements,
  publishAnnouncement,
} from "./ai-teacher-assistant";

// Types
export type {
  StudyGroupDto,
  StudyGroupMemberDto,
  GroupInvitationDto,
  GroupLeaderboardEntry,
  DiscussionDto,
  DiscussionReplyDto,
  CollaborativeNoteDto,
  CollaborativeNoteVersionDto,
  TeacherRecommendationDto,
  TeacherRecommendationType,
  InterventionDto,
  AnnouncementDto,
  LearningChallengeDto,
  ChallengeParticipationDto,
  ChallengeLeaderboardEntry,
  PeerRecommendationDto,
  PeerRecommendationType,
  MentorshipDto,
  AtRiskStudent,
  ClassInsightDto,
  OrganizationInsightDto,
  CollaborationEdgeType,
  NetworkNodeDto,
  NetworkEdgeDto,
  NetworkGraphDto,
} from "./types";
