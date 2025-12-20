# Lenis Smooth Scroll - Tài liệu kỹ thuật

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Cài đặt](#2-cài-đặt)
3. [Cấu trúc file](#3-cấu-trúc-file)
4. [Giải thích code chi tiết](#4-giải-thích-code-chi-tiết)
5. [Cách sử dụng](#5-cách-sử-dụng)
6. [API Reference](#6-api-reference)
7. [Tích hợp GSAP ScrollTrigger](#7-tích-hợp-gsap-scrolltrigger)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Tổng quan

### Lenis là gì?

**Lenis** là thư viện JavaScript tạo hiệu ứng **smooth scrolling** (cuộn mượt) cho website. Thay vì cuộn giật từng bước, Lenis tạo cảm giác cuộn "như lụa" giống các website premium.

### Tại sao dùng Lenis?

| Tính năng | Mô tả |
|-----------|-------|
| **Smooth scroll** | Cuộn mượt mà, không giật |
| **Touch support** | Hỗ trợ cảm ứng trên mobile/tablet |
| **ScrollTrigger compatible** | Tích hợp hoàn hảo với GSAP |
| **Lightweight** | Nhẹ, hiệu năng cao |
| **Customizable** | Dễ dàng tùy chỉnh tốc độ, easing |

### Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                           App.jsx                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     LenisProvider                          │  │
│  │  ┌─────────────────┐                                       │  │
│  │  │  Lenis Instance │ ← Khởi tạo 1 lần, share qua Context   │  │
│  │  └─────────────────┘                                       │  │
│  │           ↑                                                │  │
│  │     lenisRef (shared via Context)                          │  │
│  │           ↓                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  Children (Pages, Components...)                     │   │  │
│  │  │  ┌───────────────────┐  ┌───────────────────┐        │   │  │
│  │  │  │  useLenis()       │  │  useScrollTo()    │        │   │  │
│  │  │  │  → lenisRef       │  │  → scrollTo fn    │        │   │  │
│  │  │  └───────────────────┘  └───────────────────┘        │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cài đặt

### Package đã cài

```bash
npm install lenis
```

### Dependencies

```json
{
  "lenis": "^1.x.x",
  "gsap": "^3.x.x"  // Đã có sẵn trong project
}
```

---

## 3. Cấu trúc file

```
client/src/
├── hooks/
│   └── useLenis.jsx          # Custom hook + Provider
├── App.jsx                    # Wrap với LenisProvider
└── components/
    └── ...                    # Sử dụng useLenis(), useScrollTo()
```

---

## 4. Giải thích code chi tiết

### 4.1. Imports

```javascript
import { useEffect, useRef, createContext, useContext } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
```

| Import | Mục đích |
|--------|----------|
| `Lenis` | Thư viện smooth scroll |
| `gsap` | Animation library |
| `ScrollTrigger` | Plugin cho scroll-based animations |

---

### 4.2. LenisContext

```javascript
const LenisContext = createContext(null);
```

Context để share `lenisRef` cho toàn app.

---

### 4.3. LenisProvider

```javascript
export const LenisProvider = ({ children, options = {} }) => {
    const lenisRef = useRef(null);

    useEffect(() => {
        // 1. Khởi tạo Lenis với options
        const lenis = new Lenis({
            duration: 1.2,                                      // Thời gian cuộn
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  // Easing function
            orientation: 'vertical',                            // Hướng cuộn
            gestureOrientation: 'vertical',                     // Hướng gesture
            smoothWheel: true,                                  // Mượt khi dùng chuột
            wheelMultiplier: 1,                                 // Tốc độ wheel
            touchMultiplier: 2,                                 // Tốc độ touch
            infinite: false,                                    // Cuộn vô hạn
            ...options                                          // Custom options
        });

        lenisRef.current = lenis;

        // 2. Sync với ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // 3. Dùng GSAP ticker cho RAF
        const onTick = (time) => {
            lenis.raf(time * 1000);  // Convert to ms
        };
        gsap.ticker.add(onTick);

        // 4. Disable lag smoothing
        gsap.ticker.lagSmoothing(0);

        // 5. Cleanup
        return () => {
            gsap.ticker.remove(onTick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [options]);

    return (
        <LenisContext.Provider value={lenisRef}>
            {children}
        </LenisContext.Provider>
    );
};
```

#### Giải thích Options:

| Option | Default | Mô tả |
|--------|---------|-------|
| `duration` | 1.2 | Thời gian cuộn (giây) |
| `easing` | Exponential | Hàm easing cho chuyển động |
| `orientation` | 'vertical' | Hướng cuộn chính |
| `smoothWheel` | true | Làm mượt cuộn chuột |
| `wheelMultiplier` | 1 | Nhân tốc độ wheel |
| `touchMultiplier` | 2 | Nhân tốc độ touch |
| `infinite` | false | Cuộn vô hạn (loop) |

#### Tại sao dùng GSAP ticker?

```javascript
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
```

- GSAP ticker sync với `requestAnimationFrame`
- Đảm bảo Lenis và GSAP animations chạy cùng frame rate
- Tránh xung đột giữa smooth scroll và ScrollTrigger

#### Tại sao disable lagSmoothing?

```javascript
gsap.ticker.lagSmoothing(0);
```

- Khi có frame drop, GSAP thường "bù lại" để animation không bị chậm
- Với smooth scroll, điều này gây giật
- Disable để scroll luôn mượt

---

### 4.4. useLenis Hook

```javascript
export const useLenis = () => {
    const context = useContext(LenisContext);
    
    if (!context) {
        console.warn('useLenis must be used within LenisProvider');
        return { current: null };
    }
    
    return context;
};
```

Trả về `lenisRef` để truy cập Lenis instance.

---

### 4.5. useScrollTo Hook

```javascript
export const useScrollTo = () => {
    const lenisRef = useLenis();

    const scrollTo = (target, options = {}) => {
        if (lenisRef?.current) {
            lenisRef.current.scrollTo(target, {
                offset: 0,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                immediate: false,
                lock: false,
                ...options
            });
        }
    };

    return scrollTo;
};
```

Helper hook để scroll đến target dễ dàng.

---

## 5. Cách sử dụng

### 5.1. Setup trong App.jsx

```jsx
import { LenisProvider } from './hooks/useLenis';
import { CursorProvider } from './contexts/CursorContext';

function App() {
    return (
        <LenisProvider>
            <CursorProvider>
                <Routes>
                    {/* ... */}
                </Routes>
            </CursorProvider>
        </LenisProvider>
    );
}
```

### 5.2. Custom options

```jsx
<LenisProvider options={{
    duration: 2.0,           // Chậm hơn
    wheelMultiplier: 0.5,    // Cuộn chậm hơn
    touchMultiplier: 1.5     // Touch nhanh hơn
}}>
    {/* ... */}
</LenisProvider>
```

### 5.3. Scroll đến element

```jsx
import { useScrollTo } from '../hooks/useLenis';

function Navigation() {
    const scrollTo = useScrollTo();

    return (
        <nav>
            {/* Scroll đến element bằng ID */}
            <button onClick={() => scrollTo('#hero')}>Hero</button>
            
            {/* Scroll với offset */}
            <button onClick={() => scrollTo('#about', { offset: -100 })}>
                About
            </button>
            
            {/* Scroll về đầu trang */}
            <button onClick={() => scrollTo(0)}>Top</button>
            
            {/* Scroll tức thì (không animation) */}
            <button onClick={() => scrollTo('#contact', { immediate: true })}>
                Contact
            </button>
        </nav>
    );
}
```

### 5.4. Stop/Start scroll

```jsx
import { useLenis } from '../hooks/useLenis';

function Modal({ isOpen }) {
    const lenisRef = useLenis();

    useEffect(() => {
        if (isOpen) {
            lenisRef.current?.stop();   // Dừng scroll khi modal mở
        } else {
            lenisRef.current?.start();  // Bật lại khi đóng
        }
    }, [isOpen]);

    return <div className="modal">...</div>;
}
```

### 5.5. Lắng nghe sự kiện scroll

```jsx
import { useLenis } from '../hooks/useLenis';
import { useEffect } from 'react';

function ScrollProgress() {
    const lenisRef = useLenis();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const lenis = lenisRef.current;
        if (!lenis) return;

        const handleScroll = ({ scroll, limit, velocity, direction, progress }) => {
            setProgress(progress);  // 0 → 1
        };

        lenis.on('scroll', handleScroll);

        return () => {
            lenis.off('scroll', handleScroll);
        };
    }, [lenisRef]);

    return <div style={{ width: `${progress * 100}%` }} className="progress-bar" />;
}
```

---

## 6. API Reference

### 6.1. LenisProvider Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `children` | ReactNode | required | Children components |
| `options` | Object | {} | Lenis options (override defaults) |

### 6.2. Lenis Instance Methods

| Method | Mô tả |
|--------|-------|
| `lenis.scrollTo(target, options)` | Scroll đến target |
| `lenis.stop()` | Dừng smooth scroll |
| `lenis.start()` | Bật lại smooth scroll |
| `lenis.destroy()` | Hủy Lenis instance |
| `lenis.on(event, callback)` | Lắng nghe sự kiện |
| `lenis.off(event, callback)` | Hủy lắng nghe |

### 6.3. scrollTo Options

| Option | Type | Default | Mô tả |
|--------|------|---------|-------|
| `offset` | number | 0 | Offset từ target (px) |
| `duration` | number | 1.2 | Thời gian animation (s) |
| `easing` | function | exponential | Easing function |
| `immediate` | boolean | false | Scroll tức thì (không animation) |
| `lock` | boolean | false | Khóa scroll trong khi đang scroll |

### 6.4. Scroll Event Properties

```javascript
lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
    // scroll: Vị trí hiện tại (px)
    // limit: Giới hạn scroll (document height - viewport height)
    // velocity: Tốc độ scroll
    // direction: 1 (xuống) hoặc -1 (lên)
    // progress: 0 → 1
});
```

---

## 7. Tích hợp GSAP ScrollTrigger

### 7.1. Parallax Effect

```jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function ParallaxSection() {
    const sectionRef = useRef(null);
    const layer1Ref = useRef(null);
    const layer2Ref = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0  // 0 = không delay, sync với scroll
            }
        });

        tl.to(layer1Ref.current, { yPercent: 70, ease: 'none' })
          .to(layer2Ref.current, { yPercent: 40, ease: 'none' }, '<');

        return () => {
            tl.kill();
        };
    }, []);

    return (
        <section ref={sectionRef}>
            <img ref={layer1Ref} src="layer1.webp" />
            <img ref={layer2Ref} src="layer2.webp" />
        </section>
    );
}
```

### 7.2. Fade In On Scroll

```jsx
useEffect(() => {
    gsap.from('.fade-in', {
        opacity: 0,
        y: 50,
        stagger: 0.2,
        scrollTrigger: {
            trigger: '.fade-in-container',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        }
    });
}, []);
```

---

## 8. Troubleshooting

### 8.1. Scroll không mượt

**Nguyên nhân**: Có thể có CSS `overflow: hidden` ở body/html

**Giải pháp**:
```css
html, body {
    overflow-x: hidden;  /* OK */
    /* KHÔNG dùng overflow: hidden */
}
```

### 8.2. ScrollTrigger không hoạt động

**Nguyên nhân**: ScrollTrigger chưa sync với Lenis

**Giải pháp**: Đảm bảo đã có:
```javascript
lenis.on('scroll', ScrollTrigger.update);
```

### 8.3. Mobile không smooth

**Nguyên nhân**: Touch events có thể bị chặn

**Giải pháp**:
```javascript
// Trong options
touchMultiplier: 2,
gestureOrientation: 'vertical'
```

### 8.4. Fixed elements bị giật

**Nguyên nhân**: `position: fixed` cần z-index cao

**Giải pháp**:
```css
.fixed-element {
    position: fixed;
    z-index: 9999;
    will-change: transform;
}
```

---

## Tóm tắt

| Component | Mục đích |
|-----------|----------|
| `LenisProvider` | Khởi tạo và share Lenis instance |
| `useLenis()` | Truy cập Lenis instance |
| `useScrollTo()` | Scroll programmatically |

| Tích hợp | Status |
|----------|--------|
| GSAP ScrollTrigger | ✅ Tự động sync |
| Touch/Mobile | ✅ Hỗ trợ |
| Custom Cursor | ✅ Tương thích |

---

*Tài liệu được tạo ngày 19/12/2024*
