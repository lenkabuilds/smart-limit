#!/bin/bash
# =============================================================
# SMART-LIMIT — GitHub Push Script
# =============================================================
# Run from your project folder:
#   chmod +x push_to_github.sh
#   ./push_to_github.sh
# =============================================================

G='\033[0;32m'; C='\033[0;36m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1m'; N='\033[0m'
ok()   { echo -e "${G}[✓]${N} $1"; }
info() { echo -e "${C}[→]${N} $1"; }
warn() { echo -e "${Y}[!]${N} $1"; }
fail() { echo -e "${R}[✗]${N} $1"; exit 1; }

echo ""
echo -e "${B}================================================${N}"
echo -e "${B}  SMART-LIMIT — GitHub Push Script${N}"
echo -e "${B}================================================${N}"
echo ""

# Check git is installed
command -v git >/dev/null 2>&1 || { sudo dnf install -y git; }
ok "Git available"

# Check we're in right folder
[ ! -f "app.py" ] && fail "Run this from your smart_limit project folder"
ok "Project folder confirmed"

# Get GitHub username
echo -e "${B}Enter your GitHub username:${N} "
read -r GITHUB_USER
[ -z "$GITHUB_USER" ] && fail "Username cannot be empty"

REPO_URL="https://github.com/${GITHUB_USER}/smart-limit.git"
echo ""
info "Will push to: $REPO_URL"
echo ""

# Configure git identity
echo -e "${B}Enter your full name (for git commits):${N} "
read -r GIT_NAME
echo -e "${B}Enter your email (for git commits):${N} "
read -r GIT_EMAIL

git config --global user.name  "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"
ok "Git identity configured"

# Initialize repo
if [ ! -d ".git" ]; then
    git init
    git branch -M main
    ok "Git repository initialized"
else
    ok "Git repository already exists"
fi

# Add remote
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
ok "Remote set to $REPO_URL"

# Stage everything
git add .
ok "Files staged"

# Count files
FILE_COUNT=$(git diff --cached --name-only | wc -l)
info "Staging $FILE_COUNT files"

# Commit
git commit -m "feat: initial release — SMART-LIMIT v3

AI-Powered Adaptive API Rate Limiting System

Features:
- Flask backend with sliding window rate limiter
- IsolationForest ML anomaly detection
- Real-time React dashboard (Vite + TailwindCSS)
- Attack simulator: Normal / Rush Hour / Spike / DDoS
- Circular arc AI rate limit gauge
- Live traffic vs limit visualization
- AI decision event log
- One-command Fedora installer

Tech: Python · Flask · React 18 · scikit-learn · Recharts" 2>/dev/null || {
    warn "Nothing new to commit (already committed)"
}

echo ""
echo -e "${B}================================================${N}"
echo -e "${Y}  IMPORTANT: Before pushing, make sure you:${N}"
echo -e "${B}================================================${N}"
echo ""
echo "  1. Created the repo on GitHub:"
echo "     https://github.com/new"
echo "     Name: smart-limit"
echo "     Visibility: Public"
echo "     Do NOT add README or .gitignore"
echo ""
echo "  2. Have a Personal Access Token (not password):"
echo "     https://github.com/settings/tokens"
echo "     → Generate new token (classic)"
echo "     → Check 'repo' scope"
echo "     → Copy the token"
echo ""
echo -e "${B}  When Git asks for password, paste your TOKEN.${N}"
echo ""

echo -e "${B}Push now? (y/n):${N} "
read -r CONFIRM
[ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ] && {
    warn "Skipping push. Run 'git push -u origin main' when ready."
    exit 0
}

# Push
info "Pushing to GitHub..."
git push -u origin main

echo ""
echo -e "${G}${B}================================================${N}"
echo -e "${G}${B}  ✓ Successfully pushed to GitHub!${N}"
echo -e "${G}${B}================================================${N}"
echo ""
echo -e "  View your repo: ${C}https://github.com/${GITHUB_USER}/smart-limit${N}"
echo ""
echo -e "${B}  Next steps:${N}"
echo "  1. Add topics on GitHub: python, flask, react, machine-learning,"
echo "     rate-limiting, anomaly-detection, cybersecurity, ddos-protection"
echo "  2. Add description: AI-Powered Adaptive API Rate Limiting System"
echo "  3. Pin the repo on your GitHub profile"
echo ""
