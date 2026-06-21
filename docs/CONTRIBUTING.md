# Contributing Guide — Hypasia AI v2.0

Thank you for your interest in contributing to Hypasia! This guide will help you get up and running.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the code style guidelines
5. **Test** your changes
6. **Push** and open a **Pull Request**

---

## Development Setup

See the [Developer Guide](DEVELOPER_GUIDE.md) for full setup instructions.

Quick start:
```bash
# Backend
pip install -e .[api,dev]
cd src && python -m uvicorn hypasia.api.main:app --reload --port 8000

# Frontend
cd web && npm install && npm run dev
```

---

## Code Standards

### Python
- **Formatter:** `ruff` — run `ruff check . --fix` before committing
- **Type hints:** Required on all function signatures
- **Docstrings:** Required on all public functions
- Use `Pydantic` models for all request/response bodies

### JavaScript/React
- **No `import React`** (React 18 JSX transform handles it)
- Use `useCallback` for stable function references in `useEffect` dependencies
- Use CSS variables from the design system — no hardcoded colors
- All catch blocks must have a comment: `catch { /* reason */ }`

---

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Add a clear description of what changed and why
- Include screenshots for UI changes
- Ensure `npm run lint` passes with 0 errors (warnings are OK)
- Update `docs/CHANGELOG.md` with your changes under a new version

---

## Reporting Bugs

Open a GitHub Issue with:
1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Browser version and OS
5. Error messages from the browser console or terminal

---

## Suggesting Features

Open a GitHub Discussion. Include:
- Which user persona benefits (developer / non-technical / BI analyst)
- What problem it solves
- How it fits into the existing pipeline

---

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.
