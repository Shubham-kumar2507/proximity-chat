# Proximity Chat - Automated 17-Commit Git Push Script
# This script commits all recent updates in exactly 17 logical commits (excluding .env files) and pushes to GitHub.

Write-Host "🚀 Starting Git commit process..." -ForegroundColor Cyan

# 0. Cleanup unused dev file
if (Test-Path "backend/src/services/s3Service.js") {
    Write-Host "🧹 Removing unused s3Service.js..." -ForegroundColor Yellow
    Remove-Item -Force "backend/src/services/s3Service.js"
}

# Ensure .env files are NOT added
Write-Host "🔒 Ensuring .env files are kept out of tracking..." -ForegroundColor Yellow
git rm --cached backend/.env 2>$null
git rm --cached mobile/.env 2>$null

# Commit 1: Gitignore update
Write-Host "📦 Committing 1/17: .gitignore..." -ForegroundColor Green
git add .gitignore
git commit -m "chore: update gitignore to secure env and build files"

# Commit 2: Cloudinary Service
Write-Host "📦 Committing 2/17: Cloudinary Service..." -ForegroundColor Green
git add backend/src/services/cloudinaryService.js
git commit -m "feat: add Cloudinary media upload and deletion service"

# Commit 3: Notification Service
Write-Host "📦 Committing 3/17: Notification Service..." -ForegroundColor Green
git add backend/src/services/notificationService.js
git commit -m "feat: add Firebase Cloud Messaging push notification service"

# Commit 4: Config Update
Write-Host "📦 Committing 4/17: Backend Config..." -ForegroundColor Green
git add backend/src/config.js
git commit -m "feat: update backend configuration for Cloudinary and Twilio"

# Commit 5: Package JSON
Write-Host "📦 Committing 5/17: Dependencies..." -ForegroundColor Green
git add backend/package.json
git commit -m "chore: add cloudinary dependency to package.json"

# Commit 6: Docker Hardening
Write-Host "📦 Committing 6/17: Docker Infrastructure..." -ForegroundColor Green
git add backend/Dockerfile docker-compose.yml
git commit -m "ops: harden Dockerfile with multi-stage build and enable Redis persistence"

# Commit 7: Posts Route
Write-Host "📦 Committing 7/17: Posts Routes..." -ForegroundColor Green
git add backend/src/routes/posts.js
git commit -m "feat: enhance posts routes with Cloudinary uploads, reposts, and 2-level comment threads"

# Commit 8: Chat Routes
Write-Host "📦 Committing 8/17: Chat Routes..." -ForegroundColor Green
git add backend/src/routes/chat.js
git commit -m "feat: add routes for save chat, identity reveal, and post-chat ratings"

# Commit 9: Chat Service
Write-Host "📦 Committing 9/17: Chat Service..." -ForegroundColor Green
git add backend/src/services/chatService.js
git commit -m "feat: update chat service with read receipts, identity reveal flow, and partner ratings"

# Commit 10: Socket Server
Write-Host "📦 Committing 10/17: Socket Server..." -ForegroundColor Green
git add backend/src/socket/socketServer.js
git commit -m "feat: enhance WebSocket server with read/delivery receipts and typing indicators"

# Commit 11: Request Service
Write-Host "📦 Committing 11/17: Request Service..." -ForegroundColor Green
git add backend/src/services/requestService.js
git commit -m "feat: add gaming, travel, and other topic tags to request service"

# Commit 12: Cron Jobs
Write-Host "📦 Committing 12/17: Cron Jobs..." -ForegroundColor Green
git add backend/src/utils/cronJobs.js
git commit -m "feat: add cron jobs for expiring chats, requests, and hard-deleting soft-deleted posts"

# Commit 13: Users Route
Write-Host "📦 Committing 13/17: Users Route..." -ForegroundColor Green
git add backend/src/routes/users.js
git commit -m "feat: add interest tag match score, GDPR export, and GDPR cascading account delete"

# Commit 14: Core Services (JWT + Location)
Write-Host "📦 Committing 14/17: Core Services..." -ForegroundColor Green
git add backend/src/utils/jwt.js backend/src/services/locationService.js
git commit -m "refactor: configure JWT from environment and increase location TTL for offline grace period"

# Commit 15: Test Suite Setup
Write-Host "📦 Committing 15/17: Test Setup..." -ForegroundColor Green
git add backend/tests/setup.js
git commit -m "test: update test setup with new local postgres credentials"

# Commit 16: Mobile UI Updates
Write-Host "📦 Committing 16/17: Mobile Screens & Theme..." -ForegroundColor Green
git add mobile/src/screens/Discovery/SendRequestModal.js mobile/src/screens/Requests/RequestsScreen.js mobile/src/theme/theme.js
git commit -m "feat: update mobile screens with busy action, new topics, and full dark design token system"

# Commit 17: Project Documentation
Write-Host "📦 Committing 17/17: Completion Checklist..." -ForegroundColor Green
git add COMPLETION_CHECKLIST.md
git commit -m "docs: update COMPLETION_CHECKLIST with cloudinary and implemented feature status"

# Push to Origin
$branch = git branch --show-current
Write-Host "📤 Pushing 17 commits to remote repository on branch [$branch]..." -ForegroundColor Cyan
git push origin $branch

Write-Host "🎉 All 17 commits successfully pushed to GitHub (excluding .env files)!" -ForegroundColor Green
