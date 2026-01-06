# 📥 Import Data Feature

## Tổng quan

Feature **Import Data** cho phép Admin tự động import địa điểm từ Goong Maps API vào MongoDB thay vì nhập thủ công.

## Cấu trúc

```
features/imports/
├── api/
│   └── goongImport.api.ts         # API functions
├── components/
│   ├── GoongImportForm.tsx        # Search form
│   ├── PredictionsTable.tsx       # Checkbox table
│   ├── ImportSummary.tsx          # Result summary
│   └── ImportStatsCard.tsx        # Database stats
├── hooks/
│   └── useGoongImport.ts          # React Query hooks
├── pages/
│   └── GoongImportPage.tsx        # Main page
├── types/
│   └── goongImport.types.ts       # TypeScript types
├── index.ts                       # Exports
└── README.md                      # Docs này
```

## Workflow

1. **Admin nhập keyword** (ví dụ: "cafe học bài")
2. **System gọi Goong Autocomplete** → trả về gợi ý
3. **Admin tick chọn** địa điểm muốn import
4. **Click Import** → Backend fetch chi tiết từ Goong
5. **Upsert vào MongoDB** (update nếu đã tồn tại, create nếu chưa)
6. **Hiển thị kết quả**: imported / updated / skipped / errors

## Components

### GoongImportForm
- Input: keyword, location (lat,lng), radius
- Submit → trigger autocomplete API
- Loading state với spinner

### PredictionsTable
- Checkbox list kết quả từ Goong
- Select all / deselect all
- Hiển thị: name, address, placeId

### ImportSummary
- Stats: total, imported, updated, skipped, errors
- Success list: địa điểm đã import
- Error list: chi tiết lỗi (nếu có)

### ImportStatsCard
- Thống kê database real-time:
  - Total places
  - From Goong
  - Manual
  - Needs AI enrich
  - Enriched

## API Hooks

### useGoongAutocomplete()
```typescript
const autocomplete = useGoongAutocomplete();

autocomplete.mutate({
  input: 'cafe',
  location: '21.0278,105.8342',
  radius: 5000
});
```

### useGoongImportSelected()
```typescript
const importSelected = useGoongImportSelected();

importSelected.mutate({
  placeIds: ['goong_abc123', 'goong_def456']
});
```

### useGoongImportStats()
```typescript
const { data, isLoading } = useGoongImportStats();
// Auto-refetch stats
```

## Backend Integration

**Base URL:** `/admin/import`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/goong/autocomplete` | GET | Gợi ý địa điểm |
| `/goong` | POST | Import places |
| `/stats` | GET | Database stats |
| `/goong/validate-api-key` | GET | Check API key |

## Usage

Trong navigation, click tab **"Import Data"** → `/import`

Flow:
1. Nhập keyword → Search
2. Chọn places → Import
3. Xem kết quả → Stats update

## Error Handling

- **Autocomplete fail**: Hiển thị red alert + troubleshooting tips
- **Import fail**: Hiển thị errors array
- **API key invalid**: Show warning badge

## Future Enhancements

- [ ] Google Places import (tab thứ 2)
- [ ] Excel/CSV upload (tab thứ 3)
- [ ] Bulk operations
- [ ] Schedule auto-sync
- [ ] Advanced filters

## Testing

```bash
cd admin
npm run dev
# Navigate to http://localhost:5174/import
```

**Prerequisites:**
- Backend server running on http://localhost:5000
- Goong API key configured
- Admin authenticated

---

**Created:** 06/01/2026  
**Status:** ✅ Production Ready
