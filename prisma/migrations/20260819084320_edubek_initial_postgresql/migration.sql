-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "username" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "locale" TEXT DEFAULT 'uz',
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "mfaSecretEncrypted" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedReason" TEXT,
    "bannedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "gamesCreated" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "name" TEXT,
    "platform" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDay" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'school',
    "ownerId" TEXT NOT NULL,
    "billingEmail" TEXT,
    "country" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "seats" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRole" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationBilling" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "paymentMethodId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "seats" INTEGER NOT NULL DEFAULT 10,
    "renewalAt" TIMESTAMP(3),
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCohort" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCohortMember" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationCohortMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "nameI18n" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "priceFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePrice" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "priceFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "priceId" TEXT,
    "transactionId" TEXT,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "eduTokensSpent" INTEGER NOT NULL DEFAULT 0,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundableUntil" TIMESTAMP(3),
    "licenseType" TEXT NOT NULL DEFAULT 'personal',

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceReview" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "sellerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceRefund" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "initiatedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "socialLinks" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verifiedAt" TIMESTAMP(3),
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CreatorTier" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "priceFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "benefits" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tierId" TEXT,
    "transactionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CreatorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorEarning" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "eduTokens" INTEGER NOT NULL DEFAULT 0,
    "referenceId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payoutAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "stripeTransferId" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutAccount" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalAccountId" TEXT,
    "country" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eduTokensBalance" INTEGER NOT NULL DEFAULT 0,
    "fiatBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lockedEduTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EduTokenLedger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EduTokenLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "type" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "eduTokensInvolved" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'edu_tokens',
    "providerTransactionId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "listingId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eduTokens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRefund" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "initiatedBy" TEXT,
    "providerRefundId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'held',
    "heldUntil" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceYearly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" TEXT,
    "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT,
    "contextSummary" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "toolCallId" TEXT,
    "model" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiContextMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceMessageId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiContextMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "decisionType" TEXT NOT NULL,
    "inputSummary" TEXT,
    "output" TEXT,
    "rationale" TEXT,
    "model" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "wasOverridden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "model" TEXT,
    "feature" TEXT,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolCall" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "arguments" TEXT,
    "result" TEXT,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,

    CONSTRAINT "AiToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPrompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "systemPrompt" TEXT NOT NULL,
    "userTemplate" TEXT,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "mode" TEXT NOT NULL DEFAULT 'classic',
    "language" TEXT NOT NULL DEFAULT 'uz',
    "teacherId" TEXT NOT NULL,
    "orgId" TEXT,
    "listingId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentQuizId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptId" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'clean',
    "contentHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'multiple_choice',
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "points" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "mediaUrl" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "parentQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizSession" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'classic',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "selectedIndex" INTEGER,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "timeTaken" INTEGER,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMs" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizVersion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changelog" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizReview" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "QuizReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizTag" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "QuizTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizCohort" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "attemptsAllowed" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuizCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "eventName" TEXT NOT NULL,
    "properties" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyUserStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "quizzesPlayed" INTEGER NOT NULL DEFAULT 0,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMs" INTEGER NOT NULL DEFAULT 0,
    "eduTokensEarned" INTEGER NOT NULL DEFAULT 0,
    "eduTokensSpent" INTEGER NOT NULL DEFAULT 0,
    "aiRequests" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyUserStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizPerformanceStat" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlayers" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizPerformanceStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorAnalytic" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "listingsSold" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newSubscribers" INTEGER NOT NULL DEFAULT 0,
    "churnedSubscribers" INTEGER NOT NULL DEFAULT 0,
    "totalSubscribers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CreatorAnalytic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgAnalytic" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "quizzesCreated" INTEGER NOT NULL DEFAULT 0,
    "quizzesAssigned" INTEGER NOT NULL DEFAULT 0,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "eduTokensConsumed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrgAnalytic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "funnelName" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "properties" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIndex" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "categoryId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'uz',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "filters" TEXT,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "clickedEntityId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" TEXT,
    "preferredDifficulty" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'uz',
    "excludedTags" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'user',
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "addedById" TEXT,
    "listingId" TEXT,
    "metadata" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCollection" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "libraryItemId" TEXT NOT NULL,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryAccess" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "granteeType" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryImport" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changelog" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReview" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentModerationFlag" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "flaggedBy" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentModerationFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EDU',
    "scope" TEXT NOT NULL DEFAULT 'marketplace',
    "minPurchase" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER NOT NULL DEFAULT 0,
    "maxUsagePerUser" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorOnly" BOOLEAN NOT NULL DEFAULT false,
    "firstPurchaseOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCreatorTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "revenueShare" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "payoutFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "badgeIcon" TEXT,
    "featuredEligible" BOOLEAN NOT NULL DEFAULT false,
    "marketplacePriority" INTEGER NOT NULL DEFAULT 0,
    "minEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minSales" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCreatorTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCreatorTierAssignment" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "metadata" TEXT,

    CONSTRAINT "PlatformCreatorTierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT DEFAULT 'user',
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'user',
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "resourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "grade" TEXT,
    "language" TEXT NOT NULL DEFAULT 'uz',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "coverUrl" TEXT,
    "content" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "durationMinutes" INTEGER,
    "duplicatedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceVersion" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changelog" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTag" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceFavorite" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationResourceCategory" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'user',
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceStat" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "lastOpenedAt" TIMESTAMP(3),
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedResource" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "conversationId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New AI Session',
    "currentResourceId" TEXT,
    "currentModel" TEXT NOT NULL DEFAULT 'zai-default',
    "currentPromptTemplate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "AiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpListing" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "estimatedDuration" TEXT,
    "difficulty" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "licenseType" TEXT NOT NULL DEFAULT 'personal',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'marketplace',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "resourceVersionPublished" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MpListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MpCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpListingCategory" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpListingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpFavorite" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpPurchase" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "creatorEarning" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "refundableUntil" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpReview" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MpReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpWishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpWishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "orgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomStudent" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "ClassroomStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "dueDate" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'published',
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "allowLate" BOOLEAN NOT NULL DEFAULT true,
    "points" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentAttempt" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "resourceCopyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "attachments" TEXT,
    "submittedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "rubric" TEXT,
    "feedback" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT,
    "resourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT,
    "assignmentId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "questionType" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "subject" TEXT,
    "grade" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "topic" TEXT,
    "estimatedTime" INTEGER,
    "learningObjective" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiGeneratedFrom" TEXT,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changelog" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankQuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" INTEGER NOT NULL DEFAULT 10,
    "levels" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "classroomId" TEXT,
    "resourceId" TEXT,
    "assignmentId" TEXT,
    "rubricId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "assessmentType" TEXT NOT NULL DEFAULT 'quiz',
    "duration" INTEGER,
    "passingScore" DOUBLE PRECISION,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT false,
    "showResultsImmediately" BOOLEAN NOT NULL DEFAULT false,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 1,
    "overrides" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "timeRemainingMs" INTEGER,
    "score" DOUBLE PRECISION,
    "pointsAwarded" INTEGER,
    "pointsMax" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN,
    "questionOrder" TEXT,
    "autoGradedAt" TIMESTAMP(3),
    "manualGradedAt" TIMESTAMP(3),
    "proctoringIncidentCount" INTEGER NOT NULL DEFAULT 0,
    "proctoringFlagged" BOOLEAN NOT NULL DEFAULT false,
    "plagiarismScore" DOUBLE PRECISION,
    "plagiarismFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "answer" TEXT,
    "pointsAwarded" INTEGER,
    "pointsMax" INTEGER NOT NULL DEFAULT 1,
    "isCorrect" BOOLEAN,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "timeSpentMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradebookEntry" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT,
    "studentId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "attemptId" TEXT,
    "assessmentAttemptId" TEXT,
    "title" TEXT NOT NULL,
    "points" DOUBLE PRECISION,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "gradedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradebookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "classroomId" TEXT,
    "assessmentId" TEXT,
    "resourceId" TEXT,
    "certificateType" TEXT NOT NULL DEFAULT 'assessment',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studentName" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "courseName" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "revokedById" TEXT,
    "pdfBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringIncident" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "description" TEXT,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlagiarismReport" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sourceResponseId" TEXT,
    "comparedWith" TEXT NOT NULL DEFAULT '[]',
    "similarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "details" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlagiarismReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "coHostIds" TEXT NOT NULL DEFAULT '[]',
    "orgId" TEXT,
    "classroomId" TEXT,
    "resourceId" TEXT,
    "assessmentId" TEXT,
    "gameMode" TEXT NOT NULL DEFAULT 'classic',
    "config" TEXT NOT NULL DEFAULT '{}',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxPlayers" INTEGER NOT NULL DEFAULT 50,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 10,
    "leaderboardSnapshot" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "currentHostSocketId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePlayer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "status" TEXT NOT NULL DEFAULT 'active',
    "state" TEXT NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "avgResponseMs" INTEGER NOT NULL DEFAULT 0,
    "totalResponseMs" INTEGER NOT NULL DEFAULT 0,
    "answeredCount" INTEGER NOT NULL DEFAULT 0,
    "finalRank" INTEGER,
    "socketId" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveRound" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "questionId" TEXT,
    "questionSnapshot" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "questionDurationMs" INTEGER NOT NULL DEFAULT 30000,
    "answerLockAt" TIMESTAMP(3),
    "revealAt" TIMESTAMP(3),
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "resultsSnapshot" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "LiveRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveAnswer" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "responseMs" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveLeaderboard" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 0,
    "entries" TEXT NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "passwordHash" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "maxPlayers" INTEGER NOT NULL DEFAULT 50,
    "waitingRoom" TEXT NOT NULL DEFAULT '[]',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "countdownEndsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Replay" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',
    "finalSnapshot" TEXT NOT NULL DEFAULT '{}',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'session_participants',
    "analyticsSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Replay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hostId" TEXT NOT NULL,
    "orgId" TEXT,
    "classroomId" TEXT,
    "gameMode" TEXT NOT NULL DEFAULT 'classic',
    "bracket" TEXT NOT NULL DEFAULT '{}',
    "format" TEXT NOT NULL DEFAULT 'single_elimination',
    "bracketSize" INTEGER NOT NULL DEFAULT 8,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "participants" TEXT NOT NULL DEFAULT '[]',
    "championId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "session1Id" TEXT,
    "session2Id" TEXT,
    "winnerId" TEXT,
    "score1" INTEGER,
    "score2" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameReward" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "playerId" TEXT,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "amount" INTEGER,
    "code" TEXT,
    "metadata" TEXT,
    "reason" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTranslation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '{}',
    "translationStatus" TEXT NOT NULL DEFAULT 'draft',
    "translatedBy" TEXT,
    "translationProvider" TEXT,
    "translationVersion" INTEGER NOT NULL DEFAULT 1,
    "translatedAt" TIMESTAMP(3),
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanTranslation" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGraphNode" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "language" TEXT NOT NULL DEFAULT 'en',
    "availableLanguages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGraphEdge" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeGraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIndexEntry" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "searchText" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT,
    "grade" TEXT,
    "difficulty" TEXT,
    "resourceType" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "freshness" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "ownerId" TEXT,
    "orgId" TEXT,
    "price" DOUBLE PRECISION,
    "isMarketplace" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndexEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "recommendedAge" TEXT,
    "estimatedStudyTimeMin" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'en',
    "slug" TEXT,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicEdge" (
    "id" TEXT NOT NULL,
    "fromTopicId" TEXT NOT NULL,
    "toTopicId" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL DEFAULT 'PREREQUISITE',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedEntityId" TEXT,
    "clickedEntityType" TEXT,
    "crossLanguageMatch" BOOLEAN NOT NULL DEFAULT false,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "vector" TEXT NOT NULL DEFAULT '[]',
    "model" TEXT NOT NULL DEFAULT 'sentence-transformer',
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterestProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interests" TEXT NOT NULL DEFAULT '{}',
    "mastery" TEXT NOT NULL DEFAULT '{}',
    "topicAffinity" TEXT NOT NULL DEFAULT '{}',
    "signals" TEXT NOT NULL DEFAULT '{}',
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInterestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "intent" TEXT,
    "intentConfidence" DOUBLE PRECISION,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedEntityId" TEXT,
    "clickedEntityType" TEXT,
    "refinementQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extractedEntities" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "members" TEXT NOT NULL DEFAULT '[]',
    "centroid" TEXT NOT NULL DEFAULT '[]',
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "constraints" TEXT NOT NULL DEFAULT '{}',
    "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "estimatedFinish" TIMESTAMP(3),
    "achievedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "itemType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "recommendation" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "masteryScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "planItemId" TEXT,
    "learningSessionId" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT 'study',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "difficulty" TEXT,
    "mood" INTEGER,
    "energy" INTEGER,
    "focus" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewAt" TIMESTAMP(3),
    "forgettingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewScheduleId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "responseMs" INTEGER,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "LearningMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningVelocitySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "conceptsLearned" INTEGER NOT NULL DEFAULT 0,
    "minutesStudied" INTEGER NOT NULL DEFAULT 0,
    "masteryGained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quizImprovement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dropOffProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningVelocitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "studyTimeMs" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendationAcceptance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiUsageCount" INTEGER NOT NULL DEFAULT 0,
    "goalCompletionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "ownerId" TEXT NOT NULL,
    "classroomId" TEXT,
    "organizationId" TEXT,
    "subject" TEXT,
    "groupXp" INTEGER NOT NULL DEFAULT 0,
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupXp" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "inviteeId" TEXT,
    "inviteeEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "aiSummaryAt" TIMESTAMP(3),
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "isAcceptedAnswer" BOOLEAN NOT NULL DEFAULT false,
    "acceptedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "toxicityScore" DOUBLE PRECISION,
    "duplicateOfId" TEXT,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReaction" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborativeNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "contentHtml" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "classroomId" TEXT,
    "groupId" TEXT,
    "lastEditedBy" TEXT,
    "lastEditedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "aiSummaryAt" TIMESTAMP(3),
    "activeEditors" TEXT NOT NULL DEFAULT '[]',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborativeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborativeNoteVersion" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "editSummary" TEXT,
    "diffSize" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborativeNoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherRecommendation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetUserIds" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '{}',
    "rationale" TEXT,
    "rationaleKey" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT,
    "studentIds" TEXT NOT NULL DEFAULT '[]',
    "reason" TEXT NOT NULL,
    "reasonKey" TEXT,
    "description" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "classroomId" TEXT,
    "groupId" TEXT,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "organizationId" TEXT,
    "classroomId" TEXT,
    "groupId" TEXT,
    "department" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'xp',
    "rewardValue" INTEGER NOT NULL DEFAULT 100,
    "secondRewardType" TEXT,
    "secondRewardValue" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeParticipation" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT,
    "groupId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "rank" INTEGER,
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "rewardGrantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "signals" TEXT NOT NULL DEFAULT '{}',
    "reason" TEXT NOT NULL,
    "reasonKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentorship" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mentorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassInsight" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "avgMastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weakTopics" TEXT NOT NULL DEFAULT '[]',
    "strongTopics" TEXT NOT NULL DEFAULT '[]',
    "avgVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atRiskStudents" TEXT NOT NULL DEFAULT '[]',
    "totalStudyTimeMs" INTEGER NOT NULL DEFAULT 0,
    "assignmentCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInsight" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "departmentAnalytics" TEXT NOT NULL DEFAULT '{}',
    "teacherAnalytics" TEXT NOT NULL DEFAULT '[]',
    "resourceUsage" TEXT NOT NULL DEFAULT '{}',
    "aiUsage" TEXT NOT NULL DEFAULT '{}',
    "certificationProgress" TEXT NOT NULL DEFAULT '{}',
    "classComparison" TEXT NOT NULL DEFAULT '[]',
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "bloomLevel" TEXT,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "language" TEXT NOT NULL DEFAULT 'en',
    "aiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptAlias" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConceptAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningObjective" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "bloomLevel" TEXT,
    "conceptIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumFramework" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumStandard" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "strand" TEXT,
    "outcomes" TEXT NOT NULL DEFAULT '[]',
    "bloomLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumMapping" (
    "id" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "alignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "coverageLevel" TEXT NOT NULL DEFAULT 'partial',
    "rationale" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptRelationship" (
    "id" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'never',
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceConcept" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'teaches',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCoverage" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "totalStandards" INTEGER NOT NULL DEFAULT 0,
    "coveredStandards" INTEGER NOT NULL DEFAULT 0,
    "uncoveredStandards" INTEGER NOT NULL DEFAULT 0,
    "coveragePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGap" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "standardId" TEXT,
    "conceptId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceQuality" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "clarity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "depth" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "engagement" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "curriculumAlignment" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "assessmentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "accessibility" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "aiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "analysis" TEXT NOT NULL DEFAULT '{}',
    "model" TEXT NOT NULL DEFAULT 'edubek-quality-v1',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceQuality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimilarityCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "members" TEXT NOT NULL DEFAULT '[]',
    "centroidHash" TEXT,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "clusterType" TEXT NOT NULL DEFAULT 'similar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimilarityCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "predictedScore" DOUBLE PRECISION,
    "predictedCompletion" DOUBLE PRECISION,
    "predictedDropout" DOUBLE PRECISION,
    "predictedMastery" DOUBLE PRECISION,
    "predictedStudyMinutes" INTEGER,
    "interventionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "interventionReason" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeHealthSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "coverageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "curriculumCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "graphDensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resourceFreshness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiReadiness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryDistribution" TEXT NOT NULL DEFAULT '{}',
    "teacherContributions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "agentType" TEXT,
    "workflowId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentWorkflow" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "steps" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT,
    "participatingAgents" TEXT NOT NULL DEFAULT '[]',
    "executionMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT '{}',
    "actions" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxPerHour" INTEGER NOT NULL DEFAULT 10,
    "lastFiredAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecutionLog" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT,
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,
    "sources" TEXT,
    "affectedModules" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'running',
    "executionMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "scopeType" TEXT,
    "scopeId" TEXT,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "input" TEXT NOT NULL DEFAULT '{}',
    "predictions" TEXT NOT NULL DEFAULT '{}',
    "affected" TEXT NOT NULL DEFAULT '{}',
    "estimatedCosts" TEXT NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "scopeType" TEXT,
    "scopeId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "outcome" TEXT NOT NULL DEFAULT 'neutral',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "experimentId" TEXT,
    "variant" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSignal" (
    "id" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "secondaryEntityType" TEXT,
    "secondaryEntityId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "ignores" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentOutcomes" TEXT NOT NULL DEFAULT '[]',
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationOutcome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "timeSpentMs" INTEGER,
    "confidence" DOUBLE PRECISION,
    "experimentId" TEXT,
    "variant" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchOutcome" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "clickedPosition" INTEGER,
    "clickedEntityId" TEXT,
    "clickedEntityType" TEXT,
    "reformulated" BOOLEAN NOT NULL DEFAULT false,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "timeSpentMs" INTEGER,
    "outcome" TEXT NOT NULL DEFAULT 'neutral',
    "experimentId" TEXT,
    "variant" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptEvaluation" (
    "id" TEXT NOT NULL,
    "promptTemplateId" TEXT,
    "promptVersion" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generationId" TEXT,
    "acceptanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "regenerationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "editRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userRating" DOUBLE PRECISION,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "overallQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformExperiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "variants" TEXT NOT NULL DEFAULT '[]',
    "rolloutPct" INTEGER NOT NULL DEFAULT 100,
    "successMetric" TEXT NOT NULL DEFAULT 'ctr',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "winnerVariant" TEXT,
    "winnerConfidence" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstOutcome" TEXT,
    "firstOutcomeAt" TIMESTAMP(3),

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationSnapshot" (
    "id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "improvementPct" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "autoApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "scopeType" TEXT,
    "scopeId" TEXT,
    "predictedValue" DOUBLE PRECISION,
    "horizon" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSnapshot" (
    "id" TEXT NOT NULL,
    "subsystem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "details" TEXT NOT NULL DEFAULT '{}',
    "responseMs" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'system',
    "actorId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "affectedUserId" TEXT,
    "scopeType" TEXT,
    "scopeId" TEXT,
    "reasoning" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION,
    "outcome" TEXT NOT NULL DEFAULT 'success',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformInsight" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "titleKey" TEXT,
    "descriptionKey" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "scopeType" TEXT,
    "scopeId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalTwin" (
    "id" TEXT NOT NULL,
    "twinType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastSyncedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalTwin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwinSnapshot" (
    "id" TEXT NOT NULL,
    "twinType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT '{}',
    "trigger" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwinSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicCalendar" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "year" TEXT NOT NULL,
    "term" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "schedule" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "scopeType" TEXT,
    "scopeId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicWorkflow" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" TEXT,
    "scopeId" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "executionMs" INTEGER NOT NULL DEFAULT 0,
    "triggerEntityId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicMemory" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioPlan" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "predictions" TEXT NOT NULL DEFAULT '{}',
    "affected" TEXT NOT NULL DEFAULT '{}',
    "estimatedCosts" TEXT NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicOperation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "day" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "reasoning" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "conceptIds" TEXT NOT NULL DEFAULT '[]',
    "assessmentIds" TEXT NOT NULL DEFAULT '[]',
    "resourceIds" TEXT NOT NULL DEFAULT '[]',
    "prerequisiteIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyEvidence" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "entityId" TEXT,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetencyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCredential" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "issuerType" TEXT NOT NULL DEFAULT 'organization',
    "verificationId" TEXT NOT NULL,
    "verificationUrl" TEXT,
    "qrCodeData" TEXT,
    "digitalSignature" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "competencyIds" TEXT NOT NULL DEFAULT '[]',
    "evidenceLinks" TEXT NOT NULL DEFAULT '[]',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTranscript" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entries" TEXT NOT NULL DEFAULT '[]',
    "aiSummary" TEXT,
    "aiSummaryAt" TIMESTAMP(3),
    "skills" TEXT NOT NULL DEFAULT '[]',
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredentials" INTEGER NOT NULL DEFAULT 0,
    "totalCompetencies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT,
    "difficultyIndex" DOUBLE PRECISION,
    "discriminationIndex" DOUBLE PRECISION,
    "distractorAnalysis" TEXT,
    "bloomLevel" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "avgTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuality" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "overallQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "bloomCoverage" TEXT NOT NULL DEFAULT '{}',
    "curriculumCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyDistribution" TEXT NOT NULL DEFAULT '{}',
    "gradingConsistency" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fairnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "itemAnalysis" TEXT NOT NULL DEFAULT '{}',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityCheck" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "findings" TEXT NOT NULL DEFAULT '{}',
    "explanation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecureExamSession" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "questionOrder" TEXT NOT NULL DEFAULT '[]',
    "adaptiveState" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "timeRemainingMs" INTEGER,
    "autosaveData" TEXT NOT NULL DEFAULT '{}',
    "lastAutosaveAt" TIMESTAMP(3),
    "lockdownEnabled" BOOLEAN NOT NULL DEFAULT false,
    "auditLog" TEXT NOT NULL DEFAULT '[]',
    "offlineRecoveryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecureExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentBlueprint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assessmentType" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "rubricId" TEXT,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "predictedAvgScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "predictedDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "frameworkId" TEXT,
    "standardIds" TEXT NOT NULL DEFAULT '[]',
    "bloomDistribution" TEXT NOT NULL DEFAULT '{}',
    "difficultyDistribution" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "curriculumCompliance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assessmentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competencyCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredentialsIssued" INTEGER NOT NULL DEFAULT 0,
    "totalCompetenciesVerified" INTEGER NOT NULL DEFAULT 0,
    "graduateOutcomes" TEXT NOT NULL DEFAULT '{}',
    "gradingConsistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "auditReadiness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "recommendations" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialVerification" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "method" TEXT NOT NULL DEFAULT 'url',
    "result" TEXT NOT NULL DEFAULT 'valid',
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "config" TEXT NOT NULL DEFAULT '{}',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "lastHealthCheckAt" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
    "syncSchedule" TEXT NOT NULL DEFAULT 'manual',
    "webhooksRegistered" BOOLEAN NOT NULL DEFAULT false,
    "syncEntities" TEXT NOT NULL DEFAULT '[]',
    "fieldMapping" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL DEFAULT 'incremental',
    "status" TEXT NOT NULL,
    "entities" TEXT NOT NULL DEFAULT '[]',
    "conflicts" TEXT NOT NULL DEFAULT '[]',
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalImported" INTEGER NOT NULL DEFAULT 0,
    "totalUpdated" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalErrors" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',
    "secret" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryBackoffMs" INTEGER NOT NULL DEFAULT 5000,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "redirectUris" TEXT NOT NULL DEFAULT '[]',
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "grantTypes" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAiProvider" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "models" TEXT NOT NULL DEFAULT '[]',
    "defaultModel" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "lastHealthCheckAt" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportExportJob" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "organizationId" TEXT,
    "initiatedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileUrl" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "importedRecords" INTEGER NOT NULL DEFAULT 0,
    "skippedRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT NOT NULL DEFAULT '[]',
    "fieldMapping" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceApp" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "developerId" TEXT NOT NULL,
    "developerName" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "pricingModel" TEXT NOT NULL DEFAULT 'free',
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "configSchema" TEXT NOT NULL DEFAULT '{}',
    "webhookUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "categories" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseTenant" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "organizationId" TEXT,
    "adminIds" TEXT NOT NULL DEFAULT '[]',
    "delegatedAdmin" BOOLEAN NOT NULL DEFAULT false,
    "limits" TEXT NOT NULL DEFAULT '{}',
    "branding" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSubscription" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventTypes" TEXT NOT NULL DEFAULT '[]',
    "deliveryMethod" TEXT NOT NULL DEFAULT 'webhook',
    "deliveryTarget" TEXT NOT NULL,
    "filter" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extension" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "developerId" TEXT NOT NULL,
    "developerName" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pricingModel" TEXT NOT NULL DEFAULT 'free',
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "iconUrl" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "hooks" TEXT NOT NULL DEFAULT '[]',
    "uiExtensions" TEXT NOT NULL DEFAULT '[]',
    "configSchema" TEXT NOT NULL DEFAULT '{}',
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "minPlatformVersion" TEXT,
    "maxPlatformVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionVersion" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "packageUrl" TEXT,
    "packageHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "hooks" TEXT NOT NULL DEFAULT '[]',
    "minPlatformVersion" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionInstall" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "version" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'installed',
    "approvedPermissions" TEXT NOT NULL DEFAULT '[]',
    "cpuLimit" INTEGER NOT NULL DEFAULT 50,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 128,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "networkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "installedBy" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionInstall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionHook" (
    "id" TEXT NOT NULL,
    "extensionInstallId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "handlerType" TEXT NOT NULL DEFAULT 'async',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionHook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionExecution" (
    "id" TEXT NOT NULL,
    "extensionInstallId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerEvent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "cpuUsagePercent" DOUBLE PRECISION,
    "memoryUsageMb" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "requestedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExtensionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxSession" (
    "id" TEXT NOT NULL,
    "extensionInstallId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cpuLimit" INTEGER NOT NULL DEFAULT 50,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 128,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "networkPolicy" TEXT NOT NULL DEFAULT 'none',
    "networkAllowlist" TEXT NOT NULL DEFAULT '[]',
    "filesystemIsolated" BOOLEAN NOT NULL DEFAULT true,
    "auditLog" TEXT NOT NULL DEFAULT '[]',
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt" TIMESTAMP(3),

    CONSTRAINT "SandboxSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionReview" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionSubscription" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "pricePerCycle" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "deprecationDate" TIMESTAMP(3),
    "sunsetDate" TIMESTAMP(3),
    "retirementDate" TIMESTAMP(3),
    "breakingChanges" TEXT NOT NULL DEFAULT '[]',
    "migrationGuide" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityMatrix" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "extensionVersion" TEXT NOT NULL,
    "platformVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'untested',
    "notes" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataFabricEntity" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT,
    "state" TEXT NOT NULL DEFAULT '{}',
    "versionVector" TEXT NOT NULL DEFAULT '{}',
    "lineage" TEXT NOT NULL DEFAULT '[]',
    "syncStatus" TEXT NOT NULL DEFAULT 'in_sync',
    "lastSyncAt" TIMESTAMP(3),
    "lifecycle" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataFabricEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStore" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadModel" (
    "id" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "projectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCheckpoint" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conflicts" TEXT NOT NULL DEFAULT '[]',
    "syncMode" TEXT NOT NULL DEFAULT 'delta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSearchIndex" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT,
    "searchText" TEXT NOT NULL,
    "tokens" TEXT NOT NULL DEFAULT '[]',
    "embedding" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isMarketplace" BOOLEAN NOT NULL DEFAULT false,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "availableLanguages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedLearningJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "participants" TEXT NOT NULL DEFAULT '[]',
    "aggregatedParams" TEXT NOT NULL DEFAULT '{}',
    "round" INTEGER NOT NULL DEFAULT 0,
    "privacySettings" TEXT NOT NULL DEFAULT '{}',
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedLearningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "comparison" TEXT NOT NULL DEFAULT '{}',
    "peerGroup" TEXT NOT NULL DEFAULT '{}',
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservabilityTrace" (
    "id" TEXT NOT NULL,
    "traceType" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "spans" TEXT NOT NULL DEFAULT '[]',
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "logs" TEXT NOT NULL DEFAULT '[]',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservabilityTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernancePolicy" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT,
    "rules" TEXT NOT NULL DEFAULT '[]',
    "retentionDays" INTEGER,
    "region" TEXT NOT NULL DEFAULT 'global',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceLakeSnapshot" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationId" TEXT,
    "day" TIMESTAMP(3) NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "insights" TEXT NOT NULL DEFAULT '[]',
    "forecasts" TEXT NOT NULL DEFAULT '[]',
    "trends" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntelligenceLakeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "streamType" TEXT NOT NULL,
    "filter" TEXT NOT NULL DEFAULT '{}',
    "deliveryMethod" TEXT NOT NULL DEFAULT 'webhook',
    "deliveryTarget" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "queue" TEXT NOT NULL DEFAULT 'default',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "workerId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 5000,
    "scheduledFor" TIMESTAMP(3),
    "timeoutMs" INTEGER NOT NULL DEFAULT 300000,
    "requirements" TEXT NOT NULL DEFAULT '{}',
    "organizationId" TEXT,
    "createdBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InferenceRequest" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'chat',
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fallbackProvider" TEXT,
    "fallbackReason" TEXT,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "tokenUsage" TEXT NOT NULL DEFAULT '{}',
    "organizationId" TEXT,
    "userId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InferenceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "cronExpression" TEXT,
    "workflowType" TEXT NOT NULL,
    "workflowParams" TEXT NOT NULL DEFAULT '{}',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastExecutedAt" TIMESTAMP(3),
    "lastExecutionStatus" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAllocation" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "allocatedTo" TEXT NOT NULL,
    "allocatedToType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'cores',
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheEntry" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '{}',
    "ttlSeconds" INTEGER NOT NULL DEFAULT 300,
    "compression" TEXT NOT NULL DEFAULT 'none',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "missCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaJob" (
    "id" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "inputUrl" TEXT NOT NULL,
    "outputUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "organizationId" TEXT,
    "cloudJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentJob" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "inputUrl" TEXT NOT NULL,
    "extractedContent" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER,
    "errorMessage" TEXT,
    "organizationId" TEXT,
    "cloudJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "organizationId" TEXT,
    "rotationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rotationDays" INTEGER,
    "lastRotatedAt" TIMESTAMP(3),
    "nextRotationAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "lastAccessedBy" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfraMetric" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'count',
    "labels" TEXT NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfraMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudWorker" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '{}',
    "currentLoad" TEXT NOT NULL DEFAULT '{}',
    "totalJobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalJobsFailed" INTEGER NOT NULL DEFAULT 0,
    "uptimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostSnapshot" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "breakdown" TEXT NOT NULL DEFAULT '{}',
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "estimatedUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "byService" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningExperience" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "config" TEXT NOT NULL DEFAULT '{}',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "isMarketplace" BOOLEAN NOT NULL DEFAULT false,
    "priceEduTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceSession" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "interactions" TEXT NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationConfig" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parameters" TEXT NOT NULL DEFAULT '[]',
    "initialState" TEXT NOT NULL DEFAULT '{}',
    "equations" TEXT NOT NULL DEFAULT '[]',
    "visualization" TEXT NOT NULL DEFAULT '{}',
    "assessment" TEXT NOT NULL DEFAULT '[]',
    "safetyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualLabConfig" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apparatus" TEXT NOT NULL DEFAULT '[]',
    "materials" TEXT NOT NULL DEFAULT '[]',
    "safety" TEXT NOT NULL DEFAULT '[]',
    "procedure" TEXT NOT NULL DEFAULT '[]',
    "measurements" TEXT NOT NULL DEFAULT '[]',
    "expectedOutcomes" TEXT NOT NULL DEFAULT '[]',
    "assessment" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualLabConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingWorkspace" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "solutionCode" TEXT,
    "testCases" TEXT NOT NULL DEFAULT '[]',
    "hints" TEXT NOT NULL DEFAULT '[]',
    "aiDebugging" BOOLEAN NOT NULL DEFAULT true,
    "visualization" BOOLEAN NOT NULL DEFAULT false,
    "gradingConfig" TEXT NOT NULL DEFAULT '{}',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammingWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorAvatarConfig" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "mode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "personality" TEXT NOT NULL DEFAULT '{}',
    "knowledgeBase" TEXT NOT NULL DEFAULT '{}',
    "conversationSettings" TEXT NOT NULL DEFAULT '{}',
    "assessmentCriteria" TEXT NOT NULL DEFAULT '[]',
    "voiceConfig" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorAvatarConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningWorld" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT NOT NULL,
    "entities" TEXT NOT NULL DEFAULT '[]',
    "paths" TEXT NOT NULL DEFAULT '[]',
    "assignments" TEXT NOT NULL DEFAULT '[]',
    "objectives" TEXT NOT NULL DEFAULT '[]',
    "visualConfig" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioTask" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "setup" TEXT NOT NULL DEFAULT '{}',
    "decisionPoints" TEXT NOT NULL DEFAULT '[]',
    "outcomes" TEXT NOT NULL DEFAULT '[]',
    "rubric" TEXT NOT NULL DEFAULT '{}',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArtifact" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '{}',
    "subject" TEXT,
    "topic" TEXT,
    "visualStyle" TEXT NOT NULL DEFAULT '{}',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "outputFormat" TEXT NOT NULL DEFAULT 'json',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceComposition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "components" TEXT NOT NULL DEFAULT '[]',
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposal',
    "researchType" TEXT NOT NULL DEFAULT 'applied',
    "field" TEXT,
    "objectives" TEXT NOT NULL DEFAULT '[]',
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "principalInvestigator" TEXT NOT NULL,
    "teamMembers" TEXT NOT NULL DEFAULT '[]',
    "organizationId" TEXT,
    "experimentIds" TEXT NOT NULL DEFAULT '[]',
    "datasetIds" TEXT NOT NULL DEFAULT '[]',
    "publicationIds" TEXT NOT NULL DEFAULT '[]',
    "assistantState" TEXT NOT NULL DEFAULT '{}',
    "funding" TEXT NOT NULL DEFAULT '{}',
    "ethicsApproved" BOOLEAN NOT NULL DEFAULT false,
    "ethicsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiteratureEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL DEFAULT '[]',
    "abstract" TEXT,
    "year" INTEGER,
    "venue" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "concepts" TEXT NOT NULL DEFAULT '[]',
    "methodologies" TEXT NOT NULL DEFAULT '[]',
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidenceStrength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "contradictions" TEXT NOT NULL DEFAULT '[]',
    "fullTextUrl" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiteratureEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentDesign" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "experimentType" TEXT NOT NULL DEFAULT 'controlled',
    "hypothesis" TEXT,
    "variables" TEXT NOT NULL DEFAULT '{}',
    "sampleSize" INTEGER,
    "sampleSizeJustification" TEXT,
    "measurements" TEXT NOT NULL DEFAULT '[]',
    "analysisPlan" TEXT NOT NULL DEFAULT '{}',
    "risks" TEXT NOT NULL DEFAULT '[]',
    "reproducibility" TEXT NOT NULL DEFAULT '[]',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDataset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '[]',
    "fileUrl" TEXT,
    "format" TEXT NOT NULL DEFAULT 'json',
    "version" INTEGER NOT NULL DEFAULT 1,
    "provenance" TEXT NOT NULL DEFAULT '[]',
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fairCompliance" TEXT NOT NULL DEFAULT '{}',
    "anonymized" BOOLEAN NOT NULL DEFAULT false,
    "anonymizationMethod" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationRecord" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "literatureId" TEXT,
    "rawCitation" TEXT,
    "citationType" TEXT NOT NULL DEFAULT 'cites',
    "context" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "validationNotes" TEXT,
    "formattedCitation" TEXT,
    "citationStyle" TEXT NOT NULL DEFAULT 'apa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerReview" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL DEFAULT 'double_blind',
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "rubricEvaluation" TEXT NOT NULL DEFAULT '[]',
    "overallScore" DOUBLE PRECISION,
    "recommendation" TEXT,
    "reviewText" TEXT,
    "confidentialComments" TEXT,
    "revisionRound" INTEGER NOT NULL DEFAULT 1,
    "readinessScore" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatentWorkspace" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "disclosure" TEXT,
    "noveltyAnalysis" TEXT NOT NULL DEFAULT '[]',
    "priorArt" TEXT NOT NULL DEFAULT '[]',
    "draftSections" TEXT NOT NULL DEFAULT '[]',
    "commercialization" TEXT NOT NULL DEFAULT '{}',
    "inventors" TEXT NOT NULL DEFAULT '[]',
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disclosure',
    "patentNumber" TEXT,
    "filedAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatentWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationDraft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "sections" TEXT NOT NULL DEFAULT '[]',
    "authors" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "targetVenue" TEXT,
    "publicationType" TEXT NOT NULL DEFAULT 'journal_article',
    "citationStyle" TEXT NOT NULL DEFAULT 'apa',
    "bibliography" TEXT NOT NULL DEFAULT '[]',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "reviewIds" TEXT NOT NULL DEFAULT '[]',
    "doi" TEXT,
    "publishedUrl" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchAnalytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "publicationMetrics" TEXT NOT NULL DEFAULT '{}',
    "collaborationNetwork" TEXT NOT NULL DEFAULT '{}',
    "funding" TEXT NOT NULL DEFAULT '{}',
    "trends" TEXT NOT NULL DEFAULT '[]',
    "interdisciplinary" TEXT NOT NULL DEFAULT '[]',
    "innovationMetrics" TEXT NOT NULL DEFAULT '{}',
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundationModel" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "description" TEXT,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "modelMetadata" TEXT NOT NULL DEFAULT '{}',
    "trainingInfo" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'training',
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundationModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumEquivalence" (
    "id" TEXT NOT NULL,
    "sourceFramework" TEXT NOT NULL,
    "sourceStandardId" TEXT NOT NULL,
    "sourceStandardCode" TEXT NOT NULL,
    "targetFramework" TEXT NOT NULL,
    "targetStandardId" TEXT NOT NULL,
    "targetStandardCode" TEXT NOT NULL,
    "equivalenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "equivalenceType" TEXT NOT NULL DEFAULT 'partial',
    "notes" TEXT,
    "aiValidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumEquivalence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalPattern" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "pattern" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "verification" TEXT NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT NOT NULL,
    "domain" TEXT,
    "data" TEXT NOT NULL DEFAULT '[]',
    "schema" TEXT NOT NULL DEFAULT '[]',
    "privacyLevel" TEXT NOT NULL DEFAULT 'fully_synthetic',
    "generationParams" TEXT NOT NULL DEFAULT '{}',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyntheticDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalBenchmark" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeValue" TEXT,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "statistics" TEXT NOT NULL DEFAULT '{}',
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningChain" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "domain" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "conclusion" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "curriculumRefs" TEXT NOT NULL DEFAULT '[]',
    "prerequisiteAnalysis" TEXT NOT NULL DEFAULT '[]',
    "alternatives" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "modelUsed" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEvolution" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "change" TEXT NOT NULL,
    "beforeState" TEXT NOT NULL DEFAULT '{}',
    "afterState" TEXT NOT NULL DEFAULT '{}',
    "reason" TEXT,
    "impact" TEXT NOT NULL DEFAULT '{}',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'ai_detection',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalObservatorySnapshot" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "emergingSkills" TEXT NOT NULL DEFAULT '[]',
    "curriculumTrends" TEXT NOT NULL DEFAULT '[]',
    "aiAdoption" TEXT NOT NULL DEFAULT '{}',
    "assessmentInnovations" TEXT NOT NULL DEFAULT '[]',
    "teachingMethods" TEXT NOT NULL DEFAULT '[]',
    "subjectPopularity" TEXT NOT NULL DEFAULT '[]',
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalObservatorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundationApiCall" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "callerType" TEXT NOT NULL DEFAULT 'extension',
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT,
    "modelUsed" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundationApiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectiveInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "applicability" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectiveInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultilingualAlignment" (
    "id" TEXT NOT NULL,
    "sourceTerm" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetTerm" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "context" TEXT NOT NULL DEFAULT 'general',
    "notes" TEXT,
    "aiValidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MultilingualAlignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkParticipation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'contributor',
    "contributions" TEXT NOT NULL DEFAULT '[]',
    "privacySettings" TEXT NOT NULL DEFAULT '{}',
    "patternsShared" INTEGER NOT NULL DEFAULT 0,
    "benchmarksShared" INTEGER NOT NULL DEFAULT 0,
    "modelsShared" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalMemory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "period" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "linkedEntities" TEXT NOT NULL DEFAULT '[]',
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionAnalysis" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "impactEstimates" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reasoning" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "actualOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "horizon" TEXT NOT NULL,
    "goals" TEXT NOT NULL DEFAULT '[]',
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "kpis" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '[]',
    "risks" TEXT NOT NULL DEFAULT '[]',
    "expectedOutcomes" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "narrative" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorRecommendation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT,
    "expectedImpact" TEXT NOT NULL DEFAULT '{}',
    "costEstimate" TEXT NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "requiredActions" TEXT NOT NULL DEFAULT '[]',
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acknowledgedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT NOT NULL DEFAULT '[]',
    "ownerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvals" TEXT NOT NULL DEFAULT '[]',
    "aiAnalysis" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "compliance" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalGoal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT '{}',
    "kpis" TEXT NOT NULL DEFAULT '[]',
    "initiatives" TEXT NOT NULL DEFAULT '[]',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deadline" TIMESTAMP(3),
    "achievedAt" TIMESTAMP(3),
    "aiAssessment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedEntities" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "subject" TEXT,
    "graphLinks" TEXT NOT NULL DEFAULT '[]',
    "evidence" TEXT NOT NULL DEFAULT '[]',
    "effectiveness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "searchText" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'published',
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionSimulation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "predictions" TEXT NOT NULL DEFAULT '[]',
    "scenarios" TEXT NOT NULL DEFAULT '[]',
    "resourceProjections" TEXT NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WisdomInsight" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "historicalEvidence" TEXT NOT NULL DEFAULT '[]',
    "benchmarkEvidence" TEXT NOT NULL DEFAULT '[]',
    "globalEvidence" TEXT NOT NULL DEFAULT '[]',
    "institutionEvidence" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WisdomInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorPrompt" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "versionTag" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "providerOverride" TEXT,
    "modelOverride" TEXT,
    "localizations" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "experimentId" TEXT,
    "evaluation" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrchestratorPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorWorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "triggerPayload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'running',
    "steps" TEXT NOT NULL DEFAULT '[]',
    "traceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalDurationMs" INTEGER,

    CONSTRAINT "OrchestratorWorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorAIInvocation" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "promptId" TEXT,
    "promptVersion" INTEGER,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'succeeded',
    "userId" TEXT,
    "organizationId" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestratorAIInvocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorTraceSpan" (
    "id" TEXT NOT NULL,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT,
    "traceId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "logs" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "OrchestratorTraceSpan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorHealingAction" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerDetails" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultSuccess" BOOLEAN NOT NULL DEFAULT false,
    "resultMessage" TEXT NOT NULL,
    "resultDetails" TEXT NOT NULL DEFAULT '{}',
    "autoExecuted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestratorHealingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorFeatureFlag" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout" INTEGER NOT NULL DEFAULT 0,
    "cohorts" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestratorFeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OrchestratorCircuitBreaker" (
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'closed',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "failureThreshold" INTEGER NOT NULL DEFAULT 5,
    "lastFailureAt" TIMESTAMP(3),
    "resetAt" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestratorCircuitBreaker_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "OrchestratorIdempotencyKey" (
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseHash" TEXT,
    "responsePayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrchestratorIdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OrchestratorDistributedLock" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "OrchestratorDistributedLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestratorDetectedIssue" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "description" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoHealable" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "OrchestratorDetectedIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductWorkspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tabs" TEXT NOT NULL DEFAULT '[]',
    "history" TEXT NOT NULL DEFAULT '[]',
    "undoStack" TEXT NOT NULL DEFAULT '[]',
    "draft" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "autosavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "suggestions" TEXT NOT NULL DEFAULT '[]',
    "blockedSteps" TEXT NOT NULL DEFAULT '[]',
    "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedRemainingMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProductJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttentionItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT,
    "module" TEXT,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "suggestedAction" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ProductAttentionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredSystems" TEXT NOT NULL DEFAULT '[]',
    "requiredAgents" TEXT NOT NULL DEFAULT '[]',
    "requiredWorkflows" TEXT NOT NULL DEFAULT '[]',
    "recommendedActions" TEXT NOT NULL DEFAULT '[]',
    "detected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "feature" TEXT,
    "location" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "frictionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductNotificationCluster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "notificationIds" TEXT NOT NULL DEFAULT '[]',
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "delivery" TEXT NOT NULL DEFAULT 'now',
    "deliverAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductNotificationCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveWorkingMemory" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveWorkingMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveEpisodicMemory" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "linkedEntities" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveEpisodicMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveSemanticMemory" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveSemanticMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitivePlan" (
    "id" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "nodes" TEXT NOT NULL DEFAULT '[]',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "executionOrder" TEXT NOT NULL DEFAULT '[]',
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "supportedGoals" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitivePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveGoal" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "target" TEXT NOT NULL DEFAULT '{}',
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "conflictsWith" TEXT NOT NULL DEFAULT '[]',
    "contributingModules" TEXT NOT NULL DEFAULT '[]',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveDecision" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "chosenOptionId" TEXT,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "userId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveReflection" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "reflections" TEXT NOT NULL DEFAULT '[]',
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lessons" TEXT NOT NULL DEFAULT '[]',
    "memoryUpdateRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveConversationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objective" TEXT,
    "currentTask" TEXT,
    "entities" TEXT NOT NULL DEFAULT '[]',
    "assumptions" TEXT NOT NULL DEFAULT '[]',
    "pendingQuestions" TEXT NOT NULL DEFAULT '[]',
    "followUpOpportunities" TEXT NOT NULL DEFAULT '[]',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "traceId" TEXT,
    "userId" TEXT,
    "module" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "durationMs" INTEGER,
    "confidence" DOUBLE PRECISION,
    "llmInvoked" BOOLEAN NOT NULL DEFAULT false,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityBenchmark" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "questions" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIQualityBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityEvaluation" (
    "id" TEXT NOT NULL,
    "benchmarkQuestionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptId" TEXT,
    "promptVersion" INTEGER,
    "aiOutput" TEXT NOT NULL,
    "metrics" TEXT NOT NULL DEFAULT '[]',
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryScores" TEXT NOT NULL DEFAULT '{}',
    "improvementSuggestions" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "llmUsed" BOOLEAN NOT NULL DEFAULT false,
    "evaluationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQualityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityHallucination" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "flaggedText" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "suggestedCorrection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQualityHallucination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityCitationCheck" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT,
    "citation" TEXT NOT NULL,
    "sourceExists" BOOLEAN NOT NULL DEFAULT false,
    "sourceReachable" BOOLEAN NOT NULL DEFAULT false,
    "matchesClaim" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "isBroken" BOOLEAN NOT NULL DEFAULT false,
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQualityCitationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'curated',
    "category" TEXT NOT NULL,
    "owner" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "versions" TEXT NOT NULL DEFAULT '[]',
    "curriculumAlignment" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIQualityDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityScore" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptId" TEXT,
    "overall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dimensions" TEXT NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT 'F',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQualityLeaderboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metric" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQualityLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIObservabilityExperiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "variants" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "successMetric" TEXT NOT NULL DEFAULT 'quality',
    "results" TEXT,
    "winnerVariant" TEXT,
    "winnerConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIObservabilityExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIObservabilityAnomaly" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "description" TEXT NOT NULL,
    "rootCauseHypothesis" TEXT NOT NULL DEFAULT '',
    "affectedSystems" TEXT NOT NULL DEFAULT '[]',
    "recommendedActions" TEXT NOT NULL DEFAULT '[]',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIObservabilityAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIObservabilityAlert" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedSystems" TEXT NOT NULL DEFAULT '[]',
    "recommendedActions" TEXT NOT NULL DEFAULT '[]',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIObservabilityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGovernancePolicy" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rules" TEXT NOT NULL DEFAULT '[]',
    "inheritedFrom" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGovernanceApproval" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "riskAssessment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AIGovernanceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGovernanceAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'system',
    "actorId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'platform',
    "details" TEXT NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGovernanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGovernanceModel" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'experimental',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "qualityHistory" TEXT NOT NULL DEFAULT '[]',
    "latencyHistory" TEXT NOT NULL DEFAULT '[]',
    "costHistory" TEXT NOT NULL DEFAULT '[]',
    "riskHistory" TEXT NOT NULL DEFAULT '[]',
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGovernanceModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompetencyToDigitalCredential" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompetencyToDigitalCredential_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_isBanned_idx" ON "User"("isBanned");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_refreshTokenHash_idx" ON "UserSession"("refreshTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_deviceFingerprint_key" ON "UserDevice"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreference_userId_channel_category_key" ON "UserNotificationPreference"("userId", "channel", "category");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreak_userId_key" ON "UserStreak"("userId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "UserFollow_followeeId_idx" ON "UserFollow"("followeeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followeeId_key" ON "UserFollow"("followerId", "followeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "OrganizationRole_orgId_idx" ON "OrganizationRole"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRole_orgId_name_key" ON "OrganizationRole"("orgId", "name");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_orgId_userId_key" ON "OrganizationMembership"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_orgId_idx" ON "OrganizationInvitation"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBilling_orgId_key" ON "OrganizationBilling"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationCohort_orgId_idx" ON "OrganizationCohort"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCohortMember_cohortId_userId_key" ON "OrganizationCohortMember"("cohortId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCategory_slug_key" ON "MarketplaceCategory"("slug");

-- CreateIndex
CREATE INDEX "MarketplaceCategory_parentId_idx" ON "MarketplaceCategory"("parentId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_categoryId_idx" ON "MarketplaceListing"("categoryId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_contentType_idx" ON "MarketplaceListing"("contentType");

-- CreateIndex
CREATE INDEX "MarketplacePrice_listingId_idx" ON "MarketplacePrice"("listingId");

-- CreateIndex
CREATE INDEX "MarketplacePurchase_buyerId_idx" ON "MarketplacePurchase"("buyerId");

-- CreateIndex
CREATE INDEX "MarketplacePurchase_listingId_idx" ON "MarketplacePurchase"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceReview_purchaseId_key" ON "MarketplaceReview"("purchaseId");

-- CreateIndex
CREATE INDEX "MarketplaceReview_listingId_idx" ON "MarketplaceReview"("listingId");

-- CreateIndex
CREATE INDEX "MarketplaceReview_buyerId_idx" ON "MarketplaceReview"("buyerId");

-- CreateIndex
CREATE INDEX "MarketplaceRefund_purchaseId_idx" ON "MarketplaceRefund"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_userId_key" ON "Creator"("userId");

-- CreateIndex
CREATE INDEX "CreatorTier_creatorId_idx" ON "CreatorTier"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorSubscription_subscriberId_idx" ON "CreatorSubscription"("subscriberId");

-- CreateIndex
CREATE INDEX "CreatorSubscription_creatorId_idx" ON "CreatorSubscription"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorEarning_creatorId_createdAt_idx" ON "CreatorEarning"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");

-- CreateIndex
CREATE INDEX "PayoutAccount_creatorId_idx" ON "PayoutAccount"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "EduTokenLedger_walletId_createdAt_idx" ON "EduTokenLedger"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionRefund_transactionId_idx" ON "TransactionRefund"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_transactionId_key" ON "Escrow"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_tier_key" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_transactionId_key" ON "Invoice"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "AiConversation_userId_idx" ON "AiConversation"("userId");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiContextMemory_userId_idx" ON "AiContextMemory"("userId");

-- CreateIndex
CREATE INDEX "AiDecision_userId_createdAt_idx" ON "AiDecision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_day_idx" ON "AiUsageLog"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageLog_userId_day_model_feature_key" ON "AiUsageLog"("userId", "day", "model", "feature");

-- CreateIndex
CREATE INDEX "AiToolCall_messageId_idx" ON "AiToolCall"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "AiPrompt_name_version_key" ON "AiPrompt"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AiFeedback_messageId_userId_key" ON "AiFeedback"("messageId", "userId");

-- CreateIndex
CREATE INDEX "Quiz_teacherId_idx" ON "Quiz"("teacherId");

-- CreateIndex
CREATE INDEX "Quiz_orgId_idx" ON "Quiz"("orgId");

-- CreateIndex
CREATE INDEX "Quiz_isPublished_idx" ON "Quiz"("isPublished");

-- CreateIndex
CREATE INDEX "Quiz_category_idx" ON "Quiz"("category");

-- CreateIndex
CREATE INDEX "Question_quizId_orderNum_idx" ON "Question"("quizId", "orderNum");

-- CreateIndex
CREATE UNIQUE INDEX "QuizSession_code_key" ON "QuizSession"("code");

-- CreateIndex
CREATE INDEX "QuizSession_quizId_idx" ON "QuizSession"("quizId");

-- CreateIndex
CREATE INDEX "QuizSession_code_idx" ON "QuizSession"("code");

-- CreateIndex
CREATE INDEX "Player_sessionId_idx" ON "Player"("sessionId");

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");

-- CreateIndex
CREATE INDEX "Answer_playerId_idx" ON "Answer"("playerId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_userId_idx" ON "QuizAttempt"("quizId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizVersion_quizId_version_key" ON "QuizVersion"("quizId", "version");

-- CreateIndex
CREATE INDEX "QuizReview_quizId_idx" ON "QuizReview"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "QuizTag_quizId_tagId_key" ON "QuizTag"("quizId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizCohort_quizId_cohortId_key" ON "QuizCohort"("quizId", "cohortId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_orgId_occurredAt_idx" ON "AnalyticsEvent"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "DailyUserStat_userId_day_idx" ON "DailyUserStat"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DailyUserStat_userId_day_key" ON "DailyUserStat"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "QuizPerformanceStat_quizId_day_key" ON "QuizPerformanceStat"("quizId", "day");

-- CreateIndex
CREATE INDEX "CreatorAnalytic_creatorId_day_idx" ON "CreatorAnalytic"("creatorId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAnalytic_creatorId_day_key" ON "CreatorAnalytic"("creatorId", "day");

-- CreateIndex
CREATE INDEX "OrgAnalytic_orgId_day_idx" ON "OrgAnalytic"("orgId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAnalytic_orgId_day_key" ON "OrgAnalytic"("orgId", "day");

-- CreateIndex
CREATE INDEX "FunnelEvent_userId_funnelName_idx" ON "FunnelEvent"("userId", "funnelName");

-- CreateIndex
CREATE INDEX "SearchIndex_entityType_isPublished_idx" ON "SearchIndex"("entityType", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIndex_entityType_entityId_key" ON "SearchIndex"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SearchQueryLog_userId_idx" ON "SearchQueryLog"("userId");

-- CreateIndex
CREATE INDEX "SearchQueryLog_occurredAt_idx" ON "SearchQueryLog"("occurredAt");

-- CreateIndex
CREATE INDEX "Recommendation_userId_idx" ON "Recommendation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Library_ownerType_ownerId_idx" ON "Library"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "LibraryItem_libraryId_idx" ON "LibraryItem"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryItem_libraryId_itemType_itemId_key" ON "LibraryItem"("libraryId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "LibraryCollection_libraryId_idx" ON "LibraryCollection"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCollectionItem_collectionId_libraryItemId_key" ON "LibraryCollectionItem"("collectionId", "libraryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryAccess_libraryId_granteeType_granteeId_key" ON "LibraryAccess"("libraryId", "granteeType", "granteeId");

-- CreateIndex
CREATE INDEX "LibraryImport_libraryId_idx" ON "LibraryImport"("libraryId");

-- CreateIndex
CREATE INDEX "ContentVersion_entityType_entityId_idx" ON "ContentVersion"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_entityType_entityId_version_key" ON "ContentVersion"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "ContentReview_entityType_entityId_idx" ON "ContentReview"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentModerationFlag_entityType_entityId_idx" ON "ContentModerationFlag"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_scope_isActive_idx" ON "Coupon"("scope", "isActive");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_userId_orderId_key" ON "CouponUsage"("couponId", "userId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCreatorTier_name_key" ON "PlatformCreatorTier"("name");

-- CreateIndex
CREATE INDEX "PlatformCreatorTier_sortOrder_idx" ON "PlatformCreatorTier"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCreatorTierAssignment_creatorId_key" ON "PlatformCreatorTierAssignment"("creatorId");

-- CreateIndex
CREATE INDEX "PlatformCreatorTierAssignment_tierId_idx" ON "PlatformCreatorTierAssignment"("tierId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_occurredAt_idx" ON "AuditLog"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_occurredAt_idx" ON "AuditLog"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_occurredAt_idx" ON "AuditLog"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "Resource_ownerType_ownerId_idx" ON "Resource"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Resource_orgId_idx" ON "Resource"("orgId");

-- CreateIndex
CREATE INDEX "Resource_resourceType_idx" ON "Resource"("resourceType");

-- CreateIndex
CREATE INDEX "Resource_subject_idx" ON "Resource"("subject");

-- CreateIndex
CREATE INDEX "Resource_grade_idx" ON "Resource"("grade");

-- CreateIndex
CREATE INDEX "Resource_visibility_idx" ON "Resource"("visibility");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_duplicatedFromId_idx" ON "Resource"("duplicatedFromId");

-- CreateIndex
CREATE INDEX "Resource_updatedAt_idx" ON "Resource"("updatedAt");

-- CreateIndex
CREATE INDEX "ResourceVersion_resourceId_version_idx" ON "ResourceVersion"("resourceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceVersion_resourceId_version_key" ON "ResourceVersion"("resourceId", "version");

-- CreateIndex
CREATE INDEX "ResourceTag_tag_idx" ON "ResourceTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTag_resourceId_tag_key" ON "ResourceTag"("resourceId", "tag");

-- CreateIndex
CREATE INDEX "ResourceFavorite_userId_idx" ON "ResourceFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceFavorite_resourceId_userId_key" ON "ResourceFavorite"("resourceId", "userId");

-- CreateIndex
CREATE INDEX "OrganizationResourceCategory_orgId_idx" ON "OrganizationResourceCategory"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationResourceCategory_parentId_idx" ON "OrganizationResourceCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationResourceCategory_orgId_slug_key" ON "OrganizationResourceCategory"("orgId", "slug");

-- CreateIndex
CREATE INDEX "Collection_ownerType_ownerId_idx" ON "Collection"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Collection_orgId_idx" ON "Collection"("orgId");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionItem_resourceId_idx" ON "CollectionItem"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_resourceId_key" ON "CollectionItem"("collectionId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStat_resourceId_key" ON "ResourceStat"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedResource_token_key" ON "SharedResource"("token");

-- CreateIndex
CREATE INDEX "SharedResource_resourceId_idx" ON "SharedResource"("resourceId");

-- CreateIndex
CREATE INDEX "SharedResource_createdById_idx" ON "SharedResource"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "AiSession_conversationId_key" ON "AiSession"("conversationId");

-- CreateIndex
CREATE INDEX "AiSession_ownerId_idx" ON "AiSession"("ownerId");

-- CreateIndex
CREATE INDEX "AiSession_orgId_idx" ON "AiSession"("orgId");

-- CreateIndex
CREATE INDEX "AiSession_status_idx" ON "AiSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MpListing_resourceId_key" ON "MpListing"("resourceId");

-- CreateIndex
CREATE INDEX "MpListing_creatorId_idx" ON "MpListing"("creatorId");

-- CreateIndex
CREATE INDEX "MpListing_orgId_idx" ON "MpListing"("orgId");

-- CreateIndex
CREATE INDEX "MpListing_status_idx" ON "MpListing"("status");

-- CreateIndex
CREATE INDEX "MpListing_featured_status_idx" ON "MpListing"("featured", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MpCategory_slug_key" ON "MpCategory"("slug");

-- CreateIndex
CREATE INDEX "MpCategory_slug_idx" ON "MpCategory"("slug");

-- CreateIndex
CREATE INDEX "MpListingCategory_listingId_idx" ON "MpListingCategory"("listingId");

-- CreateIndex
CREATE INDEX "MpListingCategory_categoryId_idx" ON "MpListingCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MpListingCategory_listingId_categoryId_key" ON "MpListingCategory"("listingId", "categoryId");

-- CreateIndex
CREATE INDEX "MpFavorite_userId_idx" ON "MpFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MpFavorite_listingId_userId_key" ON "MpFavorite"("listingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MpPurchase_resourceId_key" ON "MpPurchase"("resourceId");

-- CreateIndex
CREATE INDEX "MpPurchase_buyerId_idx" ON "MpPurchase"("buyerId");

-- CreateIndex
CREATE INDEX "MpPurchase_listingId_idx" ON "MpPurchase"("listingId");

-- CreateIndex
CREATE INDEX "MpPurchase_creatorId_idx" ON "MpPurchase"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "MpPurchase_buyerId_listingId_key" ON "MpPurchase"("buyerId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "MpReview_purchaseId_key" ON "MpReview"("purchaseId");

-- CreateIndex
CREATE INDEX "MpReview_listingId_idx" ON "MpReview"("listingId");

-- CreateIndex
CREATE INDEX "MpReview_buyerId_idx" ON "MpReview"("buyerId");

-- CreateIndex
CREATE INDEX "MpWishlist_userId_idx" ON "MpWishlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MpWishlist_userId_listingId_key" ON "MpWishlist"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Classroom_teacherId_idx" ON "Classroom"("teacherId");

-- CreateIndex
CREATE INDEX "Classroom_orgId_idx" ON "Classroom"("orgId");

-- CreateIndex
CREATE INDEX "Classroom_status_idx" ON "Classroom"("status");

-- CreateIndex
CREATE INDEX "ClassroomStudent_studentId_idx" ON "ClassroomStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomStudent_classroomId_studentId_key" ON "ClassroomStudent"("classroomId", "studentId");

-- CreateIndex
CREATE INDEX "Assignment_classroomId_idx" ON "Assignment"("classroomId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_idx" ON "Assignment"("teacherId");

-- CreateIndex
CREATE INDEX "Assignment_resourceId_idx" ON "Assignment"("resourceId");

-- CreateIndex
CREATE INDEX "Assignment_visibility_status_idx" ON "Assignment"("visibility", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentAttempt_resourceCopyId_key" ON "AssignmentAttempt"("resourceCopyId");

-- CreateIndex
CREATE INDEX "AssignmentAttempt_studentId_idx" ON "AssignmentAttempt"("studentId");

-- CreateIndex
CREATE INDEX "AssignmentAttempt_assignmentId_idx" ON "AssignmentAttempt"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentAttempt_status_idx" ON "AssignmentAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentAttempt_assignmentId_studentId_attemptNumber_key" ON "AssignmentAttempt"("assignmentId", "studentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_attemptId_key" ON "Submission"("attemptId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_submissionId_key" ON "Grade"("submissionId");

-- CreateIndex
CREATE INDEX "Grade_teacherId_idx" ON "Grade"("teacherId");

-- CreateIndex
CREATE INDEX "LearningSession_studentId_idx" ON "LearningSession"("studentId");

-- CreateIndex
CREATE INDEX "LearningSession_attemptId_idx" ON "LearningSession"("attemptId");

-- CreateIndex
CREATE INDEX "LearningSession_status_idx" ON "LearningSession"("status");

-- CreateIndex
CREATE INDEX "ProgressRecord_studentId_idx" ON "ProgressRecord"("studentId");

-- CreateIndex
CREATE INDEX "ProgressRecord_classroomId_idx" ON "ProgressRecord"("classroomId");

-- CreateIndex
CREATE INDEX "ProgressRecord_assignmentId_idx" ON "ProgressRecord"("assignmentId");

-- CreateIndex
CREATE INDEX "ProgressRecord_metric_createdAt_idx" ON "ProgressRecord"("metric", "createdAt");

-- CreateIndex
CREATE INDEX "BankQuestion_ownerId_idx" ON "BankQuestion"("ownerId");

-- CreateIndex
CREATE INDEX "BankQuestion_orgId_idx" ON "BankQuestion"("orgId");

-- CreateIndex
CREATE INDEX "BankQuestion_questionType_idx" ON "BankQuestion"("questionType");

-- CreateIndex
CREATE INDEX "BankQuestion_subject_idx" ON "BankQuestion"("subject");

-- CreateIndex
CREATE INDEX "BankQuestion_difficulty_idx" ON "BankQuestion"("difficulty");

-- CreateIndex
CREATE INDEX "BankQuestion_status_idx" ON "BankQuestion"("status");

-- CreateIndex
CREATE INDEX "BankQuestionVersion_questionId_version_idx" ON "BankQuestionVersion"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BankQuestionVersion_questionId_version_key" ON "BankQuestionVersion"("questionId", "version");

-- CreateIndex
CREATE INDEX "Rubric_ownerId_idx" ON "Rubric"("ownerId");

-- CreateIndex
CREATE INDEX "Rubric_orgId_idx" ON "Rubric"("orgId");

-- CreateIndex
CREATE INDEX "Rubric_status_idx" ON "Rubric"("status");

-- CreateIndex
CREATE INDEX "RubricCriterion_rubricId_idx" ON "RubricCriterion"("rubricId");

-- CreateIndex
CREATE INDEX "Assessment_ownerId_idx" ON "Assessment"("ownerId");

-- CreateIndex
CREATE INDEX "Assessment_orgId_idx" ON "Assessment"("orgId");

-- CreateIndex
CREATE INDEX "Assessment_classroomId_idx" ON "Assessment"("classroomId");

-- CreateIndex
CREATE INDEX "Assessment_resourceId_idx" ON "Assessment"("resourceId");

-- CreateIndex
CREATE INDEX "Assessment_assessmentType_idx" ON "Assessment"("assessmentType");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_questionId_idx" ON "AssessmentQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_questionId_key" ON "AssessmentQuestion"("assessmentId", "questionId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_studentId_idx" ON "AssessmentAttempt"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_expiresAt_idx" ON "AssessmentAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_assessmentId_studentId_attemptNumber_key" ON "AssessmentAttempt"("assessmentId", "studentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "AssessmentResponse_attemptId_idx" ON "AssessmentResponse"("attemptId");

-- CreateIndex
CREATE INDEX "AssessmentResponse_questionId_idx" ON "AssessmentResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_attemptId_questionId_key" ON "AssessmentResponse"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradebookEntry_assessmentAttemptId_key" ON "GradebookEntry"("assessmentAttemptId");

-- CreateIndex
CREATE INDEX "GradebookEntry_classroomId_idx" ON "GradebookEntry"("classroomId");

-- CreateIndex
CREATE INDEX "GradebookEntry_studentId_idx" ON "GradebookEntry"("studentId");

-- CreateIndex
CREATE INDEX "GradebookEntry_sourceType_sourceId_idx" ON "GradebookEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "GradebookEntry_gradedAt_idx" ON "GradebookEntry"("gradedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_classroomId_idx" ON "Certificate"("classroomId");

-- CreateIndex
CREATE INDEX "Certificate_assessmentId_idx" ON "Certificate"("assessmentId");

-- CreateIndex
CREATE INDEX "Certificate_verificationCode_idx" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "Certificate_issuedAt_idx" ON "Certificate"("issuedAt");

-- CreateIndex
CREATE INDEX "ProctoringIncident_attemptId_idx" ON "ProctoringIncident"("attemptId");

-- CreateIndex
CREATE INDEX "ProctoringIncident_studentId_idx" ON "ProctoringIncident"("studentId");

-- CreateIndex
CREATE INDEX "ProctoringIncident_incidentType_idx" ON "ProctoringIncident"("incidentType");

-- CreateIndex
CREATE INDEX "ProctoringIncident_occurredAt_idx" ON "ProctoringIncident"("occurredAt");

-- CreateIndex
CREATE INDEX "PlagiarismReport_attemptId_idx" ON "PlagiarismReport"("attemptId");

-- CreateIndex
CREATE INDEX "PlagiarismReport_studentId_idx" ON "PlagiarismReport"("studentId");

-- CreateIndex
CREATE INDEX "PlagiarismReport_flagged_idx" ON "PlagiarismReport"("flagged");

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_code_key" ON "LiveSession"("code");

-- CreateIndex
CREATE INDEX "LiveSession_hostId_idx" ON "LiveSession"("hostId");

-- CreateIndex
CREATE INDEX "LiveSession_orgId_idx" ON "LiveSession"("orgId");

-- CreateIndex
CREATE INDEX "LiveSession_classroomId_idx" ON "LiveSession"("classroomId");

-- CreateIndex
CREATE INDEX "LiveSession_resourceId_idx" ON "LiveSession"("resourceId");

-- CreateIndex
CREATE INDEX "LiveSession_assessmentId_idx" ON "LiveSession"("assessmentId");

-- CreateIndex
CREATE INDEX "LiveSession_gameMode_idx" ON "LiveSession"("gameMode");

-- CreateIndex
CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");

-- CreateIndex
CREATE INDEX "LiveSession_code_idx" ON "LiveSession"("code");

-- CreateIndex
CREATE INDEX "LivePlayer_sessionId_idx" ON "LivePlayer"("sessionId");

-- CreateIndex
CREATE INDEX "LivePlayer_userId_idx" ON "LivePlayer"("userId");

-- CreateIndex
CREATE INDEX "LivePlayer_status_idx" ON "LivePlayer"("status");

-- CreateIndex
CREATE INDEX "LivePlayer_socketId_idx" ON "LivePlayer"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "LivePlayer_sessionId_userId_key" ON "LivePlayer"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "LiveRound_sessionId_idx" ON "LiveRound"("sessionId");

-- CreateIndex
CREATE INDEX "LiveRound_questionId_idx" ON "LiveRound"("questionId");

-- CreateIndex
CREATE INDEX "LiveRound_status_idx" ON "LiveRound"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LiveRound_sessionId_roundNumber_key" ON "LiveRound"("sessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "LiveAnswer_roundId_idx" ON "LiveAnswer"("roundId");

-- CreateIndex
CREATE INDEX "LiveAnswer_playerId_idx" ON "LiveAnswer"("playerId");

-- CreateIndex
CREATE INDEX "LiveAnswer_isCorrect_idx" ON "LiveAnswer"("isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "LiveAnswer_roundId_playerId_key" ON "LiveAnswer"("roundId", "playerId");

-- CreateIndex
CREATE INDEX "LiveLeaderboard_sessionId_roundNumber_idx" ON "LiveLeaderboard"("sessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "LiveLeaderboard_generatedAt_idx" ON "LiveLeaderboard"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_sessionId_key" ON "Lobby"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_joinCode_key" ON "Lobby"("joinCode");

-- CreateIndex
CREATE INDEX "Lobby_joinCode_idx" ON "Lobby"("joinCode");

-- CreateIndex
CREATE INDEX "Lobby_status_idx" ON "Lobby"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Replay_sessionId_key" ON "Replay"("sessionId");

-- CreateIndex
CREATE INDEX "Replay_visibility_idx" ON "Replay"("visibility");

-- CreateIndex
CREATE INDEX "Replay_createdAt_idx" ON "Replay"("createdAt");

-- CreateIndex
CREATE INDEX "Tournament_hostId_idx" ON "Tournament"("hostId");

-- CreateIndex
CREATE INDEX "Tournament_orgId_idx" ON "Tournament"("orgId");

-- CreateIndex
CREATE INDEX "Tournament_classroomId_idx" ON "Tournament"("classroomId");

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "TournamentMatch"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentMatch_roundNumber_idx" ON "TournamentMatch"("roundNumber");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "TournamentMatch"("status");

-- CreateIndex
CREATE INDEX "GameReward_sessionId_idx" ON "GameReward"("sessionId");

-- CreateIndex
CREATE INDEX "GameReward_playerId_idx" ON "GameReward"("playerId");

-- CreateIndex
CREATE INDEX "GameReward_userId_idx" ON "GameReward"("userId");

-- CreateIndex
CREATE INDEX "GameReward_rewardType_idx" ON "GameReward"("rewardType");

-- CreateIndex
CREATE INDEX "GameReward_code_idx" ON "GameReward"("code");

-- CreateIndex
CREATE INDEX "ResourceTranslation_resourceId_idx" ON "ResourceTranslation"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceTranslation_language_idx" ON "ResourceTranslation"("language");

-- CreateIndex
CREATE INDEX "ResourceTranslation_translationStatus_idx" ON "ResourceTranslation"("translationStatus");

-- CreateIndex
CREATE INDEX "ResourceTranslation_slug_idx" ON "ResourceTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTranslation_resourceId_language_key" ON "ResourceTranslation"("resourceId", "language");

-- CreateIndex
CREATE INDEX "CategoryTranslation_categoryId_idx" ON "CategoryTranslation"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryTranslation_language_idx" ON "CategoryTranslation"("language");

-- CreateIndex
CREATE INDEX "CategoryTranslation_slug_idx" ON "CategoryTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "CategoryTranslation"("categoryId", "language");

-- CreateIndex
CREATE INDEX "SubscriptionPlanTranslation_planId_idx" ON "SubscriptionPlanTranslation"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanTranslation_language_idx" ON "SubscriptionPlanTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanTranslation_planId_language_key" ON "SubscriptionPlanTranslation"("planId", "language");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_entityType_idx" ON "KnowledgeGraphNode"("entityType");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_entityType_entityId_idx" ON "KnowledgeGraphNode"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_title_idx" ON "KnowledgeGraphNode"("title");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_language_idx" ON "KnowledgeGraphNode"("language");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_popularity_idx" ON "KnowledgeGraphNode"("popularity");

-- CreateIndex
CREATE INDEX "KnowledgeGraphNode_quality_idx" ON "KnowledgeGraphNode"("quality");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeGraphNode_entityType_entityId_key" ON "KnowledgeGraphNode"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_fromNodeId_idx" ON "KnowledgeGraphEdge"("fromNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_toNodeId_idx" ON "KnowledgeGraphEdge"("toNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeGraphEdge_edgeType_idx" ON "KnowledgeGraphEdge"("edgeType");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeGraphEdge_fromNodeId_toNodeId_edgeType_key" ON "KnowledgeGraphEdge"("fromNodeId", "toNodeId", "edgeType");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_entityType_idx" ON "SearchIndexEntry"("entityType");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_entityType_entityId_idx" ON "SearchIndexEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_language_idx" ON "SearchIndexEntry"("language");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_subject_idx" ON "SearchIndexEntry"("subject");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_difficulty_idx" ON "SearchIndexEntry"("difficulty");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_resourceType_idx" ON "SearchIndexEntry"("resourceType");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_isMarketplace_idx" ON "SearchIndexEntry"("isMarketplace");

-- CreateIndex
CREATE INDEX "SearchIndexEntry_popularity_idx" ON "SearchIndexEntry"("popularity");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIndexEntry_entityType_entityId_key" ON "SearchIndexEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Topic_parentId_idx" ON "Topic"("parentId");

-- CreateIndex
CREATE INDEX "Topic_language_idx" ON "Topic"("language");

-- CreateIndex
CREATE INDEX "Topic_slug_idx" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_difficulty_idx" ON "Topic"("difficulty");

-- CreateIndex
CREATE INDEX "TopicEdge_fromTopicId_idx" ON "TopicEdge"("fromTopicId");

-- CreateIndex
CREATE INDEX "TopicEdge_toTopicId_idx" ON "TopicEdge"("toTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicEdge_fromTopicId_toTopicId_edgeType_key" ON "TopicEdge"("fromTopicId", "toTopicId", "edgeType");

-- CreateIndex
CREATE INDEX "SearchAnalyticsEvent_userId_idx" ON "SearchAnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "SearchAnalyticsEvent_query_idx" ON "SearchAnalyticsEvent"("query");

-- CreateIndex
CREATE INDEX "SearchAnalyticsEvent_locale_idx" ON "SearchAnalyticsEvent"("locale");

-- CreateIndex
CREATE INDEX "SearchAnalyticsEvent_createdAt_idx" ON "SearchAnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Embedding_entityType_idx" ON "Embedding"("entityType");

-- CreateIndex
CREATE INDEX "Embedding_entityType_entityId_idx" ON "Embedding"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_entityType_entityId_key" ON "Embedding"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterestProfile_userId_key" ON "UserInterestProfile"("userId");

-- CreateIndex
CREATE INDEX "UserInterestProfile_userId_idx" ON "UserInterestProfile"("userId");

-- CreateIndex
CREATE INDEX "RecommendationCache_userId_idx" ON "RecommendationCache"("userId");

-- CreateIndex
CREATE INDEX "RecommendationCache_expiresAt_idx" ON "RecommendationCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationCache_userId_strategy_locale_key" ON "RecommendationCache"("userId", "strategy", "locale");

-- CreateIndex
CREATE INDEX "SearchSession_userId_idx" ON "SearchSession"("userId");

-- CreateIndex
CREATE INDEX "SearchSession_query_idx" ON "SearchSession"("query");

-- CreateIndex
CREATE INDEX "SearchSession_createdAt_idx" ON "SearchSession"("createdAt");

-- CreateIndex
CREATE INDEX "LearningIntent_userId_idx" ON "LearningIntent"("userId");

-- CreateIndex
CREATE INDEX "LearningIntent_intent_idx" ON "LearningIntent"("intent");

-- CreateIndex
CREATE INDEX "SemanticCluster_topicId_idx" ON "SemanticCluster"("topicId");

-- CreateIndex
CREATE INDEX "LearningGoal_userId_idx" ON "LearningGoal"("userId");

-- CreateIndex
CREATE INDEX "LearningGoal_status_idx" ON "LearningGoal"("status");

-- CreateIndex
CREATE INDEX "LearningPlan_userId_idx" ON "LearningPlan"("userId");

-- CreateIndex
CREATE INDEX "LearningPlan_goalId_idx" ON "LearningPlan"("goalId");

-- CreateIndex
CREATE INDEX "LearningPlan_status_idx" ON "LearningPlan"("status");

-- CreateIndex
CREATE INDEX "LearningPlanItem_planId_idx" ON "LearningPlanItem"("planId");

-- CreateIndex
CREATE INDEX "LearningPlanItem_sortOrder_idx" ON "LearningPlanItem"("sortOrder");

-- CreateIndex
CREATE INDEX "LearningPlanItem_status_idx" ON "LearningPlanItem"("status");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "StudySession_planId_idx" ON "StudySession"("planId");

-- CreateIndex
CREATE INDEX "StudySession_startedAt_idx" ON "StudySession"("startedAt");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_nextReviewAt_idx" ON "ReviewSchedule"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "ReviewSchedule_nextReviewAt_idx" ON "ReviewSchedule"("nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_userId_entityType_entityId_key" ON "ReviewSchedule"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ReviewHistory_userId_idx" ON "ReviewHistory"("userId");

-- CreateIndex
CREATE INDEX "ReviewHistory_reviewScheduleId_idx" ON "ReviewHistory"("reviewScheduleId");

-- CreateIndex
CREATE INDEX "ReviewHistory_createdAt_idx" ON "ReviewHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LearningMilestone_userId_idx" ON "LearningMilestone"("userId");

-- CreateIndex
CREATE INDEX "LearningMilestone_type_idx" ON "LearningMilestone"("type");

-- CreateIndex
CREATE INDEX "LearningMilestone_achievedAt_idx" ON "LearningMilestone"("achievedAt");

-- CreateIndex
CREATE INDEX "LearningVelocitySnapshot_userId_idx" ON "LearningVelocitySnapshot"("userId");

-- CreateIndex
CREATE INDEX "LearningVelocitySnapshot_weekStart_idx" ON "LearningVelocitySnapshot"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "LearningVelocitySnapshot_userId_weekStart_key" ON "LearningVelocitySnapshot"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "LearningAnalyticsSnapshot_userId_idx" ON "LearningAnalyticsSnapshot"("userId");

-- CreateIndex
CREATE INDEX "LearningAnalyticsSnapshot_day_idx" ON "LearningAnalyticsSnapshot"("day");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAnalyticsSnapshot_userId_day_key" ON "LearningAnalyticsSnapshot"("userId", "day");

-- CreateIndex
CREATE INDEX "StudyGroup_ownerId_idx" ON "StudyGroup"("ownerId");

-- CreateIndex
CREATE INDEX "StudyGroup_organizationId_idx" ON "StudyGroup"("organizationId");

-- CreateIndex
CREATE INDEX "StudyGroup_subject_idx" ON "StudyGroup"("subject");

-- CreateIndex
CREATE INDEX "StudyGroup_visibility_status_idx" ON "StudyGroup"("visibility", "status");

-- CreateIndex
CREATE INDEX "StudyGroupMember_userId_idx" ON "StudyGroupMember"("userId");

-- CreateIndex
CREATE INDEX "StudyGroupMember_groupId_role_idx" ON "StudyGroupMember"("groupId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupMember_groupId_userId_key" ON "StudyGroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_token_key" ON "GroupInvitation"("token");

-- CreateIndex
CREATE INDEX "GroupInvitation_groupId_idx" ON "GroupInvitation"("groupId");

-- CreateIndex
CREATE INDEX "GroupInvitation_inviteeId_idx" ON "GroupInvitation"("inviteeId");

-- CreateIndex
CREATE INDEX "GroupInvitation_token_idx" ON "GroupInvitation"("token");

-- CreateIndex
CREATE INDEX "GroupInvitation_status_idx" ON "GroupInvitation"("status");

-- CreateIndex
CREATE INDEX "Discussion_entityType_entityId_idx" ON "Discussion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Discussion_authorId_idx" ON "Discussion"("authorId");

-- CreateIndex
CREATE INDEX "Discussion_status_pinned_idx" ON "Discussion"("status", "pinned");

-- CreateIndex
CREATE INDEX "DiscussionReply_discussionId_idx" ON "DiscussionReply"("discussionId");

-- CreateIndex
CREATE INDEX "DiscussionReply_authorId_idx" ON "DiscussionReply"("authorId");

-- CreateIndex
CREATE INDEX "DiscussionReply_parentId_idx" ON "DiscussionReply"("parentId");

-- CreateIndex
CREATE INDEX "DiscussionReply_status_idx" ON "DiscussionReply"("status");

-- CreateIndex
CREATE INDEX "DiscussionReaction_replyId_emoji_idx" ON "DiscussionReaction"("replyId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionReaction_replyId_userId_emoji_key" ON "DiscussionReaction"("replyId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "CollaborativeNote_ownerId_idx" ON "CollaborativeNote"("ownerId");

-- CreateIndex
CREATE INDEX "CollaborativeNote_classroomId_idx" ON "CollaborativeNote"("classroomId");

-- CreateIndex
CREATE INDEX "CollaborativeNote_groupId_idx" ON "CollaborativeNote"("groupId");

-- CreateIndex
CREATE INDEX "CollaborativeNote_entityType_entityId_idx" ON "CollaborativeNote"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CollaborativeNoteVersion_noteId_version_idx" ON "CollaborativeNoteVersion"("noteId", "version");

-- CreateIndex
CREATE INDEX "CollaborativeNoteVersion_editedBy_idx" ON "CollaborativeNoteVersion"("editedBy");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborativeNoteVersion_noteId_version_key" ON "CollaborativeNoteVersion"("noteId", "version");

-- CreateIndex
CREATE INDEX "TeacherRecommendation_teacherId_idx" ON "TeacherRecommendation"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherRecommendation_classroomId_idx" ON "TeacherRecommendation"("classroomId");

-- CreateIndex
CREATE INDEX "TeacherRecommendation_type_status_idx" ON "TeacherRecommendation"("type", "status");

-- CreateIndex
CREATE INDEX "Intervention_teacherId_idx" ON "Intervention"("teacherId");

-- CreateIndex
CREATE INDEX "Intervention_classroomId_idx" ON "Intervention"("classroomId");

-- CreateIndex
CREATE INDEX "Intervention_reason_status_idx" ON "Intervention"("reason", "status");

-- CreateIndex
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- CreateIndex
CREATE INDEX "Announcement_classroomId_idx" ON "Announcement"("classroomId");

-- CreateIndex
CREATE INDEX "Announcement_groupId_idx" ON "Announcement"("groupId");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_idx" ON "Announcement"("organizationId");

-- CreateIndex
CREATE INDEX "Announcement_status_pinned_idx" ON "Announcement"("status", "pinned");

-- CreateIndex
CREATE INDEX "LearningChallenge_organizationId_idx" ON "LearningChallenge"("organizationId");

-- CreateIndex
CREATE INDEX "LearningChallenge_classroomId_idx" ON "LearningChallenge"("classroomId");

-- CreateIndex
CREATE INDEX "LearningChallenge_groupId_idx" ON "LearningChallenge"("groupId");

-- CreateIndex
CREATE INDEX "LearningChallenge_type_status_idx" ON "LearningChallenge"("type", "status");

-- CreateIndex
CREATE INDEX "LearningChallenge_startsAt_endsAt_idx" ON "LearningChallenge"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ChallengeParticipation_challengeId_completed_idx" ON "ChallengeParticipation"("challengeId", "completed");

-- CreateIndex
CREATE INDEX "ChallengeParticipation_challengeId_rank_idx" ON "ChallengeParticipation"("challengeId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipation_challengeId_userId_key" ON "ChallengeParticipation"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipation_challengeId_groupId_key" ON "ChallengeParticipation"("challengeId", "groupId");

-- CreateIndex
CREATE INDEX "PeerRecommendation_userId_type_idx" ON "PeerRecommendation"("userId", "type");

-- CreateIndex
CREATE INDEX "PeerRecommendation_userId_status_idx" ON "PeerRecommendation"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PeerRecommendation_userId_peerId_type_key" ON "PeerRecommendation"("userId", "peerId", "type");

-- CreateIndex
CREATE INDEX "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");

-- CreateIndex
CREATE INDEX "Mentorship_menteeId_idx" ON "Mentorship"("menteeId");

-- CreateIndex
CREATE INDEX "Mentorship_status_idx" ON "Mentorship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Mentorship_mentorId_menteeId_subject_key" ON "Mentorship"("mentorId", "menteeId", "subject");

-- CreateIndex
CREATE INDEX "ClassInsight_classroomId_idx" ON "ClassInsight"("classroomId");

-- CreateIndex
CREATE INDEX "ClassInsight_day_idx" ON "ClassInsight"("day");

-- CreateIndex
CREATE UNIQUE INDEX "ClassInsight_classroomId_day_key" ON "ClassInsight"("classroomId", "day");

-- CreateIndex
CREATE INDEX "OrganizationInsight_organizationId_idx" ON "OrganizationInsight"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInsight_day_idx" ON "OrganizationInsight"("day");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInsight_organizationId_day_key" ON "OrganizationInsight"("organizationId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_slug_key" ON "Concept"("slug");

-- CreateIndex
CREATE INDEX "Concept_subject_idx" ON "Concept"("subject");

-- CreateIndex
CREATE INDEX "Concept_bloomLevel_idx" ON "Concept"("bloomLevel");

-- CreateIndex
CREATE INDEX "Concept_language_idx" ON "Concept"("language");

-- CreateIndex
CREATE INDEX "ConceptAlias_alias_language_idx" ON "ConceptAlias"("alias", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptAlias_conceptId_alias_language_key" ON "ConceptAlias"("conceptId", "alias", "language");

-- CreateIndex
CREATE INDEX "LearningObjective_frameworkId_idx" ON "LearningObjective"("frameworkId");

-- CreateIndex
CREATE INDEX "LearningObjective_subject_grade_idx" ON "LearningObjective"("subject", "grade");

-- CreateIndex
CREATE INDEX "LearningObjective_code_idx" ON "LearningObjective"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LearningObjective_frameworkId_code_key" ON "LearningObjective"("frameworkId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumFramework_code_key" ON "CurriculumFramework"("code");

-- CreateIndex
CREATE INDEX "CurriculumFramework_organizationId_idx" ON "CurriculumFramework"("organizationId");

-- CreateIndex
CREATE INDEX "CurriculumFramework_status_idx" ON "CurriculumFramework"("status");

-- CreateIndex
CREATE INDEX "CurriculumStandard_frameworkId_idx" ON "CurriculumStandard"("frameworkId");

-- CreateIndex
CREATE INDEX "CurriculumStandard_subject_grade_idx" ON "CurriculumStandard"("subject", "grade");

-- CreateIndex
CREATE INDEX "CurriculumStandard_strand_idx" ON "CurriculumStandard"("strand");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumStandard_frameworkId_code_key" ON "CurriculumStandard"("frameworkId", "code");

-- CreateIndex
CREATE INDEX "CurriculumMapping_standardId_idx" ON "CurriculumMapping"("standardId");

-- CreateIndex
CREATE INDEX "CurriculumMapping_entityType_entityId_idx" ON "CurriculumMapping"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CurriculumMapping_coverageLevel_idx" ON "CurriculumMapping"("coverageLevel");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumMapping_standardId_entityType_entityId_key" ON "CurriculumMapping"("standardId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ConceptRelationship_fromConceptId_idx" ON "ConceptRelationship"("fromConceptId");

-- CreateIndex
CREATE INDEX "ConceptRelationship_toConceptId_idx" ON "ConceptRelationship"("toConceptId");

-- CreateIndex
CREATE INDEX "ConceptRelationship_type_idx" ON "ConceptRelationship"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptRelationship_fromConceptId_toConceptId_type_key" ON "ConceptRelationship"("fromConceptId", "toConceptId", "type");

-- CreateIndex
CREATE INDEX "ConceptMastery_userId_idx" ON "ConceptMastery"("userId");

-- CreateIndex
CREATE INDEX "ConceptMastery_conceptId_idx" ON "ConceptMastery"("conceptId");

-- CreateIndex
CREATE INDEX "ConceptMastery_level_idx" ON "ConceptMastery"("level");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMastery_userId_conceptId_key" ON "ConceptMastery"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "ResourceConcept_conceptId_idx" ON "ResourceConcept"("conceptId");

-- CreateIndex
CREATE INDEX "ResourceConcept_entityType_entityId_idx" ON "ResourceConcept"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ResourceConcept_relationship_idx" ON "ResourceConcept"("relationship");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceConcept_conceptId_entityType_entityId_relationship_key" ON "ResourceConcept"("conceptId", "entityType", "entityId", "relationship");

-- CreateIndex
CREATE INDEX "KnowledgeCoverage_scopeType_scopeId_idx" ON "KnowledgeCoverage"("scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCoverage_scopeType_scopeId_frameworkId_key" ON "KnowledgeCoverage"("scopeType", "scopeId", "frameworkId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_scopeType_scopeId_idx" ON "KnowledgeGap"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_type_status_idx" ON "KnowledgeGap"("type", "status");

-- CreateIndex
CREATE INDEX "KnowledgeGap_standardId_idx" ON "KnowledgeGap"("standardId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_conceptId_idx" ON "KnowledgeGap"("conceptId");

-- CreateIndex
CREATE INDEX "ResourceQuality_entityType_idx" ON "ResourceQuality"("entityType");

-- CreateIndex
CREATE INDEX "ResourceQuality_overall_idx" ON "ResourceQuality"("overall");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceQuality_entityType_entityId_key" ON "ResourceQuality"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SimilarityCluster_entityType_idx" ON "SimilarityCluster"("entityType");

-- CreateIndex
CREATE INDEX "SimilarityCluster_clusterType_idx" ON "SimilarityCluster"("clusterType");

-- CreateIndex
CREATE INDEX "LearningPrediction_userId_idx" ON "LearningPrediction"("userId");

-- CreateIndex
CREATE INDEX "LearningPrediction_entityType_entityId_idx" ON "LearningPrediction"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "LearningPrediction_interventionNeeded_idx" ON "LearningPrediction"("interventionNeeded");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPrediction_userId_entityType_entityId_key" ON "LearningPrediction"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeHealthSnapshot_organizationId_idx" ON "KnowledgeHealthSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeHealthSnapshot_day_idx" ON "KnowledgeHealthSnapshot"("day");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeHealthSnapshot_organizationId_day_key" ON "KnowledgeHealthSnapshot"("organizationId", "day");

-- CreateIndex
CREATE INDEX "AgentMemory_scopeType_scopeId_idx" ON "AgentMemory"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AgentMemory_type_idx" ON "AgentMemory"("type");

-- CreateIndex
CREATE INDEX "AgentMemory_agentType_idx" ON "AgentMemory"("agentType");

-- CreateIndex
CREATE INDEX "AgentMemory_createdAt_idx" ON "AgentMemory"("createdAt");

-- CreateIndex
CREATE INDEX "AgentWorkflow_initiatedBy_idx" ON "AgentWorkflow"("initiatedBy");

-- CreateIndex
CREATE INDEX "AgentWorkflow_scopeType_scopeId_idx" ON "AgentWorkflow"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AgentWorkflow_type_status_idx" ON "AgentWorkflow"("type", "status");

-- CreateIndex
CREATE INDEX "AgentWorkflow_createdAt_idx" ON "AgentWorkflow"("createdAt");

-- CreateIndex
CREATE INDEX "AutomationRule_ownerId_idx" ON "AutomationRule"("ownerId");

-- CreateIndex
CREATE INDEX "AutomationRule_scopeType_scopeId_idx" ON "AutomationRule"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AutomationRule_enabled_idx" ON "AutomationRule"("enabled");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_agentType_idx" ON "AgentExecutionLog"("agentType");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_status_idx" ON "AgentExecutionLog"("status");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_scopeType_scopeId_idx" ON "AgentExecutionLog"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AgentExecutionLog_createdAt_idx" ON "AgentExecutionLog"("createdAt");

-- CreateIndex
CREATE INDEX "SimulationResult_scenario_idx" ON "SimulationResult"("scenario");

-- CreateIndex
CREATE INDEX "SimulationResult_createdAt_idx" ON "SimulationResult"("createdAt");

-- CreateIndex
CREATE INDEX "FeedbackEvent_type_occurredAt_idx" ON "FeedbackEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedbackEvent_userId_occurredAt_idx" ON "FeedbackEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedbackEvent_scopeType_scopeId_occurredAt_idx" ON "FeedbackEvent"("scopeType", "scopeId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedbackEvent_entityType_entityId_idx" ON "FeedbackEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FeedbackEvent_experimentId_variant_idx" ON "FeedbackEvent"("experimentId", "variant");

-- CreateIndex
CREATE INDEX "LearningSignal_signalType_entityType_idx" ON "LearningSignal"("signalType", "entityType");

-- CreateIndex
CREATE INDEX "LearningSignal_signalType_ctr_idx" ON "LearningSignal"("signalType", "ctr");

-- CreateIndex
CREATE INDEX "LearningSignal_signalType_satisfaction_idx" ON "LearningSignal"("signalType", "satisfaction");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSignal_signalType_entityType_entityId_secondaryEnti_key" ON "LearningSignal"("signalType", "entityType", "entityId", "secondaryEntityType", "secondaryEntityId");

-- CreateIndex
CREATE INDEX "RecommendationOutcome_userId_occurredAt_idx" ON "RecommendationOutcome"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "RecommendationOutcome_entityType_entityId_idx" ON "RecommendationOutcome"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RecommendationOutcome_strategy_outcome_idx" ON "RecommendationOutcome"("strategy", "outcome");

-- CreateIndex
CREATE INDEX "RecommendationOutcome_experimentId_variant_idx" ON "RecommendationOutcome"("experimentId", "variant");

-- CreateIndex
CREATE INDEX "SearchOutcome_userId_occurredAt_idx" ON "SearchOutcome"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "SearchOutcome_query_idx" ON "SearchOutcome"("query");

-- CreateIndex
CREATE INDEX "SearchOutcome_outcome_idx" ON "SearchOutcome"("outcome");

-- CreateIndex
CREATE INDEX "SearchOutcome_experimentId_variant_idx" ON "SearchOutcome"("experimentId", "variant");

-- CreateIndex
CREATE INDEX "PromptEvaluation_promptTemplateId_promptVersion_idx" ON "PromptEvaluation"("promptTemplateId", "promptVersion");

-- CreateIndex
CREATE INDEX "PromptEvaluation_provider_model_idx" ON "PromptEvaluation"("provider", "model");

-- CreateIndex
CREATE INDEX "PromptEvaluation_overallQuality_idx" ON "PromptEvaluation"("overallQuality");

-- CreateIndex
CREATE INDEX "PromptEvaluation_occurredAt_idx" ON "PromptEvaluation"("occurredAt");

-- CreateIndex
CREATE INDEX "PlatformExperiment_type_status_idx" ON "PlatformExperiment"("type", "status");

-- CreateIndex
CREATE INDEX "PlatformExperiment_ownerId_idx" ON "PlatformExperiment"("ownerId");

-- CreateIndex
CREATE INDEX "PlatformExperiment_status_startsAt_endsAt_idx" ON "PlatformExperiment"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentId_variant_idx" ON "ExperimentAssignment"("experimentId", "variant");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_userId_idx" ON "ExperimentAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_userId_key" ON "ExperimentAssignment"("experimentId", "userId");

-- CreateIndex
CREATE INDEX "OptimizationSnapshot_parameter_idx" ON "OptimizationSnapshot"("parameter");

-- CreateIndex
CREATE INDEX "OptimizationSnapshot_createdAt_idx" ON "OptimizationSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "OptimizationSnapshot_autoApplied_idx" ON "OptimizationSnapshot"("autoApplied");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_forecastType_scopeType_scopeId_idx" ON "ForecastSnapshot"("forecastType", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_createdAt_idx" ON "ForecastSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "HealthSnapshot_subsystem_checkedAt_idx" ON "HealthSnapshot"("subsystem", "checkedAt");

-- CreateIndex
CREATE INDEX "HealthSnapshot_status_idx" ON "HealthSnapshot"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_actionType_occurredAt_idx" ON "AuditEvent"("actionType", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorType_actorId_idx" ON "AuditEvent"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_affectedUserId_idx" ON "AuditEvent"("affectedUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_scopeType_scopeId_idx" ON "AuditEvent"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "PlatformInsight_category_type_idx" ON "PlatformInsight"("category", "type");

-- CreateIndex
CREATE INDEX "PlatformInsight_severity_idx" ON "PlatformInsight"("severity");

-- CreateIndex
CREATE INDEX "PlatformInsight_scopeType_scopeId_idx" ON "PlatformInsight"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "PlatformInsight_createdAt_idx" ON "PlatformInsight"("createdAt");

-- CreateIndex
CREATE INDEX "DigitalTwin_twinType_idx" ON "DigitalTwin"("twinType");

-- CreateIndex
CREATE INDEX "DigitalTwin_twinType_active_idx" ON "DigitalTwin"("twinType", "active");

-- CreateIndex
CREATE INDEX "DigitalTwin_lastSyncedAt_idx" ON "DigitalTwin"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalTwin_twinType_entityId_key" ON "DigitalTwin"("twinType", "entityId");

-- CreateIndex
CREATE INDEX "TwinSnapshot_twinType_entityId_day_idx" ON "TwinSnapshot"("twinType", "entityId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "TwinSnapshot_twinType_entityId_day_key" ON "TwinSnapshot"("twinType", "entityId", "day");

-- CreateIndex
CREATE INDEX "AcademicCalendar_organizationId_year_idx" ON "AcademicCalendar"("organizationId", "year");

-- CreateIndex
CREATE INDEX "AcademicCalendar_status_idx" ON "AcademicCalendar"("status");

-- CreateIndex
CREATE INDEX "AcademicCalendar_startDate_endDate_idx" ON "AcademicCalendar"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarId_startDate_idx" ON "CalendarEvent"("calendarId", "startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_startDate_idx" ON "CalendarEvent"("type", "startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_scopeType_scopeId_idx" ON "CalendarEvent"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AcademicWorkflow_trigger_status_idx" ON "AcademicWorkflow"("trigger", "status");

-- CreateIndex
CREATE INDEX "AcademicWorkflow_scopeType_scopeId_idx" ON "AcademicWorkflow"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AcademicWorkflow_createdAt_idx" ON "AcademicWorkflow"("createdAt");

-- CreateIndex
CREATE INDEX "AcademicMemory_scopeType_scopeId_academicYear_idx" ON "AcademicMemory"("scopeType", "scopeId", "academicYear");

-- CreateIndex
CREATE INDEX "AcademicMemory_type_academicYear_idx" ON "AcademicMemory"("type", "academicYear");

-- CreateIndex
CREATE INDEX "AcademicMemory_createdAt_idx" ON "AcademicMemory"("createdAt");

-- CreateIndex
CREATE INDEX "ScenarioPlan_type_status_idx" ON "ScenarioPlan"("type", "status");

-- CreateIndex
CREATE INDEX "ScenarioPlan_createdBy_idx" ON "ScenarioPlan"("createdBy");

-- CreateIndex
CREATE INDEX "ScenarioPlan_createdAt_idx" ON "ScenarioPlan"("createdAt");

-- CreateIndex
CREATE INDEX "AcademicOperation_organizationId_day_status_idx" ON "AcademicOperation"("organizationId", "day", "status");

-- CreateIndex
CREATE INDEX "AcademicOperation_priority_status_idx" ON "AcademicOperation"("priority", "status");

-- CreateIndex
CREATE INDEX "AcademicOperation_type_status_idx" ON "AcademicOperation"("type", "status");

-- CreateIndex
CREATE INDEX "AcademicOperation_entityType_entityId_idx" ON "AcademicOperation"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_code_key" ON "Competency"("code");

-- CreateIndex
CREATE INDEX "Competency_subject_level_idx" ON "Competency"("subject", "level");

-- CreateIndex
CREATE INDEX "Competency_code_idx" ON "Competency"("code");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_competencyId_userId_idx" ON "CompetencyEvidence"("competencyId", "userId");

-- CreateIndex
CREATE INDEX "CompetencyEvidence_userId_status_idx" ON "CompetencyEvidence"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCredential_verificationId_key" ON "DigitalCredential"("verificationId");

-- CreateIndex
CREATE INDEX "DigitalCredential_userId_status_idx" ON "DigitalCredential"("userId", "status");

-- CreateIndex
CREATE INDEX "DigitalCredential_issuerId_idx" ON "DigitalCredential"("issuerId");

-- CreateIndex
CREATE INDEX "DigitalCredential_type_status_idx" ON "DigitalCredential"("type", "status");

-- CreateIndex
CREATE INDEX "DigitalCredential_verificationId_idx" ON "DigitalCredential"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTranscript_userId_key" ON "AcademicTranscript"("userId");

-- CreateIndex
CREATE INDEX "AcademicTranscript_userId_idx" ON "AcademicTranscript"("userId");

-- CreateIndex
CREATE INDEX "AssessmentItem_assessmentId_idx" ON "AssessmentItem"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentItem_questionId_idx" ON "AssessmentItem"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuality_assessmentId_key" ON "AssessmentQuality"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentQuality_assessmentId_idx" ON "AssessmentQuality"("assessmentId");

-- CreateIndex
CREATE INDEX "IntegrityCheck_entityType_entityId_idx" ON "IntegrityCheck"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "IntegrityCheck_userId_idx" ON "IntegrityCheck"("userId");

-- CreateIndex
CREATE INDEX "IntegrityCheck_checkType_riskLevel_idx" ON "IntegrityCheck"("checkType", "riskLevel");

-- CreateIndex
CREATE INDEX "IntegrityCheck_status_idx" ON "IntegrityCheck"("status");

-- CreateIndex
CREATE INDEX "SecureExamSession_userId_status_idx" ON "SecureExamSession"("userId", "status");

-- CreateIndex
CREATE INDEX "SecureExamSession_assessmentId_status_idx" ON "SecureExamSession"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "SecureExamSession_status_idx" ON "SecureExamSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecureExamSession_assessmentId_userId_key" ON "SecureExamSession"("assessmentId", "userId");

-- CreateIndex
CREATE INDEX "AssessmentBlueprint_createdBy_idx" ON "AssessmentBlueprint"("createdBy");

-- CreateIndex
CREATE INDEX "AssessmentBlueprint_assessmentType_status_idx" ON "AssessmentBlueprint"("assessmentType", "status");

-- CreateIndex
CREATE INDEX "AssessmentBlueprint_frameworkId_idx" ON "AssessmentBlueprint"("frameworkId");

-- CreateIndex
CREATE INDEX "AccreditationReport_organizationId_idx" ON "AccreditationReport"("organizationId");

-- CreateIndex
CREATE INDEX "AccreditationReport_day_idx" ON "AccreditationReport"("day");

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationReport_organizationId_day_key" ON "AccreditationReport"("organizationId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialVerification_verificationId_key" ON "CredentialVerification"("verificationId");

-- CreateIndex
CREATE INDEX "CredentialVerification_verificationId_idx" ON "CredentialVerification"("verificationId");

-- CreateIndex
CREATE INDEX "CredentialVerification_credentialId_idx" ON "CredentialVerification"("credentialId");

-- CreateIndex
CREATE INDEX "CredentialVerification_result_idx" ON "CredentialVerification"("result");

-- CreateIndex
CREATE INDEX "Integration_organizationId_status_idx" ON "Integration"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Integration_type_status_idx" ON "Integration"("type", "status");

-- CreateIndex
CREATE INDEX "Integration_syncSchedule_idx" ON "Integration"("syncSchedule");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_integrationId_startedAt_idx" ON "IntegrationSyncLog"("integrationId", "startedAt");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_status_idx" ON "IntegrationSyncLog"("status");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_ownerId_idx" ON "WebhookEndpoint"("ownerId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_organizationId_status_idx" ON "WebhookEndpoint"("organizationId", "status");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_status_idx" ON "WebhookEndpoint"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_status_idx" ON "WebhookDelivery"("endpointId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_ownerId_idx" ON "ApiKey"("ownerId");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_status_idx" ON "ApiKey"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_status_idx" ON "ApiKey"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthClient_clientId_key" ON "OAuthClient"("clientId");

-- CreateIndex
CREATE INDEX "OAuthClient_ownerId_idx" ON "OAuthClient"("ownerId");

-- CreateIndex
CREATE INDEX "OAuthClient_organizationId_status_idx" ON "OAuthClient"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OAuthClient_clientId_idx" ON "OAuthClient"("clientId");

-- CreateIndex
CREATE INDEX "ExternalAiProvider_provider_enabled_idx" ON "ExternalAiProvider"("provider", "enabled");

-- CreateIndex
CREATE INDEX "ExternalAiProvider_organizationId_idx" ON "ExternalAiProvider"("organizationId");

-- CreateIndex
CREATE INDEX "ImportExportJob_direction_status_idx" ON "ImportExportJob"("direction", "status");

-- CreateIndex
CREATE INDEX "ImportExportJob_organizationId_idx" ON "ImportExportJob"("organizationId");

-- CreateIndex
CREATE INDEX "ImportExportJob_initiatedBy_idx" ON "ImportExportJob"("initiatedBy");

-- CreateIndex
CREATE INDEX "ImportExportJob_createdAt_idx" ON "ImportExportJob"("createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceApp_type_status_idx" ON "MarketplaceApp"("type", "status");

-- CreateIndex
CREATE INDEX "MarketplaceApp_developerId_idx" ON "MarketplaceApp"("developerId");

-- CreateIndex
CREATE INDEX "MarketplaceApp_status_idx" ON "MarketplaceApp"("status");

-- CreateIndex
CREATE INDEX "EnterpriseTenant_parentId_idx" ON "EnterpriseTenant"("parentId");

-- CreateIndex
CREATE INDEX "EnterpriseTenant_organizationId_idx" ON "EnterpriseTenant"("organizationId");

-- CreateIndex
CREATE INDEX "EnterpriseTenant_type_status_idx" ON "EnterpriseTenant"("type", "status");

-- CreateIndex
CREATE INDEX "EventSubscription_ownerId_idx" ON "EventSubscription"("ownerId");

-- CreateIndex
CREATE INDEX "EventSubscription_organizationId_status_idx" ON "EventSubscription"("organizationId", "status");

-- CreateIndex
CREATE INDEX "EventSubscription_status_idx" ON "EventSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Extension_slug_key" ON "Extension"("slug");

-- CreateIndex
CREATE INDEX "Extension_type_status_idx" ON "Extension"("type", "status");

-- CreateIndex
CREATE INDEX "Extension_developerId_idx" ON "Extension"("developerId");

-- CreateIndex
CREATE INDEX "Extension_slug_idx" ON "Extension"("slug");

-- CreateIndex
CREATE INDEX "ExtensionVersion_extensionId_status_idx" ON "ExtensionVersion"("extensionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionVersion_extensionId_version_key" ON "ExtensionVersion"("extensionId", "version");

-- CreateIndex
CREATE INDEX "ExtensionInstall_extensionId_status_idx" ON "ExtensionInstall"("extensionId", "status");

-- CreateIndex
CREATE INDEX "ExtensionInstall_organizationId_status_idx" ON "ExtensionInstall"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ExtensionInstall_userId_status_idx" ON "ExtensionInstall"("userId", "status");

-- CreateIndex
CREATE INDEX "ExtensionHook_extensionInstallId_idx" ON "ExtensionHook"("extensionInstallId");

-- CreateIndex
CREATE INDEX "ExtensionHook_event_enabled_idx" ON "ExtensionHook"("event", "enabled");

-- CreateIndex
CREATE INDEX "ExtensionExecution_extensionInstallId_status_idx" ON "ExtensionExecution"("extensionInstallId", "status");

-- CreateIndex
CREATE INDEX "ExtensionExecution_status_startedAt_idx" ON "ExtensionExecution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ExtensionExecution_trigger_idx" ON "ExtensionExecution"("trigger");

-- CreateIndex
CREATE INDEX "SandboxSession_extensionInstallId_status_idx" ON "SandboxSession"("extensionInstallId", "status");

-- CreateIndex
CREATE INDEX "SandboxSession_status_idx" ON "SandboxSession"("status");

-- CreateIndex
CREATE INDEX "ExtensionReview_extensionId_idx" ON "ExtensionReview"("extensionId");

-- CreateIndex
CREATE INDEX "ExtensionReview_userId_idx" ON "ExtensionReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionReview_extensionId_userId_key" ON "ExtensionReview"("extensionId", "userId");

-- CreateIndex
CREATE INDEX "ExtensionSubscription_extensionId_status_idx" ON "ExtensionSubscription"("extensionId", "status");

-- CreateIndex
CREATE INDEX "ExtensionSubscription_organizationId_status_idx" ON "ExtensionSubscription"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiVersion_version_key" ON "ApiVersion"("version");

-- CreateIndex
CREATE INDEX "ApiVersion_status_idx" ON "ApiVersion"("status");

-- CreateIndex
CREATE INDEX "CompatibilityMatrix_extensionId_idx" ON "CompatibilityMatrix"("extensionId");

-- CreateIndex
CREATE INDEX "CompatibilityMatrix_status_idx" ON "CompatibilityMatrix"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityMatrix_extensionId_extensionVersion_platformVe_key" ON "CompatibilityMatrix"("extensionId", "extensionVersion", "platformVersion");

-- CreateIndex
CREATE INDEX "DataFabricEntity_organizationId_idx" ON "DataFabricEntity"("organizationId");

-- CreateIndex
CREATE INDEX "DataFabricEntity_entityType_lifecycle_idx" ON "DataFabricEntity"("entityType", "lifecycle");

-- CreateIndex
CREATE INDEX "DataFabricEntity_syncStatus_idx" ON "DataFabricEntity"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DataFabricEntity_entityType_entityId_key" ON "DataFabricEntity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EventStore_entityType_entityId_sequence_idx" ON "EventStore"("entityType", "entityId", "sequence");

-- CreateIndex
CREATE INDEX "EventStore_type_occurredAt_idx" ON "EventStore"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "EventStore_organizationId_occurredAt_idx" ON "EventStore"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "ReadModel_modelType_organizationId_idx" ON "ReadModel"("modelType", "organizationId");

-- CreateIndex
CREATE INDEX "ReadModel_entityType_entityId_idx" ON "ReadModel"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadModel_modelType_entityType_entityId_key" ON "ReadModel"("modelType", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "SyncCheckpoint_nodeId_idx" ON "SyncCheckpoint"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCheckpoint_nodeId_entityType_key" ON "SyncCheckpoint"("nodeId", "entityType");

-- CreateIndex
CREATE INDEX "GlobalSearchIndex_entityType_idx" ON "GlobalSearchIndex"("entityType");

-- CreateIndex
CREATE INDEX "GlobalSearchIndex_organizationId_idx" ON "GlobalSearchIndex"("organizationId");

-- CreateIndex
CREATE INDEX "GlobalSearchIndex_language_idx" ON "GlobalSearchIndex"("language");

-- CreateIndex
CREATE INDEX "GlobalSearchIndex_popularity_idx" ON "GlobalSearchIndex"("popularity");

-- CreateIndex
CREATE INDEX "GlobalSearchIndex_quality_idx" ON "GlobalSearchIndex"("quality");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSearchIndex_entityType_entityId_key" ON "GlobalSearchIndex"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FederatedLearningJob_type_status_idx" ON "FederatedLearningJob"("type", "status");

-- CreateIndex
CREATE INDEX "FederatedLearningJob_modelType_status_idx" ON "FederatedLearningJob"("modelType", "status");

-- CreateIndex
CREATE INDEX "BenchmarkReport_organizationId_period_idx" ON "BenchmarkReport"("organizationId", "period");

-- CreateIndex
CREATE INDEX "BenchmarkReport_periodStart_idx" ON "BenchmarkReport"("periodStart");

-- CreateIndex
CREATE INDEX "ObservabilityTrace_traceType_status_occurredAt_idx" ON "ObservabilityTrace"("traceType", "status", "occurredAt");

-- CreateIndex
CREATE INDEX "ObservabilityTrace_correlationId_idx" ON "ObservabilityTrace"("correlationId");

-- CreateIndex
CREATE INDEX "ObservabilityTrace_organizationId_occurredAt_idx" ON "ObservabilityTrace"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "GovernancePolicy_type_enabled_idx" ON "GovernancePolicy"("type", "enabled");

-- CreateIndex
CREATE INDEX "GovernancePolicy_organizationId_idx" ON "GovernancePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "IntelligenceLakeSnapshot_type_organizationId_day_idx" ON "IntelligenceLakeSnapshot"("type", "organizationId", "day");

-- CreateIndex
CREATE INDEX "IntelligenceLakeSnapshot_day_idx" ON "IntelligenceLakeSnapshot"("day");

-- CreateIndex
CREATE INDEX "StreamSubscription_subscriberId_status_idx" ON "StreamSubscription"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "StreamSubscription_streamType_status_idx" ON "StreamSubscription"("streamType", "status");

-- CreateIndex
CREATE INDEX "CloudJob_queue_status_priority_idx" ON "CloudJob"("queue", "status", "priority");

-- CreateIndex
CREATE INDEX "CloudJob_type_status_idx" ON "CloudJob"("type", "status");

-- CreateIndex
CREATE INDEX "CloudJob_organizationId_status_idx" ON "CloudJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CloudJob_scheduledFor_idx" ON "CloudJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "CloudJob_createdBy_idx" ON "CloudJob"("createdBy");

-- CreateIndex
CREATE INDEX "InferenceRequest_provider_status_idx" ON "InferenceRequest"("provider", "status");

-- CreateIndex
CREATE INDEX "InferenceRequest_organizationId_occurredAt_idx" ON "InferenceRequest"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "InferenceRequest_userId_idx" ON "InferenceRequest"("userId");

-- CreateIndex
CREATE INDEX "InferenceRequest_status_occurredAt_idx" ON "InferenceRequest"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "ScheduledWorkflow_status_nextRunAt_idx" ON "ScheduledWorkflow"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledWorkflow_organizationId_status_idx" ON "ScheduledWorkflow"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ScheduledWorkflow_scheduleType_status_idx" ON "ScheduledWorkflow"("scheduleType", "status");

-- CreateIndex
CREATE INDEX "ResourceAllocation_resourceType_status_idx" ON "ResourceAllocation"("resourceType", "status");

-- CreateIndex
CREATE INDEX "ResourceAllocation_allocatedTo_status_idx" ON "ResourceAllocation"("allocatedTo", "status");

-- CreateIndex
CREATE INDEX "ResourceAllocation_organizationId_status_idx" ON "ResourceAllocation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CacheEntry_namespace_expiresAt_idx" ON "CacheEntry"("namespace", "expiresAt");

-- CreateIndex
CREATE INDEX "CacheEntry_tags_idx" ON "CacheEntry"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "CacheEntry_namespace_key_key" ON "CacheEntry"("namespace", "key");

-- CreateIndex
CREATE INDEX "MediaJob_status_mediaType_idx" ON "MediaJob"("status", "mediaType");

-- CreateIndex
CREATE INDEX "MediaJob_organizationId_status_idx" ON "MediaJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DocumentJob_status_documentType_idx" ON "DocumentJob"("status", "documentType");

-- CreateIndex
CREATE INDEX "DocumentJob_organizationId_status_idx" ON "DocumentJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Secret_organizationId_type_idx" ON "Secret"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Secret_type_name_idx" ON "Secret"("type", "name");

-- CreateIndex
CREATE INDEX "Secret_nextRotationAt_idx" ON "Secret"("nextRotationAt");

-- CreateIndex
CREATE INDEX "InfraMetric_source_metric_timestamp_idx" ON "InfraMetric"("source", "metric", "timestamp");

-- CreateIndex
CREATE INDEX "InfraMetric_timestamp_idx" ON "InfraMetric"("timestamp");

-- CreateIndex
CREATE INDEX "CloudWorker_type_status_idx" ON "CloudWorker"("type", "status");

-- CreateIndex
CREATE INDEX "CloudWorker_status_idx" ON "CloudWorker"("status");

-- CreateIndex
CREATE INDEX "CostSnapshot_organizationId_day_idx" ON "CostSnapshot"("organizationId", "day");

-- CreateIndex
CREATE INDEX "CostSnapshot_day_idx" ON "CostSnapshot"("day");

-- CreateIndex
CREATE INDEX "LearningExperience_type_status_idx" ON "LearningExperience"("type", "status");

-- CreateIndex
CREATE INDEX "LearningExperience_authorId_idx" ON "LearningExperience"("authorId");

-- CreateIndex
CREATE INDEX "LearningExperience_organizationId_status_idx" ON "LearningExperience"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LearningExperience_subject_status_idx" ON "LearningExperience"("subject", "status");

-- CreateIndex
CREATE INDEX "ExperienceSession_experienceId_status_idx" ON "ExperienceSession"("experienceId", "status");

-- CreateIndex
CREATE INDEX "ExperienceSession_userId_status_idx" ON "ExperienceSession"("userId", "status");

-- CreateIndex
CREATE INDEX "SimulationConfig_domain_idx" ON "SimulationConfig"("domain");

-- CreateIndex
CREATE INDEX "SimulationConfig_experienceId_idx" ON "SimulationConfig"("experienceId");

-- CreateIndex
CREATE INDEX "VirtualLabConfig_domain_idx" ON "VirtualLabConfig"("domain");

-- CreateIndex
CREATE INDEX "VirtualLabConfig_experienceId_idx" ON "VirtualLabConfig"("experienceId");

-- CreateIndex
CREATE INDEX "ProgrammingWorkspace_language_idx" ON "ProgrammingWorkspace"("language");

-- CreateIndex
CREATE INDEX "ProgrammingWorkspace_experienceId_idx" ON "ProgrammingWorkspace"("experienceId");

-- CreateIndex
CREATE INDEX "TutorAvatarConfig_mode_idx" ON "TutorAvatarConfig"("mode");

-- CreateIndex
CREATE INDEX "TutorAvatarConfig_experienceId_idx" ON "TutorAvatarConfig"("experienceId");

-- CreateIndex
CREATE INDEX "LearningWorld_theme_idx" ON "LearningWorld"("theme");

-- CreateIndex
CREATE INDEX "LearningWorld_experienceId_idx" ON "LearningWorld"("experienceId");

-- CreateIndex
CREATE INDEX "ScenarioTask_type_idx" ON "ScenarioTask"("type");

-- CreateIndex
CREATE INDEX "ScenarioTask_experienceId_idx" ON "ScenarioTask"("experienceId");

-- CreateIndex
CREATE INDEX "ContentArtifact_type_idx" ON "ContentArtifact"("type");

-- CreateIndex
CREATE INDEX "ContentArtifact_subject_topic_idx" ON "ContentArtifact"("subject", "topic");

-- CreateIndex
CREATE INDEX "ContentArtifact_experienceId_idx" ON "ContentArtifact"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceComposition_authorId_idx" ON "ExperienceComposition"("authorId");

-- CreateIndex
CREATE INDEX "ExperienceComposition_organizationId_status_idx" ON "ExperienceComposition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ResearchProject_status_idx" ON "ResearchProject"("status");

-- CreateIndex
CREATE INDEX "ResearchProject_principalInvestigator_idx" ON "ResearchProject"("principalInvestigator");

-- CreateIndex
CREATE INDEX "ResearchProject_organizationId_status_idx" ON "ResearchProject"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ResearchProject_field_status_idx" ON "ResearchProject"("field", "status");

-- CreateIndex
CREATE INDEX "LiteratureEntry_type_year_idx" ON "LiteratureEntry"("type", "year");

-- CreateIndex
CREATE INDEX "LiteratureEntry_doi_idx" ON "LiteratureEntry"("doi");

-- CreateIndex
CREATE INDEX "LiteratureEntry_organizationId_idx" ON "LiteratureEntry"("organizationId");

-- CreateIndex
CREATE INDEX "LiteratureEntry_evidenceStrength_idx" ON "LiteratureEntry"("evidenceStrength");

-- CreateIndex
CREATE INDEX "ExperimentDesign_projectId_idx" ON "ExperimentDesign"("projectId");

-- CreateIndex
CREATE INDEX "ExperimentDesign_experimentType_status_idx" ON "ExperimentDesign"("experimentType", "status");

-- CreateIndex
CREATE INDEX "ResearchDataset_projectId_idx" ON "ResearchDataset"("projectId");

-- CreateIndex
CREATE INDEX "ResearchDataset_organizationId_idx" ON "ResearchDataset"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchDataset_format_version_idx" ON "ResearchDataset"("format", "version");

-- CreateIndex
CREATE INDEX "CitationRecord_sourceType_sourceId_idx" ON "CitationRecord"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "CitationRecord_literatureId_idx" ON "CitationRecord"("literatureId");

-- CreateIndex
CREATE INDEX "CitationRecord_citationType_idx" ON "CitationRecord"("citationType");

-- CreateIndex
CREATE INDEX "CitationRecord_validationStatus_idx" ON "CitationRecord"("validationStatus");

-- CreateIndex
CREATE INDEX "PeerReview_entityType_entityId_status_idx" ON "PeerReview"("entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "PeerReview_reviewerId_status_idx" ON "PeerReview"("reviewerId", "status");

-- CreateIndex
CREATE INDEX "PeerReview_status_idx" ON "PeerReview"("status");

-- CreateIndex
CREATE INDEX "PatentWorkspace_organizationId_status_idx" ON "PatentWorkspace"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PatentWorkspace_status_idx" ON "PatentWorkspace"("status");

-- CreateIndex
CREATE INDEX "PublicationDraft_projectId_idx" ON "PublicationDraft"("projectId");

-- CreateIndex
CREATE INDEX "PublicationDraft_status_idx" ON "PublicationDraft"("status");

-- CreateIndex
CREATE INDEX "PublicationDraft_organizationId_status_idx" ON "PublicationDraft"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ResearchAnalytics_organizationId_idx" ON "ResearchAnalytics"("organizationId");

-- CreateIndex
CREATE INDEX "ResearchAnalytics_day_idx" ON "ResearchAnalytics"("day");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchAnalytics_organizationId_day_key" ON "ResearchAnalytics"("organizationId", "day");

-- CreateIndex
CREATE INDEX "FoundationModel_domain_status_idx" ON "FoundationModel"("domain", "status");

-- CreateIndex
CREATE INDEX "FoundationModel_status_idx" ON "FoundationModel"("status");

-- CreateIndex
CREATE INDEX "CurriculumEquivalence_sourceFramework_targetFramework_idx" ON "CurriculumEquivalence"("sourceFramework", "targetFramework");

-- CreateIndex
CREATE INDEX "CurriculumEquivalence_sourceStandardId_idx" ON "CurriculumEquivalence"("sourceStandardId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumEquivalence_sourceFramework_sourceStandardId_targ_key" ON "CurriculumEquivalence"("sourceFramework", "sourceStandardId", "targetFramework", "targetStandardId");

-- CreateIndex
CREATE INDEX "EducationalPattern_type_subject_idx" ON "EducationalPattern"("type", "subject");

-- CreateIndex
CREATE INDEX "EducationalPattern_verification_idx" ON "EducationalPattern"("verification");

-- CreateIndex
CREATE INDEX "EducationalPattern_confidence_idx" ON "EducationalPattern"("confidence");

-- CreateIndex
CREATE INDEX "SyntheticDataset_purpose_domain_idx" ON "SyntheticDataset"("purpose", "domain");

-- CreateIndex
CREATE INDEX "SyntheticDataset_privacyLevel_idx" ON "SyntheticDataset"("privacyLevel");

-- CreateIndex
CREATE INDEX "GlobalBenchmark_metric_scope_period_idx" ON "GlobalBenchmark"("metric", "scope", "period");

-- CreateIndex
CREATE INDEX "GlobalBenchmark_periodStart_idx" ON "GlobalBenchmark"("periodStart");

-- CreateIndex
CREATE INDEX "ReasoningChain_domain_createdAt_idx" ON "ReasoningChain"("domain", "createdAt");

-- CreateIndex
CREATE INDEX "ReasoningChain_language_idx" ON "ReasoningChain"("language");

-- CreateIndex
CREATE INDEX "KnowledgeEvolution_type_entity_detectedAt_idx" ON "KnowledgeEvolution"("type", "entity", "detectedAt");

-- CreateIndex
CREATE INDEX "KnowledgeEvolution_detectedAt_idx" ON "KnowledgeEvolution"("detectedAt");

-- CreateIndex
CREATE INDEX "GlobalObservatorySnapshot_day_idx" ON "GlobalObservatorySnapshot"("day");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalObservatorySnapshot_day_key" ON "GlobalObservatorySnapshot"("day");

-- CreateIndex
CREATE INDEX "FoundationApiCall_endpoint_occurredAt_idx" ON "FoundationApiCall"("endpoint", "occurredAt");

-- CreateIndex
CREATE INDEX "FoundationApiCall_callerId_idx" ON "FoundationApiCall"("callerId");

-- CreateIndex
CREATE INDEX "FoundationApiCall_status_occurredAt_idx" ON "FoundationApiCall"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "CollectiveInsight_type_domain_status_idx" ON "CollectiveInsight"("type", "domain", "status");

-- CreateIndex
CREATE INDEX "CollectiveInsight_status_confidence_idx" ON "CollectiveInsight"("status", "confidence");

-- CreateIndex
CREATE INDEX "MultilingualAlignment_sourceLanguage_targetLanguage_idx" ON "MultilingualAlignment"("sourceLanguage", "targetLanguage");

-- CreateIndex
CREATE INDEX "MultilingualAlignment_sourceTerm_idx" ON "MultilingualAlignment"("sourceTerm");

-- CreateIndex
CREATE UNIQUE INDEX "MultilingualAlignment_sourceTerm_sourceLanguage_targetLangu_key" ON "MultilingualAlignment"("sourceTerm", "sourceLanguage", "targetLanguage", "context");

-- CreateIndex
CREATE INDEX "NetworkParticipation_level_status_idx" ON "NetworkParticipation"("level", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkParticipation_organizationId_key" ON "NetworkParticipation"("organizationId");

-- CreateIndex
CREATE INDEX "InstitutionalMemory_organizationId_type_idx" ON "InstitutionalMemory"("organizationId", "type");

-- CreateIndex
CREATE INDEX "InstitutionalMemory_period_idx" ON "InstitutionalMemory"("period");

-- CreateIndex
CREATE INDEX "InstitutionalMemory_importance_idx" ON "InstitutionalMemory"("importance");

-- CreateIndex
CREATE INDEX "DecisionAnalysis_organizationId_status_idx" ON "DecisionAnalysis"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DecisionAnalysis_type_status_idx" ON "DecisionAnalysis"("type", "status");

-- CreateIndex
CREATE INDEX "StrategicPlan_organizationId_horizon_status_idx" ON "StrategicPlan"("organizationId", "horizon", "status");

-- CreateIndex
CREATE INDEX "StrategicPlan_status_idx" ON "StrategicPlan"("status");

-- CreateIndex
CREATE INDEX "AdvisorRecommendation_organizationId_status_priority_idx" ON "AdvisorRecommendation"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "AdvisorRecommendation_category_status_idx" ON "AdvisorRecommendation"("category", "status");

-- CreateIndex
CREATE INDEX "AdvisorRecommendation_priority_status_idx" ON "AdvisorRecommendation"("priority", "status");

-- CreateIndex
CREATE INDEX "EducationalPolicy_organizationId_type_status_idx" ON "EducationalPolicy"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "EducationalPolicy_status_idx" ON "EducationalPolicy"("status");

-- CreateIndex
CREATE INDEX "InstitutionalGoal_organizationId_status_idx" ON "InstitutionalGoal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InstitutionalGoal_type_status_idx" ON "InstitutionalGoal"("type", "status");

-- CreateIndex
CREATE INDEX "InstitutionalGoal_deadline_idx" ON "InstitutionalGoal"("deadline");

-- CreateIndex
CREATE INDEX "TimelineEvent_organizationId_occurredAt_idx" ON "TimelineEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_type_occurredAt_idx" ON "TimelineEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_occurredAt_idx" ON "TimelineEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_severity_idx" ON "TimelineEvent"("severity");

-- CreateIndex
CREATE INDEX "KnowledgeBaseEntry_organizationId_type_status_idx" ON "KnowledgeBaseEntry"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "KnowledgeBaseEntry_type_status_idx" ON "KnowledgeBaseEntry"("type", "status");

-- CreateIndex
CREATE INDEX "KnowledgeBaseEntry_subject_idx" ON "KnowledgeBaseEntry"("subject");

-- CreateIndex
CREATE INDEX "KnowledgeBaseEntry_effectiveness_idx" ON "KnowledgeBaseEntry"("effectiveness");

-- CreateIndex
CREATE INDEX "InstitutionSimulation_organizationId_type_idx" ON "InstitutionSimulation"("organizationId", "type");

-- CreateIndex
CREATE INDEX "InstitutionSimulation_type_idx" ON "InstitutionSimulation"("type");

-- CreateIndex
CREATE INDEX "WisdomInsight_organizationId_type_status_idx" ON "WisdomInsight"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "WisdomInsight_type_status_idx" ON "WisdomInsight"("type", "status");

-- CreateIndex
CREATE INDEX "WisdomInsight_confidence_idx" ON "WisdomInsight"("confidence");

-- CreateIndex
CREATE INDEX "WisdomInsight_subject_idx" ON "WisdomInsight"("subject");

-- CreateIndex
CREATE INDEX "OrchestratorPrompt_module_active_idx" ON "OrchestratorPrompt"("module", "active");

-- CreateIndex
CREATE INDEX "OrchestratorPrompt_promptId_active_idx" ON "OrchestratorPrompt"("promptId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OrchestratorPrompt_promptId_version_key" ON "OrchestratorPrompt"("promptId", "version");

-- CreateIndex
CREATE INDEX "OrchestratorWorkflowExecution_workflowId_status_idx" ON "OrchestratorWorkflowExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "OrchestratorWorkflowExecution_status_startedAt_idx" ON "OrchestratorWorkflowExecution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "OrchestratorWorkflowExecution_traceId_idx" ON "OrchestratorWorkflowExecution"("traceId");

-- CreateIndex
CREATE INDEX "OrchestratorAIInvocation_traceId_idx" ON "OrchestratorAIInvocation"("traceId");

-- CreateIndex
CREATE INDEX "OrchestratorAIInvocation_provider_createdAt_idx" ON "OrchestratorAIInvocation"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "OrchestratorAIInvocation_userId_createdAt_idx" ON "OrchestratorAIInvocation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OrchestratorAIInvocation_organizationId_createdAt_idx" ON "OrchestratorAIInvocation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OrchestratorTraceSpan_traceId_idx" ON "OrchestratorTraceSpan"("traceId");

-- CreateIndex
CREATE INDEX "OrchestratorTraceSpan_module_startedAt_idx" ON "OrchestratorTraceSpan"("module", "startedAt");

-- CreateIndex
CREATE INDEX "OrchestratorTraceSpan_status_startedAt_idx" ON "OrchestratorTraceSpan"("status", "startedAt");

-- CreateIndex
CREATE INDEX "OrchestratorHealingAction_module_status_idx" ON "OrchestratorHealingAction"("module", "status");

-- CreateIndex
CREATE INDEX "OrchestratorHealingAction_status_createdAt_idx" ON "OrchestratorHealingAction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrchestratorHealingAction_kind_createdAt_idx" ON "OrchestratorHealingAction"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "OrchestratorFeatureFlag_enabled_idx" ON "OrchestratorFeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "OrchestratorCircuitBreaker_module_state_idx" ON "OrchestratorCircuitBreaker"("module", "state");

-- CreateIndex
CREATE INDEX "OrchestratorIdempotencyKey_status_expiresAt_idx" ON "OrchestratorIdempotencyKey"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "OrchestratorDistributedLock_resource_expiresAt_idx" ON "OrchestratorDistributedLock"("resource", "expiresAt");

-- CreateIndex
CREATE INDEX "OrchestratorDistributedLock_holder_idx" ON "OrchestratorDistributedLock"("holder");

-- CreateIndex
CREATE INDEX "OrchestratorDetectedIssue_module_severity_detectedAt_idx" ON "OrchestratorDetectedIssue"("module", "severity", "detectedAt");

-- CreateIndex
CREATE INDEX "OrchestratorDetectedIssue_resolvedAt_idx" ON "OrchestratorDetectedIssue"("resolvedAt");

-- CreateIndex
CREATE INDEX "ProductWorkspace_userId_active_idx" ON "ProductWorkspace"("userId", "active");

-- CreateIndex
CREATE INDEX "ProductWorkspace_userId_kind_idx" ON "ProductWorkspace"("userId", "kind");

-- CreateIndex
CREATE INDEX "ProductJourney_userId_status_idx" ON "ProductJourney"("userId", "status");

-- CreateIndex
CREATE INDEX "ProductJourney_userId_kind_status_idx" ON "ProductJourney"("userId", "kind", "status");

-- CreateIndex
CREATE INDEX "ProductAttentionItem_userId_acknowledgedAt_idx" ON "ProductAttentionItem"("userId", "acknowledgedAt");

-- CreateIndex
CREATE INDEX "ProductAttentionItem_userId_kind_detectedAt_idx" ON "ProductAttentionItem"("userId", "kind", "detectedAt");

-- CreateIndex
CREATE INDEX "ProductAttentionItem_priority_idx" ON "ProductAttentionItem"("priority");

-- CreateIndex
CREATE INDEX "ProductIntent_userId_createdAt_idx" ON "ProductIntent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductIntent_intent_idx" ON "ProductIntent"("intent");

-- CreateIndex
CREATE INDEX "ProductMemory_userId_category_idx" ON "ProductMemory"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMemory_userId_key_key" ON "ProductMemory"("userId", "key");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_eventType_createdAt_idx" ON "ProductAnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_userId_createdAt_idx" ON "ProductAnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_feature_createdAt_idx" ON "ProductAnalyticsEvent"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "ProductNotificationCluster_userId_deliverAt_idx" ON "ProductNotificationCluster"("userId", "deliverAt");

-- CreateIndex
CREATE INDEX "ProductNotificationCluster_userId_deliveredAt_idx" ON "ProductNotificationCluster"("userId", "deliveredAt");

-- CreateIndex
CREATE INDEX "CognitiveWorkingMemory_scopeType_scopeId_expiresAt_idx" ON "CognitiveWorkingMemory"("scopeType", "scopeId", "expiresAt");

-- CreateIndex
CREATE INDEX "CognitiveWorkingMemory_expiresAt_idx" ON "CognitiveWorkingMemory"("expiresAt");

-- CreateIndex
CREATE INDEX "CognitiveEpisodicMemory_scopeType_scopeId_occurredAt_idx" ON "CognitiveEpisodicMemory"("scopeType", "scopeId", "occurredAt");

-- CreateIndex
CREATE INDEX "CognitiveEpisodicMemory_kind_occurredAt_idx" ON "CognitiveEpisodicMemory"("kind", "occurredAt");

-- CreateIndex
CREATE INDEX "CognitiveEpisodicMemory_importance_idx" ON "CognitiveEpisodicMemory"("importance");

-- CreateIndex
CREATE INDEX "CognitiveSemanticMemory_domain_kind_idx" ON "CognitiveSemanticMemory"("domain", "kind");

-- CreateIndex
CREATE INDEX "CognitiveSemanticMemory_confidence_idx" ON "CognitiveSemanticMemory"("confidence");

-- CreateIndex
CREATE INDEX "CognitivePlan_status_createdAt_idx" ON "CognitivePlan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CognitiveGoal_status_priority_idx" ON "CognitiveGoal"("status", "priority");

-- CreateIndex
CREATE INDEX "CognitiveGoal_kind_status_idx" ON "CognitiveGoal"("kind", "status");

-- CreateIndex
CREATE INDEX "CognitiveDecision_userId_createdAt_idx" ON "CognitiveDecision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CognitiveDecision_organizationId_createdAt_idx" ON "CognitiveDecision"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "CognitiveReflection_traceId_idx" ON "CognitiveReflection"("traceId");

-- CreateIndex
CREATE INDEX "CognitiveReflection_actionType_createdAt_idx" ON "CognitiveReflection"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "CognitiveReflection_overallScore_idx" ON "CognitiveReflection"("overallScore");

-- CreateIndex
CREATE INDEX "CognitiveConversationState_userId_status_idx" ON "CognitiveConversationState"("userId", "status");

-- CreateIndex
CREATE INDEX "CognitiveEvent_eventType_createdAt_idx" ON "CognitiveEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "CognitiveEvent_traceId_idx" ON "CognitiveEvent"("traceId");

-- CreateIndex
CREATE INDEX "CognitiveEvent_userId_createdAt_idx" ON "CognitiveEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIQualityBenchmark_category_idx" ON "AIQualityBenchmark"("category");

-- CreateIndex
CREATE INDEX "AIQualityBenchmark_version_idx" ON "AIQualityBenchmark"("version");

-- CreateIndex
CREATE INDEX "AIQualityEvaluation_provider_model_createdAt_idx" ON "AIQualityEvaluation"("provider", "model", "createdAt");

-- CreateIndex
CREATE INDEX "AIQualityEvaluation_promptId_promptVersion_idx" ON "AIQualityEvaluation"("promptId", "promptVersion");

-- CreateIndex
CREATE INDEX "AIQualityEvaluation_benchmarkQuestionId_idx" ON "AIQualityEvaluation"("benchmarkQuestionId");

-- CreateIndex
CREATE INDEX "AIQualityHallucination_severity_createdAt_idx" ON "AIQualityHallucination"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AIQualityHallucination_kind_createdAt_idx" ON "AIQualityHallucination"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AIQualityCitationCheck_evaluationId_idx" ON "AIQualityCitationCheck"("evaluationId");

-- CreateIndex
CREATE INDEX "AIQualityDataset_category_idx" ON "AIQualityDataset"("category");

-- CreateIndex
CREATE INDEX "AIQualityDataset_kind_idx" ON "AIQualityDataset"("kind");

-- CreateIndex
CREATE INDEX "AIQualityScore_provider_model_idx" ON "AIQualityScore"("provider", "model");

-- CreateIndex
CREATE INDEX "AIQualityScore_overall_idx" ON "AIQualityScore"("overall");

-- CreateIndex
CREATE INDEX "AIQualityLeaderboard_type_metric_score_idx" ON "AIQualityLeaderboard"("type", "metric", "score");

-- CreateIndex
CREATE INDEX "AIQualityLeaderboard_metric_score_idx" ON "AIQualityLeaderboard"("metric", "score");

-- CreateIndex
CREATE INDEX "AIObservabilityExperiment_status_type_idx" ON "AIObservabilityExperiment"("status", "type");

-- CreateIndex
CREATE INDEX "AIObservabilityAnomaly_severity_createdAt_idx" ON "AIObservabilityAnomaly"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AIObservabilityAnomaly_kind_createdAt_idx" ON "AIObservabilityAnomaly"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AIObservabilityAlert_severity_createdAt_idx" ON "AIObservabilityAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AIObservabilityAlert_kind_createdAt_idx" ON "AIObservabilityAlert"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AIGovernancePolicy_scope_scopeId_status_idx" ON "AIGovernancePolicy"("scope", "scopeId", "status");

-- CreateIndex
CREATE INDEX "AIGovernanceApproval_status_type_idx" ON "AIGovernanceApproval"("status", "type");

-- CreateIndex
CREATE INDEX "AIGovernanceApproval_requestedBy_idx" ON "AIGovernanceApproval"("requestedBy");

-- CreateIndex
CREATE INDEX "AIGovernanceAudit_action_occurredAt_idx" ON "AIGovernanceAudit"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "AIGovernanceAudit_actorType_occurredAt_idx" ON "AIGovernanceAudit"("actorType", "occurredAt");

-- CreateIndex
CREATE INDEX "AIGovernanceAudit_entityType_entityId_idx" ON "AIGovernanceAudit"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AIGovernanceModel_status_idx" ON "AIGovernanceModel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AIGovernanceModel_provider_model_key" ON "AIGovernanceModel"("provider", "model");

-- CreateIndex
CREATE INDEX "_CompetencyToDigitalCredential_B_index" ON "_CompetencyToDigitalCredential"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationRole" ADD CONSTRAINT "OrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationBilling" ADD CONSTRAINT "OrganizationBilling_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCohort" ADD CONSTRAINT "OrganizationCohort_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCohortMember" ADD CONSTRAINT "OrganizationCohortMember_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "OrganizationCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCategory" ADD CONSTRAINT "MarketplaceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePrice" ADD CONSTRAINT "MarketplacePrice_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "MarketplacePrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "MarketplacePurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceRefund" ADD CONSTRAINT "MarketplaceRefund_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "MarketplacePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorTier" ADD CONSTRAINT "CreatorTier_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "CreatorTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "PayoutAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAccount" ADD CONSTRAINT "PayoutAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EduTokenLedger" ADD CONSTRAINT "EduTokenLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionRefund" ADD CONSTRAINT "TransactionRefund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDecision" ADD CONSTRAINT "AiDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDecision" ADD CONSTRAINT "AiDecision_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiToolCall" ADD CONSTRAINT "AiToolCall_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizReview" ADD CONSTRAINT "QuizReview_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizTag" ADD CONSTRAINT "QuizTag_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizTag" ADD CONSTRAINT "QuizTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCohort" ADD CONSTRAINT "QuizCohort_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCohort" ADD CONSTRAINT "QuizCohort_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "OrganizationCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQueryLog" ADD CONSTRAINT "SearchQueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "library_user_owner_fk" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "library_org_owner_fk" FOREIGN KEY ("ownerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCollection" ADD CONSTRAINT "LibraryCollection_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCollectionItem" ADD CONSTRAINT "LibraryCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "LibraryCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCollectionItem" ADD CONSTRAINT "LibraryCollectionItem_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryAccess" ADD CONSTRAINT "LibraryAccess_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryImport" ADD CONSTRAINT "LibraryImport_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCreatorTierAssignment" ADD CONSTRAINT "PlatformCreatorTierAssignment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCreatorTierAssignment" ADD CONSTRAINT "PlatformCreatorTierAssignment_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "PlatformCreatorTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceVersion" ADD CONSTRAINT "ResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceFavorite" ADD CONSTRAINT "ResourceFavorite_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceStat" ADD CONSTRAINT "ResourceStat_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedResource" ADD CONSTRAINT "SharedResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_currentResourceId_fkey" FOREIGN KEY ("currentResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpListing" ADD CONSTRAINT "MpListing_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpListing" ADD CONSTRAINT "MpListing_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpListing" ADD CONSTRAINT "MpListing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpListingCategory" ADD CONSTRAINT "MpListingCategory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MpListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpListingCategory" ADD CONSTRAINT "MpListingCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MpCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpFavorite" ADD CONSTRAINT "MpFavorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MpListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpFavorite" ADD CONSTRAINT "MpFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpPurchase" ADD CONSTRAINT "MpPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpPurchase" ADD CONSTRAINT "MpPurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MpListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpPurchase" ADD CONSTRAINT "MpPurchase_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpReview" ADD CONSTRAINT "MpReview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MpListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpReview" ADD CONSTRAINT "MpReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpReview" ADD CONSTRAINT "MpReview_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "MpPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpWishlist" ADD CONSTRAINT "MpWishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpWishlist" ADD CONSTRAINT "MpWishlist_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MpListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttempt" ADD CONSTRAINT "AssignmentAttempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttempt" ADD CONSTRAINT "AssignmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAttempt" ADD CONSTRAINT "AssignmentAttempt_resourceCopyId_fkey" FOREIGN KEY ("resourceCopyId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssignmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssignmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressRecord" ADD CONSTRAINT "ProgressRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestionVersion" ADD CONSTRAINT "BankQuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestionVersion" ADD CONSTRAINT "BankQuestionVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradebookEntry" ADD CONSTRAINT "GradebookEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradebookEntry" ADD CONSTRAINT "GradebookEntry_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringIncident" ADD CONSTRAINT "ProctoringIncident_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringIncident" ADD CONSTRAINT "ProctoringIncident_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlagiarismReport" ADD CONSTRAINT "PlagiarismReport_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlagiarismReport" ADD CONSTRAINT "PlagiarismReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePlayer" ADD CONSTRAINT "LivePlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePlayer" ADD CONSTRAINT "LivePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveRound" ADD CONSTRAINT "LiveRound_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveRound" ADD CONSTRAINT "LiveRound_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveAnswer" ADD CONSTRAINT "LiveAnswer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "LiveRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveAnswer" ADD CONSTRAINT "LiveAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LivePlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveLeaderboard" ADD CONSTRAINT "LiveLeaderboard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replay" ADD CONSTRAINT "Replay_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_session1Id_fkey" FOREIGN KEY ("session1Id") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_session2Id_fkey" FOREIGN KEY ("session2Id") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameReward" ADD CONSTRAINT "GameReward_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameReward" ADD CONSTRAINT "GameReward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "LivePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameReward" ADD CONSTRAINT "GameReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTranslation" ADD CONSTRAINT "ResourceTranslation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MpCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanTranslation" ADD CONSTRAINT "SubscriptionPlanTranslation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGraphEdge" ADD CONSTRAINT "KnowledgeGraphEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "KnowledgeGraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGraphEdge" ADD CONSTRAINT "KnowledgeGraphEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "KnowledgeGraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicEdge" ADD CONSTRAINT "TopicEdge_fromTopicId_fkey" FOREIGN KEY ("fromTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicEdge" ADD CONSTRAINT "TopicEdge_toTopicId_fkey" FOREIGN KEY ("toTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "LearningGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlanItem" ADD CONSTRAINT "LearningPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMember" ADD CONSTRAINT "StudyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborativeNoteVersion" ADD CONSTRAINT "CollaborativeNoteVersion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "CollaborativeNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeParticipation" ADD CONSTRAINT "ChallengeParticipation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "LearningChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptAlias" ADD CONSTRAINT "ConceptAlias_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningObjective" ADD CONSTRAINT "LearningObjective_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "CurriculumFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumStandard" ADD CONSTRAINT "CurriculumStandard_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "CurriculumFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumMapping" ADD CONSTRAINT "CurriculumMapping_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "CurriculumStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptRelationship" ADD CONSTRAINT "ConceptRelationship_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptRelationship" ADD CONSTRAINT "ConceptRelationship_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceConcept" ADD CONSTRAINT "ResourceConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "PlatformExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "AcademicCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyEvidence" ADD CONSTRAINT "CompetencyEvidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionVersion" ADD CONSTRAINT "ExtensionVersion_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionInstall" ADD CONSTRAINT "ExtensionInstall_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceSession" ADD CONSTRAINT "ExperienceSession_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetencyToDigitalCredential" ADD CONSTRAINT "_CompetencyToDigitalCredential_A_fkey" FOREIGN KEY ("A") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetencyToDigitalCredential" ADD CONSTRAINT "_CompetencyToDigitalCredential_B_fkey" FOREIGN KEY ("B") REFERENCES "DigitalCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
