/** EduBek — Learning Studio barrel export. Phase 5C.2. */
export {
  createExperience, getExperience, listExperiences, publishExperience,
  startSession, updateSessionProgress, completeSession, listSessions,
  generateSimulation, listSimulations, getSimulation,
  generateVirtualLab, listVirtualLabs,
  createProgrammingWorkspace, listProgrammingWorkspaces, gradeProgrammingSubmission,
  createTutorAvatar, listTutorAvatars,
  generateLearningWorld, listLearningWorlds,
  createScenario, listScenarios,
  generateContentArtifact, listContentArtifacts,
  composeExperience, getComposition, listCompositions, publishComposition,
} from "./service";

export type {
  ExperienceType, LearningExperienceDto, ExperienceSessionDto,
  SimulationConfigDto, VirtualLabConfigDto, ProgrammingWorkspaceDto,
  TutorAvatarConfigDto, LearningWorldDto, ScenarioTaskDto,
  ContentArtifactDto, ExperienceCompositionDto,
} from "./types";
