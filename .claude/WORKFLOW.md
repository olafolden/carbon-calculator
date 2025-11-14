# Two-Agent Development Workflow

This project uses a two-agent workflow to maintain code quality and repository cleanliness.

## Available Agents

### 1. `/cleanup` - Clone Cleanup Agent
Removes unnecessary files and optimizes the repository structure.

**When to use:**
- After cloning the repository
- Before committing large changes
- When preparing for deployment
- To reduce repository size

**What it does:**
- Identifies build artifacts, caches, and temporary files
- Checks and updates .gitignore
- Removes unnecessary files with your approval
- Reports space savings

### 2. `/review` - Code Review Agent
Performs comprehensive code quality and security review.

**When to use:**
- Before merging to main branch
- After implementing new features
- During regular code audits
- Before production deployment

**What it reviews:**
- Code quality and organization
- Security vulnerabilities
- Performance optimization opportunities
- Best practices compliance
- Framework-specific issues
- Accessibility concerns

## Recommended Workflow

### Initial Setup (After Clone)
```bash
# 1. Clone the repository
git clone <repo-url>
cd carbon-calculator

# 2. Run cleanup agent
/cleanup

# 3. Install dependencies
npm install
```

### Development Cycle
```bash
# 1. Make your changes
# 2. Before committing, run code review
/review

# 3. Fix any issues identified
# 4. Run cleanup if needed
/cleanup

# 5. Commit your changes
git add .
git commit -m "Your message"
```

### Pre-Production Checklist
1. Run `/review` for comprehensive audit
2. Fix all Critical and High severity issues
3. Run `/cleanup` to optimize bundle
4. Test the application
5. Deploy

## Tips

- **Cleanup Agent:** Safe to run frequently, always asks for confirmation
- **Review Agent:** Provides actionable feedback with file locations
- **Combine them:** Run cleanup before review for best results
- **CI/CD:** Consider automating reviews in your pipeline

## Customization

Both agents are defined in `.claude/commands/`:
- `cleanup.md` - Customize cleanup patterns
- `review.md` - Adjust review criteria

Edit these files to match your project's specific needs.
