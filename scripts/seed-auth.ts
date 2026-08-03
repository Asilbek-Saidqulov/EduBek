/**
 * EduBek Phase 1B — Seed admin user + sample organization.
 *
 * Creates:
 *   - A platform superadmin user (admin@edubek.local / AdminPass123)
 *   - A regular platform user (teacher@edubek.local / TeacherPass123)
 *   - A sample organization ("Springfield High School") owned by the admin
 *     with all default system roles seeded
 *   - The teacher user is NOT a member yet (test the invitation flow)
 *
 * Run with: bun run scripts/seed-auth.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const db = new PrismaClient()

import {
  PlatformRole,
  ORG_DEFAULT_ROLES,
} from '../src/features/rbac/rbac.roles'

async function main() {
  console.log('🌱 Seeding auth + organization foundation...')

  // Clean existing auth/org data AND marketplace data that references users
  // (the Phase 1 seed created creators that we're replacing here).
  console.log('  🧹 Cleaning existing data...')
  await db.organizationInvitation.deleteMany()
  await db.organizationMembership.deleteMany()
  await db.organizationRole.deleteMany()
  await db.organization.deleteMany()
  await db.userSession.deleteMany()
  await db.userRole.deleteMany()
  await db.userPermission.deleteMany()
  // Delete marketplace data that references users
  await db.marketplaceReview.deleteMany()
  await db.marketplacePurchase.deleteMany()
  await db.marketplaceListing.deleteMany()
  await db.question.deleteMany()
  await db.quiz.deleteMany()
  await db.creator.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()

  // --- Create admin user ---
  const adminPasswordHash = await bcrypt.hash('AdminPass123', 12)
  const admin = await db.user.create({
    data: {
      email: 'admin@edubek.local',
      passwordHash: adminPasswordHash,
      name: 'EduBek Admin',
      username: 'admin',
      locale: 'en',
      profile: { create: { displayName: 'EduBek Admin' } },
      roles: {
        create: [
          { role: PlatformRole.SUPERADMIN, grantedAt: new Date() },
          { role: PlatformRole.ADMIN, grantedAt: new Date() },
        ],
      },
    },
  })
  console.log(`  ✓ Created admin user: ${admin.email} (${admin.id})`)

  // --- Create teacher user ---
  const teacherPasswordHash = await bcrypt.hash('TeacherPass123', 12)
  const teacher = await db.user.create({
    data: {
      email: 'teacher@edubek.local',
      passwordHash: teacherPasswordHash,
      name: 'Jane Teacher',
      username: 'janeteacher',
      locale: 'en',
      profile: { create: { displayName: 'Jane Teacher' } },
      roles: {
        create: [
          { role: PlatformRole.USER, grantedAt: new Date() },
          { role: PlatformRole.CREATOR, grantedAt: new Date() },
        ],
      },
    },
  })
  console.log(`  ✓ Created teacher user: ${teacher.email} (${teacher.id})`)

  // --- Create a sample organization owned by the admin ---
  console.log('  🏫 Creating sample organization...')
  const org = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: 'Springfield High School',
        slug: 'springfield-high',
        type: 'school',
        ownerId: admin.id,
        billingEmail: admin.email,
        country: 'US',
        plan: 'pro',
        seats: 50,
      },
    })

    // Seed default system roles
    const roles = await Promise.all(
      ORG_DEFAULT_ROLES.map((r) =>
        tx.organizationRole.create({
          data: {
            orgId: created.id,
            name: r.name,
            permissions: JSON.stringify(r.permissions),
            isDefault: r.isDefault,
            isSystem: r.isSystem,
          },
        }),
      ),
    )

    // Add the admin as the owner
    const ownerRole = roles.find((r) => r.name === 'org_owner')!
    await tx.organizationMembership.create({
      data: {
        orgId: created.id,
        userId: admin.id,
        roleId: ownerRole.id,
        status: 'active',
      },
    })

    return created
  })
  console.log(`  ✓ Created organization: ${org.name} (${org.slug})`)
  console.log(`    Owner: ${admin.email}`)
  console.log(`    Roles seeded: ${ORG_DEFAULT_ROLES.length} (owner, admin, school_admin, teacher, ta, student)`)

  // --- Create a pending invitation for the teacher ---
  const teacherRole = await db.organizationRole.findFirst({
    where: { orgId: org.id, name: 'org_teacher' },
  })
  if (teacherRole) {
    const token = randomBytes(32).toString('hex')
    await db.organizationInvitation.create({
      data: {
        orgId: org.id,
        email: teacher.email!,
        roleId: teacherRole.id,
        token,
        invitedById: admin.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    console.log(`  ✓ Created invitation for ${teacher.email} (role: org_teacher)`)
    console.log(`    Token: ${token}`)
  }

  console.log('\n✅ Auth + org seed complete!')
  console.log('\n📋 Test credentials:')
  console.log('  Admin:    admin@edubek.local / AdminPass123  (superadmin)')
  console.log('  Teacher:  teacher@edubek.local / TeacherPass123  (platform_user + creator)')
  console.log('\n  The teacher has a pending invitation to Springfield High School.')
  console.log('  Test the accept flow via POST /api/organizations/invitations/[token]/accept')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
