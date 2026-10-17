# TriFusion AI

 AI-powered Business Workspace for individuals, freelancers, digital agencies, and IT/service companies.

## 📋 Overview

TriFusion AI brings project work, client information, tasks, documents, team collaboration, reports, and AI assistance into one secure product. Start with a narrow, reliable MVP, validate it with real users, and expand after the core workflow is stable.

## 🎯 Core Features

- **Authentication & Onboarding** - Sign up, sign in, email verification, password reset
- **Workspaces** - Personal and company workspaces with multi-tenancy
- **Client Management** - Create, view, update, archive clients
- **Project Management** - Projects with status, dates, client links, and membership
- **Task Management** - Tasks with assignment, priority, due dates, and status
- **Dashboard** - Real-time metrics from persisted data
- **AI Assistant** - Project summaries, weekly reports, and Q&A with permission-aware retrieval
- **Notifications** - In-app and email notifications for important events
- **File Storage** - Private document handling with signed URLs
- **Reports** - Date-filtered reports for project/task progress
- **Billing** - Subscription management and payment integration

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS
- **API:** REST with Swagger/OpenAPI
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache/Queue:** Redis + BullMQ
- **Real-time:** Socket.IO/WebSockets
- **AI Streaming:** Server-Sent Events (SSE)

### Infrastructure
- **Database:** PostgreSQL (managed recommended)
- **Cache:** Redis (managed recommended)
- **Storage:** S3-compatible object storage
- **AI Provider:** OpenAI / Anthropic / Google
- **Email:** SendGrid / SES / Mailgun
- **Payment:** Stripe / Razorpay
- **Monitoring:** Sentry
- **CI/CD:** GitHub Actions

## 📁 Repository Structure

```
trifusion-ai/
├── apps/
│   ├── web/                       # Customer-facing Next.js app
│   ├── api/                       # Main NestJS API
│   └── admin/                     # TriFusion internal platform admin UI
├── services/
│   └── ai-service/                # Optional FastAPI AI/RAG service
├── packages/
│   ├── ui/                        # Shared UI components
│   ├── contracts/                 # Shared API contracts/types
│   ├── config/                    # Shared TypeScript/ESLint configuration
│   └── utils/                     # Shared utilities
├── database/
│   ├── prisma/                    # Prisma schema and migrations
│   ├── seeds/                     # Development/test seed scripts
│   └── docs/                      # ER diagrams and data model notes
├── infrastructure/
│   ├── docker/                    # Docker files
│   ├── deployment/                # Deployment configuration
│   └── monitoring/                # Monitoring configuration
├── docs/
│   ├── PRD.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_CONTRACTS.md
│   ├── SECURITY.md
│   ├── DEVELOPMENT_ROADMAP.md
│   └── ADRs/                      # Architecture Decision Records
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── security/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js:** >= 18.0.0
- **pnpm:** >= 8.0.0
- **PostgreSQL:** >= 14 (for local development)
- **Redis:** >= 6 (for local development)
- **Git:** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/trifusion-ai.git
   cd trifusion-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in the required values:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string
   - `AUTH_SECRET` - Generate a secure secret: `openssl rand -base64 32`
   - `AI_PROVIDER` - Choose your AI provider (openai, anthropic, etc.)
   - `OPENAI_API_KEY` - Your OpenAI API key (or other provider)
   - Other optional variables as needed

4. **Set up app-specific environment files**

   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   cp apps/admin/.env.example apps/admin/.env
   cp services/ai-service/.env.example services/ai-service/.env
   ```

5. **Set up the database**

   Generate Prisma client:
   ```bash
   pnpm db:generate
   ```

   Run migrations:
   ```bash
   pnpm db:migrate
   ```

   (Optional) Seed development data:
   ```bash
   pnpm db:seed
   ```

6. **Start development servers**

   Start all apps in development mode:
   ```bash
   pnpm dev
   ```

   Or start individual apps:
   ```bash
   # Web app (Next.js)
   cd apps/web
   pnpm dev

   # API (NestJS)
   cd apps/api
   pnpm dev

   # Admin UI
   cd apps/admin
   pnpm dev

   # AI Service (if needed)
   cd services/ai-service
   pnpm dev
   ```

7. **Access the applications**

   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - API Documentation (Swagger): http://localhost:3001/api/docs
   - Admin UI: http://localhost:3002
   - AI Service: http://localhost:3003

## 📝 Available Scripts

### Root Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm lint` - Lint all code
- `pnpm lint:fix` - Fix linting issues
- `pnpm typecheck` - Type-check all TypeScript code
- `pnpm test` - Run all unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm test:integration` - Run integration tests
- `pnpm clean` - Clean build artifacts and node_modules
- `pnpm format` - Format all code with Prettier
- `pnpm format:check` - Check code formatting

### Database Scripts

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Create and apply database migrations
- `pnpm db:migrate:deploy` - Deploy migrations (production)
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed development data
- `pnpm db:reset` - Reset database (development only)

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### End-to-End Tests
```bash
pnpm test:e2e
```

## 🔒 Security

- Never commit `.env` files with real secrets
- Use strong secrets in production
- Enable HTTPS in production
- Configure CORS properly
- Implement rate limiting
- Enable audit logging
- Regular security audits required

See `docs/SECURITY.md` for detailed security guidelines.

## 📚 Documentation

- `docs/PRD.md` - Product Requirements Document
- `docs/SYSTEM_ARCHITECTURE.md` - System Architecture
- `docs/DATABASE_DESIGN.md` - Database Design
- `docs/API_CONTRACTS.md` - API Contracts
- `docs/SECURITY.md` - Security Guidelines
- `docs/DEVELOPMENT_ROADMAP.md` - Development Roadmap
- `docs/ADRs/` - Architecture Decision Records

## 🗺️ Development Roadmap

The project is divided into 9 phases:

1. **Phase 0** - Product definition and setup
2. **Phase 1** - Foundation and identity
3. **Phase 2** - Workspaces, membership, and tenant isolation
4. **Phase 3** - Core business workflow (clients, projects, tasks)
5. **Phase 4** - Collaboration and notifications
6. **Phase 5** - AI assistant MVP
7. **Phase 6** - Files, reporting, and subscriptions
8. **Phase 7** - Security hardening and beta readiness
9. **Phase 8** - Production launch

See `Project.md` for detailed phase-by-phase implementation plan.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED - All rights reserved

## 🆘 Support

For support, email support@trifusion.ai or open an issue in the repository.

## 🔗 Links

- Product Website: https://trifusion.ai
- Documentation: https://docs.trifusion.ai
- Status Page: https://status.trifusion.ai

---

**Built with ❤️ by the TriFusion AI Team**
#   t r i f u s i o n - a i 
 
 