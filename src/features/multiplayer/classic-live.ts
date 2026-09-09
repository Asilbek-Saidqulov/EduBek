import type { Server as SocketIOServer, Socket } from "socket.io";
import { db } from "@/lib/db";

type ClassicQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

type ClassicPlayer = {
  id: string;
  name: string;
  score: number;
  correct: number;
  socket_id: string;
  answered: boolean;
  last_answer: number | null;
  join_time: number;
};

type ClassicSession = {
  code: string;
  session_id: string;
  title: string;
  mode: string;
  status: "waiting" | "playing" | "ended";
  questions: ClassicQuestion[];
  current_question: number;
  players: Record<string, ClassicPlayer>;
  teacherSocket?: string;
  timeLeft: number;
  timer?: ReturnType<typeof setInterval>;
  revealed: boolean;
  answer_stats: Record<number, number[]>;
  eliminated: Record<string, boolean>;
};

const DEFAULT_QUESTIONS: ClassicQuestion[] = [
  {
    question: "Which organelle produces most of the ATP in a cell?",
    options: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Nucleus"],
    correct_index: 1,
  },
  {
    question: "2x + 6 = 14. What is x?",
    options: ["2", "4", "6", "8"],
    correct_index: 1,
  },
  {
    question: "Toshkent O‘zbekiston poytaxtimi?",
    options: ["True", "False", "Sometimes", "Unknown"],
    correct_index: 0,
  },
  {
    question: "A queue is First-In, First-Out (FIFO).",
    options: ["True", "False", "Only in trees", "Only in stacks"],
    correct_index: 0,
  },
];

const activeSessions: Record<string, ClassicSession> = ((globalThis as any).__edubekClassicSessions ||=
  {}) as Record<string, ClassicSession>;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function ranking(session: ClassicSession) {
  return Object.values(session.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      name: p.name,
      score: p.score,
      correct: p.correct,
      eliminated: !!session.eliminated[p.socket_id],
    }));
}

async function persistSession(session: ClassicSession, status: string) {
  try {
    await db.liveSession.updateMany({
      where: { code: session.code },
      data: { status },
    });
  } catch (err: any) {
    console.error("[classic-live] session persist skipped:", err?.message);
  }
}

function sendQuestion(io: SocketIOServer, code: string) {
  const session = activeSessions[code];
  if (!session) return;
  const q = session.questions[session.current_question];
  if (!q) {
    void endGame(io, code);
    return;
  }

  Object.values(session.players).forEach((p) => {
    p.answered = !!session.eliminated[p.socket_id];
    p.last_answer = null;
  });
  session.revealed = false;
  session.timeLeft = 20;

  const payload = {
    index: session.current_question,
    total: session.questions.length,
    question: q.question,
    options: q.options,
    time: 20,
    mode: session.mode,
  };

  io.to(`teacher:${code}`).emit("game:question", payload);
  Object.entries(session.players).forEach(([sid]) => {
    if (!session.eliminated[sid]) io.to(sid).emit("game:question", payload);
  });

  if (session.timer) clearInterval(session.timer);
  session.timer = setInterval(() => {
    session.timeLeft -= 1;
    io.to(`session:${code}`).emit("game:timer", { time: session.timeLeft });
    if (session.timeLeft <= 0) {
      if (session.timer) clearInterval(session.timer);
      revealAnswer(io, code);
    }
  }, 1000);
}

function revealAnswer(io: SocketIOServer, code: string) {
  const session = activeSessions[code];
  if (!session || session.revealed) return;
  session.revealed = true;
  const q = session.questions[session.current_question];
  if (!q) return;

  io.to(`session:${code}`).emit("game:reveal", {
    correct_index: q.correct_index,
    stats: session.answer_stats[session.current_question] || [0, 0, 0, 0],
  });
  io.to(`session:${code}`).emit("game:ranking", { ranking: ranking(session) });

  setTimeout(() => {
    const sess = activeSessions[code];
    if (!sess || sess.status !== "playing") return;
    sess.current_question += 1;
    if (sess.current_question >= sess.questions.length) {
      void endGame(io, code);
    } else {
      sendQuestion(io, code);
    }
  }, 4000);
}

