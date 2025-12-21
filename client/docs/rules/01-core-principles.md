# 2. Nguyên tắc Cốt lõi (Core Principles)

## 🚀 Performance First (Tối ưu Hiệu năng)

- **Lazy Loading**: Luôn áp dụng `React.lazy` và `Suspense` cho Route components và heavy components (ChatWindow, MapView, ImageGallery)
- **Image Optimization**:
    - Format **WebP** cho tất cả ảnh tĩnh
    - Cloudinary images luôn dùng `f_auto,q_auto,w_800` (responsive width)
    - Lazy load images với Intersection Observer
- **Minimize Re-renders**:
    - Sử dụng `useMemo` cho tính toán phức tạp (filter arrays > 50 items)
    - `useCallback` cho functions pass xuống child components
    - `React.memo` cho list items (PlaceCard, ReviewCard)
    - Tránh inline objects/arrays trong props
- **Bundle Size**:
    - Initial bundle < 200KB (gzipped)
    - Tree-shake unused code
    - Dynamic imports cho features ít dùng

---

## 🎨 Visual & UX Excellence

- **Loading States**:
    - **KHÔNG BAO GIỜ** để màn hình trắng
    - Skeleton loading cho data fetching (places list, chat history)
    - Spinner component cho mutations (submit review, send message)
- **Feedback**:
    - Toast notification cho mọi user action:
        - ✅ "Đã thêm vào yêu thích"
        - ❌ "Không thể gửi tin nhắn, vui lòng thử lại"
    - Visual feedback cho interactions (button press, card hover)
- **Micro-interactions**:
    - Smooth transitions (0.3s ease-in-out)
    - Hover effects trên PlaceCard (scale: 1.02, shadow lift)
    - Loading animations cho chatbot typing indicator
- **Accessibility**:
    - ARIA labels cho interactive elements
    - Keyboard navigation (Tab, Enter, Esc)
    - Focus indicators rõ ràng

---

## 🛠 Clean Code & Maintainability

- **DRY (Don't Repeat Yourself)**:
    - Tách logic lặp lại thành Custom Hooks (`usePlaces`, `useChat`)
    - Shared UI components trong `components/common/`
- **Modular Architecture**:
    - Feature-based structure: mỗi feature tự quản lý components, hooks, pages
    - Single Responsibility: 1 component chỉ làm 1 việc
- **Consistency**: Tuân thủ naming conventions
