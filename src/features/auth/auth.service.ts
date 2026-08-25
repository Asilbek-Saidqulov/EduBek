import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { conflict, unauthorized, internalError, ApiError } from "@/lib/errors";
import { type LoginInput, type RegisterInput, type UpdateProfileInput } from "./auth.schema";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  hashIp,
  calculateExpiration,
  isUserBanned,
  normalizeEmail,
  normalizeUsername,
  getIpSalt,
} from "./auth.utils";

interface LoginResult {
  session: {
    user: any;
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

interface RegisterResult {
  session: {
    user: any;
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

export async function loginUser(input: LoginInput & {
  userAgent?: string;
  ipAddress?: string;
}): Promise<LoginResult> {
  const normalizedEmail = normalizeEmail(input.email);

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: true,
      },
    });

    // Generic error to prevent user enumeration
    if (!user) {
      throw unauthorized("Invalid credentials");
    }

    // Check if user has a password hash
    if (!user.passwordHash) {
      throw unauthorized("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw unauthorized("Invalid credentials");
    }

    // Check ban status
    if (isUserBanned(user.isBanned, user.bannedUntil)) {
      throw unauthorized("Account is banned");
    }

    // Generate secure tokens
    const sessionToken = generateSecureToken();
    const refreshToken = generateSecureToken();
    const sessionTokenHash = hashToken(sessionToken);
    const refreshTokenHash = hashToken(refreshToken);

    // Hash IP address if provided
    const ipHash = input.ipAddress
      ? hashIp(input.ipAddress, getIpSalt())
      : null;

    // Calculate expiration
    const sessionExpiresAt = calculateExpiration(7); // 7 days
    const refreshExpiresAt = calculateExpiration(30); // 30 days

    // Create session in database
    await db.userSession.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        refreshTokenHash,
        userAgent: input.userAgent,
        ipHash,
        expiresAt: refreshExpiresAt,
      },
    });

    // Update user's last login
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIpHash: ipHash || undefined,
      },
    });

    // Map roles to string array
    const platformRoles = user.roles
      .filter((role: any) => !role.expiresAt || new Date(role.expiresAt) > new Date())
      .map((role: any) => role.role);

    // Return safe user object
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      platformRoles: platformRoles.length > 0 ? platformRoles : ["STUDENT"],
    };

    return {
      session: {
        user: safeUser,
        sessionToken,
        refreshToken,
        expiresAt: sessionExpiresAt,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (
      error instanceof Error &&
      (error.message === "Invalid credentials" || error.message === "Account is banned")
    ) {
      throw error;
    }
    console.error("Login error:", error);
    throw internalError("Authentication failed");
  }
}


export async function registerUser(input: RegisterInput & {
  userAgent?: string;
  ipAddress?: string;
}): Promise<RegisterResult> {
  const normalizedEmail = normalizeEmail(input.email);

  try {
    // 1. Email uniqueness check
    const existingEmail = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      throw conflict("User with this email already exists");
    }

    // 2. Determine and validate username
    let normalizedUsername: string;
    if (input.username && input.username.trim().length > 0) {
      normalizedUsername = normalizeUsername(input.username);
      const existingUsername = await db.user.findUnique({
        where: { username: normalizedUsername },
      });

      if (existingUsername) {
        throw conflict("Username already taken");
      }
    } else {
      // Safely generate a unique username candidate from name/email
      const baseCandidate = (input.name || input.email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18);
      const prefix = baseCandidate.length >= 3 ? baseCandidate : `user_${baseCandidate || "edu"}`;

      let candidate = `${prefix.slice(0, 20)}_${Math.floor(1000 + Math.random() * 9000)}`;
      for (let i = 0; i < 5; i++) {
        const existing = await db.user.findUnique({
          where: { username: candidate },
        });
        if (!existing) break;
        candidate = `${prefix.slice(0, 18)}_${Math.floor(10000 + Math.random() * 90000)}`;
      }
      normalizedUsername = candidate;
    }

    // Password hashing happens before the transaction so expensive bcrypt
    // work does not hold a database transaction open.
    const passwordHash = await hashPassword(input.password);

    // Generate tokens before entering the transaction.
    const sessionToken = generateSecureToken();
    const refreshToken = generateSecureToken();

    const sessionTokenHash = hashToken(sessionToken);
    const refreshTokenHash = hashToken(refreshToken);

    const ipHash = input.ipAddress
      ? hashIp(input.ipAddress, getIpSalt())
      : null;

    const sessionExpiresAt = calculateExpiration(7);
    const refreshExpiresAt = calculateExpiration(30);

    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: input.name,
          username: normalizedUsername,
          locale: input.locale || "uz",
          country: input.country || "UZ",
          passwordHash,
        },
      });

      // Assign default role
      await tx.userRole.create({
        data: {
          userId: user.id,
          role: "STUDENT",
        },
      });

      // Create authenticated session
      await tx.userSession.create({
        data: {
          userId: user.id,
          sessionTokenHash,
          refreshTokenHash,
          userAgent: input.userAgent,
          ipHash,
          expiresAt: refreshExpiresAt,
        },
      });

      // Update login metadata
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIpHash: ipHash || undefined,
        },
      });

      return updatedUser;
    });

    // Safe user object — never expose passwordHash or other sensitive fields.
    const safeUser = {
      id: result.id,
      email: result.email,
      name: result.name,
      username: result.username,
      avatarUrl: result.avatarUrl,
      bio: result.bio,
      country: result.country,
      platformRoles: ["STUDENT"],
    };

    return {
      session: {
        user: safeUser,
        sessionToken,
        refreshToken,
        expiresAt: sessionExpiresAt,
      },
    };
  } catch (error) {
    // Preserve intentional application errors.
    if (
      error instanceof Error &&
      (
        error.message === "User with this email already exists" ||
        error.message === "Username already taken"
      )
    ) {
      throw error;
    }

    // Database-level unique constraint protection.
    // This handles concurrent registration attempts safely.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      if (Array.isArray(target) && target.includes("email")) {
        throw conflict("User with this email already exists");
      }

      if (Array.isArray(target) && target.includes("username")) {
        throw conflict("Username already taken");
      }

      throw conflict("User already exists");
    }

    console.error("Registration error:", error);
    throw internalError("Registration failed");
  }
}


