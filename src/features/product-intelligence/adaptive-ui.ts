/**
 * EduBek — Adaptive Interface.
 *
 * Phase 5D.5 System 7: UI metadata only. The backend computes
 * recommended widgets, collapsed sections, important cards, dashboard
 * ordering, and quick actions based on role, activity, behavior,
 * learning goals, and product memory.
 *
 * The frontend consumes this metadata and renders accordingly. No
 * business logic is duplicated — we reuse the unified context and
 * product memory.
 */
import { getLogger } from "@/lib/logger";
import type { AdaptiveInterface, AdaptiveWidget, AdaptiveCard, AdaptiveQuickAction } from "./types";
import type { UnifiedProductContext } from "./types";

const log = getLogger("adaptive-ui");

// ===========================================================================
// Public API
// ===========================================================================

export function computeAdaptiveInterface(context: UnifiedProductContext): AdaptiveInterface {
  const roles = context.user.roles;
  const isTeacher = roles.some(r => r.toLowerCase().includes("teacher"));
  const isStudent = roles.some(r => r.toLowerCase().includes("student"));
  const isAdmin = roles.some(r => r.toLowerCase().includes("admin") || r.toLowerCase().includes("superadmin"));

  const recommendedWidgets = pickWidgets(context, isTeacher, isStudent, isAdmin);
  const collapsedSections = pickCollapsedSections(context, isTeacher, isStudent, isAdmin);
  const importantCards = pickImportantCards(context);
  const dashboardOrder = pickDashboardOrder(context, isTeacher, isStudent, isAdmin);
  const quickActions = pickQuickActions(context, isTeacher, isStudent, isAdmin);
  const rationale = computeRationale(context, isTeacher, isStudent, isAdmin);

  log.debug("adaptive_ui.computed", { userId: context.user.id, widgets: recommendedWidgets.length });
  return {
    recommendedWidgets,
    collapsedSections,
    importantCards,
    dashboardOrder,
    quickActions,
    rationale,
  };
}

// ===========================================================================
// Widget pickers
// ===========================================================================

function pickWidgets(ctx: UnifiedProductContext, isTeacher: boolean, isStudent: boolean, isAdmin: boolean): AdaptiveWidget[] {
  const widgets: AdaptiveWidget[] = [];

  if (isTeacher) {
    widgets.push({ id: "grading_queue", type: "queue", title: "Grading Queue", size: "medium", priority: 95 });
    widgets.push({ id: "at_risk_students", type: "alert_list", title: "At-Risk Students", size: "medium", priority: 90 });
    widgets.push({ id: "upcoming_classes", type: "calendar", title: "Upcoming Classes", size: "small", priority: 70 });
    widgets.push({ id: "ai_suggestions", type: "suggestions", title: "AI Teaching Suggestions", size: "medium", priority: 75 });
  }
  if (isStudent) {
    widgets.push({ id: "learning_plan", type: "plan", title: "Today's Plan", size: "large", priority: 95 });
    widgets.push({ id: "streak", type: "stat", title: "Streak", size: "small", priority: 80 });
    widgets.push({ id: "recommendations", type: "recommendations", title: "Recommended for You", size: "medium", priority: 85 });
    widgets.push({ id: "mastery", type: "mastery_chart", title: "Mastery Progress", size: "medium", priority: 75 });
  }
  if (isAdmin) {
    widgets.push({ id: "org_kpis", type: "kpis", title: "Organization KPIs", size: "full", priority: 100 });
    widgets.push({ id: "alerts", type: "alerts", title: "Platform Alerts", size: "medium", priority: 90 });
    widgets.push({ id: "twin_health", type: "twin_health", title: "Twin Health", size: "medium", priority: 80 });
  }

  // Context-aware additions
  if (ctx.notifications.highPriority > 0) {
    widgets.push({ id: "urgent_notifications", type: "notifications", title: "Urgent Notifications", size: "small", priority: 99 });
  }
  if (ctx.activeAssignments.asStudent > 0) {
    widgets.push({ id: "active_assignments", type: "assignments", title: "Active Assignments", size: "medium", priority: 88 });
  }
  if (ctx.aiHistory.sessionsToday > 0) {
    widgets.push({ id: "recent_ai", type: "ai_history", title: "Recent AI Sessions", size: "small", priority: 60 });
  }
  if (ctx.productMemory.favoriteViews.length > 0) {
    // Promote widgets the user has favorited
    for (const fav of ctx.productMemory.favoriteViews) {
      const w = widgets.find(w => w.id === fav);
      if (w) w.priority += 10;
    }
  }
  // Filter out hidden widgets
  const filtered = widgets.filter(w => !ctx.productMemory.hiddenWidgets.includes(w.id));
  // Sort by priority desc
  filtered.sort((a, b) => b.priority - a.priority);
  return filtered.slice(0, 8);
}

