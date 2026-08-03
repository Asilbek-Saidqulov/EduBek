const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('AdminPass123', 12);
  const admin = await db.user.create({
    data: {
      email: 'admin@edubek.local',
      passwordHash: adminPass,
      name: 'EduBek Admin',
      username: 'admin',
      locale: 'en',
      profile: { create: { displayName: 'EduBek Admin' } },
      roles: { create: [{ role: 'platform_superadmin' }, { role: 'platform_admin' }] }
    }
  });
  console.log('✓ Admin:', admin.email);

  const teacherPass = await bcrypt.hash('TeacherPass123', 12);
  const teacher = await db.user.create({
    data: {
      email: 'teacher@edubek.local',
      passwordHash: teacherPass,
      name: 'Jane Teacher',
      username: 'janeteacher',
      locale: 'en',
      profile: { create: { displayName: 'Jane Teacher' } },
      roles: { create: [{ role: 'platform_user' }, { role: 'platform_creator' }] },
      creatorProfile: { create: { displayName: 'Jane Teacher', verificationStatus: 'verified', verifiedAt: new Date() } }
    }
  });
  console.log('✓ Teacher:', teacher.email);

  await db.wallet.create({ data: { userId: admin.id, eduTokensBalance: 1000 } });
  await db.wallet.create({ data: { userId: teacher.id, eduTokensBalance: 1000 } });

  const pu = await db.user.create({
    data: { email: 'platform@edubek.local', name: 'EduBek Platform', roles: { create: [{ role: 'platform_superadmin' }] } }
  });
  await db.wallet.create({ data: { userId: pu.id, eduTokensBalance: 0 } });
  console.log('✓ Platform user + wallets');

  const org = await db.organization.create({
    data: { name: 'Springfield High', slug: 'springfield-high', type: 'school', ownerId: admin.id, plan: 'pro', seats: 50 }
  });
  const ownerRole = await db.organizationRole.create({
    data: { orgId: org.id, name: 'org_owner', permissions: JSON.stringify(['org.read', 'org.update', 'org.members.read', 'org.members.invite', 'org.members.remove', 'org.resource.create', 'org.resource.read']) }
  });
  await db.organizationMembership.create({
    data: { orgId: org.id, userId: admin.id, roleId: ownerRole.id, status: 'active' }
  });
  console.log('✓ Org:', org.name);

  await db.subscriptionPlan.create({ data: { name: 'Free', tier: 'free', priceMonthly: 0, aiCreditsMonthly: 10, features: JSON.stringify({ aiCredits: 10, resourceLimit: 50 }) } });
  await db.subscriptionPlan.create({ data: { name: 'Pro', tier: 'pro', priceMonthly: 9.99, priceYearly: 99, aiCreditsMonthly: 200, features: JSON.stringify({ aiCredits: 200, resourceLimit: 500 }) } });
  await db.subscriptionPlan.create({ data: { name: 'Ultra', tier: 'ultra', priceMonthly: 29.99, priceYearly: 299, aiCreditsMonthly: -1, features: JSON.stringify({ aiCredits: -1, resourceLimit: -1 }) } });
  console.log('✓ Subscription plans');

  await db.platformCreatorTier.create({ data: { name: 'starter', label: 'Starter', revenueShare: 80, sortOrder: 0 } });
  await db.platformCreatorTier.create({ data: { name: 'silver', label: 'Silver', revenueShare: 85, featuredEligible: true, minEarnings: 100, minSales: 10, sortOrder: 1 } });
  await db.platformCreatorTier.create({ data: { name: 'gold', label: 'Gold', revenueShare: 90, featuredEligible: true, marketplacePriority: 1, minEarnings: 500, minSales: 50, sortOrder: 2 } });
  await db.platformCreatorTier.create({ data: { name: 'elite', label: 'Elite', revenueShare: 95, featuredEligible: true, marketplacePriority: 2, minEarnings: 2000, minSales: 200, sortOrder: 3 } });
  console.log('✓ Creator tiers');

  const starter = await db.platformCreatorTier.findUnique({ where: { name: 'starter' } });
  await db.platformCreatorTierAssignment.create({ data: { creatorId: teacher.id, tierId: starter.id, assignedBy: admin.id } });
  console.log('✓ Teacher assigned to Starter tier');

  await db.$disconnect();
  console.log('✅ Seed complete!');
}

main().catch(e => console.error('ERROR:', e.message));
