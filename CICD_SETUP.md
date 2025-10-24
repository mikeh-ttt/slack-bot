# CI/CD Pipeline Setup Guide

## Quick Start (5 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/slack-bot.git
git push -u origin main
```

### 2. Enable SSH on Windows Server
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

### 3. Add GitHub Secrets
Go to: **Repository → Settings → Secrets and variables → Actions**

**Server Connection:**
- `WINDOWS_SERVER_HOST` = Your server IP
- `WINDOWS_SERVER_USER` = SSH username
- `WINDOWS_SERVER_PASSWORD` = SSH password
- `PROJECT_PATH` = `C:\Users\YourUser\slack-bot`

**Application Secrets:**
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_APP_TOKEN`
- `HARVEST_ACCOUNT_ID`
- `HARVEST_ACCESS_TOKEN`
- `ALLOWED_INVOKERS` (optional)

### 4. Prepare Windows Server
```powershell
git clone https://github.com/YOUR_USERNAME/slack-bot.git
cd slack-bot
npm install
npm run build
```

### 5. Test Deployment
```bash
git add .
git commit -m "Test CI/CD"
git push origin main
```

Watch it deploy at: **GitHub → Actions**

---

## How It Works

1. Push code to GitHub
2. GitHub Actions builds and tests
3. Creates `.env` from secrets
4. SCP copies `.env` to Windows server
5. SSH deploys and restarts Docker
6. Bot is live! ✅

---

## Troubleshooting

| Problem | Solution |
|---|---|
| SSH connection fails | Check: `Get-Service sshd` and verify credentials |
| Docker not found | Install Docker Desktop, add to PATH |
| Git pull fails | Verify `PROJECT_PATH` is correct |
| Port already in use | Run: `docker-compose down` |

---

## Useful Commands

**View deployment logs:**
```powershell
docker-compose logs -f harvest-bot
```

**Stop the bot:**
```powershell
docker-compose down
```

**Restart the bot:**
```powershell
docker-compose restart
```

**Check if running:**
```powershell
docker-compose ps
```

---

## Security: Use SSH Keys (Optional)

For better security, use SSH keys instead of passwords:

1. Generate key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f deploy_key
   ```

2. Add public key to Windows server:
   ```powershell
   mkdir C:\Users\YourUser\.ssh
   # Copy deploy_key.pub contents to C:\Users\YourUser\.ssh\authorized_keys
   ```

3. Add private key to GitHub as `DEPLOY_KEY` secret

4. Update `.github/workflows/deploy.yml`:
   ```yaml
   key: ${{ secrets.DEPLOY_KEY }}
   ```

---

## Workflows

**Deploy Workflow** (`deploy.yml`)
- Triggers: Push to `main` or `dev`
- Builds, tests, and deploys to Windows server

**Test Workflow** (`test.yml`)
- Triggers: Push or pull request to `main`/`dev`
- Checks TypeScript compilation and linting

---

## Need Help?

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
- Check GitHub Actions logs for errors
