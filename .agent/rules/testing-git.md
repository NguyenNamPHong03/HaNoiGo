---
trigger: always_on
---

# 9. Testing Checklist

- ✅ Unit tests cho utility functions (`formatPrice`, `validateEmail`)
- ✅ Hook tests với `@testing-library/react-hooks`
- ✅ Component tests với `@testing-library/react`
- ✅ Integration tests cho user flows (Search → Select Place → Submit Review)
- ✅ E2E tests với Playwright/Cypress cho critical paths

---

# 10. Git Commit Messages

**Format**: `type: description`

**Types:**

- `feat`: Tính năng mới (`feat: Add place favorite feature`)
- `fix`: Fix bug (`fix: Resolve chat scroll issue`)
- `perf`: Performance optimization (`perf: Optimize place list rendering`)
- `refactor`: Code refactoring (`refactor: Extract PlaceCard logic to hook`)
- `style`: UI/CSS changes (`style: Update place card hover effect`)
- `test`: Add tests (`test: Add PlaceCard component tests`)

---

## Git Commit Examples

```bash
# Feature
git commit -m "feat: Add place favorite feature"

# Bug fix
git commit -m "fix: Resolve chat scroll issue on mobile"

# Performance
git commit -m "perf: Lazy load PlaceMap component"

# Refactoring
git commit -m "refactor: Extract PlaceCard logic to usePlaceCard hook"

# Style/UI
git commit -m "style: Update PlaceCard hover animation"

# Tests
git commit -m "test: Add integration tests for place search"
```

---

## Branch Naming Convention

```bash
# Feature branches
feature/place-favorite
feature/chat-history

# Bug fix branches
fix/chat-scroll-mobile
fix/place-image-loading

# Hotfix branches
hotfix/critical-api-error
```