async function endGame(io: SocketIOServer, code: string) {
  const session = activeSessions[code];
  if (!session) return;
  session.status = "ended";
  if (session.timer) clearInterval(session.timer);
  await persistSession(session, "finished");

  const leaderboard = ranking(session).slice(0, 20).map((row) => ({
    ...row,
    total: session.questions.length,
  }));
  io.to(`session:${code}`).emit("game:end", {
    leaderboard,
    mode: session.mode,
    champion: leaderboard[0] ? { name: leaderboard[0].name, score: leaderboard[0].score } : null,
  });

  setTimeout(() => {
    delete activeSessions[code];
  }, 60 * 60 * 1000);
}

function ensureSession(code: string, extras?: { title?: string; mode?: string; questions?: ClassicQuestion[] }) {
  const key = code.trim().toUpperCase();
  if (!activeSessions[key]) {
    activeSessions[key] = {
      code: key,
      session_id: `live_${key}`,
      title: extras?.title || "Live quiz",
      mode: extras?.mode || "classic",
      status: "waiting",
      questions: extras?.questions?.length ? extras.questions : DEFAULT_QUESTIONS,
      current_question: 0,
      players: {},
      timeLeft: 20,
      revealed: false,
      answer_stats: {},
      eliminated: {},
    };
  }
  return activeSessions[key];
}

