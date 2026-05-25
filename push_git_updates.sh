#!/bin/bash
# Proximity Chat - Automated 17-Commit Git Push Script (Bash / Git Bash)
# This script commits all recent updates in exactly 17 logical commits (excluding .env files) and pushes to GitHub.

echo -e "\033[0;36m🚀 Starting Git commit process...\033[0m"

# 0. Cleanup unused dev file
if [ -f "backend/src/services/s3Service.js" ]; then
    echo -e "\033[0;33m🧹 Removing unused s3Service.js...\033[0m"
    rm -f backend/src/services/s3Service.js
fi

# Ensure .env files are NOT added
echo -e "\033[0;33m🔒 Ensuring .env files are kept out of tracking...\033[0m"
git rm --cached backend/.env 2>/dev/null
git rm --cached mobile/.env 2>/dev/null

# Commit 1: Gitignore update
echo -e "\033[0;32m📦 Committing 1/17: .gitignore...\033[0m"
git add .gitignore
git commit -m "chore: update gitignore to secure env and build files"

# Commit 2: Cloudinary Service
echo -e "\033[0;32m📦 Committing 2/17: Cloudinary Service...\033[0m"
git add backend/src/services/cloudinaryService.js
git commit -m "feat: add Cloudinary media upload and deletion service"

# Commit 3: Notification Service
echo -e "\033[0;32m📦 Committing 3/17: Notification Service...\033[0m"
git add backend/src/services/notificationService.js
git commit -m "feat: add Firebase Cloud Messaging push notification service"

# Commit 4: Config Update
echo -e "\033[0;32m📦 Committing 4/17: Backend Config...\033[0m"
git add backend/src/config.js
git commit -m "feat: update backend configuration for Cloudinary and Twilio"

# Commit 5: Package JSON
echo -e "\033[0;32m📦 Committing 5/17: Dependencies...\033[0m"
git add backend/package.json
git commit -m "chore: add cloudinary dependency to package.json"

# Commit 6: Docker Hardening
echo -e "\033[0;32m📦 Committing 6/17: Docker Infrastructure...\033[0m"
git add backend/Dockerfile docker-compose.yml
git commit -m "ops: harden Dockerfile with multi-stage build and enable Redis persistence"

# Commit 7: Posts Route
echo -e "\033[0;32m📦 Committing 7/17: Posts Routes...\033[0m"
git add backend/src/routes/posts.js
git commit -m "feat: enhance posts routes with Cloudinary uploads, reposts, and 2-level comment threads"

# Commit 8: Chat Routes
echo -e "\033[0;32m📦 Committing 8/17: Chat Routes...\033[0m"
git add backend/src/routes/chat.js
git commit -m "feat: add routes for save chat, identity reveal, and post-chat ratings"

# Commit 9: Chat Service
echo -e "\033[0;32m📦 Committing 9/17: Chat Service...\033[0m"
git add backend/src/services/chatService.js
git commit -m "feat: update chat service with read receipts, identity reveal flow, and partner ratings"

# Commit 10: Socket Server
echo -e "\033[0;32m📦 Committing 10/17: Socket Server...\033[0m"
git add backend/src/socket/socketServer.js
git commit -m "feat: enhance WebSocket server with read/delivery receipts and typing indicators"

# Commit 11: Request Service
echo -e "\033[0;32m📦 Committing 11/17: Request Service...\033[0m"
git add backend/src/services/requestService.js
git commit -m "feat: add gaming, travel, and other topic tags to request service"

# Commit 12: Cron Jobs
echo -e "\033[0;32m📦 Committing 12/17: Cron Jobs...\033[0m"
git add backend/src/utils/cronJobs.js
git commit -m "feat: add cron jobs for expiring chats, requests, and hard-deleting soft-deleted posts"

# Commit 13: Users Route
echo -e "\033[0;32m📦 Committing 13/17: Users Route...\033[0m"
git add backend/src/routes/users.js
git commit -m "feat: add interest tag match score, GDPR export, and GDPR cascading account delete"

# Commit 14: Core Services (JWT + Location)
echo -e "\033[0;32m📦 Committing 14/17: Core Services...\033[0m"
git add backend/src/utils/jwt.js backend/src/services/locationService.js
git commit -m "refactor: configure JWT from environment and increase location TTL for offline grace period"

# Commit 15: Test Suite Setup
echo -e "\033[0;32m📦 Committing 15/17: Test Setup...\033[0m"
git add backend/tests/setup.js
git commit -m "test: update test setup with new local postgres credentials"

# Commit 16: Mobile UI Updates
echo -e "\033[0;32m📦 Committing 16/17: Mobile Screens & Theme...\033[0m"
git add mobile/src/screens/Discovery/SendRequestModal.js mobile/src/screens/Requests/RequestsScreen.js mobile/src/theme/theme.js
git commit -m "feat: update mobile screens with busy action, new topics, and full dark design token system"

# Commit 17: Project Documentation
echo -e "\033[0;32m📦 Committing 17/17: Completion Checklist...\033[0m"
git add COMPLETION_CHECKLIST.md
git commit -m "docs: update COMPLETION_CHECKLIST with cloudinary and implemented feature status"

# Push to Origin
branch=$(git branch --show-current)
echo -e "\033[0;36m📤 Pushing 17 commits to remote repository on branch [$branch]...\033[0m"
git push origin "$branch"

echo -e "\033[0;32m🎉 All 17 commits successfully pushed to GitHub (excluding .env files)!\033[0m"
