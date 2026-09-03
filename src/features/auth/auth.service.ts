import { db } from "@/lib/db";
import { conflict, unauthorized, forbidden } from "@/lib/errors";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { signSessionPayload } from "@/lib/session-token";
import {
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from "./auth.schema";

export async function generateUniqueUsername(base: string): Promise<string> {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  const prefix = sanitized.length >= 3 ? sanitized : "user";

  const existing = await (db as any).user.findUnique({
    where: { username: prefix },
  });
  if (!existing) {
    return prefix;
  }

  for (let i = 0; i < 10; i++) {
    const candidate = `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;
    const found = await (db as any).user.findUnique({
      where: { username: candidate },
    });
    if (!found) {
      return candidate;
    }
  }
  return `${prefix}_${Date.now().toString(36)}`;
}

export function buildSessionTokens(user: {
  id: string;
  email: string;
  roles: string[];
}) {
  const sessionId = randomBytes(24).toString("hex");
  const refreshToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const sessionToken = signSessionPayload({
      userId: user.id,
      email: user.email,
      platformRoles: user.roles,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    });

  const sessionTokenHash = createHash("sha256")
    .update(sessionToken)
    .digest("hex");
  const refreshTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return {
    sessionToken,
    refreshToken,
    sessionTokenHash,
    refreshTokenHash,
    expiresAt,
  };
}

export async function registerUser(
  input: RegisterInput & { userAgent?: string; ipAddress?: string }
) {
  const email = input.email.trim().toLowerCase();

  // Check if email already exists
  const existingUser = await (db as any).user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw conflict(
      "User with this email already exists",
      undefined,
      "errors.alreadyExists"
    );
  }

  // Handle username
  let username = input.username?.trim();
  if (username) {
    const existingUsername = await (db as any).user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw conflict(
        "Username is already taken",
        undefined,
        "errors.alreadyExists"
      );
    }
  } else {
    username = await generateUniqueUsername(input.name || email.split("@")[0]);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, 10);
  const primaryRole = input.role === "teacher" ? "teacher" : "student";

  // Create user with profile, default role, and wallet
  const createdUser = await (db as any).user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      username,
      locale: input.locale || "uz",
      country: input.country || "UZ",
      primaryRole,
      profile: {
        create: {
          displayName: input.name.trim(),
        },
      },
      roles: {
        create: [{ role: "user" }, { role: primaryRole }],
      },
      wallet: {
        create: {
          eduTokensBalance: 0,
          fiatBalance: 0,
          currency: "UZS",
        },
      },
    },
    include: {
      roles: true,
      profile: true,
    },
  });

  const roles =
    createdUser.roles?.map((r: any) => r.role.toUpperCase()) || ["STUDENT", "USER"];
  const platformRoles = roles.length > 0 ? roles : ["STUDENT"];

  const {
    sessionToken,
    refreshToken,
    sessionTokenHash,
    refreshTokenHash,
    expiresAt,
  } = buildSessionTokens({
    id: createdUser.id,
    email: createdUser.email,
    roles: platformRoles,
  });

  // Create UserSession record
  try {
    await (db as any).userSession.create({
      data: {
        userId: createdUser.id,
        sessionTokenHash,
        refreshTokenHash,
        expiresAt,
        userAgent: input.userAgent || null,
        ipHash: input.ipAddress
          ? createHash("sha256").update(input.ipAddress).digest("hex")
          : null,
      },
    });
  } catch (err) {
    console.warn("Failed to persist userSession record in db:", err);
  }

  return {
    session: {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        username: createdUser.username,
        roles: platformRoles,
        platformRoles,
        locale: createdUser.locale || "uz",
        country: createdUser.country || "UZ",
        avatarUrl: createdUser.avatarUrl,
      },
      sessionToken,
      refreshToken,
      expiresAt,
    },
  };
}

export async function loginUser(
  input: LoginInput & { userAgent?: string; ipAddress?: string }
) {
  const email = input.email.trim().toLowerCase();

  const user = await (db as any).user.findUnique({
    where: { email },
    include: {
      roles: true,
      profile: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw unauthorized(
      "Invalid email or password",
      undefined,
      "errors.invalidCredentials"
    );
  }

  if (user.isBanned) {
    throw forbidden(
      "This account has been banned",
      undefined,
      "errors.accountBanned"
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw unauthorized(
      "Invalid email or password",
      undefined,
      "errors.invalidCredentials"
    );
  }

  // Update last login
  try {
    await (db as any).user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIpHash: input.ipAddress
          ? createHash("sha256").update(input.ipAddress).digest("hex")
          : null,
      },
    });
  } catch (err) {
    console.warn("Failed to update lastLoginAt:", err);
  }

  const rawRoles =
    user.roles?.map((r: any) => r.role.toUpperCase()) || [];
  const platformRoles = rawRoles.length > 0 ? rawRoles : ["STUDENT", "USER"];

  const {
    sessionToken,
    refreshToken,
    sessionTokenHash,
    refreshTokenHash,
    expiresAt,
  } = buildSessionTokens({
    id: user.id,
    email: user.email,
    roles: platformRoles,
  });

  // Create UserSession record
  try {
    await (db as any).userSession.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        refreshTokenHash,
        expiresAt,
        userAgent: input.userAgent || null,
        ipHash: input.ipAddress
          ? createHash("sha256").update(input.ipAddress).digest("hex")
          : null,
      },
    });
  } catch (err) {
    console.warn("Failed to persist userSession record in db:", err);
  }

  return {
    session: {
      user: {
        id: user.id,
        email: user.email,
        name:
          user.name ||
          user.profile?.displayName ||
          user.email.split("@")[0],
        username: user.username || user.email.split("@")[0],
        roles: platformRoles,
        platformRoles,
        locale: user.locale || "uz",
        country: user.country || "UZ",
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      sessionToken,
      refreshToken,
      expiresAt,
    },
  };
}

export async function refreshSession(refreshToken?: string) {
  if (!refreshToken) {
    throw unauthorized(
      "Refresh token is required",
      undefined,
      "errors.unauthorized"
    );
  }

  const refreshTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await (db as any).userSession.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          roles: true,
          profile: true,
        },
      },
    },
  });

  if (!session || !session.user || session.user.isBanned) {
    throw unauthorized(
      "Invalid or expired refresh token",
      undefined,
      "errors.sessionExpired"
    );
  }

  // Revoke old session
  await (db as any).userSession
    .update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    })
    .catch(() => null);

  const rawRoles =
    session.user.roles?.map((r: any) => r.role.toUpperCase()) || [];
  const platformRoles = rawRoles.length > 0 ? rawRoles : ["STUDENT", "USER"];

  const {
    sessionToken: newSessionToken,
    refreshToken: newRefreshToken,
    sessionTokenHash: newSessionTokenHash,
    refreshTokenHash: newRefreshTokenHash,
    expiresAt,
  } = buildSessionTokens({
    id: session.user.id,
    email: session.user.email,
    roles: platformRoles,
  });

  await (db as any).userSession
    .create({
      data: {
        userId: session.user.id,
        sessionTokenHash: newSessionTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
        userAgent: session.userAgent,
        ipHash: session.ipHash,
      },
    })
    .catch(() => null);

  return {
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name:
          session.user.name || session.user.profile?.displayName,
        username: session.user.username,
        roles: platformRoles,
        platformRoles,
        locale: session.user.locale || "uz",
        avatarUrl: session.user.avatarUrl,
      },
      sessionToken: newSessionToken,
      refreshToken: newRefreshToken,
      expiresAt,
    },
  };
}

export async function logout(
  refreshToken?: string,
  sessionToken?: string
) {
  if (refreshToken) {
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await (db as any).userSession
      .updateMany({
        where: { refreshTokenHash },
        data: { revokedAt: new Date() },
      })
      .catch(() => null);
  }
  if (sessionToken) {
    const sessionTokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");
    await (db as any).userSession
      .updateMany({
        where: { sessionTokenHash },
        data: { revokedAt: new Date() },
      })
      .catch(() => null);
  }
  return { success: true };
}

export async function getCurrentUser(userId: string) {
  try {
    const user = await (db as any).user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: true,
        wallet: true,
      },
    });

    if (!user) {
      return null;
    }

    const rawRoles =
      user.roles?.map((r: any) => r.role.toUpperCase()) || [];
    const platformRoles = rawRoles.length > 0 ? rawRoles : ["STUDENT", "USER"];

    return {
      id: user.id,
      email: user.email,
      name:
        user.name ||
        user.profile?.displayName ||
        user.email.split("@")[0],
      username: user.username || user.email.split("@")[0],
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      locale: user.locale || "uz",
      roles: platformRoles,
      platformRoles,
      balanceEduTokens: user.wallet?.eduTokensBalance ?? 250,
      balanceFiat: user.wallet?.fiatBalance ?? 0,
      isCreator: platformRoles.includes("CREATOR"),
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput
) {
  if (input.username) {
    const existing = await (db as any).user.findFirst({
      where: {
        username: input.username,
        id: { not: userId },
      },
    });
    if (existing) {
      throw conflict(
        "Username is already taken",
        undefined,
        "errors.alreadyExists"
      );
    }
  }

  const updated = await (db as any).user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.country !== undefined && { country: input.country }),
    },
    include: {
      profile: true,
      roles: true,
      wallet: true,
    },
  });

  return getCurrentUser(updated.id);
}

export const login = loginUser;
export const register = registerUser;
