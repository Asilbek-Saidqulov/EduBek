export type BlackboardSectionType =
  | "concept"
  | "explanation"
  | "derivation"
  | "example"
  | "diagram"
  | "checkpoint"
  | "summary";

export interface DiagramData {
  diagramType:
    | "coordinate_graph"
    | "flowchart"
    | "geometry"
    | "circuit"
    | "hierarchy"
    | "custom_svg";
  svg: string;
  caption?: string;
}

export interface CheckpointData {
  checkpointId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answeredIndex?: number;
  isCorrect?: boolean;
}

export interface BlackboardSection {
  id: string;
  type: BlackboardSectionType;
  title: string;
  content: string;
  order: number;
  highlighted?: boolean;
  diagramData?: DiagramData;
  checkpointData?: CheckpointData;
  createdAt?: string;
}

export interface BlackboardDocument {
  id: string;
  title: string;
  subject?: string;
  topic?: string;
  sections: BlackboardSection[];
  updatedAt: string;
}

export interface BlackboardHistoryState {
  present: BlackboardDocument;
  past: BlackboardDocument[];
  future: BlackboardDocument[];
}

export type BlackboardAction =
  | {
      type: "SET_TITLE";
      payload: { title: string; subject?: string; topic?: string };
    }
  | {
      type: "ADD_SECTION";
      payload: {
        id?: string;
        type: BlackboardSectionType;
        title: string;
        content: string;
        highlighted?: boolean;
        diagramData?: DiagramData;
        checkpointData?: CheckpointData;
      };
    }
  | {
      type: "UPDATE_SECTION";
      payload: {
        id: string;
        title?: string;
        content?: string;
        type?: BlackboardSectionType;
        highlighted?: boolean;
        diagramData?: DiagramData;
        checkpointData?: CheckpointData;
      };
    }
  | {
      type: "DELETE_SECTION";
      payload: { id: string };
    }
  | {
      type: "HIGHLIGHT_SECTION";
      payload: { id: string; highlighted: boolean };
    }
  | {
      type: "INSERT_DIAGRAM";
      payload: {
        sectionId?: string;
        title: string;
        diagramType: DiagramData["diagramType"];
        svg: string;
        caption?: string;
      };
    }
  | {
      type: "INSERT_CHECKPOINT";
      payload: {
        checkpointId?: string;
        title?: string;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      };
    }
  | {
      type: "ANSWER_CHECKPOINT";
      payload: {
        checkpointId: string;
        answeredIndex: number;
      };
    }
  | {
      type: "SET_DOCUMENT";
      payload: BlackboardDocument;
    }
  | {
      type: "CLEAR_DOCUMENT";
    }
  | {
      type: "UNDO";
    }
  | {
      type: "REDO";
    };

const MAX_HISTORY_LENGTH = 30;

