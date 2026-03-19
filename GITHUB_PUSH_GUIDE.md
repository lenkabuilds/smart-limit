# How to Push SMART-LIMIT to GitHub
# =====================================
# Follow these steps EXACTLY in order.
# Takes about 10 minutes total.

## STEP 1 — Create GitHub account (if you don't have one)

Go to https://github.com and sign up.
Use a professional username — this will be on your portfolio.

---

## STEP 2 — Install Git on Fedora (if not installed)

Open a terminal and run:

    sudo dnf install -y git

Verify it worked:

    git --version
    # Should show: git version 2.x.x

---

## STEP 3 — Configure Git with your identity

    git config --global user.name "Your Full Name"
    git config --global user.email "your@email.com"

---

## STEP 4 — Create the repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - Repository name: smart-limit
   - Description: AI-Powered Adaptive API Rate Limiting System with ML anomaly detection and real-time dashboard
   - Visibility: Public
   - DO NOT check "Add a README file" (we have our own)
   - DO NOT add .gitignore (we have our own)
3. Click "Create repository"
4. GitHub will show you a page with a URL like:
   https://github.com/YOUR_USERNAME/smart-limit.git
   COPY THAT URL — you need it in Step 7.

---

## STEP 5 — Go to your project folder

    cd ~/smart_limit

Make sure these files are all there:

    ls
    # Should show: app.py  ml_engine.py  simulator.py
    #              requirements.txt  install.sh  frontend/
    #              README.md  .gitignore  LICENSE

---

## STEP 6 — Initialize Git in your project

    git init
    git branch -M main

---

## STEP 7 — Connect to your GitHub repository

Replace YOUR_USERNAME with your actual GitHub username:

    git remote add origin https://github.com/YOUR_USERNAME/smart-limit.git

---

## STEP 8 — Stage all files

    git add .

Check what will be committed (should NOT include venv/ or node_modules/):

    git status

You should see a list of files in green. If you see venv/ or node_modules/,
your .gitignore is not in the right place.

---

## STEP 9 — Make your first commit

    git commit -m "feat: initial release — AI-powered adaptive rate limiting system

    - Flask backend with adaptive rate limiting engine
    - IsolationForest ML anomaly detection
    - React + Vite + TailwindCSS real-time dashboard
    - Attack simulator (Normal/Rush/Spike/DDoS modes)
    - One-command Fedora installer
    - Circular arc AI rate limit gauge
    - Live traffic vs limit combo chart
    - Full event log of AI decisions"

---

## STEP 10 — Push to GitHub

    git push -u origin main

GitHub will ask for your username and password.
NOTE: GitHub no longer accepts passwords. You need a Personal Access Token.

HOW TO GET A TOKEN:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: smart-limit-push
4. Expiration: 90 days
5. Check the "repo" scope (top checkbox)
6. Click "Generate token"
7. COPY THE TOKEN — it shows only once!

When Git asks for password, paste the token instead.

---

## STEP 11 — Verify it worked

Go to: https://github.com/YOUR_USERNAME/smart-limit

You should see your README.md displayed beautifully on the page.

---

## STEP 12 — Add a repository description and topics

On your GitHub repo page:
1. Click the gear icon ⚙️ next to "About" on the right side
2. Description: AI-Powered Adaptive API Rate Limiting with ML Anomaly Detection
3. Website: (leave blank or add if you deploy it)
4. Topics (add these one by one):
   - python
   - flask
   - react
   - machine-learning
   - rate-limiting
   - anomaly-detection
   - cybersecurity
   - api-security
   - scikit-learn
   - tailwindcss
   - real-time-dashboard
   - ddos-protection
5. Click Save changes

---

## FUTURE UPDATES — how to push changes

Every time you make changes and want to update GitHub:

    cd ~/smart_limit
    git add .
    git commit -m "fix: describe what you changed"
    git push

---

## MAKE YOUR PROFILE LOOK GOOD

1. Go to https://github.com/YOUR_USERNAME
2. Click "Edit profile"
3. Add:
   - Name: Your real name
   - Bio: "Building AI-powered security tools | Python · React · ML"
   - Location: Your city
   - Link to LinkedIn if you have it

4. Pin the smart-limit repo:
   - On your profile page click "Customize your pins"
   - Select smart-limit
   - Click Save

---

## SHARE IT

LinkedIn post template:

  🚀 Just published SMART-LIMIT on GitHub!

  An AI-powered API rate limiting system that:
  ✅ Detects DDoS attacks with ML (IsolationForest)
  ✅ Adapts rate limits in real-time based on traffic
  ✅ Visualizes everything on a live React dashboard
  ✅ Drops rate limit from 100 → 5 during attacks automatically

  Built with: Python · Flask · React · scikit-learn · TailwindCSS

  🔗 github.com/YOUR_USERNAME/smart-limit

  #Python #MachineLearning #Cybersecurity #OpenSource #Flask #React
