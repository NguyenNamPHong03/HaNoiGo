---
trigger: always_on
---

# 3. Quy chuẩn Đặt tên (Naming Conventions)

## ⚛️ React Components & Files

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Components** | PascalCase | `PlaceCard`, `ChatWindow`, `SearchBar` |
| **Component files** | PascalCase + `.jsx` | `PlaceCard.jsx`, `ReviewForm.jsx` |
| **Pages** | PascalCase + `Page` | `HomePage.jsx`, `PlaceDetailPage.jsx` |
| **Layouts** | PascalCase + `Layout` | `MainLayout.jsx`, `AdminLayout.jsx` |

---

## 🪝 Hooks & Services

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Custom Hooks** | `use` + PascalCase | `usePlaces.js`, `useChat.js`, `useAuth.js` |
| **Services** | camelCase + `Service` | `placeService.js`, `chatService.js` |
| **API client** | camelCase | `api.js`, `axiosClient.js` |

---

## 📦 Utils & Constants

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Utilities** | camelCase | `formatPrice.js`, `debounce.js`, `validateEmail.js` |
| **Constants** | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_PRICE_RANGE`, `DISTRICTS` |
| **Context** | PascalCase + `Context` | `AuthContext.js`, `ThemeContext.js` |

---

## 🎨 Styling

| Element | Convention | Example |
| :-- | :-- | :-- |
| **CSS Modules** | PascalCase + `.module.css` | `PlaceCard.module.css` |
| **Tailwind classes** | Alphabetical order | `className="flex items-center gap-4 rounded-lg bg-white p-4"` |

---

## 🔤 Variables & Functions

| Element | Convention | Example |
| :-- | :-- | :-- |
| **State variables** | camelCase | `selectedPlace`, `chatHistory`, `isModalOpen` |
| **Boolean variables** | `is`, `has`, `should` prefix | `isLoading`, `hasError`, `shouldRefetch` |
| **Props** | camelCase | `placeData`, `onSubmit`, `isDisabled` |
| **Event handlers** | `handle` + Action | `handleSubmit`, `handlePlaceSelect`, `handleChatSend` |
| **Functions** | Verb + Noun | `fetchPlaces`, `formatCurrency`, `validateInput` |

---

## Examples

```javascript
// ✅ GOOD
const [selectedPlace, setSelectedPlace] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const handlePlaceClick = useCallback((placeId) => { ... }, []);

// ❌ BAD
const [place, setPlace] = useState(null); // Không rõ nghĩa
const [loading, setLoading] = useState(false); // Thiếu 'is'
const clickPlace = (placeId) => { ... }; // Thiếu 'handle'
```
