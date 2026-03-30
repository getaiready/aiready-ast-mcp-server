# @aiready/platform

AIReady Platform Dashboard - Web application for monitoring and improving codebase AI readiness.

## Development

### Prerequisites

- Node.js 24+
- pnpm
- AWS account with SST configured
- GitHub OAuth apps (3 required - one per environment)
- Google OAuth app (1 with multiple redirect URIs)

### Environment Setup

SST uses stage-specific environment files:

| File         | Stage | Purpose                            |
| ------------ | ----- | ---------------------------------- |
| `.env.local` | local | Local development (localhost:8888) |
| `.env.dev`   | dev   | Deployed dev environment           |
| `.env.prod`  | prod  | Production environment             |

Copy `.env.example` to the appropriate `.env.{stage}` file and fill in values.

### OAuth Setup

#### GitHub OAuth (3 separate apps required)

GitHub only allows 1 callback URL per OAuth app, so you need 3 apps:

| Environment | Callback URL                                                   |
| ----------- | -------------------------------------------------------------- |
| Local       | `http://localhost:8888/api/auth/callback/github`               |
| Dev         | `https://dev.platform.getaiready.dev/api/auth/callback/github` |
| Prod        | `https://platform.getaiready.dev/api/auth/callback/github`     |

#### Google OAuth (1 app with multiple URIs)

Google allows multiple redirect URIs per app:

- `http://localhost:8888/api/auth/callback/google`
- `https://dev.platform.getaiready.dev/api/auth/callback/google`
- `https://platform.getaiready.dev/api/auth/callback/google`

### Commands

```bash
# Local development (uses .env.local)
pnpm dev
# OR
make dev-platform

# Deploy to dev (uses .env.dev)
pnpm run deploy
# OR
make deploy-platform

# Deploy to production (uses .env.prod)
pnpm run deploy:prod
# OR
make deploy-platform-prod
```

### Architecture

- **Framework**: Next.js 16 with App Router
- **Auth**: NextAuth v5 (Auth.js)
- **Database**: DynamoDB (Single Table Design)
- **Storage**: S3
- **Deployment**: SST v3 on AWS with CloudFront
- **DNS**: Cloudflare

### Project Structure

```
platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth handlers
│   │   │   ├── analysis/       # Analysis upload
│   │   │   ├── billing/        # Stripe webhooks
│   │   │   ├── keys/           # API key management
│   │   │   └── repos/          # Repository management
│   │   ├── dashboard/          # Dashboard page
│   │   └── login/              # Login page
│   ├── components/             # React components
│   └── lib/                    # Utilities
│       ├── auth.ts             # NextAuth config
│       ├── auth.config.ts      # Auth providers
│       └── db.ts               # DynamoDB operations
├── sst.config.ts               # SST configuration
└── package.json
```

### SST Configuration

The `sst.config.ts` handles:

- **Local stage** (`--stage local`): No custom domain, localhost URLs
- **Dev stage** (`--stage dev`): `dev.platform.getaiready.dev` domain
- **Prod stage** (`--stage prod`): `platform.getaiready.dev` domain

### Authentication Flow

1. User clicks "Sign in with GitHub" or "Sign in with Google"
2. OAuth provider authenticates user
3. Callback received at `/api/auth/callback/{provider}`
4. NextAuth creates session with JWT
5. User redirected to dashboard

### Database Schema (DynamoDB Single Table)

| Entity   | PK              | SK                     | GSI1             | GSI2            |
| -------- | --------------- | ---------------------- | ---------------- | --------------- |
| User     | `USER#{id}`     | `USER#{id}`            | `EMAIL#{email}`  | -               |
| Repo     | `USER#{userId}` | `REPO#{repoId}`        | `REPO#{url}`     | -               |
| Analysis | `REPO#{repoId}` | `ANALYSIS#{timestamp}` | -                | `USER#{userId}` |
| ApiKey   | `USER#{userId}` | `KEY#{id}`             | `HASH#{keyHash}` | -               |

### Stripe Integration

- Subscription management via Stripe Billing
- Webhook endpoint: `/api/billing/webhook`
- Customer Portal: `/api/billing/portal`

### Remediation Agent System