export function attachClassicLive(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    socket.on("teacher:create", (payload: { title?: string; mode?: string } = {}, cb?: Function) => {
      let code = generateCode();
      while (activeSessions[code]) code = generateCode();
      const session = ensureSession(code, { title: payload.title, mode: payload.mode });
      socket.join(`session:${code}`);
      socket.join(`teacher:${code}`);
      session.teacherSocket = socket.id;
      socket.data.code = code;
      socket.data.role = "teacher";
      const body = {
        code,
        questions_count: session.questions.length,
        players: Object.values(session.players),
      };
      socket.emit("teacher:joined", body);
      cb?.({ success: true, data: body });
    });

    socket.on("teacher:join", ({ code }: { code?: string }, cb?: Function) => {
      if (!code) {
        socket.emit("error", "Kod kerak");
        return cb?.({ error: "Kod kerak" });
      }
      const session = ensureSession(code);
      socket.join(`session:${session.code}`);
      socket.join(`teacher:${session.code}`);
      session.teacherSocket = socket.id;
      socket.data.code = session.code;
      socket.data.role = "teacher";
      const body = {
        code: session.code,
        questions_count: session.questions.length,
        players: Object.values(session.players),
      };
      socket.emit("teacher:joined", body);
      cb?.({ success: true, data: body });
    });

    socket.on("player:join", async ({ code, name }: { code?: string; name?: string }, cb?: Function) => {
      const key = String(code || "").trim().toUpperCase();
      const session = activeSessions[key];
      if (!session) {
        socket.emit("error", "Noto'g'ri kod");
        return cb?.({ error: "Noto'g'ri kod" });
      }
      if (session.status !== "waiting") {
        socket.emit("error", "O'yin allaqachon boshlangan");
        return cb?.({ error: "O'yin allaqachon boshlangan" });
      }
      const display = String(name || "").trim();
      if (!display) {
        socket.emit("error", "Ism kerak");
        return cb?.({ error: "Ism kerak" });
      }
      const taken = Object.values(session.players).some((p) => p.name.toLowerCase() === display.toLowerCase());
      if (taken) {
        socket.emit("error", "Bu ism band, boshqa ism tanlang");
        return cb?.({ error: "Bu ism band" });
      }

      const player: ClassicPlayer = {
        id: `p_${socket.id.slice(-6)}`,
        name: display,
        score: 0,
        correct: 0,
        socket_id: socket.id,
        answered: false,
        last_answer: null,
        join_time: Date.now(),
      };
      try {
        const row = await db.livePlayer.create({
          data: {
            sessionId: session.session_id,
            displayName: display,
            isGuest: true,
            score: 0,
          },
        });
        player.id = row.id;
      } catch {
        /* memory-only if the HTTP session row is missing */
      }

      session.players[socket.id] = player;
      socket.join(`session:${session.code}`);
      socket.data.code = session.code;
      socket.data.player_id = player.id;
      socket.data.role = "player";
      socket.emit("player:joined", { name: display, player_id: player.id, code: session.code });
      io.to(`teacher:${session.code}`).emit("player:new", {
        name: display,
        count: Object.keys(session.players).length,
      });
      cb?.({ success: true, player });
    });

    socket.on("teacher:start", async ({ code }: { code?: string }) => {
      const session = activeSessions[String(code || socket.data.code || "").toUpperCase()];
      if (!session) return socket.emit("error", "Sessiya topilmadi");
      if (Object.keys(session.players).length === 0) {
        return socket.emit("error", "Hech kim ulanmagan");
      }
      session.status = "playing";
      session.current_question = 0;
      await persistSession(session, "in_progress");
      sendQuestion(io, session.code);
    });

    socket.on("player:answer", async ({ code, answer_index }: { code?: string; answer_index?: number }) => {
      const session = activeSessions[String(code || socket.data.code || "").toUpperCase()];
      if (!session || session.status !== "playing") return;
      const player = session.players[socket.id];
      if (!player || player.answered) return;
      if (session.eliminated[socket.id]) return;
      const q = session.questions[session.current_question];
      if (!q) return;

      player.answered = true;
      player.last_answer = Number(answer_index);
      if (!session.answer_stats[session.current_question]) {
        session.answer_stats[session.current_question] = [0, 0, 0, 0];
      }
      if (answer_index !== undefined && answer_index >= 0 && answer_index <= 3) {
        session.answer_stats[session.current_question][answer_index] += 1;
      }

      const is_correct = Number(answer_index) === q.correct_index;
      const points = is_correct ? Math.max(100, Math.floor((session.timeLeft / 20) * 1000)) : 0;
      if (is_correct) {
        player.score += points;
        player.correct += 1;
      }

      try {
        await db.liveAnswer.create({
          data: {
            roundId: `${session.code}_${session.current_question}`,
            playerId: player.id,
            answer: String(answer_index),
            isCorrect: is_correct,
            pointsAwarded: points,
          },
        });
      } catch (err: any) {
        console.error("[classic-live] answer persist skipped:", err?.message);
      }

      socket.emit("player:answer_result", {
        is_correct,
        points,
        total_score: player.score,
        correct_index: is_correct ? q.correct_index : null,
      });

      const answered = Object.values(session.players).filter((p) => p.answered).length;
      const total = Object.keys(session.players).length;
      io.to(`teacher:${session.code}`).emit("teacher:answers_update", { answered, total });
      if (answered >= total) {
        if (session.timer) clearInterval(session.timer);
        revealAnswer(io, session.code);
      }
    });

    socket.on("teacher:reveal", ({ code }: { code?: string }) => {
      const session = activeSessions[String(code || socket.data.code || "").toUpperCase()];
      if (!session) return;
      if (session.timer) clearInterval(session.timer);
      revealAnswer(io, session.code);
    });

    socket.on("teacher:next", ({ code }: { code?: string }) => {
      const session = activeSessions[String(code || socket.data.code || "").toUpperCase()];
      if (!session) return;
      session.current_question += 1;
      if (session.current_question >= session.questions.length) {
        void endGame(io, session.code);
      } else {
        sendQuestion(io, session.code);
      }
    });

    socket.on("teacher:end", ({ code }: { code?: string }) => {
      const session = activeSessions[String(code || socket.data.code || "").toUpperCase()];
      if (!session) return;
      if (session.timer) clearInterval(session.timer);
      void endGame(io, session.code);
    });

    socket.on("disconnect", () => {
      const code = socket.data.code as string | undefined;
      if (!code || !activeSessions[code]) return;
      const session = activeSessions[code];
      if (session.players[socket.id]) {
        const name = session.players[socket.id].name;
        delete session.players[socket.id];
        io.to(`teacher:${code}`).emit("player:left", {
          name,
          count: Object.keys(session.players).length,
        });
      }
    });
  });
}

export function getClassicSession(code: string) {
  return activeSessions[String(code || "").trim().toUpperCase()];
}