export async function getCurrentUser(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw unauthorized("User not found");
    }

    // Check ban status
    if (isUserBanned(user.isBanned, user.bannedUntil)) {
      throw unauthorized("Account is banned");
    }

    // Map roles to string array
    const platformRoles = user.roles
      .filter((role: any) => !role.expiresAt || new Date(role.expiresAt) > new Date())
      .map((role: any) => role.role);

    // Return safe user object
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      platformRoles: platformRoles.length > 0 ? platformRoles : ["STUDENT"],
    };
  } catch (error) {
    console.error("Get current user error:", error);
    throw unauthorized("Authentication failed");
  }
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  try {
    const updateData: UpdateProfileInput = { ...input };
    if (updateData.username) {
      updateData.username = normalizeUsername(updateData.username);
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: true,
      },
    });

    // Map roles to string array
    const platformRoles = updated.roles
      .filter((role: any) => !role.expiresAt || new Date(role.expiresAt) > new Date())
      .map((role: any) => role.role);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      username: updated.username,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      country: updated.country,
      platformRoles: platformRoles.length > 0 ? platformRoles : ["STUDENT"],
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("Username already taken");
    }
    console.error("Update profile error:", error);
    throw internalError("Profile update failed");
  }
}

export const login = loginUser;
export const register = registerUser;

interface RefreshResult {
  session: {
    user: any;
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

export async function logout(refreshToken: string | undefined, userId: string | undefined): Promise<{ success: boolean }> {
  try {
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);
      await db.userSession.updateMany({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    // If userId is provided, revoke all sessions for that user
    if (userId) {
      await db.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Always return success to avoid leaking information
    return { success: true };
  }
}

export async function refreshSession(
  refreshToken: string,
): Promise<RefreshResult> {
  try {
    const refreshTokenHash = hashToken(refreshToken);
    const now = new Date();

    // Find the session associated with the current refresh token.
    // This read is only used to load the user and perform preliminary checks.
    const session = await db.userSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!session) {
      throw unauthorized("Invalid or expired refresh token");
    }

    // Ban check before issuing new credentials.
    if (isUserBanned(session.user.isBanned, session.user.bannedUntil)) {
      await db.userSession.updateMany({
        where: {
          id: session.id,
          refreshTokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      throw unauthorized("Invalid or expired refresh token");
    }

    // Generate the replacement token pair.
    const newSessionToken = generateSecureToken();
    const newRefreshToken = generateSecureToken();

    const newSessionTokenHash = hashToken(newSessionToken);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const sessionExpiresAt = calculateExpiration(7);
    const refreshExpiresAt = calculateExpiration(30);

    /*
     * Atomic compare-and-swap.
     *
     * The update only succeeds if this database row still contains
     * the exact refresh token hash that was presented by this request.
     *
     * If two refresh requests race:
     *
     * Request A -> count === 1
     * Request B -> count === 0
     *
     * Therefore the old refresh token can only be consumed once.
     */
    const rotation = await db.userSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        sessionTokenHash: newSessionTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: refreshExpiresAt,
        lastUsedAt: now,
      },
    });

    if (rotation.count !== 1) {
      throw unauthorized("Invalid or expired refresh token");
    }

    // Only after the atomic rotation succeeds do we return new credentials.
    const platformRoles = session.user.roles
      .filter(
        (role: any) =>
          !role.expiresAt || new Date(role.expiresAt) > now,
      )
      .map((role: any) => role.role);

    const safeUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      username: session.user.username,
      avatarUrl: session.user.avatarUrl,
      bio: session.user.bio,
      country: session.user.country,
      platformRoles:
        platformRoles.length > 0
          ? platformRoles
          : ["STUDENT"],
    };

    return {
      session: {
        user: safeUser,
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt: sessionExpiresAt,
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid or expired refresh token"
    ) {
      throw error;
    }

    console.error("Refresh session error:", error);

    // Never expose database or internal errors to the client.
    throw unauthorized("Session refresh failed");
  }
}


