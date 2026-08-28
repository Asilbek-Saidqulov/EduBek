"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Plus,
  Users,
  Key,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  UserPlus,
  Trash2,
  Play,
  FileCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mascot } from "@/components/edubek/mascots";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ClassroomSummary {
  id: string;
  name: string;
  description?: string | null;
  grade?: string | null;
  subject?: string | null;
  joinCode?: string;
  status: string;
  teacherId: string;
  teacher: {
    id: string;
    name?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
  studentCount: number;
  assignmentCount: number;
  isTeacher: boolean;
}

interface ClassroomDetail extends ClassroomSummary {
  students?: Array<{
    id: string;
    studentId: string;
    student: {
      id: string;
      name?: string | null;
      username?: string | null;
      email?: string | null;
      avatarUrl?: string | null;
    };
    joinedAt: string;
  }>;
  assignments: Array<any>;
}

interface AssessmentOption {
  id: string;
  title: string;
  assessmentType: string;
  duration?: number | null;
  passingScore?: number | null;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ClassroomsClient() {
  const t = useTranslations("classrooms");
  const { user } = useCurrentUser();

  // Navigation & View State
  const [selectedClassroomId, setSelectedClassroomId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"assignments" | "students" | "analytics">("assignments");
  const [filterType, setFilterType] = React.useState<"all" | "teaching" | "enrolled">("all");

  // Data State
  const [classrooms, setClassrooms] = React.useState<ClassroomSummary[]>([]);
  const [classroomDetail, setClassroomDetail] = React.useState<ClassroomDetail | null>(null);
  const [analytics, setAnalytics] = React.useState<any | null>(null);
  const [publishedAssessments, setPublishedAssessments] = React.useState<AssessmentOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Modals & Forms State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Form Inputs
  const [newClassroomName, setNewClassroomName] = React.useState("");
  const [newClassroomSubject, setNewClassroomSubject] = React.useState("");
  const [newClassroomGrade, setNewClassroomGrade] = React.useState("");
  const [newClassroomDesc, setNewClassroomDesc] = React.useState("");
  const [joinCodeInput, setJoinCodeInput] = React.useState("");
  const [inviteIdentifier, setInviteIdentifier] = React.useState("");

  // Assignment Creation Inputs
  const [assignAssessmentId, setAssignAssessmentId] = React.useState("");
  const [assignTitle, setAssignTitle] = React.useState("");
  const [assignInstructions, setAssignInstructions] = React.useState("");
  const [assignDueAt, setAssignDueAt] = React.useState("");
  const [assignMaxAttempts, setAssignMaxAttempts] = React.useState(1);
  const [assignPoints, setAssignPoints] = React.useState(100);
  const [submitting, setSubmitting] = React.useState(false);

  // Active Quiz/Attempt Taking State
  const [activeTakingAssignment, setActiveTakingAssignment] = React.useState<any | null>(null);
  const [activeAttemptData, setActiveAttemptData] = React.useState<any | null>(null);
  const [userAnswers, setUserAnswers] = React.useState<Record<string, any>>({});
  const [attemptSubmitting, setAttemptSubmitting] = React.useState(false);
  const [gradedResult, setGradedResult] = React.useState<any | null>(null);

  // Load classrooms list
  const loadClassrooms = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ classrooms: ClassroomSummary[] }>("/api/classrooms");
      setClassrooms(res.classrooms ?? []);
    } catch (err: any) {
      setError(err?.message ?? t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  // Load selected classroom detail
  const loadClassroomDetail = React.useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await api.get<ClassroomDetail>(`/api/classrooms/${id}`);
      setClassroomDetail(data);

      if (data.isTeacher) {
        try {
          const analyticsRes = await api.get<any>(`/api/classrooms/${id}/analytics`);
          setAnalytics(analyticsRes);
        } catch {
          // ignore analytics error
        }

        try {
          const assessRes = await api.get<{ items: AssessmentOption[] }>("/api/assessments?pageSize=50");
          setPublishedAssessments(assessRes.items || []);
        } catch {
          // ignore assessments error
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load classroom details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedClassroomId) {
      loadClassroomDetail(selectedClassroomId);
    } else {
      setClassroomDetail(null);
      setAnalytics(null);
    }
  }, [selectedClassroomId, loadClassroomDetail]);

  // Handle Create Classroom
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroomName.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.post<ClassroomSummary>("/api/classrooms", {
        name: newClassroomName.trim(),
        subject: newClassroomSubject.trim() || undefined,
        grade: newClassroomGrade.trim() || undefined,
        description: newClassroomDesc.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewClassroomName("");
      setNewClassroomSubject("");
      setNewClassroomGrade("");
      setNewClassroomDesc("");
      await loadClassrooms();
      setSelectedClassroomId(created.id);
    } catch (err: any) {
      alert(err?.message || "Failed to create classroom");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Join Classroom
  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setSubmitting(true);
    try {
      const result = await api.post<{ classroom: any; message: string }>("/api/classrooms/join", {
        joinCode: joinCodeInput.trim(),
      });
      setShowJoinModal(false);
      setJoinCodeInput("");
      await loadClassrooms();
      if (result.classroom?.id) {
        setSelectedClassroomId(result.classroom.id);
      }
    } catch (err: any) {
      alert(err?.message || "Invalid or expired join code");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Regenerate Join Code
  const handleRegenerateCode = async () => {
    if (!classroomDetail) return;
    try {
      const res = await api.post<{ joinCode: string }>(`/api/classrooms/${classroomDetail.id}/regenerate-code`, {});
      setClassroomDetail((prev) => prev ? { ...prev, joinCode: res.joinCode } : null);
    } catch (err: any) {
      alert(err?.message || "Failed to regenerate join code");
    }
  };

  // Handle Copy Join Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomDetail || !assignAssessmentId) return;
    setSubmitting(true);
    try {
      await api.post("/api/assignments", {
        classroomId: classroomDetail.id,
        assessmentId: assignAssessmentId,
        title: assignTitle.trim() || undefined,
        instructions: assignInstructions.trim() || undefined,
        dueAt: assignDueAt ? new Date(assignDueAt).toISOString() : undefined,
        maxAttempts: Number(assignMaxAttempts) || 1,
        points: Number(assignPoints) || 100,
        status: "published",
      });
      setShowAssignModal(false);
      setAssignAssessmentId("");
      setAssignTitle("");
      setAssignInstructions("");
      setAssignDueAt("");
      setAssignMaxAttempts(1);
      setAssignPoints(100);
      await loadClassroomDetail(classroomDetail.id);
    } catch (err: any) {
      alert(err?.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Invite Student
  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomDetail || !inviteIdentifier.trim()) return;
    setSubmitting(true);
    try {
      const isEmail = inviteIdentifier.includes("@");
      await api.post(`/api/classrooms/${classroomDetail.id}/students`, {
        email: isEmail ? inviteIdentifier.trim() : undefined,
        username: !isEmail ? inviteIdentifier.trim() : undefined,
      });
      setShowInviteModal(false);
      setInviteIdentifier("");
      await loadClassroomDetail(classroomDetail.id);
    } catch (err: any) {
      alert(err?.message || "Failed to invite student. Verify the email or username exists.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Remove Student
  const handleRemoveStudent = async (studentId: string) => {
    if (!classroomDetail || !confirm("Remove this student from the classroom?")) return;
    try {
      await api.delete(`/api/classrooms/${classroomDetail.id}/students/${studentId}`);
      await loadClassroomDetail(classroomDetail.id);
    } catch (err: any) {
      alert(err?.message || "Failed to remove student");
    }
  };

  // Student Start/Resume Assignment
  const handleStartAssignment = async (assignment: any) => {
    try {
      const res = await api.post<any>(`/api/assignments/${assignment.id}/start`, {});
      setActiveTakingAssignment(assignment);
      setActiveAttemptData(res);
      setUserAnswers({});
      setGradedResult(null);
    } catch (err: any) {
      alert(err?.message || "Unable to start assignment");
    }
  };

  // Submit Quiz Responses
  const handleSubmitQuiz = async () => {
    if (!activeAttemptData || !activeTakingAssignment) return;
    if (!confirm("Are you sure you want to submit your assignment attempt?")) return;
    setAttemptSubmitting(true);
    try {
      const questions = activeAttemptData.assessment?.questions || [];
      const responses = questions.map((q: any) => ({
        questionId: q.questionId,
        answer: userAnswers[q.questionId] ?? null,
      }));

      const res = await api.post<any>(
        `/api/assignments/${activeTakingAssignment.id}/attempts/${activeAttemptData.attempt.id}/submit`,
        { responses },
      );
      setGradedResult(res);
      if (classroomDetail) {
        loadClassroomDetail(classroomDetail.id);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to submit attempt");
    } finally {
      setAttemptSubmitting(false);
    }
  };

  const filteredClassrooms = classrooms.filter((c) => {
    if (filterType === "teaching") return c.isTeacher;
    if (filterType === "enrolled") return !c.isTeacher;
    return true;
  });

  // ---------------------------------------------------------------------------
  // RENDER: ACTIVE QUIZ PLAYER VIEW
  // ---------------------------------------------------------------------------
  if (activeTakingAssignment && activeAttemptData) {
    const assessment = activeAttemptData.assessment;
    const questions = assessment?.questions || [];

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground mb-2"
              onClick={() => {
                if (gradedResult || confirm("Exit assignment player? Your in-progress answers are saved.")) {
                  setActiveTakingAssignment(null);
                  setActiveAttemptData(null);
                  setGradedResult(null);
                }
              }}
            >
              <ArrowLeft className="size-4" />
              Back to Classroom
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{activeTakingAssignment.title}</h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions · Passing score: {assessment?.passingScore ?? 60}%
            </p>
          </div>
          {assessment?.duration && !gradedResult && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 border border-amber-200 text-amber-900 text-sm font-medium">
              <Clock className="size-4 text-amber-600" />
              <span>Timed Assessment</span>
            </div>
          )}
        </div>

        {/* Post-submission Result Card */}
        {gradedResult ? (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {gradedResult.passed ? (
                  <CheckCircle2 className="size-8 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-8 text-amber-600" />
                )}
                <div>
                  <CardTitle className="text-xl font-bold">
                    {gradedResult.passed ? "Assessment Passed!" : "Assessment Completed"}
                  </CardTitle>
                  <CardDescription>
                    Score: {gradedResult.score}% ({gradedResult.pointsAwarded} / {gradedResult.pointsMax} points)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="rounded-lg bg-white p-4 border shadow-sm flex-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">Final Score</div>
                  <div className="text-2xl font-bold text-emerald-700">{gradedResult.score}%</div>
                </div>
                <div className="rounded-lg bg-white p-4 border shadow-sm flex-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">Result Status</div>
                  <div className="text-lg font-semibold mt-1">
                    <Badge variant={gradedResult.passed ? "default" : "secondary"}>
                      {gradedResult.passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => {
                    setActiveTakingAssignment(null);
                    setActiveAttemptData(null);
                    setGradedResult(null);
                  }}
                >
                  Return to Classroom
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active Question Form */
          <div className="space-y-6">
            {questions.map((q: any, idx: number) => {
              const payload = q.payload || {};
              const selectedVal = userAnswers[q.questionId];

              return (
                <Card key={q.questionId} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Question {idx + 1} of {questions.length}</Badge>
                      <span className="text-xs text-muted-foreground font-medium">{q.points || 1} point(s)</span>
                    </div>
                    <CardTitle className="text-base font-semibold mt-2">
                      {payload.prompt || payload.text || `Question ${idx + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Multiple Choice Options */}
                    {payload.options && Array.isArray(payload.options) && (
                      <div className="grid gap-2">
                        {payload.options.map((opt: any) => {
                          const isSelected = selectedVal === opt.id || selectedVal === opt.text;
                          return (
                            <button
                              key={opt.id || opt.text}
                              type="button"
                              onClick={() =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [q.questionId]: opt.id || opt.text,
                                }))
                              }
                              className={`flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-all ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-medium"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                                  isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40"
                                }`}
                              >
                                {isSelected ? "✓" : ""}
                              </div>
                              <span>{opt.text || opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True / False Options */}
                    {q.questionType === "true_false" && (
                      <div className="flex gap-3">
                        {["true", "false"].map((val) => {
                          const isSelected = selectedVal === val;
                          return (
                            <Button
                              key={val}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className="flex-1 capitalize"
                              onClick={() =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [q.questionId]: val,
                                }))
                              }
                            >
                              {val}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.questionType === "short_answer" && (
                      <Input
                        placeholder="Type your response here..."
                        value={selectedVal || ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [q.questionId]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Answered: {Object.keys(userAnswers).length} of {questions.length}
              </div>
              <Button
                size="lg"
                disabled={attemptSubmitting}
                onClick={handleSubmitQuiz}
                className="gap-2"
              >
                <FileCheck className="size-4" />
                {attemptSubmitting ? "Submitting..." : "Submit Assignment"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: CLASSROOM DETAIL VIEW (ASSIGNMENTS, ROSTER, ANALYTICS)
  // ---------------------------------------------------------------------------
  if (selectedClassroomId) {
    if (detailLoading) {
      return (
        <div className="container mx-auto max-w-6xl px-4 py-12 flex flex-col items-center justify-center">
          <Mascot name="book" size={64} className="animate-pulse text-muted-foreground/60 mb-4" />
          <p className="text-sm text-muted-foreground">Loading classroom...</p>
        </div>
      );
    }

    if (!classroomDetail) return null;

    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Detail Top Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground mb-2"
              onClick={() => setSelectedClassroomId(null)}
            >
              <ArrowLeft className="size-4" />
              All Classrooms
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{classroomDetail.name}</h1>
              <Badge variant={classroomDetail.status === "active" ? "default" : "secondary"}>
                {classroomDetail.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {classroomDetail.subject || "General"} · {classroomDetail.grade || "All Grades"} · Teacher:{" "}
              <span className="font-medium text-foreground">{classroomDetail.teacher.name || "Educator"}</span>
            </p>
          </div>

          {/* Teacher Action Controls & Join Code */}
          <div className="flex flex-wrap items-center gap-3">
            {classroomDetail.isTeacher && classroomDetail.joinCode && (
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 shadow-sm">
                <Key className="size-4 text-primary" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Join Code: </span>
                  <span className="font-mono font-bold tracking-wider">{classroomDetail.joinCode}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopyCode(classroomDetail.joinCode!)}
                  title="Copy join code"
                >
                  {copiedCode ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={handleRegenerateCode}
                  title="Regenerate join code"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            )}

            {classroomDetail.isTeacher && (
              <Button onClick={() => setShowAssignModal(true)} className="gap-2">
                <Plus className="size-4" />
                Assign Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("assignments")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "assignments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-4" />
            Assignments ({classroomDetail.assignments?.length || 0})
          </button>

          {classroomDetail.isTeacher && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "students"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-4" />
                Student Roster ({classroomDetail.students?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="size-4" />
                Classroom Analytics
              </button>
            </>
          )}
        </div>

        {/* TAB 1: ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            {classroomDetail.assignments?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Mascot name="notebook" size={64} className="text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-semibold">No assignments posted yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {classroomDetail.isTeacher
                      ? "Create an assignment to assign assessments to your students."
                      : "Your teacher has not published any assignments in this classroom yet."}
                  </p>
                  {classroomDetail.isTeacher && (
                    <Button onClick={() => setShowAssignModal(true)} className="mt-4 gap-2">
                      <Plus className="size-4" />
                      Assign Assessment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {classroomDetail.assignments.map((a: any) => {
                  const isTeacher = classroomDetail.isTeacher;
                  const effectiveDue = a.dueAt || a.dueDate;

                  return (
                    <Card key={a.id} className="transition-all hover:border-primary/50">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{a.title}</h3>
                            {isTeacher ? (
                              <Badge variant="outline" className="text-xs capitalize">
                                {a.visibility || a.status}
                              </Badge>
                            ) : (
                              <Badge
                                variant={
                                  a.studentStatus === "COMPLETED"
                                    ? "default"
                                    : a.studentStatus === "IN_PROGRESS"
                                    ? "secondary"
                                    : a.studentStatus === "OVERDUE"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {a.studentStatus}
                              </Badge>
                            )}
                          </div>
                          {a.instructions && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{a.instructions}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                            {effectiveDue && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                Due: {new Date(effectiveDue).toLocaleDateString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Award className="size-3.5" />
                              {a.points} Points Max
                            </span>
                            <span>Max Attempts: {a.maxAttempts}</span>
                          </div>
                        </div>

                        {/* Right side stats or action button */}
                        <div className="flex items-center gap-4">
                          {isTeacher && a.stats && (
                            <div className="flex items-center gap-4 text-xs text-right pr-4 border-r">
                              <div>
                                <div className="text-muted-foreground">Completed</div>
                                <div className="font-semibold text-sm">
                                  {a.stats.completedCount} / {a.stats.assignedCount}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Score</div>
                                <div className="font-semibold text-sm text-emerald-700">
                                  {a.stats.averageScore}%
                                </div>
                              </div>
                            </div>
                          )}

                          {!isTeacher && (
                            <div className="flex items-center gap-3">
                              {a.bestScore !== null && (
                                <div className="text-right text-xs mr-2">
                                  <div className="text-muted-foreground">Best Score</div>
                                  <div className="font-bold text-sm text-emerald-700">{a.bestScore}%</div>
                                </div>
                              )}
                              <Button
                                size="sm"
                                disabled={a.studentStatus === "UPCOMING" || a.studentStatus === "COMPLETED"}
                                onClick={() => handleStartAssignment(a)}
                                className="gap-1.5"
                              >
                                <Play className="size-3.5" />
                                {a.studentStatus === "IN_PROGRESS" ? "Resume Attempt" : "Start Assignment"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT ROSTER (Teacher View) */}
        {activeTab === "students" && classroomDetail.isTeacher && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Enrolled Students</h3>
              <Button size="sm" onClick={() => setShowInviteModal(true)} className="gap-2">
                <UserPlus className="size-4" />
                Invite Student
              </Button>
            </div>

            {classroomDetail.students?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Mascot name="pencil" size={64} className="text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-semibold">No students in this classroom yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Share the join code <span className="font-mono font-bold">{classroomDetail.joinCode}</span> or
                    invite students by email.
                  </p>
                  <Button size="sm" onClick={() => setShowInviteModal(true)} className="mt-4 gap-2">
                    <UserPlus className="size-4" />
                    Invite Student
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {classroomDetail.students?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {(s.student.name || s.student.username || "S")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.student.name || s.student.username}</div>
                          <div className="text-xs text-muted-foreground">{s.student.email || `@${s.student.username}`}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          Joined: {new Date(s.joinedAt).toLocaleDateString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveStudent(s.studentId)}
                          title="Remove student"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS (Teacher View) */}
        {activeTab === "analytics" && classroomDetail.isTeacher && analytics && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="text-xs font-medium text-muted-foreground">Active Students</div>
                <div className="text-2xl font-bold mt-1">{analytics.activeStudents}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-medium text-muted-foreground">Total Assignments</div>
                <div className="text-2xl font-bold mt-1">{analytics.totalAssignments}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-medium text-muted-foreground">Average Score</div>
                <div className="text-2xl font-bold mt-1 text-emerald-700">{analytics.averageScore}%</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-medium text-muted-foreground">Pass Rate</div>
                <div className="text-2xl font-bold mt-1 text-emerald-700">{analytics.passRate}%</div>
              </Card>
            </div>

            {analytics.recentActivity?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {analytics.recentActivity.map((item: any) => (
                      <div key={item.attemptId} className="flex items-center justify-between p-4 text-sm">
                        <div>
                          <span className="font-medium">{item.student?.name || item.student?.username}</span>
                          <span className="text-muted-foreground"> completed </span>
                          <span className="font-medium text-primary">{item.assessmentTitle}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={item.passed ? "default" : "secondary"}>
                            {item.score}% {item.passed ? "PASS" : "FAIL"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* MODAL: ASSIGN ASSESSMENT */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Assign Assessment to Classroom</CardTitle>
                <CardDescription>Select an assessment and configure submission rules.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateAssignment}>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Select Assessment *</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={assignAssessmentId}
                      onChange={(e) => {
                        setAssignAssessmentId(e.target.value);
                        const found = publishedAssessments.find((pa) => pa.id === e.target.value);
                        if (found) setAssignTitle(found.title);
                      }}
                      required
                    >
                      <option value="">-- Choose an assessment --</option>
                      {publishedAssessments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.assessmentType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Assignment Title</label>
                    <Input
                      placeholder="e.g. Unit 3 Quiz"
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Due Date (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={assignDueAt}
                      onChange={(e) => setAssignDueAt(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Max Attempts</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={assignMaxAttempts}
                        onChange={(e) => setAssignMaxAttempts(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Points</label>
                      <Input
                        type="number"
                        min="1"
                        value={assignPoints}
                        onChange={(e) => setAssignPoints(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Instructions (Optional)</label>
                    <Textarea
                      placeholder="Special notes or guidelines for students..."
                      value={assignInstructions}
                      onChange={(e) => setAssignInstructions(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
                <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
                  <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !assignAssessmentId}>
                    {submitting ? "Assigning..." : "Publish Assignment"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* MODAL: INVITE STUDENT */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Invite Student to Classroom</CardTitle>
                <CardDescription>Enter the student&apos;s registered email address or username.</CardDescription>
              </CardHeader>
              <form onSubmit={handleInviteStudent}>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Student Email or Username *
                    </label>
                    <Input
                      placeholder="student@example.com or username"
                      value={inviteIdentifier}
                      onChange={(e) => setInviteIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
                  <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !inviteIdentifier.trim()}>
                    {submitting ? "Inviting..." : "Add Student"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: PRIMARY CLASSROOMS LIST & DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Mascot name="notebook" size={56} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowJoinModal(true)} className="gap-2">
            <Key className="size-4" />
            Join with Code
          </Button>
          {user && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="size-4" />
              {t("createClassroom")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="mb-6 flex border-b">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterType === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Classrooms ({classrooms.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("teaching")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterType === "teaching" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Teaching ({classrooms.filter((c) => c.isTeacher).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("enrolled")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterType === "enrolled" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Enrolled ({classrooms.filter((c) => !c.isTeacher).length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12">
            <Mascot name="book" size={64} className="text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredClassrooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-16 text-center">
            <Mascot name="notebook" size={96} className="text-muted-foreground/40" />
            <div>
              <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setShowJoinModal(true)} className="gap-2">
                <Key className="size-4" />
                Join with Code
              </Button>
              {user && (
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="size-4" />
                  {t("createClassroom")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classroom grid */}
      {!loading && !error && filteredClassrooms.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((c) => (
            <Card
              key={c.id}
              onClick={() => setSelectedClassroomId(c.id)}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                        {c.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {c.grade || "All Grades"} · {c.subject || "General"}
                      </CardDescription>
                    </div>
                  </div>
                  {c.isTeacher ? (
                    <Badge variant="default" className="text-xs">Teacher</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Enrolled</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {c.studentCount} {t("students")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="size-3.5" />
                      {c.assignmentCount} {t("assignments")}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            {t("tipsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { mascot: "notebook" as const, title: t("tip1Title"), desc: t("tip1Desc") },
              { mascot: "pencil" as const, title: t("tip2Title"), desc: t("tip2Desc") },
              { mascot: "book" as const, title: t("tip3Title"), desc: t("tip3Desc") },
            ].map((tip, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Mascot name={tip.mascot} size={32} className="text-muted-foreground/60" />
                  <h4 className="text-sm font-semibold">{tip.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MODAL: CREATE CLASSROOM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Create New Classroom</CardTitle>
              <CardDescription>Setup your classroom to invite students and assign quizzes.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateClassroom}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Classroom Name *</label>
                  <Input
                    placeholder="e.g. Grade 9 Biology - Period 2"
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Subject</label>
                    <Input
                      placeholder="e.g. Biology"
                      value={newClassroomSubject}
                      onChange={(e) => setNewClassroomSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Grade</label>
                    <Input
                      placeholder="e.g. Grade 9"
                      value={newClassroomGrade}
                      onChange={(e) => setNewClassroomGrade(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description (Optional)</label>
                  <Textarea
                    placeholder="Brief description of this class..."
                    value={newClassroomDesc}
                    onChange={(e) => setNewClassroomDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !newClassroomName.trim()}>
                  {submitting ? "Creating..." : "Create Classroom"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: JOIN CLASSROOM */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Join Classroom</CardTitle>
              <CardDescription>Enter the 6-character join code provided by your teacher.</CardDescription>
            </CardHeader>
            <form onSubmit={handleJoinClassroom}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Classroom Join Code *</label>
                  <Input
                    placeholder="e.g. 7KP9X2"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="font-mono text-center tracking-widest text-lg font-bold uppercase"
                    maxLength={10}
                    required
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
                <Button type="button" variant="ghost" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !joinCodeInput.trim()}>
                  {submitting ? "Joining..." : "Join Classroom"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
