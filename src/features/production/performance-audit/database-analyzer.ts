/**
 * EduBek — Database Optimization Analyzer (System 2).
 *
 * Analyzes Prisma query patterns to detect:
 *   • N+1 queries
 *   • Missing includes
 *   • Unnecessary eager loading
 *   • Large payloads
 *   • Missing pagination
 *   • Duplicated queries
 *   • Repeated transactions
 *   • Inefficient ordering
 *   • Missing indexes
 *   • Expensive filtering
 *
 * Produces recommendations — never automatically rewrites queries.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  DatabaseOptimizationReport, NPlusOnePattern, MissingIncludePattern,
  EagerLoadingPattern, LargePayloadPattern, MissingPaginationPattern,
  DuplicatedQueryPattern, RepeatedTransactionPattern, InefficientOrderingPattern,
  MissingIndexPattern, ExpensiveFilteringPattern, OptimizationRecommendation,
} from "./types";

const log = getLogger("database-analyzer");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateDatabaseReport(): Promise<DatabaseOptimizationReport> {
  const generatedAt = new Date().toISOString();
  const [nPlusOne, missingIncludes, eagerLoading, largePayloads, missingPagination,
    duplicated, repeatedTx, inefficientOrder, missingIndexes, expensiveFilter] = await Promise.all([
    detectNPlusOne(),
    detectMissingIncludes(),
    detectUnnecessaryEagerLoading(),
    detectLargePayloads(),
    detectMissingPagination(),
    detectDuplicatedQueries(),
    detectRepeatedTransactions(),
    detectInefficientOrdering(),
    detectMissingIndexes(),
    detectExpensiveFiltering(),
  ]);
  const recommendations = generateDbRecommendations({
    nPlusOne, missingIncludes, eagerLoading, largePayloads,
    missingPagination, duplicated, missingIndexes, expensiveFilter,
  });
  log.info("database.audit_complete", {
    nPlusOne: nPlusOne.length, missingIncludes: missingIncludes.length,
    missingIndexes: missingIndexes.length, recommendations: recommendations.length,
  });
  return {
    generatedAt,
    nPlusOneQueries: nPlusOne, missingIncludes, unnecessaryEagerLoading: eagerLoading,
    largePayloads, missingPagination, duplicatedQueries: duplicated,
    repeatedTransactions: repeatedTx, inefficientOrdering: inefficientOrder,
    missingIndexes, expensiveFiltering: expensiveFilter,
    recommendations,
  };
}

// ===========================================================================
// Detectors
// ===========================================================================

async function detectNPlusOne(): Promise<NPlusOnePattern[]> {
  // N+1 = same model queried many times in a single trace, then a relation queried for each
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const byTrace = new Map<string, typeof samples>();
  for (const s of samples) {
    if (!byTrace.has(s.traceId)) byTrace.set(s.traceId, []);
    byTrace.get(s.traceId)!.push(s);
  }
  const patterns: NPlusOnePattern[] = [];
  for (const [traceId, traceSamples] of byTrace) {
    // Group by model+operation
    const byModelOp = new Map<string, number>();
    for (const s of traceSamples) {
      const key = `${s.model}:${s.operation}`;
      byModelOp.set(key, (byModelOp.get(key) ?? 0) + 1);
    }
    for (const [key, count] of byModelOp) {
      if (count >= 5) {
        const [model, operation] = key.split(":");
        patterns.push({
          model, relation: operation, occurrences: count, traceId,
          recommendation: `Trace ${traceId} issued ${count} ${operation} queries on ${model}. Use Prisma include() to fetch relations in a single query.`,
        });
      }
    }
  }
  return patterns.sort((a, b) => b.occurrences - a.occurrences).slice(0, 20);
}

async function detectMissingIncludes(): Promise<MissingIncludePattern[]> {
  // Missing includes = a query on model A, immediately followed by queries on model B where B is a relation of A
  const samples = repo.listQuerySamples();
  if (samples.length < 2) return [];
  const patterns: MissingIncludePattern[] = [];
  // Known relations (simplified — a full implementation would introspect the Prisma schema)
  const relations: Record<string, string[]> = {
    Classroom: ["ClassroomStudent", "Assignment"],
    Assignment: ["AssignmentAttempt", "Resource"],
    Assessment: ["AssessmentAttempt", "AssessmentQuestion"],
    User: ["ConceptMastery", "LearningGoal", "LearningSession"],
    Concept: ["ConceptRelationship", "ResourceConcept"],
    Resource: ["ResourceConcept", "Assignment"],
  };
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (a.traceId !== b.traceId) continue;
    const aRelations = relations[a.model];
    if (aRelations && aRelations.includes(b.model)) {
      // Same-trace sequential query on a related model — likely a missing include
      const existing = patterns.find(p => p.model === a.model && p.relation === b.model);
      if (existing) {
        existing.followUpQueries++;
      } else {
        patterns.push({
          model: a.model, relation: b.model, followUpQueries: 1,
          recommendation: `Queries on ${a.model} are followed by queries on ${b.model}. Add \`include: { ${b.model.toLowerCase()}: true }\` to the first query.`,
        });
      }
    }
  }
  return patterns.sort((a, b) => b.followUpQueries - a.followUpQueries).slice(0, 15);
}

async function detectUnnecessaryEagerLoading(): Promise<EagerLoadingPattern[]> {
  // Eager loading = queries that include many relations but the payload is large
  // We approximate by checking trace spans for queries with long serialization times
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 50, limit: 50 });
  const patterns: EagerLoadingPattern[] = [];
  const seen = new Set<string>();
  for (const s of spans) {
    if (s.module !== "database") continue;
    const attrs = repo.safeParse<Record<string, unknown>>(s.attributes, {});
    const model = String(attrs.model ?? "unknown");
    const relations = Array.isArray(attrs.relations) ? attrs.relations as string[] : [];
    const estimatedBytes = Number(attrs.payloadBytes ?? 0);
    if (relations.length > 0 && estimatedBytes > 10000 && !seen.has(model)) {
      seen.add(model);
      patterns.push({
        model, relations,
        estimatedPayloadBytes: estimatedBytes,
        recommendation: `${model} queries include ${relations.length} relation(s) with an estimated payload of ${(estimatedBytes / 1024).toFixed(1)}KB. Use select() to fetch only needed fields.`,
      });
    }
  }
  return patterns.slice(0, 10);
}

async function detectLargePayloads(): Promise<LargePayloadPattern[]> {
  // Reuse trace spans to find queries returning large payloads
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 100, limit: 50 });
  const patterns: LargePayloadPattern[] = [];
  for (const s of spans) {
    const attrs = repo.safeParse<Record<string, unknown>>(s.attributes, {});
    const rowCount = Number(attrs.rowCount ?? 0);
    const estimatedBytes = Number(attrs.payloadBytes ?? 0);
    if (rowCount > 100 || estimatedBytes > 100000) {
      patterns.push({
        model: String(attrs.model ?? "unknown"),
        estimatedBytes, rowCount,
        recommendation: `Query returned ${rowCount} rows (${(estimatedBytes / 1024).toFixed(1)}KB). Add pagination with take/skip.`,
      });
    }
  }
  return patterns.sort((a, b) => b.estimatedBytes - a.estimatedBytes).slice(0, 10);
}

async function detectMissingPagination(): Promise<MissingPaginationPattern[]> {
  // Queries that use findMany without take/limit and return many rows
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const patterns: MissingPaginationPattern[] = [];
  const byModel = new Map<string, number>();
  for (const s of samples) {
    if (s.operation === "findMany") {
      byModel.set(s.model, (byModel.get(s.model) ?? 0) + 1);
    }
  }
  for (const [model, count] of byModel) {
    if (count > 20) {
      patterns.push({
        model, operation: "findMany", rowCount: count,
        recommendation: `${count} findMany queries on ${model} detected. Ensure all list endpoints use pagination.`,
      });
    }
  }
  return patterns.sort((a, b) => b.rowCount - a.rowCount).slice(0, 10);
}

async function detectDuplicatedQueries(): Promise<DuplicatedQueryPattern[]> {
  // Same fingerprint appearing many times across traces
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const byFingerprint = new Map<string, { count: number; model: string; operation: string }>();
  for (const s of samples) {
    const existing = byFingerprint.get(s.fingerprint);
    if (existing) {
      existing.count++;
    } else {
      byFingerprint.set(s.fingerprint, { count: 1, model: s.model, operation: s.operation });
    }
  }
  const patterns: DuplicatedQueryPattern[] = [];
  for (const [, info] of byFingerprint) {
    if (info.count > 10) {
      patterns.push({
        model: info.model, operation: info.operation, count: info.count,
        recommendation: `Query on ${info.model} (${info.operation}) was executed ${info.count} times. Cache the result or batch the calls.`,
      });
    }
  }
  return patterns.sort((a, b) => b.count - a.count).slice(0, 10);
}

async function detectRepeatedTransactions(): Promise<RepeatedTransactionPattern[]> {
  // We can't directly detect transactions from samples, but we can flag
  // modules that make many sequential writes
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 50, limit: 50 });
  const byModule = new Map<string, number>();
  for (const s of spans) {
    if (s.operation.includes("transaction") || s.operation.includes("create") || s.operation.includes("update")) {
      byModule.set(s.module, (byModule.get(s.module) ?? 0) + 1);
    }
  }
  const patterns: RepeatedTransactionPattern[] = [];
  for (const [module, count] of byModule) {
    if (count > 5) {
      patterns.push({
        module, transactionCount: count,
        recommendation: `${module} executed ${count} write operations. Consider batching writes in a single transaction.`,
      });
    }
  }
  return patterns.slice(0, 10);
}

async function detectInefficientOrdering(): Promise<InefficientOrderingPattern[]> {
  // Check the Prisma schema for orderBy patterns on non-indexed columns
  // We approximate by reading the schema and flagging models with many orderBy usages
  const patterns: InefficientOrderingPattern[] = [];
  const schema = readPrismaSchema();
  const modelsWithIndexes = parseModelIndexes(schema);
  // Flag common ordering fields that might not be indexed
  const commonOrderFields = ["createdAt", "updatedAt", "name", "title", "priority"];
  for (const [model, indexedFields] of modelsWithIndexes) {
    for (const field of commonOrderFields) {
      if (!indexedFields.includes(field)) {
        // Check if the model has this field
        if (schema.includes(`model ${model}`) && schema.includes(field)) {
          patterns.push({
            model, field, hasIndex: false,
            recommendation: `${model} is likely ordered by ${field} but the field is not indexed. Add an index to speed up ordering.`,
          });
        }
      }
    }
  }
  return patterns.slice(0, 20);
}

async function detectMissingIndexes(): Promise<MissingIndexPattern[]> {
  // Reuse query samples to find frequently-filtered columns
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const byModelOp = new Map<string, number>();
  for (const s of samples) {
    if (s.operation === "findFirst" || s.operation === "findMany" || s.operation === "count") {
      const key = `${s.model}`;
      byModelOp.set(key, (byModelOp.get(key) ?? 0) + 1);
    }
  }
  const schema = readPrismaSchema();
  const modelsWithIndexes = parseModelIndexes(schema);
  const patterns: MissingIndexPattern[] = [];
  for (const [model, frequency] of byModelOp) {
    if (frequency > 10) {
      const indexedFields = modelsWithIndexes.get(model) ?? [];
      if (indexedFields.length < 2) {
        patterns.push({
          model, field: "(various)", queryFrequency: frequency,
          recommendation: `${model} is queried ${frequency} times but has only ${indexedFields.length} index(es). Add indexes for frequently-filtered columns.`,
        });
      }
    }
  }
  return patterns.sort((a, b) => b.queryFrequency - a.queryFrequency).slice(0, 15);
}

async function detectExpensiveFiltering(): Promise<ExpensiveFilteringPattern[]> {
  // Reuse trace spans to find slow queries (expensive filtering)
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 200, limit: 30 });
  const patterns: ExpensiveFilteringPattern[] = [];
  for (const s of spans) {
    if (s.module !== "database") continue;
    const attrs = repo.safeParse<Record<string, unknown>>(s.attributes, {});
    const filter = String(attrs.filter ?? "unknown");
    const scannedRows = Number(attrs.scannedRows ?? 0);
    if (scannedRows > 1000 || (s.durationMs ?? 0) > 500) {
      patterns.push({
        model: String(attrs.model ?? "unknown"),
        filter, scannedRows,
        recommendation: `Filter "${filter}" scanned ${scannedRows} rows. Add a composite index on the filtered columns.`,
      });
    }
  }
  return patterns.slice(0, 10);
}

// ===========================================================================
// Recommendation generator
// ===========================================================================

function generateDbRecommendations(input: {
  nPlusOne: NPlusOnePattern[];
  missingIncludes: MissingIncludePattern[];
  eagerLoading: EagerLoadingPattern[];
  largePayloads: LargePayloadPattern[];
  missingPagination: MissingPaginationPattern[];
  duplicated: DuplicatedQueryPattern[];
  missingIndexes: MissingIndexPattern[];
  expensiveFilter: ExpensiveFilteringPattern[];
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `db-${++id}`;
  if (input.nPlusOne.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Fix N+1 query patterns",
      description: `${input.nPlusOne.length} N+1 pattern(s) detected.`,
      impact: "high", effort: "low",
      recommendation: "Use Prisma's include() or select() to fetch relations in a single query.",
    });
  }
  if (input.missingIncludes.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Add missing includes",
      description: `${input.missingIncludes.length} missing-include pattern(s) detected.`,
      impact: "medium", effort: "low",
      recommendation: "Add include() to parent queries to avoid follow-up queries on relations.",
    });
  }
  if (input.missingIndexes.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Add missing database indexes",
      description: `${input.missingIndexes.length} model(s) are frequently queried but lack indexes.`,
      impact: "high", effort: "low",
      recommendation: "Add Prisma @@index directives for frequently-filtered and ordered columns.",
    });
  }
  if (input.missingPagination.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Add pagination to list endpoints",
      description: `${input.missingPagination.length} model(s) have many findMany calls without pagination.`,
      impact: "medium", effort: "low",
      recommendation: "Always use take/skip or cursor-based pagination for list endpoints.",
    });
  }
  if (input.largePayloads.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Reduce large query payloads",
      description: `${input.largePayloads.length} query pattern(s) return large payloads.`,
      impact: "medium", effort: "medium",
      recommendation: "Use select() to fetch only needed fields, and add pagination.",
    });
  }
  return recs;
}

// ===========================================================================
// Schema parsing helpers
// ===========================================================================

function readPrismaSchema(): string {
  try {
    return readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf-8");
  } catch {
    return "";
  }
}

function parseModelIndexes(schema: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const modelRegex = /model\s+(\w+)\s+\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields: string[] = [];
    // @@index fields
    const indexRegex = /@@index\[([^\]]+)\]/g;
    let idxMatch: RegExpExecArray | null;
    while ((idxMatch = indexRegex.exec(body)) !== null) {
      const fieldsStr = idxMatch[1];
      // Extract field names from [field1, field2]
      const fieldMatches = fieldsStr.matchAll(/(\w+)/g);
      for (const fm of fieldMatches) fields.push(fm[1]);
    }
    // @@unique fields
    const uniqueRegex = /@@unique\(([^\)]+)\)/g;
    while ((idxMatch = uniqueRegex.exec(body)) !== null) {
      const fieldsStr = idxMatch[1];
      const fieldMatches = fieldsStr.matchAll(/(\w+)/g);
      for (const fm of fieldMatches) fields.push(fm[1]);
    }
    // @id fields
    const idRegex = /(\w+)\s+\S+.*@id/;
    const idMatch = idRegex.exec(body);
    if (idMatch) fields.push(idMatch[1]);
    result.set(modelName, fields);
  }
  return result;
}
