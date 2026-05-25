# GitHub Actions Deployment Setup Guide

This guide explains how to configure the GitHub Actions workflow for Docker registry push, cloud deployment, and Slack notifications.

---

## 📋 Prerequisites

1. Your repository must be on GitHub
2. Push `.github/workflows/ci-cd.yml` to your repository

---

## 🔐 GitHub Secrets Configuration

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. **Docker Registry (GitHub Container Registry)**

Docker images are automatically pushed to **GitHub Container Registry (GHCR)** using your `GITHUB_TOKEN` (built-in).

**What happens:**
- Backend image: `ghcr.io/your-username/your-repo/backend:latest`
- Web image: `ghcr.io/your-username/your-repo/web:latest`
- No additional secrets needed! ✅

---

## ☁️ Cloud Deployment Options

Choose **one or more** deployment platforms:

### **Option 1: Render.com (Recommended for Beginners)**

```
Secret Name: RENDER_DEPLOY_HOOK
Secret Value: https://api.render.com/deploy/srv-xxxxxxxxxxxxxx?key=yyyyyyy
```

**How to get it:**
1. Go to [Render.com](https://render.com) → Dashboard → Service
2. Settings → Deploy Hook → Copy the URL
3. Add as GitHub secret `RENDER_DEPLOY_HOOK`

**Workflow triggers:** Automatically deploys on push to `main` branch

---

### **Option 2: Railway.app**

```
Secret Name: RAILWAY_TOKEN
Secret Value: <your-railway-api-token>

Secret Name: RAILWAY_PROJECT_ID
Secret Value: <your-railway-project-id>
```

**How to get it:**
1. Go to [Railway.app](https://railway.app) → Account → API Tokens
2. Generate new token → Copy it
3. Go to your project → Settings → Copy project ID
4. Add both as GitHub secrets

---

### **Option 3: AWS ECS (Advanced)**

```
Secret Name: AWS_ACCESS_KEY_ID
Secret Value: <your-aws-access-key>

Secret Name: AWS_SECRET_ACCESS_KEY
Secret Value: <your-aws-secret-key>

Secret Name: AWS_REGION
Secret Value: us-east-1

Secret Name: AWS_ECS_CLUSTER
Secret Value: <your-cluster-name>

Secret Name: AWS_ECS_SERVICE
Secret Value: <your-service-name>
```

**How to get it:**
1. Go to AWS IAM → Users → Create user with ECS permissions
2. Generate access keys
3. Add all secrets to GitHub

---

### **Option 4: Heroku (Legacy)**

```
Secret Name: HEROKU_API_KEY
Secret Value: <your-heroku-api-key>

Secret Name: HEROKU_APP_NAME
Secret Value: <your-app-name>

Secret Name: HEROKU_EMAIL
Secret Value: <your-heroku-email>
```

**How to get it:**
1. Go to [Heroku](https://heroku.com) → Account → API Key → Reveal
2. Copy your API key
3. Add secrets to GitHub

---

## 💬 Slack Notifications

### Enable Slack Notifications

```
Secret Name: SLACK_WEBHOOK
Secret Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX
```

**How to get it:**

1. Go to your Slack workspace → **Settings → Apps** → Search "Incoming Webhooks"
2. Click "Add" → Choose channel (e.g., #deployments)
3. Copy the webhook URL
4. Add as GitHub secret `SLACK_WEBHOOK`

**What you'll get:**
- ✅ Build success notification
- ❌ Build failure notification
- 📊 Commit message, author, and branch info
- 🔗 Link to workflow run

---

## 📊 Workflow Status Checks

View your workflow status:

1. Go to your GitHub repo → **Actions** tab
2. Click the latest workflow run
3. See real-time logs for each job

---

## 🚀 Deployment Flow

```
Developer pushes code to main
        ↓
GitHub detects push
        ↓
[PARALLEL JOBS]
├─ Security scan dependencies
├─ Build & push Docker images to GHCR
├─ Security scan containers (Trivy)
└─ Run backend tests
        ↓
All jobs pass?
        ↓
YES → Deploy to cloud platform (Render/Railway/AWS/Heroku)
NO  → Pipeline fails (notifications sent)
        ↓
Send Slack notification
```

---

## 📝 Configuration Examples

### **Minimal Setup (Docker only, no deployment)**
- No secrets needed
- Images push to GHCR automatically
- Tests run automatically

### **Development Setup (Docker + Render)**
1. Add `RENDER_DEPLOY_HOOK` secret
2. Push to `main` branch
3. Services auto-deploy to Render

### **Production Setup (Docker + AWS + Slack)**
1. Add AWS secrets (4 total)
2. Add `SLACK_WEBHOOK` secret
3. Get notifications for every deployment

---

## 🔍 Troubleshooting

### Images not pushing to GHCR?
- Check: Settings → Actions → General → Workflow permissions
- Ensure "Read and write permissions" is selected
- Re-run the workflow

### Deployment not triggering?
- Only deploys on **main branch** with **push events**
- PRs don't trigger deployment
- Check if the condition `if: github.ref == 'refs/heads/main'` matches

### Slack notifications not working?
- Verify `SLACK_WEBHOOK` secret is set correctly
- Check: curl -X POST $SLACK_WEBHOOK -d "test"
- Ensure webhook URL is still valid (expires after 30 days of inactivity)

### Tests failing in CI but passing locally?
- GitHub Actions uses PostgreSQL 15 & Redis 7 (same as docker-compose)
- Check DATABASE_URL and REDIS_URL are correct
- Ensure all environment variables are set in `.env.example`

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build and Push Action](https://github.com/docker/build-push-action)
- [Render Deployment Guide](https://render.com/docs)
- [Railway Deployment Guide](https://docs.railway.app)
- [AWS ECS Deployment](https://docs.aws.amazon.com/ecs)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
