import { PrismaClient, WorkspaceRole, PlatformStaffRoleType, UserStatus, WorkspaceStatus, WorkspaceMemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export async function runSeed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: Seed scripts are forbidden in production environment.');
  }

  console.log('🌱 Starting TriFusion AI Phase 2 Development Seeding...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Seed Workspace Test Users
  const workspaceUsersData = [
    { email: 'owner@trifusion.dev', firstName: 'Alice', lastName: 'Owner', role: WorkspaceRole.OWNER },
    { email: 'admin@trifusion.dev', firstName: 'Bob', lastName: 'Admin', role: WorkspaceRole.TEAM_ADMIN },
    { email: 'member@trifusion.dev', firstName: 'Charlie', lastName: 'Member', role: WorkspaceRole.MEMBER },
    { email: 'viewer@trifusion.dev', firstName: 'Dana', lastName: 'Viewer', role: WorkspaceRole.VIEWER },
  ];

  const createdWorkspaceUsers: Record<string, { id: string; email: string; role: WorkspaceRole }> = {};

  for (const u of workspaceUsersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        profile: {
          create: {
            firstName: u.firstName,
            lastName: u.lastName,
          },
        },
      },
      update: {
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    createdWorkspaceUsers[u.email] = { id: user.id, email: user.email, role: u.role };

    // Ensure personal workspace exists
    const personalSlug = `personal-${u.firstName.toLowerCase()}-${user.id.slice(0, 6)}`;
    const personalWs = await prisma.workspace.upsert({
      where: { slug: personalSlug },
      create: {
        name: `${u.firstName}'s Personal Space`,
        slug: personalSlug,
        type: 'PERSONAL',
        status: WorkspaceStatus.ACTIVE,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER,
            status: WorkspaceMemberStatus.ACTIVE,
          },
        },
      },
      update: {},
    });

    console.log(`  ✓ User ${u.email} created with personal workspace ${personalWs.slug}`);
  }

  // 2. Seed Shared Company Workspace
  const companySlug = 'acme-innovations-corp';
  const ownerUser = createdWorkspaceUsers['owner@trifusion.dev'];

  const companyWs = await prisma.workspace.upsert({
    where: { slug: companySlug },
    create: {
      name: 'Acme Innovations Corp',
      slug: companySlug,
      type: 'COMPANY',
      status: WorkspaceStatus.ACTIVE,
      ownerId: ownerUser.id,
    },
    update: {
      name: 'Acme Innovations Corp',
      status: WorkspaceStatus.ACTIVE,
    },
  });

  console.log(`  ✓ Company Workspace "${companyWs.name}" (${companyWs.id}) ready`);

  // Assign memberships for all 4 roles to Acme Innovations Corp
  for (const u of workspaceUsersData) {
    const userRef = createdWorkspaceUsers[u.email];
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: companyWs.id,
          userId: userRef.id,
        },
      },
      create: {
        workspaceId: companyWs.id,
        userId: userRef.id,
        role: userRef.role,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      update: {
        role: userRef.role,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    console.log(`    - Assigned ${u.email} as ${userRef.role} in ${companyWs.name}`);
  }

  // 3. Seed Platform Staff Users (Strictly separated from customer workspaces)
  const platformStaffData = [
    { email: 'superadmin@trifusion.dev', firstName: 'Sam', lastName: 'Superadmin', staffRole: PlatformStaffRoleType.SUPERADMIN },
    { email: 'platformadmin@trifusion.dev', firstName: 'Paul', lastName: 'PlatformAdmin', staffRole: PlatformStaffRoleType.PLATFORM_ADMIN },
    { email: 'analyst@trifusion.dev', firstName: 'Ana', lastName: 'Analyst', staffRole: PlatformStaffRoleType.ANALYST },
    { email: 'support@trifusion.dev', firstName: 'Sue', lastName: 'SupportAgent', staffRole: PlatformStaffRoleType.SUPPORT_AGENT },
  ];

  for (const s of platformStaffData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        passwordHash,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        profile: {
          create: {
            firstName: s.firstName,
            lastName: s.lastName,
          },
        },
      },
      update: {
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.platformStaffRole.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: s.staffRole,
        },
      },
      create: {
        userId: user.id,
        role: s.staffRole,
        status: 'ACTIVE',
        reason: 'Initial development seeding',
      },
      update: {
        status: 'ACTIVE',
      },
    });

    console.log(`  ✓ Platform Staff ${s.email} (${s.staffRole}) provisioned`);
  }

  // 4. Seed Suspended User (to verify access rejection)
  await prisma.user.upsert({
    where: { email: 'suspended@trifusion.dev' },
    create: {
      email: 'suspended@trifusion.dev',
      passwordHash,
      status: UserStatus.SUSPENDED,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'Simon',
          lastName: 'Suspended',
        },
      },
    },
    update: {
      status: UserStatus.SUSPENDED,
    },
  });
  console.log('  ✓ Suspended user (suspended@trifusion.dev) provisioned for security tests');

  // 5. Seed a Sample Workspace Invitation
  const rawInviteToken = 'dev_sample_invite_token_1234567890';
  const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
  await prisma.workspaceInvitation.upsert({
    where: {
      workspaceId_email: {
        workspaceId: companyWs.id,
        email: 'contractor@example.com',
      },
    },
    create: {
      workspaceId: companyWs.id,
      email: 'contractor@example.com',
      role: WorkspaceRole.MEMBER,
      tokenHash: inviteTokenHash,
      inviterId: ownerUser.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    update: {
      status: 'PENDING',
      tokenHash: inviteTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Pending invitation seeded for contractor@example.com (Token: ${rawInviteToken})`);

  console.log('✅ Dev Seeding successfully completed!\n');
}

if (require.main === module) {
  runSeed()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
