# TriFusion AI — User Guide

This guide walks you through every role-specific dashboard in TriFusion AI, how to log in, what each role can do, and where to find test credentials.

> **All test users share the same password:** `Password123!`  
> **Full credential list:** See `TEST_CREDENTIALS.md` at the repository root.

---

## Table of Contents

1. [Logging In](#logging-in)
2. [Customer Workspace Dashboards](#customer-workspace-dashboards-appsweb)
   - [OWNER](#owner-role)
   - [TEAM_ADMIN](#team_admin-role)
   - [MEMBER](#member-role)
   - [VIEWER](#viewer-role)
3. [Platform Staff Dashboards](#platform-staff-dashboards-appsplatform-admin)
   - [SUPERADMIN](#superadmin-role)
   - [PLATFORM_ADMIN](#platform_admin-role)
   - [ANALYST](#analyst-role)
   - [SUPPORT_AGENT](#support_agent-role)
4. [Test Credentials](#test-credentials)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Logging In

### Customer Web Dashboard

1. Open **http://localhost:3000/login**
2. Enter your email and password (`Password123!` for all test users)
3. Click **Sign In**
4. You are redirected to `/dashboard` with your role-specific layout

### Platform Admin Portal

1. Open **http://localhost:3002/login**
2. Enter your email and password (`Password123!` for all test users)
3. Click **Sign In to Platform Admin**
4. You are redirected to `/` with your role-specific layout

> ⚠️ **Important:** Customer workspace credentials (owner@, admin@, member@, viewer@) only work on the web dashboard (port 3000). Platform staff credentials (superadmin@, platformadmin@, analyst@, support@) only work on the platform admin portal (port 3002). The two layers are strictly separated — they never share access.

---

## Customer Workspace Dashboards (`apps/web`)

Customer dashboards are role-specific. Your workspace role determines:
- **Design theme** (glassmorphism, minimalist, productivity, editorial)
- **Layout** (bento grid, grid, kanban, list)
- **Navigation items** visible in the sidebar
- **Widgets** displayed on the overview page
- **Actions** you can perform (create, edit, archive, manage members)

### OWNER Role

**Design:** Glassmorphism  
**Layout:** Bento Grid  
**Primary Color:** `#003F5C` (dark blue)

#### Dashboard Overview
The OWNER dashboard shows 6 widgets:
- **Workspace Overview** — workspace name, member count, project count, task count
- **Project Stats** — project status distribution (planning, active, on hold, completed)
- **Task Stats** — task status distribution (todo, in progress, review, done)
- **Recent Activity** — latest workspace events (client create, project update, etc.)
- **Team Members** — all workspace members with their roles
- **Quick Actions** — create client, create project, create task, invite member

#### What OWNER Can Do
| Capability | Allowed? |
|------------|----------|
| View all workspace data | ✅ |
| Create clients, projects, tasks | ✅ |
| Edit clients, projects, tasks | ✅ |
| Archive/restore resources | ✅ |
| Invite members (any role) | ✅ |
| Promote/demote members | ✅ |
| Remove members | ✅ |
| Update workspace settings/name | ✅ |
| Delete workspace | ✅ |
| Transfer ownership | ✅ |
| View workspace audit logs | ✅ |

> 🔒 **Guardrail:** A workspace must always have at least one active OWNER. You cannot demote yourself or be removed if you are the sole owner.

#### Test Credential
- **Email:** `owner@trifusion.dev`
- **Name:** Alice Owner

---

### TEAM_ADMIN Role

**Design:** Minimalist  
**Layout:** Bento Grid  
**Primary Color:** `#58508D` (purple-blue)

#### Dashboard Overview
The TEAM_ADMIN dashboard shows 5 widgets:
- **Workspace Overview** — workspace name, member count, project count, task count
- **Project Stats** — project status distribution
- **Task Stats** — task status distribution
- **Team Members** — workspace members (no role management for OWNER/TEAM_ADMIN)
- **Recent Activity** — latest workspace events

#### What TEAM_ADMIN Can Do
| Capability | Allowed? |
|------------|----------|
| View all workspace data | ✅ |
| Create clients, projects, tasks | ✅ |
| Edit clients, projects, tasks | ✅ |
| Archive/restore resources | ✅ |
| Invite MEMBER / VIEWER | ✅ |
| Remove MEMBER / VIEWER | ✅ |
| Update workspace settings/name | ✅ |
| Invite/promote to TEAM_ADMIN | ❌ |
| Manage OWNER role | ❌ |
| Delete workspace | ❌ |
| View workspace audit logs | ✅ |

#### Test Credential
- **Email:** `admin@trifusion.dev`
- **Name:** Bob Admin

---

### MEMBER Role

**Design:** Productivity  
**Layout:** Kanban  
**Primary Color:** `#8A508F` (purple)

#### Dashboard Overview
The MEMBER dashboard shows 4 widgets focused on personal productivity:
- **My Tasks** — tasks assigned to you, organized by status (Todo, In Progress, Review, Done)
- **Assigned Projects** — projects you are working on
- **Recent Activity** — activity relevant to your assignments
- **Notifications** — unread notifications

#### What MEMBER Can Do
| Capability | Allowed? |
|------------|----------|
| View all workspace data (read) | ✅ |
| Create clients, projects, tasks | ✅ |
| Edit clients, projects, tasks | ✅ |
| Assign tasks to active members | ✅ |
| Change project/task status | ✅ |
| Invite members | ❌ |
| Archive/restore resources | ❌ |
| Update workspace settings | ❌ |
| View workspace audit logs | ❌ |
| Delete workspace | ❌ |

#### Test Credential
- **Email:** `member@trifusion.dev`
- **Name:** Charlie Member

---

### VIEWER Role

**Design:** Editorial  
**Layout:** List  
**Primary Color:** `#64748B` (slate)

#### Dashboard Overview
The VIEWER dashboard shows 4 read-only widgets:
- **Workspace Overview** — key metrics (read-only)
- **Project Progress** — list of projects with progress bars
- **Task Status** — list of tasks with status badges
- **Recent Activity** — activity feed (read-only)

#### What VIEWER Can Do
| Capability | Allowed? |
|------------|----------|
| View all workspace data (read-only) | ✅ |
| Create resources | ❌ |
| Edit resources | ❌ |
| Archive/restore resources | ❌ |
| Invite/manage members | ❌ |
| Update workspace settings | ❌ |
| View workspace audit logs | ❌ |

#### Test Credential
- **Email:** `viewer@trifusion.dev`
- **Name:** Dana Viewer

---

## Platform Staff Dashboards (`apps/platform-admin`)

Platform staff dashboards are strictly separated from customer workspaces. Platform staff have **no ambient access** to customer project/task data.

### SUPERADMIN Role

**Design:** Glassmorphism  
**Layout:** Bento Grid  
**Primary Color:** `#003F5C` (dark blue)

#### Dashboard Overview
6 platform-level widgets:
- **Platform Overview** — total workspaces, users, staff, API calls
- **Workspace Stats** — workspace count by status (active, suspended, archived)
- **User Stats** — user count by status (active, suspended, deleted)
- **Staff Management** — platform staff role assignments
- **Global Audit** — recent platform audit events
- **System Health** — API, database, Redis status

#### What SUPERADMIN Can Do
| Capability | Allowed? |
|------------|----------|
| Assign platform staff roles | ✅ |
| Revoke platform staff roles | ✅ |
| Modify global system config | ✅ |
| Suspend/activate tenant workspaces | ✅ |
| Suspend/activate user accounts | ✅ |
| View global platform telemetry | ✅ |
| View aggregated usage/quotas | ✅ |
| View global audit logs | ✅ |
| View tenant audit log stream | ✅ |
| View customer workspace content | ❌ (bounded support only) |

#### Test Credential
- **Email:** `superadmin@trifusion.dev`
- **Name:** Sam Superadmin

---

### PLATFORM_ADMIN Role

**Design:** Minimalist  
**Layout:** Grid  
**Primary Color:** `#58508D` (purple-blue)

#### Dashboard Overview
4 operational widgets:
- **Tenant Overview** — workspace management summary
- **Workspace Management** — list of workspaces with activation controls
- **User Management** — list of users with suspension controls
- **Usage Metrics** — platform usage summary

#### What PLATFORM_ADMIN Can Do
| Capability | Allowed? |
|------------|----------|
| Suspend/activate tenant workspaces | ✅ |
| Suspend/activate user accounts | ✅ |
| View global platform telemetry | ✅ |
| View aggregated usage/quotas | ✅ |
| View global audit logs | ✅ |
| View tenant audit log stream | ✅ |
| Assign/revoke staff roles | ❌ |
| Modify global system config | ❌ |

#### Test Credential
- **Email:** `platformadmin@trifusion.dev`
- **Name:** Paul PlatformAdmin

---

### ANALYST Role

**Design:** Dark Mode  
**Layout:** Bento Grid  
**Primary Color:** `#8A508F` (purple)

#### Dashboard Overview
5 analytics widgets:
- **Platform Telemetry** — real-time platform metrics
- **User Growth** — user registration trends
- **API Usage** — API call volume and endpoints
- **Quota Reports** — workspace quota utilization
- **Performance Monitoring** — response times, error rates

#### What ANALYST Can Do
| Capability | Allowed? |
|------------|----------|
| View global platform telemetry | ✅ |
| View aggregated usage/quotas | ✅ |
| Export platform performance metrics | ✅ |
| View global audit logs | ✅ |
| Modify system config | ❌ |
| Suspend/activate workspaces | ❌ |

#### Test Credential
- **Email:** `analyst@trifusion.dev`
- **Name:** Ana Analyst

---

### SUPPORT_AGENT Role

**Design:** Helpdesk  
**Layout:** Kanban  
**Primary Color:** `#FF6361` (coral)

#### Dashboard Overview
4 support widgets:
- **Ticket Overview** — support tickets by status
- **SLA Metrics** — response/resolution time tracking
- **Active Sessions** — ongoing support sessions
- **Resolution Rate** — ticket resolution percentage

#### What SUPPORT_AGENT Can Do
| Capability | Allowed? |
|------------|----------|
| Initiate bounded support session (with consent) | ✅ |
| View customer workspace content | ❌ (bounded session only) |
| View global platform telemetry | ❌ |
| Modify system config | ❌ |

> 🔒 **Support Session Policy:** Support agents require customer consent and a documented incident ticket before ephemeral support access is activated. All support access generates an immutable `PLATFORM_SUPPORT_ACCESS` audit event.

#### Test Credential
- **Email:** `support@trifusion.dev`
- **Name:** Sue SupportAgent

---

## Test Credentials

All test users share the same password: **`Password123!`**

### Customer Workspace (Web Dashboard — http://localhost:3000)

| Email | Role | Name |
|-------|------|------|
| owner@trifusion.dev | OWNER | Alice Owner |
| admin@trifusion.dev | TEAM_ADMIN | Bob Admin |
| member@trifusion.dev | MEMBER | Charlie Member |
| viewer@trifusion.dev | VIEWER | Dana Viewer |

### Platform Staff (Platform Admin — http://localhost:3002)

| Email | Role | Name |
|-------|------|------|
| superadmin@trifusion.dev | SUPERADMIN | Sam Superadmin |
| platformadmin@trifusion.dev | PLATFORM_ADMIN | Paul PlatformAdmin |
| analyst@trifusion.dev | ANALYST | Ana Analyst |
| support@trifusion.dev | SUPPORT_AGENT | Sue SupportAgent |

### Negative Test

| Email | Status | Expected Behavior |
|-------|--------|-------------------|
| suspended@trifusion.dev | SUSPENDED | Login should be rejected |

---

## Common Tasks

### Creating a Project (OWNER, TEAM_ADMIN, MEMBER)

1. Navigate to **Projects** in the sidebar
2. Click **Create Project**
3. Fill in: project name, description, status, start/end dates, optional client
4. Click **Create**
5. The project appears in your project list and dashboard widgets

### Creating a Task (OWNER, TEAM_ADMIN, MEMBER)

1. Navigate to **Tasks** in the sidebar
2. Click **Create Task**
3. Fill in: task title, description, project, assignee, priority, due date
4. Click **Create**
5. The task appears in the kanban board or task list

### Changing Task Status

1. Open a task from the Tasks page
2. Select a new status from the dropdown (Todo → In Progress → Review → Done)
3. Click **Save**
4. The status change is recorded in the activity feed

### Inviting a Member (OWNER, TEAM_ADMIN)

1. Navigate to **Settings → Members** (OWNER only) or **Members** (TEAM_ADMIN)
2. Click **Invite Member**
3. Enter email and select role (MEMBER or VIEWER for TEAM_ADMIN; any role for OWNER)
4. Click **Send Invitation**
5. The invitee receives an email with an invitation link

### Viewing Audit Logs (OWNER, TEAM_ADMIN)

1. Navigate to **Settings** in the sidebar
2. Click **Audit Logs**
3. Browse the chronological list of workspace events
4. Each entry shows: actor, action, target, timestamp, and outcome

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Login redirects back to /login | Wrong portal (using workspace creds on platform-admin, or vice versa) | Use the correct URL: port 3000 for workspace users, port 3002 for platform staff |
| "Account is suspended" error | User account is suspended | Contact a SUPERADMIN or PLATFORM_ADMIN to reactivate |
| "Invalid email or password" | Wrong credentials | Use `Password123!` for all test users; check email spelling |
| Dashboard shows no data | No workspace membership or empty database | Seed the database: `pnpm db:seed` (development only) |
| 403 Forbidden on a page | Insufficient role for that action | Your role doesn't permit this action; see the role matrix above |
| API connection error | API server not running | Start the API: `pnpm --filter @trifusion/api start:dev` |
| Cookies not set | Browser blocking third-party cookies | Ensure you're accessing localhost directly (not via proxy) |

---

## Getting Help

- **Role permissions:** `docs/ROLES_REFERENCE.md` and `docs/AUTHORIZATION_MATRIX.md`
- **API reference:** `docs/API_CONTRACTS.md`
- **Architecture:** `docs/ARCHITECTURE.md` and `docs/ARCHITECTURE_DIAGRAMS.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Security:** `docs/SECURITY.md`
- **Operational runbook:** `docs/RUNBOOK.md`
- **Test credentials:** `TEST_CREDENTIALS.md`