function pickCollapsedSections(ctx: UnifiedProductContext, _isTeacher: boolean, _isStudent: boolean, _isAdmin: boolean): string[] {
  const collapsed: string[] = [];
  // Collapse marketplace section if no sales
  if (ctx.productMemory.hiddenWidgets.includes("marketplace")) collapsed.push("marketplace");
  // Collapse research section if user has no active research
  // (we don't fetch research in the unified context — leave this to the frontend)
  return collapsed;
}

function pickImportantCards(ctx: UnifiedProductContext): AdaptiveCard[] {
  const cards: AdaptiveCard[] = [];
  if (ctx.notifications.highPriority > 0) {
    cards.push({
      id: "urgent_notifications_card",
      title: `${ctx.notifications.highPriority} urgent notification(s)`,
      kind: "alert", priority: 100, ttlSeconds: 0,
    });
  }
  if (ctx.learningGoals.overdueTasks > 0) {
    cards.push({
      id: "overdue_tasks_card",
      title: `${ctx.learningGoals.overdueTasks} overdue task(s)`,
      kind: "alert", priority: 95, ttlSeconds: 0,
    });
  }
  if (ctx.planner.burnoutRisk > 0.6) {
    cards.push({
      id: "burnout_warning_card",
      title: "You might be overworking — consider a break",
      kind: "insight", priority: 85, ttlSeconds: 60 * 60,
    });
  }
  if (ctx.aiHistory.sessionsToday === 0 && ctx.permissions.canUseAI) {
    cards.push({
      id: "try_ai_card",
      title: "Try AI to accelerate your work",
      kind: "suggestion", priority: 50, ttlSeconds: 24 * 60 * 60,
    });
  }
  return cards.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

function pickDashboardOrder(ctx: UnifiedProductContext, isTeacher: boolean, isStudent: boolean, isAdmin: boolean): string[] {
  // Default order based on role, then personalized by memory
  let order: string[];
  if (isAdmin) {
    order = ["org_kpis", "alerts", "twin_health", "grading_queue", "ai_suggestions"];
  } else if (isTeacher) {
    order = ["grading_queue", "at_risk_students", "upcoming_classes", "ai_suggestions", "recent_ai"];
  } else if (isStudent) {
    order = ["learning_plan", "streak", "recommendations", "mastery", "active_assignments"];
  } else {
    order = ["recommendations", "recent_ai", "streak"];
  }
  // Apply user's saved layout if present
  const savedOrder = ctx.productMemory.dashboardLayout.order as string[] | undefined;
  if (Array.isArray(savedOrder) && savedOrder.length > 0) {
    // Merge: saved order first, then any defaults not in saved
    const set = new Set(savedOrder);
    for (const w of order) if (!set.has(w)) savedOrder.push(w);
    return savedOrder;
  }
  return order;
}

function pickQuickActions(ctx: UnifiedProductContext, isTeacher: boolean, isStudent: boolean, _isAdmin: boolean): AdaptiveQuickAction[] {
  const actions: AdaptiveQuickAction[] = [];
  if (isTeacher && ctx.permissions.canCreate) {
    actions.push({ id: "new_lesson", label: "New Lesson", url: "/resources/new?type=lesson_plan", icon: "book", priority: 90 });
    actions.push({ id: "new_quiz", label: "New Quiz", url: "/assessments/new", icon: "clipboard", priority: 85 });
  }
  if (isStudent) {
    actions.push({ id: "study_now", label: "Study Now", url: "/planner", icon: "book-open", priority: 90 });
    actions.push({ id: "ask_ai", label: "Ask AI", url: "/ai", icon: "sparkles", priority: 80 });
  }
  if (ctx.permissions.canUseAI) {
    actions.push({ id: "ai_workspace", label: "AI Workspace", url: "/ai", icon: "sparkles", priority: 75 });
  }
  actions.push({ id: "notifications", label: "Notifications", url: "/notifications", icon: "bell", priority: 60 });
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

function computeRationale(ctx: UnifiedProductContext, isTeacher: boolean, isStudent: boolean, isAdmin: boolean): string {
  const parts: string[] = [];
  if (isAdmin) parts.push("admin role");
  else if (isTeacher) parts.push("teacher role");
  else if (isStudent) parts.push("student role");
  if (ctx.notifications.highPriority > 0) parts.push(`${ctx.notifications.highPriority} urgent notification(s)`);
  if (ctx.activeAssignments.asStudent > 0) parts.push(`${ctx.activeAssignments.asStudent} active assignment(s)`);
  if (ctx.productMemory.favoriteViews.length > 0) parts.push(`${ctx.productMemory.favoriteViews.length} favorited view(s)`);
  if (ctx.productMemory.hiddenWidgets.length > 0) parts.push(`${ctx.productMemory.hiddenWidgets.length} hidden widget(s)`);
  return `Layout based on: ${parts.join(", ")}.`;
}
