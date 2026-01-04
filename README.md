# ChiStartup Hub

Chicago's comprehensive startup ecosystem platform - connecting founders with communities, accelerators, funding opportunities, events, and workspaces.

## Features

- **Communities** - Discover Chicago's startup communities and incubators
- **Accelerators** - Find accelerator programs tailored to your stage and sector
- **Funding Opportunities** - Browse grants, angel investors, and VCs
- **Events** - Stay updated on startup events, meetups, and conferences
- **Workspaces** - Find coworking spaces and innovation hubs
- **Chicago Blueprints** - Learn from successful Chicago startup stories

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Animations**: Framer Motion + GSAP
- **Deployment**: Vercel

---

## Local Development

### Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
   - Ensure Docker is running before starting Supabase

2. **Node.js 18+** - Required for the frontend

3. **Supabase CLI** - Included in dev dependencies (runs via npx)

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/bjtheartist/chistartuphub.git
cd chistartuphub

# 2. Install dependencies
npm install

# 3. Start local Supabase (first run downloads Docker images ~5-10 min)
npm run db:start

# 4. Copy local environment template
cp .env.local.example .env.local

# 5. Start the development server
npm run dev
```

The app will be available at http://localhost:5173

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start local Supabase stack |
| `npm run db:stop` | Stop local Supabase stack |
| `npm run db:reset` | Wipe database and reapply migrations + seed data |
| `npm run db:status` | Show local service URLs and credentials |
| `npm run db:studio` | Open Supabase Studio (database GUI) |

### Local Service URLs

Once `npm run db:start` completes:

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio (Database GUI) | http://127.0.0.1:54323 |
| Inbucket (Email Testing) | http://127.0.0.1:54324 |

### Daily Workflow

```bash
# Start your day
npm run db:start    # Boot local Supabase
npm run dev         # Start frontend

# End your day
npm run db:stop     # Stop Supabase (saves Docker resources)
```

### Environment Switching

The project uses different `.env` files for different environments:

| File | Purpose | Gitignored? |
|------|---------|-------------|
| `.env.local` | Local development (Supabase on Docker) | Yes |
| `.env` | Production credentials | Yes |
| `.env.example` | Template for production | No |
| `.env.local.example` | Template for local dev | No |

**How it works**: Vite automatically loads `.env.local` with higher priority than `.env`. For local development, use `.env.local` with local Supabase credentials.

### Resetting to Clean State

When you need a fresh database:

```bash
npm run db:reset
```

This will:
1. Drop all tables
2. Reapply all migrations
3. Load seed data (sample communities, events, etc.)

### Troubleshooting

#### Docker not running
```
Error: Cannot connect to Docker daemon
```
**Solution**: Start Docker Desktop and wait for it to fully initialize.

#### Port already in use
```
Error: Port 54321 is already in use
```
**Solution**: Stop the existing Supabase instance:
```bash
npm run db:stop
npm run db:start
```

#### Health check timeout during startup
The Supabase CLI has aggressive health check timeouts. The `db:start` script includes `--ignore-health-check` to allow services time to fully initialize. All services typically become healthy within 30-60 seconds after the command completes.

#### Migrations fail
```bash
# View migration status
npx supabase migration list

# Check for issues
npx supabase db reset --debug
```

---

## Project Structure

```
chistartuphub/
├── src/
│   ├── api/           # Supabase client configuration
│   ├── components/    # Reusable React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
├── supabase/
│   ├── migrations/    # Database migrations
│   ├── functions/     # Edge Functions
│   └── seed.sql       # Sample data for local dev
├── .claude/
│   └── skills/        # Claude Code skills for this project
└── public/            # Static assets
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` to check for issues
4. Submit a pull request

## License

Private - All rights reserved