The platform includes an automated code remediation system that improves AI-readiness of customer repositories.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REMEDIATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Analysis Spokes]                                                      │
│  pattern-detect, context-analyzer, consistency                          │
│         │                                                               │
│         ▼                                                               │
│  [RemediationRequest] ──► DynamoDB (status: pending)                   │
│         │                                                               │
│         ▼                                                               │
│  [User Approves in UI]                                                  │
│         │                                                               │
│         ├──► POST /api/remediate/[id]/approve ──► SQS Queue            │
│         │     (initial trigger)                                         │
│         │                                                               │
│  [Expert Review Panel]                                                  │
│         │                                                               │
│         ├──► POST /api/remediation/[id]/review ──► SQS Queue           │
│         │     (approve: triggers PR creation)                           │
│         │     (request-changes: re-enqueues with expert feedback)       │
│         │                                                               │
│         ▼                                                               │
│  [SQS Queue] ──► RemediationWorker (Lambda)                             │
│         │                                                               │
│         │  ┌────────────────────────────────────────────────────────┐   │
│         │  │  1. Validate SQS message fields + LLM API key         │   │
│         │  │  2. Clone repo to /tmp via isomorphic-git             │   │
│         │  │  3. RemediationSwarm.execute()                        │   │
│         │  │     ├─ Create direct tools (Octokit + fs/promises)    │   │
│         │  │     ├─ Build Mastra Agent with tools + instructions   │   │
│         │  │     ├─ Inject expert feedback (if re-run)             │   │
│         │  │     ├─ Execute with 3x retry + exponential backoff   │   │
│         │  │     └─ Parse JSON response (balanced-brace extractor) │   │
│         │  │  4. Update DynamoDB (status: reviewing, diff, PR URL) │   │
│         │  │  5. Send SES email notification                       │   │
│         │  │  6. Cleanup /tmp                                      │   │
│         │  │                                                        │   │
│         │  │  Timeout: 5 minutes | Model: MiniMax-M2.7             │   │
│         │  └────────────────────────────────────────────────────────┘   │
│         │                                                               │
│         ▼                                                               │
│  [Status: reviewing] ──► PR URL + suggestedDiff stored in DynamoDB      │
│         │                                                               │
│         ▼                                                               │
│  [Expert Review in Dashboard]                                           │
│         │                                                               │
│         ├── Approve ──► SQS ──► Worker creates real GitHub PR           │
│         └── Request Changes ──► SQS ──► Agent re-runs with feedback     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component              | Location                         | Purpose                                             |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| `RemediationQueue.tsx` | `src/app/.../components/`        | UI for viewing/managing remediation queue           |
| `RemediationWorker`    | `src/worker/remediation.ts`      | Lambda handler: clone, run agent, update DB, notify |
| `RemediationSwarm`     | `packages/agents/src/workflows/` | Mastra Agent with direct tools (no MCP/Lambda-safe) |
| `github.ts`            | `packages/agents/src/tools/`     | Standalone GitHub tools (Octokit)                   |
| `fs.ts`                | `packages/agents/src/tools/`     | Standalone filesystem tools (isomorphic-git + fs)   |
| `extractJson()`        | `packages/agents/src/workflows/` | Balanced-brace JSON parser for agent responses      |
| `withRetry()`          | `packages/agents/src/workflows/` | Exponential backoff wrapper (3 attempts, 2s/4s/8s)  |

#### Data Flow (SQS Messages)

```json
// Initial trigger (/api/remediate or /api/remediate/[id]/approve)
{
  "remediationId": "rem-xxx",
  "repoId": "repo-xxx",
  "userId": "user-xxx",
  "accessToken": "ghp_xxx",
  "type": "swarm"
}

// Expert review with feedback (/api/remediation/[id]/review, decision: "request-changes")
{
  "remediationId": "rem-xxx",
  "repoId": "repo-xxx",
  "userId": "user-xxx",
  "accessToken": "ghp_xxx",
  "type": "swarm",
  "expertFeedback": "Also update the test file",
  "previousDiff": "--- a/file.ts\n+++ b/file.ts"
}
```

#### Direct Tools (Lambda-Compatible)

The agent uses pre-bound direct tools instead of MCP server spawning (which fails in Lambda):

| Tool              | Backend          | Pre-bound Context        |
| ----------------- | ---------------- | ------------------------ |
| `read-file`       | `fs/promises`    | `rootDir`                |
| `write-file`      | `fs/promises`    | `rootDir`                |
| `list-files`      | `fs/promises`    | `rootDir`                |
| `create-branch`   | `@octokit/rest`  | `repoUrl`, `githubToken` |
| `checkout-branch` | `isomorphic-git` | `rootDir`                |
| `commit-and-push` | `isomorphic-git` | `rootDir`, `githubToken` |
| `create-pr`       | `@octokit/rest`  | `repoUrl`, `githubToken` |

All filesystem tools include path traversal protection (`path.resolve` + prefix check).

#### Remediation Types

- **consolidation**: Merge duplicate code patterns
- **rename**: Fix naming convention issues
- **restructure**: Reorganize file/folder structure
- **refactor**: General code improvements

#### Safety Features

1. **Human-in-the-loop**: All remediations require explicit user approval
2. **PR-based**: Changes are submitted as Pull Requests for review
3. **In-progress blocking**: UI prevents approving new remediations while one is running
4. **Single-threaded**: SQS processes messages sequentially
5. **LLM API key validation**: Worker fails fast if no key is configured
6. **5-minute timeout**: Agent execution is bounded
7. **Path traversal protection**: Filesystem tools reject `../` escapes
8. **Retry with backoff**: Transient LLM failures are retried 3x

#### Database Schema

| Entity      | PK              | SK                 |
| ----------- | --------------- | ------------------ |
| Remediation | `REPO#{repoId}` | `REMEDIATION#{id}` |

GSI1: `REMEDIATION#{id}` - For looking up remediation by ID
GSI2: `REPO#{repoId}` - For listing remediations by repo
GSI3: `TEAM#{teamId}` - For listing remediations by team

#### Future Enhancements

- SQS FIFO with `MessageGroupId = repoId` for ordered processing
- DynamoDB repo-level locking for concurrent safety
- File overlap detection before execution
- Autonomous mode with auto-approve for trusted repos
- WebSocket real-time status updates (replace 5s polling)

## License

MIT