export function createEmptyDocument(
  title = "Untitled Lesson",
  subject = "General",
  topic = ""
): BlackboardDocument {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`,
    title,
    subject,
    topic,
    sections: [],
    updatedAt: new Date().toISOString(),
  };
}

export const createEmptyBlackboardDocument = createEmptyDocument;

export function createInitialHistoryState(initialDoc?: BlackboardDocument): BlackboardHistoryState {
  return {
    present: initialDoc || createEmptyDocument(),
    past: [],
    future: [],
  };
}

function updatePresent(
  state: BlackboardHistoryState,
  newPresent: BlackboardDocument
): BlackboardHistoryState {
  // Check if identical to prevent useless history bloating
  if (JSON.stringify(state.present) === JSON.stringify(newPresent)) {
    return state;
  }
  const newPast = [...state.past, state.present].slice(-MAX_HISTORY_LENGTH);
  return {
    past: newPast,
    present: { ...newPresent, updatedAt: new Date().toISOString() },
    future: [],
  };
}

export function blackboardReducer(
  state: BlackboardHistoryState,
  action: BlackboardAction
): BlackboardHistoryState {
  const current = state.present;

  switch (action.type) {
    case "SET_TITLE": {
      const updated: BlackboardDocument = {
        ...current,
        title: action.payload.title,
        subject: action.payload.subject ?? current.subject,
        topic: action.payload.topic ?? current.topic,
      };
      return updatePresent(state, updated);
    }

    case "ADD_SECTION": {
      const sectionId =
        action.payload.id ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

      // If a section with this id already exists, update it instead
      const existingIndex = current.sections.findIndex((s) => s.id === sectionId);
      if (existingIndex >= 0) {
        const updatedSections = [...current.sections];
        updatedSections[existingIndex] = {
          ...updatedSections[existingIndex],
          title: action.payload.title,
          content: action.payload.content,
          type: action.payload.type,
          highlighted: action.payload.highlighted ?? updatedSections[existingIndex].highlighted,
          diagramData: action.payload.diagramData ?? updatedSections[existingIndex].diagramData,
          checkpointData: action.payload.checkpointData ?? updatedSections[existingIndex].checkpointData,
        };
        return updatePresent(state, { ...current, sections: updatedSections });
      }

      const newSection: BlackboardSection = {
        id: sectionId,
        type: action.payload.type,
        title: action.payload.title,
        content: action.payload.content,
        order: current.sections.length + 1,
        highlighted: action.payload.highlighted ?? false,
        diagramData: action.payload.diagramData,
        checkpointData: action.payload.checkpointData,
        createdAt: new Date().toISOString(),
      };

      return updatePresent(state, {
        ...current,
        sections: [...current.sections, newSection],
      });
    }

    case "UPDATE_SECTION": {
      const targetIndex = current.sections.findIndex((s) => s.id === action.payload.id);
      if (targetIndex === -1) {
        // If not found, create it as a new section
        return blackboardReducer(state, {
          type: "ADD_SECTION",
          payload: {
            id: action.payload.id,
            type: action.payload.type ?? "explanation",
            title: action.payload.title ?? "Section",
            content: action.payload.content ?? "",
            highlighted: action.payload.highlighted,
            diagramData: action.payload.diagramData,
            checkpointData: action.payload.checkpointData,
          },
        });
      }

      const updatedSections = [...current.sections];
      const existing = updatedSections[targetIndex];
      updatedSections[targetIndex] = {
        ...existing,
        title: action.payload.title ?? existing.title,
        content: action.payload.content ?? existing.content,
        type: action.payload.type ?? existing.type,
        highlighted:
          action.payload.highlighted !== undefined
            ? action.payload.highlighted
            : existing.highlighted,
        diagramData: action.payload.diagramData ?? existing.diagramData,
        checkpointData: action.payload.checkpointData ?? existing.checkpointData,
      };

      return updatePresent(state, { ...current, sections: updatedSections });
    }

    case "DELETE_SECTION": {
      const filtered = current.sections
        .filter((s) => s.id !== action.payload.id)
        .map((s, idx) => ({ ...s, order: idx + 1 }));

      return updatePresent(state, { ...current, sections: filtered });
    }

    case "HIGHLIGHT_SECTION": {
      const updatedSections = current.sections.map((s) =>
        s.id === action.payload.id ? { ...s, highlighted: action.payload.highlighted } : s
      );
      return updatePresent(state, { ...current, sections: updatedSections });
    }

    case "INSERT_DIAGRAM": {
      const sectionId =
        action.payload.sectionId ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `diag_${Date.now()}`);

      const diagramSection: BlackboardSection = {
        id: sectionId,
        type: "diagram",
        title: action.payload.title,
        content: action.payload.caption ? `*${action.payload.caption}*` : "",
        order: current.sections.length + 1,
        diagramData: {
          diagramType: action.payload.diagramType,
          svg: action.payload.svg,
          caption: action.payload.caption,
        },
        createdAt: new Date().toISOString(),
      };

      return updatePresent(state, {
        ...current,
        sections: [...current.sections, diagramSection],
      });
    }

    case "INSERT_CHECKPOINT": {
      const checkpointId =
        action.payload.checkpointId ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `cp_${Date.now()}`);

      const checkpointSection: BlackboardSection = {
        id: checkpointId,
        type: "checkpoint",
        title: action.payload.title || "Interactive Concept Check",
        content: "",
        order: current.sections.length + 1,
        checkpointData: {
          checkpointId,
          question: action.payload.question,
          options: action.payload.options,
          correctIndex: action.payload.correctIndex,
          explanation: action.payload.explanation,
        },
        createdAt: new Date().toISOString(),
      };

      return updatePresent(state, {
        ...current,
        sections: [...current.sections, checkpointSection],
      });
    }

    case "ANSWER_CHECKPOINT": {
      const updatedSections = current.sections.map((s) => {
        if (s.type === "checkpoint" && s.checkpointData?.checkpointId === action.payload.checkpointId) {
          const isCorrect = action.payload.answeredIndex === s.checkpointData.correctIndex;
          return {
            ...s,
            checkpointData: {
              ...s.checkpointData,
              answeredIndex: action.payload.answeredIndex,
              isCorrect,
            },
          };
        }
        return s;
      });

      return updatePresent(state, { ...current, sections: updatedSections });
    }

    case "SET_DOCUMENT": {
      return updatePresent(state, action.payload);
    }

    case "CLEAR_DOCUMENT": {
      const blank = createEmptyDocument(current.title);
      blank.subject = current.subject;
      blank.topic = current.topic;
      return updatePresent(state, blank);
    }

    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    default:
      return state;
  }
}

/**
 * Applies a single tool call to a BlackboardDocument directly.
 */
export function applySingleToolCall(
  doc: BlackboardDocument,
  name: string,
  args: Record<string, any>
): BlackboardDocument {
  const dummyState: BlackboardHistoryState = {
    past: [],
    present: doc,
    future: [],
  };

  let action: BlackboardAction | null = null;

  switch (name) {
    case "set_title":
      action = {
        type: "SET_TITLE",
        payload: {
          title: args.title || doc.title,
          subject: args.subject !== undefined ? args.subject : doc.subject,
          topic: args.topic !== undefined ? args.topic : doc.topic,
        },
      };
      break;

    case "add_section":
      action = {
        type: "ADD_SECTION",
        payload: {
          id: args.id,
          type: args.type,
          title: args.title,
          content: args.content,
          highlighted: args.highlighted,
        },
      };
      break;

    case "update_section":
      action = {
        type: "UPDATE_SECTION",
        payload: {
          id: args.id,
          title: args.title,
          content: args.content,
          type: args.type,
          highlighted: args.highlighted,
        },
      };
      break;

    case "delete_section":
      action = {
        type: "DELETE_SECTION",
        payload: {
          id: args.id,
        },
      };
      break;

    case "highlight_section":
      action = {
        type: "HIGHLIGHT_SECTION",
        payload: {
          id: args.id,
          highlighted: args.highlighted,
        },
      };
      break;

    case "insert_diagram":
      action = {
        type: "INSERT_DIAGRAM",
        payload: {
          sectionId: args.sectionId,
          title: args.title,
          diagramType: args.diagramType,
          svg: args.svg,
          caption: args.caption,
        },
      };
      break;

    case "add_checkpoint":
      action = {
        type: "INSERT_CHECKPOINT",
        payload: {
          checkpointId: args.checkpointId,
          title: args.title,
          question: args.question,
          options: args.options,
          correctIndex: args.correctIndex,
          explanation: args.explanation,
        },
      };
      break;

    case "answer_checkpoint":
      action = {
        type: "ANSWER_CHECKPOINT",
        payload: {
          checkpointId: args.checkpointId,
          answeredIndex: args.answeredIndex,
        },
      };
      break;

    default:
      return doc;
  }

  const newState = blackboardReducer(dummyState, action);
  return newState.present;
}

/**
 * Sequentially applies an array of tool calls to a BlackboardDocument.
 */
export function applyToolCallsToDocument(
  initialDoc: BlackboardDocument,
  toolCalls: Array<{ name: string; args: Record<string, any> }>
): BlackboardDocument {
  let doc = initialDoc;
  for (const tc of toolCalls) {
    try {
      doc = applySingleToolCall(doc, tc.name, tc.args);
    } catch (e) {
      console.warn("Failed to apply tool call to document:", tc.name, e);
    }
  }
  return doc;
}

