# 🎯 Hướng dẫn & Nguyên tắc Phát triển CLIENT - HANOIGO

Tài liệu này định nghĩa các tiêu chuẩn, nguyên tắc và hướng dẫn tối ưu hóa để đảm bảo Frontend **HANOIGO** đạt hiệu suất cao, code chất lượng và trải nghiệm người dùng xuất sắc.

---

## 📋 Mục Lục Các File Rules

| File | Nội dung |
| :-- | :-- |
| [01-core-principles.md](./01-core-principles.md) | Nguyên tắc Cốt lõi (Performance, UX, Clean Code) |
| [02-naming-conventions.md](./02-naming-conventions.md) | Quy chuẩn Đặt tên |
| [03-error-handling.md](./03-error-handling.md) | Xử lý Lỗi |
| [04-performance-optimization.md](./04-performance-optimization.md) | Tối ưu Performance |
| [05-react-query.md](./05-react-query.md) | React Query Best Practices |
| [06-code-splitting.md](./06-code-splitting.md) | Code Splitting & Lazy Loading |
| [07-testing-git.md](./07-testing-git.md) | Testing & Git Commit Messages |

---

## 1. Tầm nhìn & Quy mô (Scope)

**HANOIGO Client** là giao diện người dùng cho nền tảng khám phá địa điểm tại Hà Nội, tích hợp AI Chatbot (RAG) và tìm kiếm semantic.

- **Tech Stack**: React 18 + Vite + React Query + Axios
- **Architecture**: Feature-based modular structure
- **Target**: Sub-3s load time

---

## ✅ Final Checklist

Trước khi commit/deploy, đảm bảo:

- [ ] Không có console.log/debugger trong code
- [ ] Tất cả images đã optimize (WebP, lazy load)
- [ ] Components nặng đã được memo/lazy load
- [ ] Error boundaries đã wrap routes chính
- [ ] Loading states cho tất cả async operations
- [ ] Toast notifications cho user actions
- [ ] Mobile responsive (test từ 320px)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] No TypeScript/ESLint errors
- [ ] Lighthouse score > 90

---

**🎯 Mục tiêu cuối cùng**: Code clean, performant, maintainable, và mang lại trải nghiệm người dùng xuất sắc!
