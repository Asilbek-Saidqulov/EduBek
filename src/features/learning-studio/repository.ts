/** EduBek — Learning Studio repository. */
import { db } from "@/lib/db";

// Learning Experiences
export const createExperience = (input: any) => db.learningExperience.create({ data: input });
export const findExperience = (id: string) => db.learningExperience.findUnique({ where: { id } });
export const findExperiences = (input: any) => { const { limit, ...where } = input; return db.learningExperience.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateExperience = (id: string, data: any) => db.learningExperience.update({ where: { id }, data });

// Sessions
export const createSession = (input: any) => db.experienceSession.create({ data: input });
export const findSession = (id: string) => db.experienceSession.findUnique({ where: { id } });
export const findSessions = (input: any) => { const { limit, ...where } = input; return db.experienceSession.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateSession = (id: string, data: any) => db.experienceSession.update({ where: { id }, data });

// Simulation Configs
export const createSimulation = (input: any) => db.simulationConfig.create({ data: input });
export const findSimulation = (id: string) => db.simulationConfig.findUnique({ where: { id } });
export const findSimulations = (input: any) => { const { limit, ...where } = input; return db.simulationConfig.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Virtual Lab Configs
export const createVirtualLab = (input: any) => db.virtualLabConfig.create({ data: input });
export const findVirtualLab = (id: string) => db.virtualLabConfig.findUnique({ where: { id } });
export const findVirtualLabs = (input: any) => { const { limit, ...where } = input; return db.virtualLabConfig.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Programming Workspaces
export const createProgramming = (input: any) => db.programmingWorkspace.create({ data: input });
export const findProgramming = (id: string) => db.programmingWorkspace.findUnique({ where: { id } });
export const findProgrammings = (input: any) => { const { limit, ...where } = input; return db.programmingWorkspace.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Tutor Avatar Configs
export const createTutorAvatar = (input: any) => db.tutorAvatarConfig.create({ data: input });
export const findTutorAvatar = (id: string) => db.tutorAvatarConfig.findUnique({ where: { id } });
export const findTutorAvatars = (input: any) => { const { limit, ...where } = input; return db.tutorAvatarConfig.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Learning Worlds
export const createWorld = (input: any) => db.learningWorld.create({ data: input });
export const findWorld = (id: string) => db.learningWorld.findUnique({ where: { id } });
export const findWorlds = (input: any) => { const { limit, ...where } = input; return db.learningWorld.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Scenario Tasks
export const createScenario = (input: any) => db.scenarioTask.create({ data: input });
export const findScenario = (id: string) => db.scenarioTask.findUnique({ where: { id } });
export const findScenarios = (input: any) => { const { limit, ...where } = input; return db.scenarioTask.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Content Artifacts
export const createArtifact = (input: any) => db.contentArtifact.create({ data: input });
export const findArtifact = (id: string) => db.contentArtifact.findUnique({ where: { id } });
export const findArtifacts = (input: any) => { const { limit, ...where } = input; return db.contentArtifact.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Compositions
export const createComposition = (input: any) => db.experienceComposition.create({ data: input });
export const findComposition = (id: string) => db.experienceComposition.findUnique({ where: { id } });
export const findCompositions = (input: any) => { const { limit, ...where } = input; return db.experienceComposition.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
