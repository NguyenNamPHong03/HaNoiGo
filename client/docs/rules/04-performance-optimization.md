# 5. Tối ưu Performance (Optimization)

## 🧠 useMemo - Memoize Expensive Calculations

**✅ KHI NÀO DÙNG:**

1. **Filter/map/reduce array lớn (> 50 items)**
```javascript
const filteredPlaces = useMemo(() => {
  return places.filter(place => {
    const matchDistrict = !filters.district || place.district === filters.district;
    const matchPrice = place.priceRange.max <= filters.maxPrice;
    const matchMood = filters.mood ? place.aiTags.mood.includes(filters.mood) : true;
    return matchDistrict && matchPrice && matchMood;
  });
}, [places, filters.district, filters.maxPrice, filters.mood]);
```

2. **Transform data từ API**
```javascript
const placesByDistrict = useMemo(() => {
  return places.reduce((acc, place) => {
    if (!acc[place.district]) acc[place.district] = [];
    acc[place.district].push(place);
    return acc;
  }, {});
}, [places]);
```

3. **Tính toán phức tạp (> 5ms)**
```javascript
const averageRating = useMemo(() => {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}, [reviews]);
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Tính toán quá đơn giản
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`; // < 0.1ms, không cần memo
}, [firstName, lastName]);

// ❌ BAD: Tạo object nhỏ
const style = useMemo(() => ({ color: 'red' }), []); // Không cần memo
```

---

## 🎯 useCallback - Memoize Functions

**✅ KHI NÀO DÙNG:**

1. **Function được pass xuống child component (tránh re-render)**
```javascript
const PlaceList = ({ places }) => {
  const handlePlaceSelect = useCallback((placeId) => {
    navigate(`/places/${placeId}`);
    trackEvent('place_clicked', { placeId });
  }, [navigate]);

  return places.map(place => (
    <PlaceCard 
      key={place._id}
      place={place}
      onSelect={handlePlaceSelect} // Không tạo function mới mỗi render
    />
  ));
};
```

2. **Function là dependency của useEffect/useMemo**
```javascript
const fetchPlaceDetails = useCallback(async (placeId) => {
  const data = await placeService.getPlaceById(placeId);
  setPlaceData(data);
}, []);

useEffect(() => {
  fetchPlaceDetails(placeId);
}, [placeId, fetchPlaceDetails]); // Không trigger re-fetch vô ích
```

3. **Event handlers trong lists**
```javascript
const handleReviewSubmit = useCallback((reviewData) => {
  submitReview.mutate({ placeId, ...reviewData });
}, [placeId, submitReview]);
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Function chỉ dùng local, không pass xuống
const handleClick = useCallback(() => {
  console.log('clicked'); // Không cần memo
}, []);

// ❌ BAD: Event handler inline đơn giản
<button onClick={useCallback(() => setCount(c => c + 1), [])}>
  // Quá phức tạp cho việc đơn giản
</button>
```

---

## 🛡️ React.memo - Prevent Component Re-renders

**✅ KHI NÀO DÙNG:**

1. **List items (PlaceCard, ReviewCard)**
```javascript
const PlaceCard = React.memo(({ place, onSelect }) => {
  return (
    <div className="place-card" onClick={() => onSelect(place._id)}>
      <img src={place.images[0]} alt={place.name} />
      <h3>{place.name}</h3>
      <p>{formatPrice(place.priceRange.min)}</p>
    </div>
  );
});

PlaceCard.displayName = 'PlaceCard';
```

2. **Pure UI components (Button, Badge, Icon)**
```javascript
const Button = React.memo(({ children, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
});
```

3. **Heavy components (Charts, Maps)**
```javascript
const PlaceMap = React.memo(({ places, center }) => {
  return <MapView places={places} center={center} />;
}, (prevProps, nextProps) => {
  // Custom comparison: chỉ re-render khi places hoặc center thay đổi
  return prevProps.places.length === nextProps.places.length &&
         prevProps.center.lat === nextProps.center.lat;
});
```

**❌ KHI KHÔNG NÊN DÙNG:**

```javascript
// ❌ BAD: Component props thay đổi liên tục
const Counter = React.memo(({ count }) => {
  return <div>{count}</div>; // count thay đổi mỗi giây, memo vô ích
});

// ❌ BAD: Component quá đơn giản
const Text = React.memo(({ children }) => <p>{children}</p>); // Không cần
```

---

## 🚫 Anti-Patterns Phải Tránh

```javascript
// ❌ BAD: Inline object trong props → tạo mới mỗi render
<PlaceCard style={{ margin: 10 }} />

// ✅ GOOD: Hoist ra ngoài
const cardStyle = { margin: 10 };
<PlaceCard style={cardStyle} />

// ❌ BAD: Inline array trong props
<PlaceCard tags={['cafe', 'quiet']} />

// ✅ GOOD: useMemo hoặc constant
const tags = useMemo(() => ['cafe', 'quiet'], []);
<PlaceCard tags={tags} />

// ❌ BAD: Anonymous function trong prop
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: useCallback
const onClick = useCallback(() => handleClick(id), [id]);
<button onClick={onClick}>Click</button>

// ❌ BAD: Nested map/filter trong render
{places.map(p => p.reviews.filter(r => r.rating > 4).map(...))}

// ✅ GOOD: useMemo
const topReviews = useMemo(() => {
  return places.flatMap(p => 
    p.reviews.filter(r => r.rating > 4)
  );
}, [places]);
```

---

## 📊 Optimization Decision Tree

```
Có phải tính toán phức tạp (> 5ms)?
├─ YES → useMemo
└─ NO → Không cần optimize

Function được pass xuống child?
├─ YES → useCallback
└─ NO → Không cần optimize

Component re-render không cần thiết?
├─ YES → React.memo
└─ NO → Không cần optimize
```

---

## 🔍 Profiling & Measurement

**Tools:**

- **React DevTools Profiler**: Record và phân tích render time
- **Chrome DevTools Performance**: Flame chart toàn bộ app
- **Lighthouse**: Check Core Web Vitals

**Metrics mục tiêu:**

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Total Blocking Time (TBT) < 300ms
- Cumulative Layout Shift (CLS) < 0.1

**Khi nào cần optimize:**

1. Component render > 16ms (60 FPS)
2. User interaction bị lag
3. Lighthouse score < 90
