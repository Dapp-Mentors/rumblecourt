# PR Creation Guide: Conflict-Free PRs

## 🚨 Problem We Solved
PRs were accumulating duplicate commits from previous PRs because branches were reused without proper synchronization.

## ✅ Correct PR Creation Process

### 1. **Always Start Fresh**

**If you have uncommitted changes:**
```bash
git stash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
git stash pop
# If conflicts occur: resolve them, then git add . && git stash drop
```

**If no uncommitted changes:**
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

**Important**: Always branch from main, never from other feature branches!

### 2. **Verify Before Creating PR**
```bash
# Check what commits will be in your PR
git log main..your-branch

# Verify branch is current with main
git fetch origin
git log HEAD..origin/main  # Should show nothing

# Safe conflict check
git merge-tree $(git merge-base main HEAD) main HEAD
```

### 3. **Create Clean PRs**
```bash
# Ready for review
gh pr create --base main --head your-branch-name \
  --title "feat: Your feature description" \
  --body "Detailed description"

# Work in progress (prevents premature review)
gh pr create --draft --base main --head your-branch-name \
  --title "feat: Your feature description" \
  --body "Detailed description"
```

### 4. **If Hooks/Tests Fail**
```bash
# Fix the issues, then amend your commit
git add .
git commit --amend --no-edit
git push --force-with-lease origin your-branch
```

**⚠️ Always use `--force-with-lease`, NEVER `--force` alone**

## 📋 Quick Checklist

- [ ] Branch created from latest main?
- [ ] Branch contains only relevant commits?
- [ ] No duplicate commits from previous PRs?
- [ ] All hooks passing?
- [ ] Build successful?
- [ ] PR follows correct format?

## 🆘 Common Mistakes & Fixes

**Created branch from wrong base:**
```bash
git rebase --onto main wrong-base your-branch
```

**Accidentally committed to main:**
```bash
git branch feature/save-my-work
git reset --hard origin/main
git checkout feature/save-my-work
```

**Worked on stale branch:**
```bash
git checkout main && git pull origin main
git checkout -b feature/new-branch
git cherry-pick <only-new-commit-hashes>
```

## 🔒 Important Rules

- One branch = One PR (never reuse branches)
- Merging handled by AI Code Reviewer Agent only
- PR format: `https://github.com/Dapp-Mentors/rumblecourt/pull/[number]`
- Delete branches after PR is merged