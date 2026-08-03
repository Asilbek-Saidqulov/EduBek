/** EduBek — Phase 5D.1 Research Platform tests. */
import { describe, it, expect } from "vitest";
import {
  queryResearchAssistant,
  createProject, getProject, listProjects, updateProjectStatus,
  addLiterature, getLiterature, listLiterature, searchLiteratureEntries,
  designExperiment, listExperiments,
  createDataset, getDataset, listDatasets, validateDatasetFairness,
  recordCitation, listCitations, validateCitations,
  assignReview, submitReview, listReviews,
  createPatentWorkspace, getPatent, listPatents, updatePatentStatus,
  createPublication, getPublication, listPublications, updatePublicationStatus,
  generateResearchAnalytics, getResearchAnalytics,
} from "@/features/research-platform";

const TEST_USER = `test-5d1-${Date.now()}`;
const TEST_ORG = `test-org-5d1-${Date.now()}`;

// ---------------------------------------------------------------------------
// AI Research Assistant
// ---------------------------------------------------------------------------

describe("AI Research Assistant", () => {
  it("responds to a research query with suggestions", async () => {
    const result = await queryResearchAssistant({
      query: "What is the impact of AI on student learning outcomes?",
    });
    expect(result.query).toBeTruthy();
    expect(result.response).toBeTruthy();
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Research Project Workspace
// ---------------------------------------------------------------------------

describe("Research Project Workspace", () => {
  it("creates + retrieves + lists + updates a project", async () => {
    const project = await createProject({
      title: `Test Project ${Date.now()}`, researchType: "experimental",
      field: "education", principalInvestigator: TEST_USER,
      teamMembers: [TEST_USER], organizationId: TEST_ORG,
      objectives: [{ id: "obj1", objective: "Measure AI impact", status: "pending" }],
      funding: { source: "NSF", amount: 50000, currency: "USD" },
    });
    expect(project.id).toBeTruthy();
    expect(project.status).toBe("proposal");
    expect(project.objectives.length).toBe(1);

    const retrieved = await getProject(project.id);
    expect(retrieved).toBeTruthy();

    const list = await listProjects({ principalInvestigator: TEST_USER });
    expect(list.length).toBeGreaterThan(0);

    const updated = await updateProjectStatus(project.id, "active");
    expect(updated.status).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Scientific Literature Intelligence
// ---------------------------------------------------------------------------

describe("Scientific Literature Intelligence", () => {
  it("adds + retrieves + lists + searches literature", async () => {
    const entry = await addLiterature({
      type: "paper", title: `AI in Education ${Date.now()}`,
      authors: [{ name: "Test Author", affiliation: "Test University" }],
      abstract: "This paper examines AI's impact on learning outcomes.",
      year: 2024, venue: "Journal of Educational Technology",
      doi: "10.1234/test.5678", keywords: ["AI", "education", "learning"],
      concepts: ["machine learning", "adaptive learning"],
    });
    expect(entry.id).toBeTruthy();
    expect(entry.type).toBe("paper");

    const retrieved = await getLiterature(entry.id);
    expect(retrieved).toBeTruthy();

    const list = await listLiterature({ type: "paper" });
    expect(list.length).toBeGreaterThan(0);

    const searchResults = await searchLiteratureEntries("AI", 5);
    expect(searchResults.length).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Experiment Designer
// ---------------------------------------------------------------------------

describe("Experiment Designer", () => {
  it("designs a controlled experiment with variables + reproducibility", async () => {
    const exp = await designExperiment({
      title: `A/B Test ${Date.now()}`, experimentType: "controlled",
      hypothesis: "AI tutoring improves test scores by 15%",
      variables: {
        independent: [{ name: "tutoring_type", type: "categorical", levels: ["AI", "human", "none"] }],
        dependent: [{ name: "test_score", type: "continuous", measurement: "percentage" }],
        control: [{ name: "class_size", value: "30" }],
      },
      sampleSize: 90,
      sampleSizeJustification: "30 per group × 3 groups = 90, powered at 0.8",
      measurements: [{ name: "test_score", instrument: "standardized_test", frequency: "post_intervention", unit: "percentage" }],
      risks: [{ risk: "Low engagement", severity: "medium", mitigation: "Gamification" }],
      aiGenerated: true,
    });
    expect(exp.id).toBeTruthy();
    expect(exp.variables.independent.length).toBe(1);
    expect(exp.variables.dependent.length).toBe(1);
    expect(exp.reproducibility.length).toBeGreaterThan(0);
    expect(exp.aiGenerated).toBe(true);

    const list = await listExperiments({ experimentType: "controlled" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Dataset Intelligence
// ---------------------------------------------------------------------------

describe("Dataset Intelligence", () => {
  it("creates + validates FAIR compliance for a dataset", async () => {
    const ds = await createDataset({
      name: `Test Dataset ${Date.now()}`,
      description: "Student performance data",
      schema: [{ name: "student_id", type: "string", required: true }, { name: "score", type: "number", unit: "percent", required: true }],
      data: [{ student_id: "s1", score: 85 }, { student_id: "s2", score: 92 }],
      format: "json", organizationId: TEST_ORG,
    });
    expect(ds.id).toBeTruthy();
    expect(ds.rowCount).toBe(2);
    expect(ds.sizeBytes).toBeGreaterThan(0);

    // Validate FAIR
    const fair = await validateDatasetFairness(ds.id);
    expect(fair).toHaveProperty("findable");
    expect(fair).toHaveProperty("accessible");
    expect(fair).toHaveProperty("interoperable");
    expect(fair).toHaveProperty("reusable");
    expect(fair).toHaveProperty("score");
    expect(fair.score).toBeGreaterThan(0);

    const list = await listDatasets({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Citation & Evidence Engine
// ---------------------------------------------------------------------------

describe("Citation & Evidence Engine", () => {
  it("records + lists + validates citations", async () => {
    // First add a literature entry to cite
    const lit = await addLiterature({
      type: "paper", title: `Cited Paper ${Date.now()}`,
      authors: [{ name: "Author" }], year: 2023,
    });

    const citation = await recordCitation({
      sourceType: "publication_draft", sourceId: "draft-1",
      literatureId: lit.id, citationType: "supports",
      context: "This finding aligns with...",
    });
    expect(citation.id).toBeTruthy();
    expect(citation.validationStatus).toBe("verified");
    expect(citation.formattedCitation).toBeTruthy();

    const list = await listCitations({ sourceType: "publication_draft", sourceId: "draft-1" });
    expect(list.length).toBeGreaterThan(0);

    const validation = await validateCitations("publication_draft", "draft-1");
    expect(validation.total).toBeGreaterThan(0);
    expect(validation.verified).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Peer Review Platform
// ---------------------------------------------------------------------------

describe("Peer Review Platform", () => {
  it("assigns + submits a peer review", async () => {
    const review = await assignReview({
      entityType: "publication_draft", entityId: "draft-review-test",
      reviewerId: TEST_USER, reviewerName: "Test Reviewer",
      reviewType: "double_blind",
    });
    expect(review.id).toBeTruthy();
    expect(review.status).toBe("assigned");

    const submitted = await submitReview({
      reviewId: review.id,
      rubricEvaluation: [
        { criterion: "Originality", score: 4, feedback: "Novel approach" },
        { criterion: "Methodology", score: 5, feedback: "Rigorous design" },
      ],
      overallScore: 4.5,
      recommendation: "minor_revision",
      reviewText: "The paper presents a novel approach with sound methodology. Minor revisions needed.",
      readinessScore: 0.8,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.overallScore).toBe(4.5);
    expect(submitted.recommendation).toBe("minor_revision");

    const list = await listReviews({ reviewerId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Innovation & Patent Workspace
// ---------------------------------------------------------------------------

describe("Innovation & Patent Workspace", () => {
  it("creates + updates a patent workspace", async () => {
    const patent = await createPatentWorkspace({
      title: `AI Tutoring Method ${Date.now()}`,
      description: "Novel method for adaptive AI tutoring",
      disclosure: "A system that uses...",
      inventors: [TEST_USER], organizationId: TEST_ORG,
    });
    expect(patent.id).toBeTruthy();
    expect(patent.status).toBe("disclosure");

    const filed = await updatePatentStatus(patent.id, "filed");
    expect(filed.status).toBe("filed");
    expect(filed.filedAt).toBeTruthy();

    const granted = await updatePatentStatus(patent.id, "granted", "US12345678");
    expect(granted.status).toBe("granted");
    expect(granted.patentNumber).toBe("US12345678");
    expect(granted.grantedAt).toBeTruthy();

    const list = await listPatents({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Publication Drafts
// ---------------------------------------------------------------------------

describe("Publication Drafts", () => {
  it("creates + retrieves + lists + updates a publication", async () => {
    const pub = await createPublication({
      title: `Test Paper ${Date.now()}`,
      abstract: "This paper presents findings on...",
      sections: [
        { id: "intro", name: "Introduction", content: "Introduction text...", wordCount: 500, status: "draft" },
        { id: "method", name: "Methodology", content: "Methods text...", wordCount: 800, status: "draft" },
      ],
      authors: [{ name: "Test Author", affiliation: "Test University", corresponding: true }],
      keywords: ["AI", "education"], targetVenue: "Journal of EdTech",
      publicationType: "journal_article", citationStyle: "apa",
      organizationId: TEST_ORG,
    });
    expect(pub.id).toBeTruthy();
    expect(pub.wordCount).toBe(1300);
    expect(pub.sections.length).toBe(2);

    const retrieved = await getPublication(pub.id);
    expect(retrieved).toBeTruthy();

    const list = await listPublications({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);

    const published = await updatePublicationStatus(pub.id, "published", "10.1234/test.pub", "https://journal.example.com/paper");
    expect(published.status).toBe("published");
    expect(published.doi).toBe("10.1234/test.pub");
  });
});

// ---------------------------------------------------------------------------
// Research Analytics
// ---------------------------------------------------------------------------

describe("Research Analytics", () => {
  it("generates + retrieves research analytics", async () => {
    const analytics = await generateResearchAnalytics(TEST_ORG);
    expect(analytics.organizationId).toBe(TEST_ORG);
    expect(analytics.publicationMetrics).toBeTruthy();
    expect(analytics.collaborationNetwork).toBeTruthy();
    expect(analytics.innovationMetrics).toBeTruthy();
    expect(analytics.aiSummary).toBeTruthy();
    expect(analytics.trends.length).toBeGreaterThan(0);

    const retrieved = await getResearchAnalytics(TEST_ORG);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.organizationId).toBe(TEST_ORG);
  });
});
