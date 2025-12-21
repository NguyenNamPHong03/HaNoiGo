# Custom Cursor System - Tài liệu kỹ thuật

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Cấu trúc file](#2-cấu-trúc-file)
3. [Nguyên lý hoạt động](#3-nguyên-lý-hoạt-động)
4. [CursorContext - Quản lý toàn cục](#4-cursorcontext---quản-lý-toàn-cục)
5. [Cursor Component](#5-cursor-component)
6. [MagneticButton - Ứng dụng thực tế](#6-magneticbutton---ứng-dụng-thực-tế)
7. [CSS và Responsive](#7-css-và-responsive)
8. [Cách sử dụng](#8-cách-sử-dụng)
9. [Mở rộng và tùy biến](#9-mở-rộng-và-tùy-biến)

---

## 1. Tổng quan

Custom Cursor System là một hệ thống hoàn chỉnh bao gồm:
- **Cursor Component**: Con trỏ chuột tùy chỉnh với hiệu ứng trailing
- **CursorContext**: Quản lý state toàn cục để các component con có thể điều khiển cursor
- **MagneticButton**: Ví dụ ứng dụng thực tế - button với hiệu ứng "hút từ"

### Đặc điểm nổi bật:
- ✅ Chuyển động mượt mà nhờ **Linear Interpolation (Lerp)**
- ✅ Hiệu năng cao với **requestAnimationFrame**
- ✅ **Context API** để quản lý cursor toàn cục
- ✅ **useCursor hook** để dễ dàng sử dụng trong mọi component
- ✅ Responsive - chỉ hiển thị trên thiết bị có chuột
- ✅ Tích hợp sẵn với **MagneticButton**

---

## 2. Cấu trúc file

```
client/src/
├── App.jsx                                    # Wrap app với CursorProvider
├── contexts/
│   └── CursorContext.jsx                      # Context + Provider + Hook
└── components/common/
    ├── Cursor/
    │   ├── Cursor.jsx                         # Component cursor chính
    │   └── Cursor.module.css                  # Styles cho cursor
    └── MagneticButton/
        ├── MagneticButton.jsx                 # Button với hiệu ứng magnetic
        └── MagneticButton.module.css          # Styles cho button
```

---

## 3. Nguyên lý hoạt động

### 3.1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                           App.jsx                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     CursorProvider                         │  │
│  │  ┌─────────────────┐                                       │  │
│  │  │  Cursor (SVG)   │ ← Render 1 lần duy nhất               │  │
│  │  └─────────────────┘                                       │  │
│  │           ↑                                                │  │
│  │     cursorRef (shared via Context)                         │  │
│  │           ↓                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  Children (Routes, Pages, Components...)             │   │  │
│  │  │  ┌───────────────────┐                               │   │  │
│  │  │  │  MagneticButton   │ → useCursor() → cursorRef     │   │  │
│  │  │  │  .enter()/.leave()│                               │   │  │
│  │  │  └───────────────────┘                               │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Công thức Lerp (Linear Interpolation)

```javascript
lerp(a, b, n) = (1 - n) * a + n * b
```

| Tham số | Ý nghĩa | Ví dụ |
|---------|---------|-------|
| `a` | Vị trí hiện tại của cursor | 100px |
| `b` | Vị trí mục tiêu (vị trí chuột) | 200px |
| `n` | Tốc độ di chuyển (0 → 1) | 0.2 (20%) |
| **Kết quả** | Vị trí mới của cursor | 120px |

**Mỗi frame**, cursor di chuyển 20% khoảng cách còn lại về phía chuột → Tạo hiệu ứng **easing out** tự nhiên!

---

## 4. CursorContext - Quản lý toàn cục

### 4.1. File: `contexts/CursorContext.jsx`

```javascript
import { createContext, useContext, useRef } from 'react';
import Cursor from '../components/common/Cursor/Cursor';

const CursorContext = createContext(null);

export const CursorProvider = ({ children }) => {
    const cursorRef = useRef();

    return (
        <CursorContext.Provider value={cursorRef}>
            <Cursor ref={cursorRef} />
            {children}
        </CursorContext.Provider>
    );
};

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        console.warn('useCursor must be used within CursorProvider');
        return null;
    }
    return context;
};
```

### 4.2. Giải thích

| Thành phần | Mục đích |
|------------|----------|
| `CursorContext` | Context để share `cursorRef` |
| `CursorProvider` | Provider wrap toàn app, render Cursor 1 lần |
| `cursorRef` | Ref trỏ đến Cursor component |
| `useCursor()` | Hook để lấy cursorRef từ bất kỳ đâu |

### 4.3. Tại sao dùng Context?

**Trước đây (không có Context):**
```jsx
// App.jsx - Phải truyền ref và handlers qua nhiều cấp
const cursorRef = useRef();
const handleMouseEnter = () => cursorRef.current?.enter();
const handleMouseLeave = () => cursorRef.current?.leave();

// Phải prop drilling xuống các component con
<Header onEnter={handleMouseEnter} onLeave={handleMouseLeave} />
```

**Bây giờ (có Context):**
```jsx
// Bất kỳ component nào cũng có thể dùng
const cursorRef = useCursor();
cursorRef?.current?.enter();
```

---

## 5. Cursor Component

### 5.1. File: `components/common/Cursor/Cursor.jsx`

#### Imports và Helper Functions

```javascript
import { useEffect, useRef } from 'react';
import { useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import styles from './Cursor.module.css';

const lerp = (a, b, n) => (1 - n) * a + n * b;

const getMousePos = (e) => {
    return { x: e.clientX, y: e.clientY };
};
```

#### Refs - Lưu trữ trạng thái

```javascript
const cursorRef = useRef(null);           // DOM element của SVG
const mouseRef = useRef({ x: 0, y: 0 });  // Vị trí chuột thực tế
const rafIdRef = useRef(null);            // ID của requestAnimationFrame

const renderedStylesRef = useRef({
    tx: { previous: 0, current: 0, amt: 0.2 },      // Translate X
    ty: { previous: 0, current: 0, amt: 0.2 },      // Translate Y
    scale: { previous: 1, current: 1, amt: 0.2 },   // Scale
    opacity: { previous: 1, current: 1, amt: 0.2 }  // Opacity
});
```

#### useImperativeHandle - Expose methods

```javascript
useImperativeHandle(ref, () => ({
    enter: () => {
        renderedStylesRef.current.scale.current = 4;      // Phóng to 4x
        renderedStylesRef.current.opacity.current = 0.2;  // Làm mờ
    },
    leave: () => {
        renderedStylesRef.current.scale.current = 1;      // Về kích thước gốc
        renderedStylesRef.current.opacity.current = 1;    // Rõ nét
    }
}));
```

#### Animation Loop

```javascript
const render = () => {
    const styles = renderedStylesRef.current;

    // 1. Cập nhật vị trí mục tiêu
    styles.tx.current = mouseRef.current.x - bounds.width / 2;
    styles.ty.current = mouseRef.current.y - bounds.height / 2;

    // 2. Lerp tất cả properties
    for (const key in styles) {
        styles[key].previous = lerp(
            styles[key].previous,
            styles[key].current,
            styles[key].amt
        );
    }

    // 3. Áp dụng transform
    cursor.style.transform = `translateX(...) translateY(...) scale(...)`;
    cursor.style.opacity = styles.opacity.previous;

    // 4. Lặp lại mỗi frame
    requestAnimationFrame(render);
};
```

---

## 6. MagneticButton - Ứng dụng thực tế

### 6.1. Tổng quan

MagneticButton là ví dụ thực tế về cách sử dụng `useCursor()` hook. Button này có:
- **Hiệu ứng magnetic**: Button bị "hút" về phía chuột khi chuột đến gần
- **Text animation**: Chữ chạy lên/xuống khi hover
- **Cursor integration**: Tự động gọi `cursor.enter()` / `cursor.leave()`

### 6.2. Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                        MagneticButton                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Tính khoảng cách từ chuột đến tâm button                   │
│      distanceMouseButton = distance(mouse, buttonCenter)        │
│                                                                  │
│   2. Nếu khoảng cách < trigger distance (70% width):            │
│      → Button di chuyển 30% về phía chuột                       │
│      → Text di chuyển ngược lại 18% (parallax effect)           │
│      → Gọi cursorRef.current.enter()                            │
│                                                                  │
│   3. Nếu chuột rời xa:                                          │
│      → Button trở về vị trí gốc                                 │
│      → Gọi cursorRef.current.leave()                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3. Code quan trọng

```javascript
const MagneticButton = ({ children, onClick }) => {
    const cursorRef = useCursor();  // ← Lấy cursorRef từ Context
    
    // ... các refs khác

    const enter = () => {
        cursorRef?.current?.enter();  // ← Trigger cursor animation
        // ... animation cho button
    };

    const leave = () => {
        cursorRef?.current?.leave();  // ← Trigger cursor animation
        // ... animation cho button
    };

    const render = () => {
        const distanceMouseButton = distance(mouse, buttonCenter);
        
        if (distanceMouseButton < triggerDistance) {
            if (!isHover) enter();
            // Di chuyển button về phía chuột
            x = (mouseX - centerX) * 0.3;
            y = (mouseY - centerY) * 0.3;
        } else if (isHover) {
            leave();
        }
        
        // Lerp và apply transform
        button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        text.style.transform = `translate3d(${-x * 0.6}px, ${-y * 0.6}px, 0)`;
    };
};
```

---

## 7. CSS và Responsive

### 7.1. Cursor.module.css

```css
.cursor {
    display: none;
    opacity: 0;
}

@media (any-pointer: fine) {
    .cursor {
        position: fixed;
        top: 0;
        left: 0;
        display: block;
        pointer-events: none;
        z-index: 9999;
    }

    .cursorInner {
        fill: var(--cursor-fill, none);
        stroke: var(--cursor-stroke, #000);
        stroke-width: var(--cursor-stroke-width, 1px);
    }
}
```

### 7.2. `@media (any-pointer: fine)`

| Thiết bị | any-pointer | Cursor hiện? |
|----------|-------------|--------------|
| Desktop với chuột | `fine` | ✅ Có |
| Laptop với trackpad | `fine` | ✅ Có |
| Tablet | `coarse` | ❌ Không |
| Smartphone | `coarse` | ❌ Không |

---

## 8. Cách sử dụng

### 8.1. Setup trong App.jsx

```jsx
import { CursorProvider } from './contexts/CursorContext';

function App() {
    return (
        <CursorProvider>
            <Routes>
                {/* Các routes */}
            </Routes>
        </CursorProvider>
    );
}
```

### 8.2. Sử dụng MagneticButton

```jsx
import MagneticButton from './components/common/MagneticButton/MagneticButton';

function Header() {
    return (
        <header>
            <MagneticButton onClick={() => console.log('Clicked!')}>
                Booking
            </MagneticButton>
        </header>
    );
}
```

### 8.3. Tạo component tùy chỉnh với cursor effect

```jsx
import { useCursor } from '../contexts/CursorContext';

function MyCustomComponent() {
    const cursorRef = useCursor();

    const handleMouseEnter = () => {
        cursorRef?.current?.enter();
    };

    const handleMouseLeave = () => {
        cursorRef?.current?.leave();
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            Hover me!
        </div>
    );
}
```

### 8.4. Tạo custom hook để đơn giản hóa

```jsx
// hooks/useCursorHover.js
import { useCursor } from '../contexts/CursorContext';

export const useCursorHover = () => {
    const cursorRef = useCursor();
    
    return {
        onMouseEnter: () => cursorRef?.current?.enter(),
        onMouseLeave: () => cursorRef?.current?.leave()
    };
};

// Sử dụng
function MyButton() {
    const cursorHover = useCursorHover();
    return <button {...cursorHover}>Click me</button>;
}
```

---

## 9. Mở rộng và tùy biến

### 9.1. Thay đổi tốc độ cursor

```javascript
// Chậm hơn (mượt hơn)
tx: { previous: 0, current: 0, amt: 0.1 }

// Nhanh hơn (responsive hơn)
tx: { previous: 0, current: 0, amt: 0.3 }
```

### 9.2. Thêm hiệu ứng mix-blend-mode

```css
.cursor {
    mix-blend-mode: difference;
}

.cursorInner {
    fill: #fff;
}
```

### 9.3. Thêm method mới cho Cursor

```javascript
useImperativeHandle(ref, () => ({
    enter: () => { /* ... */ },
    leave: () => { /* ... */ },
    // Thêm method mới
    stick: (element) => {
        const rect = element.getBoundingClientRect();
        renderedStylesRef.current.tx.current = rect.left + rect.width / 2;
        renderedStylesRef.current.ty.current = rect.top + rect.height / 2;
    }
}));
```

### 9.4. Customize CSS Variables

```css
:root {
    --cursor-fill: #000;
    --cursor-stroke: #000;
    --cursor-stroke-width: 2px;
    
    /* MagneticButton */
    --button-bg: #d8d4cf;
    --button-text: #000;
    --button-stroke: #d8d4cf;
    --button-stroke-hover: #000;
}
```

---

## Tóm tắt

| Component | Vai trò |
|-----------|---------|
| **CursorContext** | Quản lý cursorRef toàn cục |
| **CursorProvider** | Wrap app, render Cursor 1 lần |
| **useCursor()** | Hook lấy cursorRef |
| **Cursor** | SVG cursor với lerp animation |
| **MagneticButton** | Ví dụ tích hợp cursor |

| Kỹ thuật | Mục đích |
|----------|----------|
| **Lerp** | Chuyển động mượt mà |
| **requestAnimationFrame** | Sync với refresh rate |
| **useRef** | Lưu state không re-render |
| **useImperativeHandle** | Expose methods |
| **Context API** | Share state toàn cục |

---

*Tài liệu được cập nhật ngày 19/12/2024*
