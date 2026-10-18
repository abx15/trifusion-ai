import { PrismaClient, WorkspaceRole, PlatformStaffRoleType, UserStatus, WorkspaceStatus, WorkspaceMemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const seedDatabaseUrl = process.env.DATABASE_URL_SEED;
const prisma = new PrismaClient(
  seedDatabaseUrl ? { datasources: { db: { url: seedDatabaseUrl } } } : undefined,
);

export async function runSeed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: Seed scripts are forbidden in production environment.');
  }
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development seeds can run only when NODE_ENV=development.');
  }
  if (process.env.ALLOW_DEV_SEED !== 'true' || !seedDatabaseUrl) {
    throw new Error(
      'Set ALLOW_DEV_SEED=true and configure a separate DATABASE_URL_SEED for a non-production development database.',
    );
  }
  if (seedDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_SEED must differ from the runtime DATABASE_URL.');
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

  // 6. Seed sample clients for the company workspace
  const ownerId = ownerUser.id;

  const clientData = [
    { name: 'Northwind Wellness Group', email: 'contact@northwindwellness.example', phone: '+1-212-555-0100', website: 'https://northwindwellness.example', status: 'ACTIVE' as const },
    { name: 'Summit Trail Outfitters', email: 'hello@summittrail.example', phone: '+1-212-555-0200', website: 'https://summittrail.example', status: 'ACTIVE' as const },
    { name: 'Harborline Analytics', email: 'team@harborline.example', phone: '+1-212-555-0300', website: 'https://harborline.example', status: 'ARCHIVED' as const },
    { name: 'Cedarstone Studio', email: 'office@cedarstone.example', phone: '+1-212-555-0400', website: 'https://cedarstone.example', status: 'ACTIVE' as const },
  ];

  const createdClients: Record<string, { id: string; name: string }> = {};

  for (const c of clientData) {
    const existing = await prisma.client.findFirst({
      where: { workspaceId: companyWs.id, name: c.name },
    });
    const data = {
      name: c.name,
      email: c.email,
      phone: c.phone,
      website: c.website,
      status: c.status,
      deletedAt: c.status === 'ARCHIVED' ? existing?.deletedAt ?? new Date() : null,
    };
    const client = existing
      ? await prisma.client.update({ where: { id: existing.id }, data })
      : await prisma.client.create({
          data: { ...data, workspaceId: companyWs.id, createdBy: ownerId },
        });
    createdClients[c.name] = { id: client.id, name: client.name };
    console.log(`    - Client "${client.name}" (${client.id}) status=${c.status}`);
  }

  // 7. Seed Sample Projects
  const projectData = [
    { name: 'Customer Portal Refresh', clientId: createdClients['Northwind Wellness Group'].id, description: 'Redesign and implement the customer self-service portal', status: 'ACTIVE' as const },
    { name: 'Compliance Readiness', clientId: createdClients['Summit Trail Outfitters'].id, description: 'Prepare evidence and controls for the annual compliance review', status: 'PLANNING' as const },
    { name: 'Data Platform Migration', clientId: createdClients['Harborline Analytics'].id, description: 'Move legacy reporting workloads to the managed data platform', status: 'ARCHIVED' as const },
    { name: 'Partner API Integration', clientId: createdClients['Cedarstone Studio'].id, description: 'Integrate approved partner services through the public API', status: 'ACTIVE' as const },
    { name: 'Internal Dashboard', clientId: null, description: 'Internal company dashboard for TriFusion Sample Company', status: 'ON_HOLD' as const },
  ];

  const createdProjects: Record<string, { id: string; name: string }> = {};

  for (const p of projectData) {
    const existing = await prisma.project.findFirst({
      where: { workspaceId: companyWs.id, name: p.name },
    });
    const data = {
      clientId: p.clientId,
      description: p.description,
      status: p.status,
      deletedAt: p.status === 'ARCHIVED' ? existing?.deletedAt ?? new Date() : null,
    };
    const project = existing
      ? await prisma.project.update({ where: { id: existing.id }, data })
      : await prisma.project.create({
          data: {
            ...data,
            workspaceId: companyWs.id,
            name: p.name,
            createdBy: ownerId,
          },
        });
    createdProjects[p.name] = { id: project.id, name: project.name };
    console.log(`    - Project "${project.name}" (${project.id}) status=${p.status}`);
  }

  // 8. Seed Sample Tasks
  const taskData = [
    { projectId: createdProjects['Customer Portal Refresh'].id, assigneeId: createdWorkspaceUsers['admin@trifusion.dev'].id, title: 'Review customer journey', description: 'Review current onboarding and identify friction points', status: 'DONE' as const, priority: 'HIGH' as const, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { projectId: createdProjects['Customer Portal Refresh'].id, assigneeId: createdWorkspaceUsers['member@trifusion.dev'].id, title: 'Build responsive navigation', description: 'Implement keyboard-accessible navigation for desktop and mobile', status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { projectId: createdProjects['Compliance Readiness'].id, assigneeId: createdWorkspaceUsers['owner@trifusion.dev'].id, title: 'Plan evidence review', description: 'Define the evidence review scope and timeline', status: 'TODO' as const, priority: 'URGENT' as const, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { projectId: createdProjects['Partner API Integration'].id, assigneeId: createdWorkspaceUsers['member@trifusion.dev'].id, title: 'Implement partner authorization', description: 'Add scoped authorization for approved partner requests', status: 'REVIEW' as const, priority: 'HIGH' as const, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { projectId: createdProjects['Internal Dashboard'].id, assigneeId: null, title: 'Dashboard wireframes', description: 'Low-fidelity wireframes for internal dashboard', status: 'TODO' as const, priority: 'LOW' as const, dueDate: null },
    { projectId: createdProjects['Customer Portal Refresh'].id, assigneeId: createdWorkspaceUsers['owner@trifusion.dev'].id, title: 'Schedule client review', description: 'Review approved portal designs with the client', status: 'TODO' as const, priority: 'MEDIUM' as const, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  ];

  for (const t of taskData) {
    const existing = await prisma.task.findFirst({
      where: { workspaceId: companyWs.id, projectId: t.projectId, title: t.title },
    });
    const data = {
      assigneeId: t.assigneeId,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      deletedAt: null,
    };
    const task = existing
      ? await prisma.task.update({ where: { id: existing.id }, data })
      : await prisma.task.create({
          data: {
            ...data,
            workspaceId: companyWs.id,
            projectId: t.projectId,
            title: t.title,
            createdBy: ownerId,
          },
        });
    console.log(`    - Task "${task.title}" (${task.id}) status=${t.status} priority=${t.priority}`);
  }

  const personalWorkspace = await prisma.workspace.findUnique({
    where: { slug: `personal-alice-${ownerId.slice(0, 6)}` },
  });
  if (!personalWorkspace) {
    throw new Error('Seeded owner personal workspace was not found.');
  }

  const personalClientName = 'Personal Consulting Client';
  const existingPersonalClient = await prisma.client.findFirst({
    where: { workspaceId: personalWorkspace.id, name: personalClientName },
  });
  const personalClient = existingPersonalClient
    ? await prisma.client.update({
        where: { id: existingPersonalClient.id },
        data: { email: 'owner@personal-client.example', status: 'ACTIVE', deletedAt: null },
      })
    : await prisma.client.create({
        data: {
          workspaceId: personalWorkspace.id,
          name: personalClientName,
          email: 'owner@personal-client.example',
          status: 'ACTIVE',
          createdBy: ownerId,
        },
      });
  const personalProjectName = 'Independent Advisory Engagement';
  const existingPersonalProject = await prisma.project.findFirst({
    where: { workspaceId: personalWorkspace.id, name: personalProjectName },
  });
  const personalProject = existingPersonalProject
    ? await prisma.project.update({
        where: { id: existingPersonalProject.id },
        data: { clientId: personalClient.id, status: 'ACTIVE', deletedAt: null },
      })
    : await prisma.project.create({
        data: {
          workspaceId: personalWorkspace.id,
          clientId: personalClient.id,
          name: personalProjectName,
          description: 'Plan and deliver a short operational improvement engagement',
          status: 'ACTIVE',
          createdBy: ownerId,
        },
      });
  const personalTaskTitle = 'Prepare kickoff plan';
  const existingPersonalTask = await prisma.task.findFirst({
    where: {
      workspaceId: personalWorkspace.id,
      projectId: personalProject.id,
      title: personalTaskTitle,
    },
  });
  if (existingPersonalTask) {
    await prisma.task.update({
      where: { id: existingPersonalTask.id },
      data: { assigneeId: ownerId, status: 'TODO', deletedAt: null },
    });
  } else {
    await prisma.task.create({
      data: {
        workspaceId: personalWorkspace.id,
        projectId: personalProject.id,
        assigneeId: ownerId,
        title: personalTaskTitle,
        description: 'Confirm goals, participants, milestones, and expected outcomes',
        status: 'TODO',
        priority: 'MEDIUM',
        createdBy: ownerId,
      },
    });
  }

  await prisma.workspaceSettings.upsert({
    where: { workspaceId: companyWs.id },
    create: { workspaceId: companyWs.id, companyName: companyWs.name },
    update: {},
  });
  await prisma.workspaceSettings.upsert({
    where: { workspaceId: personalWorkspace.id },
    create: { workspaceId: personalWorkspace.id },
    update: {},
  });

  console.log('✅ Phase 3 development seed completed for company and personal workspaces.\n');
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
