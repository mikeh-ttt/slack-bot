# Harvest Slack Bot 🤖

Slack bot for Harvest timesheet management, reporting, and team analytics.

---

## Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd slack-bot
npm install
```

### 2. Set up `.env`
```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
HARVEST_ACCOUNT_ID=...
HARVEST_ACCESS_TOKEN=...
```

### 3. Run
```bash
npm run dev          # Development
npm run build        # Build
npm start            # Production
```

### 4. Docker
```bash
docker-compose up -d
```

---

## Commands

| Command | Description |
|---|---|
| `/harvest-summary` | Billable hours by team member |
| `/timesheet-nudge` | Send timesheet reminders |
| `/leaderboard` | Top billable hours this week |

---

## Setup

### Slack App Setup
1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Create new app → Enable Socket Mode
3. Add scopes: `commands`, `chat:write`, `users:read`
4. Copy tokens to `.env`

### Harvest API Setup
1. Log in to Harvest
2. Settings → Developers → Personal Access Tokens
3. Copy Account ID and Access Token to `.env`

---

## Docker Commands

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f harvest-bot

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild after changes
docker-compose up -d --build
```

---

## Project Structure

```
src/
├── index.ts              # Entry point
├── commands/             # Slack commands
├── jobs/                 # Scheduled jobs
├── services/             # API clients (Harvest, Analytics)
├── types/                # TypeScript types
└── utils/                # Helpers
```

---

## Configuration

### Environment Variables

| Variable | Required | Default |
|---|---|---|
| `SLACK_BOT_TOKEN` | Yes | - |
| `SLACK_SIGNING_SECRET` | Yes | - |
| `SLACK_APP_TOKEN` | Yes | - |
| `HARVEST_ACCOUNT_ID` | Yes | - |
| `HARVEST_ACCESS_TOKEN` | Yes | - |
| `ALLOWED_INVOKERS` | No | All users |
| `HARVEST_CACHE_TTL_SEC` | No | 300 |

### Restrict Command Access
```env
ALLOWED_INVOKERS=U123456,U789012
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Bot not responding | Enable Socket Mode, verify `SLACK_APP_TOKEN` |
| Missing env vars error | Check `.env` file has all required variables |
| Docker errors | Run `docker-compose down` then `docker-compose up -d --build` |
| Permission denied | Verify user ID in `ALLOWED_INVOKERS` |

---

## CI/CD Deployment

See [CICD_SETUP.md](./CICD_SETUP.md) for GitHub Actions setup to auto-deploy to Windows server.

---

## Features

✅ Timesheet management
✅ Team reporting
✅ Leaderboard rankings
✅ Automated reminders
✅ Caching for performance
✅ Error handling
✅ Docker support
✅ CI/CD ready

---

## License

MIT

