/**
 * EduBek — Dataset Manager (System 9).
 *
 * Manages evaluation datasets: versioning, import, export, approval
 * workflow, dataset ownership, curriculum alignment, synthetic datasets,
 * and golden datasets.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  DatasetManagerReport, ManagedDataset, DatasetVersion, DatasetKind,
} from "./types";

const log = getLogger("dataset-manager");

export async function createDataset(input: {
  name: string;
  description?: string;
  kind?: DatasetKind;
  category: string;
  owner?: string | null;
  curriculumAlignment?: string[];
  tags?: string[];
}): Promise<ManagedDataset> {
  const row = await repo.createDataset(input);
  log.info("dataset.created", { id: row.id, name: input.name, kind: input.kind ?? "curated" });
  return mapDataset(row);
}

export async function getDataset(id: string): Promise<ManagedDataset | null> {
  const row = await repo.findDataset(id);
  return row ? mapDataset(row) : null;
}

export async function listDatasets(category?: string): Promise<ManagedDataset[]> {
  const rows = await repo.listDatasets(category);
  return rows.map(mapDataset);
}

export async function approveDatasetVersion(id: string, version: number, approvedBy: string): Promise<ManagedDataset | null> {
  const dataset = await getDataset(id);
  if (!dataset) return null;
  const versions = dataset.versions.map(v =>
    v.version === version ? { ...v, approved: true, approvedBy } : v
  );
  const row = await repo.updateDataset(id, { versions });
  log.info("dataset.version_approved", { id, version, approvedBy });
  return row ? mapDataset(row) : null;
}

export async function addDatasetVersion(id: string, input: {
  createdBy?: string | null;
  questionCount: number;
  notes?: string;
}): Promise<ManagedDataset | null> {
  const dataset = await getDataset(id);
  if (!dataset) return null;
  const newVersion: DatasetVersion = {
    version: dataset.currentVersion + 1,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy ?? null,
    approved: false,
    approvedBy: null,
    questionCount: input.questionCount,
    notes: input.notes ?? "",
  };
  const versions = [...dataset.versions, newVersion];
  const row = await repo.updateDataset(id, {
    currentVersion: newVersion.version,
    versions,
  });
  log.info("dataset.version_added", { id, version: newVersion.version });
  return row ? mapDataset(row) : null;
}

export function exportDataset(dataset: ManagedDataset): string {
  return JSON.stringify(dataset, null, 2);
}

export function importDataset(json: string): ManagedDataset {
  return JSON.parse(json) as ManagedDataset;
}

export async function generateDatasetManagerReport(): Promise<DatasetManagerReport> {
  const generatedAt = new Date().toISOString();
  const datasets = await listDatasets();
  const totalQuestions = datasets.reduce((s, d) => {
    const latest = d.versions[d.versions.length - 1];
    return s + (latest?.questionCount ?? 0);
  }, 0);
  const pendingApprovals = datasets.reduce((s, d) =>
    s + d.versions.filter(v => !v.approved).length, 0
  );
  log.info("dataset.manager_report", {
    datasets: datasets.length, totalQuestions, pendingApprovals,
  });
  return {
    generatedAt,
    datasets,
    totalDatasets: datasets.length,
    totalQuestions,
    pendingApprovals,
  };
}

function mapDataset(row: Awaited<ReturnType<typeof repo.createDataset>>): ManagedDataset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    kind: row.kind as DatasetKind,
    category: row.category,
    owner: row.owner,
    currentVersion: row.currentVersion,
    versions: repo.safeParse<DatasetVersion[]>(row.versions, []),
    curriculumAlignment: repo.safeParse(row.curriculumAlignment, []),
    tags: repo.safeParse(row.tags, []),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
