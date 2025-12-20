# MagneticButton Component - Tài liệu kỹ thuật

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Cấu trúc file](#2-cấu-trúc-file)
3. [Nguyên lý hoạt động](#3-nguyên-lý-hoạt-động)
4. [Giải thích code chi tiết](#4-giải-thích-code-chi-tiết)
5. [Flow hoạt động](#5-flow-hoạt-động)
6. [CSS Styling](#6-css-styling)
7. [Cách sử dụng](#7-cách-sử-dụng)
8. [Mở rộng và tùy biến](#8-mở-rộng-và-tùy-biến)

---

## 1. Tổng quan

MagneticButton là một component React tạo ra nút bấm với **hiệu ứng từ tính (magnetic effect)**. Khi chuột đến gần button, button sẽ bị "hút" về phía con trỏ chuột, tạo cảm giác tương tác sinh động và premium.

### Đặc điểm nổi bật:
- ✅ **Magnetic effect**: Button di chuyển theo hướng chuột khi chuột đến gần
- ✅ **Parallax text**: Text di chuyển ngược hướng với button (tạo hiệu ứng 3D)
- ✅ **Text animation**: Chữ chạy lên/xuống khi hover với GSAP
- ✅ **Cursor integration**: Tự động kích hoạt hiệu ứng cursor khi hover
- ✅ **Lerp smooth motion**: Chuyển động mượt mà với Linear Interpolation
- ✅ **Distance-based trigger**: Kích hoạt khi chuột trong vùng 70% chiều rộng button

---

## 2. Cấu trúc file

```
client/src/components/common/MagneticButton/
├── MagneticButton.jsx           # Component chính
└── MagneticButton.module.css    # CSS Styles
```

### Dependencies:
```javascript
import { useEffect, useRef } from 'react';
import gsap from 'gsap';                              // Animation library
import { useCursor } from '../../../contexts/CursorContext';  // Cursor hook
import styles from './MagneticButton.module.css';
```

---

## 3. Nguyên lý hoạt động

### 3.1. Ý tưởng cốt lõi

```
                    Trigger Zone (70% width)
                    ┌─────────────────────────┐
                    │                         │
                    │    ┌─────────────┐      │
                    │    │   Button    │      │
                    │    │  ──────→    │ ←── Chuột kéo button về phía nó
                    │    └─────────────┘      │
                    │         ●               │ ←── Vị trí chuột
                    │                         │
                    └─────────────────────────┘
```

**Khi chuột vào trigger zone:**
1. Tính khoảng cách từ chuột đến tâm button
2. Button di chuyển 30% khoảng cách về phía chuột
3. Text di chuyển ngược lại 18% (parallax effect)
4. Cursor phóng to và mờ đi

### 3.2. Công thức tính toán

#### Khoảng cách (Distance)

```javascript
const distance = (x1, y1, x2, y2) => {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.hypot(a, b);  // = √(a² + b²)
};
```

#### Trigger Distance

```javascript
distanceToTrigger = buttonWidth * 0.7  // 70% chiều rộng button
```

#### Vị trí mới của button

```javascript
x = (mouseX - buttonCenterX) * 0.3  // Di chuyển 30% khoảng cách
y = (mouseY - buttonCenterY) * 0.3
```

#### Vị trí text (parallax)

```javascript
textX = -x * 0.6  // Di chuyển ngược lại 60% của button movement
textY = -y * 0.6
```

### 3.3. Lerp (Linear Interpolation)

```javascript
const lerp = (a, b, n) => (1 - n) * a + n * b;
```

Tạo chuyển động mượt mà bằng cách di chuyển 10% khoảng cách mỗi frame.

---

## 4. Giải thích code chi tiết

### 4.1. Utility Functions

```javascript
// Linear Interpolation - tạo chuyển động mượt
const lerp = (a, b, n) => (1 - n) * a + n * b;

// Lấy vị trí chuột từ event
const getMousePos = (e) => {
    return { x: e.clientX, y: e.clientY };
};

// Tính khoảng cách giữa 2 điểm (Pythagorean theorem)
const distance = (x1, y1, x2, y2) => {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.hypot(a, b);  // Math.hypot tối ưu hơn Math.sqrt(a*a + b*b)
};
```

### 4.2. Component Props

```javascript
const MagneticButton = ({ children, onClick }) => {
    // children: Nội dung bên trong button (text, icon, etc.)
    // onClick: Callback khi click
```

### 4.3. Refs

```javascript
const cursorRef = useCursor();          // Ref đến custom cursor (từ Context)
const buttonRef = useRef(null);         // Ref đến button element
const textRef = useRef(null);           // Ref đến text wrapper
const textInnerRef = useRef(null);      // Ref đến text content (cho animation)

const mouseRef = useRef({ x: 0, y: 0 });        // Vị trí chuột hiện tại
const rectRef = useRef(null);                   // Bounding rect của button
const distanceToTriggerRef = useRef(0);         // Khoảng cách trigger
const isHoverRef = useRef(false);               // Trạng thái hover

const renderedStylesRef = useRef({
    tx: { previous: 0, current: 0, amt: 0.1 },  // Translate X
    ty: { previous: 0, current: 0, amt: 0.1 }   // Translate Y
});

const rafIdRef = useRef(null);  // requestAnimationFrame ID
```

### 4.4. Hàm calculateSizePosition

```javascript
const calculateSizePosition = () => {
    rectRef.current = button.getBoundingClientRect();
    distanceToTriggerRef.current = rectRef.current.width * 0.7;
};
```

**Mục đích:**
- Lấy vị trí và kích thước của button
- Tính trigger distance = 70% chiều rộng button
- Được gọi khi mount và khi resize window

### 4.5. Hàm enter() - Khi chuột vào trigger zone

```javascript
const enter = () => {
    // 1. Kích hoạt cursor animation
    cursorRef?.current?.enter();

    // 2. Đánh dấu đang hover
    isHoverRef.current = true;
    button.classList.add(styles.buttonHover);

    // 3. Animation text: chạy lên rồi chạy xuống
    gsap.killTweensOf(textInner);
    gsap.timeline()
        .to(textInner, {
            duration: 0.15,
            ease: 'power2.in',
            opacity: 0,
            y: '-20%'           // Chạy lên và mờ đi
        })
        .to(textInner, {
            duration: 0.2,
            ease: 'expo.out',
            opacity: 1,
            y: '0%',
            startAt: { y: '100%' }  // Xuất hiện từ dưới lên
        });
};
```

**Timeline animation:**
```
Step 1: Text hiện tại → chạy lên 20% + opacity 0 (0.15s)
Step 2: Text mới → từ dưới (100%) chạy lên 0% + opacity 1 (0.2s)
```

### 4.6. Hàm leave() - Khi chuột rời trigger zone

```javascript
const leave = () => {
    // 1. Kích hoạt cursor animation
    cursorRef?.current?.leave();

    // 2. Đánh dấu không còn hover
    isHoverRef.current = false;
    button.classList.remove(styles.buttonHover);

    // 3. Animation text: chạy xuống rồi chạy lên
    gsap.killTweensOf(textInner);
    gsap.timeline()
        .to(textInner, {
            duration: 0.15,
            ease: 'power2.in',
            opacity: 0,
            y: '20%'            // Chạy xuống và mờ đi
        })
        .to(textInner, {
            duration: 0.2,
            ease: 'expo.out',
            opacity: 1,
            y: '0%',
            startAt: { y: '-100%' }  // Xuất hiện từ trên xuống
        });
};
```

### 4.7. Hàm render() - Animation loop

```javascript
const render = () => {
    const rect = rectRef.current;
    
    // 1. Tính khoảng cách từ chuột đến tâm button
    const distanceMouseButton = distance(
        mouseRef.current.x + window.scrollX,    // Vị trí chuột (có scroll)
        mouseRef.current.y + window.scrollY,
        rect.left + rect.width / 2,             // Tâm button X
        rect.top + rect.height / 2              // Tâm button Y
    );

    let x = 0;
    let y = 0;

    // 2. Kiểm tra chuột có trong trigger zone không
    if (distanceMouseButton < distanceToTriggerRef.current) {
        // Vào trigger zone
        if (!isHoverRef.current) {
            enter();
        }
        // Tính offset: 30% khoảng cách từ tâm button đến chuột
        x = (mouseRef.current.x + window.scrollX - (rect.left + rect.width / 2)) * 0.3;
        y = (mouseRef.current.y + window.scrollY - (rect.top + rect.height / 2)) * 0.3;
    } else if (isHoverRef.current) {
        // Rời trigger zone
        leave();
    }

    // 3. Cập nhật target position
    const styles = renderedStylesRef.current;
    styles.tx.current = x;
    styles.ty.current = y;

    // 4. Lerp để smooth animation
    for (const key in styles) {
        styles[key].previous = lerp(
            styles[key].previous,
            styles[key].current,
            styles[key].amt    // 0.1 = 10% mỗi frame
        );
    }

    // 5. Apply transform
    button.style.transform = `translate3d(${styles.tx.previous}px, ${styles.ty.previous}px, 0)`;
    text.style.transform = `translate3d(${-styles.tx.previous * 0.6}px, ${-styles.ty.previous * 0.6}px, 0)`;

    // 6. Loop
    rafIdRef.current = requestAnimationFrame(render);
};
```

### 4.8. useEffect - Setup và Cleanup

```javascript
useEffect(() => {
    // ... setup code

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', calculateSizePosition);

    // Start animation loop
    rafIdRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', calculateSizePosition);
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }
    };
}, [cursorRef]);
```

### 4.9. JSX Structure

```jsx
return (
    <button
        ref={buttonRef}
        className={styles.button}
        onClick={onClick}
    >
        <span ref={textRef} className={styles.buttonText}>
            <span ref={textInnerRef} className={styles.buttonTextInner}>
                {children}
            </span>
        </span>
    </button>
);
```

**Cấu trúc 3 lớp:**
```
button (buttonRef)           ← Di chuyển theo magnetic effect
  └── span.buttonText (textRef)      ← Di chuyển parallax ngược lại
        └── span.buttonTextInner (textInnerRef)  ← Animation text lên/xuống
              └── {children}
```

---

## 5. Flow hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│ KHỞI TẠO                                                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Component mount                                               │
│ 2. calculateSizePosition() → lấy rect và trigger distance       │
│ 3. Đăng ký mousemove và resize listeners                        │
│ 4. Bắt đầu render loop                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ANIMATION LOOP (requestAnimationFrame)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Tính khoảng cách chuột → tâm button                   │   │
│   │ 2. if (distance < trigger):                              │   │
│   │    → enter() (nếu chưa hover)                            │   │
│   │    → Tính x, y offset                                    │   │
│   │ 3. else if (đang hover):                                 │   │
│   │    → leave()                                             │   │
│   │ 4. Lerp smooth animation                                 │   │
│   │ 5. Apply transform cho button và text                    │   │
│   │ 6. requestAnimationFrame(render)                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ENTER (khi chuột vào trigger zone)                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. cursorRef.enter() → Cursor phóng to + mờ                     │
│ 2. isHover = true                                               │
│ 3. Add class .buttonHover                                       │
│ 4. GSAP timeline: text chạy lên → xuất hiện từ dưới            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LEAVE (khi chuột rời trigger zone)                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. cursorRef.leave() → Cursor về bình thường                    │
│ 2. isHover = false                                              │
│ 3. Remove class .buttonHover                                    │
│ 4. GSAP timeline: text chạy xuống → xuất hiện từ trên          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. CSS Styling

### 6.1. MagneticButton.module.css

```css
.button {
    cursor: pointer;
    -moz-appearance: none;
    -webkit-appearance: none;
    border-width: var(--button-stroke-width, 1px);
    border-color: var(--button-stroke, #d8d4cf);
    border-style: solid;
    color: var(--button-text, #000);
    background: var(--button-bg, #d8d4cf);
    border-radius: var(--button-border-radius, 7px);
    min-width: 12rem;
    height: 5rem;
    padding: 0;
    margin: 1rem;
    font-family: inherit;
    font-size: 1.5rem;
    overflow: hidden;          /* Quan trọng: ẩn text khi animation */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s ease;
    position: relative;
}

.button:focus,
.buttonHover {
    outline: none;
    border-width: var(--button-stroke-width-hover, 2px);
    border-color: var(--button-stroke-hover, #000);
    color: var(--button-text-hover, #000);
    background: var(--button-bg-hover, #d8d4cf);
}

.buttonText,
.buttonTextInner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}
```

### 6.2. CSS Variables có thể tùy chỉnh

```css
:root {
    /* Default state */
    --button-stroke-width: 1px;
    --button-stroke: #d8d4cf;
    --button-text: #000;
    --button-bg: #d8d4cf;
    --button-border-radius: 7px;
    
    /* Hover state */
    --button-stroke-width-hover: 2px;
    --button-stroke-hover: #000;
    --button-text-hover: #000;
    --button-bg-hover: #d8d4cf;
}
```

---

## 7. Cách sử dụng

### 7.1. Sử dụng cơ bản

```jsx
import MagneticButton from './components/common/MagneticButton/MagneticButton';

function MyComponent() {
    return (
        <MagneticButton onClick={() => console.log('Clicked!')}>
            Click me
        </MagneticButton>
    );
}
```

### 7.2. Với navigation

```jsx
import { useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();
    
    return (
        <MagneticButton onClick={() => navigate('/booking')}>
            Booking
        </MagneticButton>
    );
}
```

### 7.3. Với icon

```jsx
import Icon from '../Icon/Icon';

function Header() {
    return (
        <MagneticButton onClick={handleClick}>
            <Icon width={20} height={20} />
            <span>Book Now</span>
        </MagneticButton>
    );
}
```

---

## 8. Mở rộng và tùy biến

### 8.1. Thay đổi trigger distance

```javascript
// Mặc định: 70% chiều rộng
distanceToTriggerRef.current = rectRef.current.width * 0.7;

// Lớn hơn (trigger từ xa hơn)
distanceToTriggerRef.current = rectRef.current.width * 1.0;

// Nhỏ hơn (phải đến gần hơn)
distanceToTriggerRef.current = rectRef.current.width * 0.5;
```

### 8.2. Thay đổi độ mạnh magnetic effect

```javascript
// Mặc định: 30%
x = (mouseX - centerX) * 0.3;

// Mạnh hơn (button di chuyển nhiều hơn)
x = (mouseX - centerX) * 0.5;

// Nhẹ hơn (button di chuyển ít hơn)
x = (mouseX - centerX) * 0.15;
```

### 8.3. Thay đổi tốc độ lerp

```javascript
// Mặc định: 10% mỗi frame
tx: { previous: 0, current: 0, amt: 0.1 }

// Nhanh hơn (responsive hơn)
tx: { previous: 0, current: 0, amt: 0.2 }

// Chậm hơn (mượt hơn)
tx: { previous: 0, current: 0, amt: 0.05 }
```

### 8.4. Thêm props mới

```jsx
const MagneticButton = ({ 
    children, 
    onClick,
    magnetStrength = 0.3,      // Độ mạnh magnetic
    triggerScale = 0.7,        // Trigger zone scale
    className = ''             // Custom class
}) => {
    // ...
    distanceToTriggerRef.current = rectRef.current.width * triggerScale;
    
    x = (mouseX - centerX) * magnetStrength;
    y = (mouseY - centerY) * magnetStrength;
    // ...
};
```

### 8.5. Variant: Outline button

```css
/* Thêm vào global.css hoặc component riêng */
.buttonOutline {
    --button-bg: transparent;
    --button-bg-hover: transparent;
    --button-stroke: #000;
    --button-stroke-hover: #000;
}
```

```jsx
<MagneticButton className={styles.buttonOutline}>
    Learn More
</MagneticButton>
```

---

## Tóm tắt

| Kỹ thuật | Mục đích |
|----------|----------|
| **Distance calculation** | Xác định khi nào trigger effect |
| **Lerp** | Chuyển động mượt mà |
| **requestAnimationFrame** | Animation loop hiệu năng cao |
| **GSAP Timeline** | Text animation phức tạp |
| **CSS Variables** | Dễ dàng customize |
| **useCursor hook** | Tích hợp với custom cursor |

| Số liệu | Giá trị mặc định |
|---------|------------------|
| Trigger distance | 70% button width |
| Magnetic strength | 30% |
| Text parallax | 60% of button movement |
| Lerp speed | 10% per frame |

---

*Tài liệu được tạo ngày 19/12/2024*
