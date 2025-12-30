Dưới đây là “hướng làm từ đầu” theo đúng ý tưởng bạn thích: Admin nhập keyword → lấy gợi ý từ Google → tick chọn → lưu vào DB riêng → AI chuẩn hoá/tạo tags/mô tả → RAG chatbot dùng DB đó. Mình viết theo kiểu roadmap + kiến trúc + luồng API để bạn triển khai luôn.

0) Mục tiêu

Không nhập tay địa điểm nữa.

Admin chỉ “import” nhanh từ Google.

Dữ liệu được lưu trong MongoDB của HaNoiGo.

AI giúp chuẩn hoá (category/district/tags/description).

Chatbot RAG đọc DB của bạn để trả lời.

1) Chuẩn bị (Google Places API)
1.1 Tạo API key

Google Cloud Console → Enable Places API (bản New hoặc cũ đều được).

Tạo API key và restrict:

Application restriction: server-side (nếu có thể)

API restriction: chỉ Places API

1.2 Thêm env backend
GOOGLE_PLACES_API_KEY=xxx

2) Thiết kế dữ liệu trong MongoDB (rất quan trọng)

Trong Place schema bạn thêm các field “nguồn Google” để về sau refresh/đồng bộ:

source: { type: String, enum: ["manual", "google"], default: "manual" },
googlePlaceId: { type: String, index: true },
google: {
  types: [String],
  rating: Number,
  userRatingsTotal: Number,
  photoRefs: [String],
  lastSyncedAt: Date
}


Còn các field “dữ liệu của bạn” (AI generate) lưu bình thường:

category, district

semanticTags

features

description

Ý hay: dữ liệu Google chỉ là “tham khảo/refresh”, còn mô tả/tags là “tài sản của HaNoiGo”.

3) Luồng Admin “Import từ Google” (UI)
3.1 Nút/Tab mới trong Admin: Import từ Google

Form nhập:

Keyword: “bún bò huế”, “cafe view đẹp”

Quận/huyện (optional)

Bán kính (radius)

Tọa độ trung tâm (lat/lng) (có thể preset Hà Nội)

3.2 Khi bấm “Tìm”

Admin gọi backend:

Backend gọi Google Places → trả về danh sách gợi ý (10–20 item)

UI hiển thị list + checkbox:

Tên

Địa chỉ

Rating (nếu có)

Ảnh preview (nếu có)

3.3 Admin tick chọn → bấm “Import”

gửi list placeIds đã chọn lên backend

backend lấy Place Details từng cái rồi map sang schema Place và lưu DB

3.4 Sau import: bấm “AI chuẩn hoá”

backend chạy AI để:

gán category nội bộ (Ăn uống/Vui chơi…)

tách district từ address

tạo semanticTags/features/description

update lại DB

4) Backend API cần có (rõ ràng, dễ code)
4.1 Search gợi ý từ Google

GET /api/admin/google-places/search?query=...&lat=...&lng=...&radius=...

Backend:

gọi Places Text Search / Nearby Search

trả về list:

place_id

name

formatted_address

rating, user_ratings_total

photo_reference (1 cái để preview)

location

4.2 Lấy chi tiết 1 place (optional)

GET /api/admin/google-places/details/:placeId

4.3 Import vào DB

POST /api/admin/google-places/import
Body:

{ "placeIds": ["...","..."] }


Backend:

với mỗi placeId → gọi details

map sang schema Place

nếu đã tồn tại googlePlaceId thì skip/update (tránh trùng)

lưu vào MongoDB

4.4 AI enrich (chuẩn hoá)

POST /api/admin/places/:id/ai-enrich
hoặc batch:
POST /api/admin/places/ai-enrich
Body: { placeIds: [...] }

5) Mapping dữ liệu từ Google → schema Place của bạn

Google trả:

name → Place.name

formatted_address → Place.address

geometry.location → Place.location.coordinates = [lng, lat]

types → google.types

rating/user_ratings_total → google.rating, google.userRatingsTotal

photos.photo_reference → google.photoRefs[]

Còn các field bạn tự tạo:

district: parse từ address (hoặc AI)

category: map từ types + AI

description/features/semanticTags: AI tạo

6) Ảnh: lưu “photo reference” thay vì tải ảnh về

Thay vì download ảnh Google và upload Cloudinary (rủi ro chính sách), bạn có thể:

lưu photo_reference

khi hiển thị ảnh: gọi endpoint Google photo (server proxy hoặc client render)

Bạn cũng có thể chỉ dùng ảnh do user/admin upload để “sạch” 100%.

7) RAG Chatbot dùng DB của bạn (đúng ý bạn)

Sau khi đã có dữ liệu Places trong MongoDB:

User hỏi → backend query Places theo:

district/category

text search name/description

semanticTags/features

lấy top N places → build context → gọi OpenAI → trả lời
=> Chatbot không phụ thuộc Google nữa (Google chỉ dùng để import/refresh).

8) “Best practice” để hệ thống chạy mượt

Chống trùng: unique index theo googlePlaceId

Batch import: giới hạn 10–20 place / lần để tránh quota

Queue AI enrich: chạy theo batch, có trạng thái “pending/enriched”

Refresh định kỳ (tuỳ): rating/opening hours có thể refresh bằng googlePlaceId

9) Kết quả cuối cùng bạn sẽ có

✅ Admin không nhập tay nữa
✅ Có dữ liệu gốc (tên/địa chỉ/toạ độ) nhanh
✅ AI làm phần “giá trị gia tăng” (tags/mô tả/gợi ý)
✅ RAG chatbot trả lời dựa trên DB nội bộ
✅ Dễ mở rộng: sau này import từ Foody/Tripadvisor (nếu muốn) theo cùng pipeline

Nếu bạn muốn, mình có thể tiếp luôn phần thiết kế UI “Import từ Google” trong admin + code controller Node.js theo đúng cấu trúc server của bạn (routes/controllers/models). Chỉ cần bạn xác nhận 1 ý: bạn muốn Admin chạy app riêng (port 5174) hay muốn gom vào cùng client route /admin?
Luồng đầy đủ: Lấy dữ liệu từ Google Places API → “flatten” → lưu vào MongoDB
Tổng quan

Admin nhập keyword + khu vực

Backend gọi Places Search để lấy danh sách gợi ý (place_id)

Admin tick chọn

Backend gọi Place Details cho từng place_id

Backend flatten dữ liệu về format schema Place của HaNoiGo

Lưu DB (chống trùng)

(Optional) gọi AI để enrich (tags/mô tả/category/district)

1) Bước Search (lấy danh sách gợi ý từ Google)
Input từ Admin

query: keyword (vd: “bún bò huế”, “cafe view đẹp”)

lat, lng: tâm khu vực (vd Hà Nội)

radius: bán kính (vd 2000–5000m)

(optional) type: restaurant, cafe, tourist_attraction…

API Google (2 lựa chọn phổ biến)
A) Text Search (tìm theo câu chữ)

Dùng khi bạn có keyword + có thể kèm quận/huyện: “bún bò huế Hai Bà Trưng”

Trả về list place basic info + place_id

Kết quả cần lấy:

place_id

name

formatted_address

geometry.location (lat/lng)

rating, user_ratings_total

types

photos[0].photo_reference (nếu có)

B) Nearby Search (tìm quanh tọa độ)

Dùng khi bạn muốn quét trong bán kính cố định quanh lat/lng

Thường kết hợp với keyword

Kết quả cần lấy tương tự.

Output trả về cho Admin UI (list gợi ý)

Bạn nên trả về dạng “preview list” như này:

[
  {
    "googlePlaceId": "ChIJ...abc",
    "name": "Bún bò Huế Ngự Uyển",
    "address": "172 Phố Vọng, Hai Bà Trưng, Hà Nội",
    "location": { "lat": 21.0, "lng": 105.8 },
    "rating": 4.4,
    "ratingCount": 1200,
    "types": ["restaurant", "food"],
    "photoRef": "Aap_uE..."
  }
]


✅ Admin chỉ cần cái list này để tick chọn.

2) Bước Details (lấy đầy đủ dữ liệu cho từng place_id)

Khi admin tick chọn xong, backend sẽ gọi Place Details theo place_id.

Thứ bạn cần từ Details (để lưu vào DB)

name

formatted_address

geometry.location (lat/lng)

opening_hours (optional)

international_phone_number / formatted_phone_number

website

types

photos[].photo_reference

rating, user_ratings_total

Output Details “raw” từ Google rất dài → bạn flatten nó.
3) Flatten (chuẩn hoá dữ liệu về schema của HaNoiGo)

Đây là phần “flat” bạn hỏi.

3.1 Quy tắc flatten (mapping)

Giả sử schema Place của bạn:

name ← Google name

address ← formatted_address

location.coordinates ← [lng, lat] (GeoJSON)

contactInfo.phone ← formatted_phone_number (hoặc international)

contactInfo.website ← website

images ← tuỳ: nên lưu photoRefs (khuyến nghị)

category ← map từ types + AI (hoặc rule)

district ← parse từ address (hoặc AI)

semanticTags/features/description ← AI enrich

3.2 Output “flat” chuẩn để lưu DB

Bạn nên tạo object “PlaceCreatePayload” chuẩn như:

{
  "name": "Bún bò Huế Ngự Uyển",
  "address": "172 Phố Vọng, Phương Liệt, Hai Bà Trưng, Hà Nội",
  "district": "Hai Bà Trưng",
  "category": "Ăn uống",
  "description": "Quán bún bò Huế nổi tiếng...",
  "priceRange": { "min": 30000, "max": 80000 },
  "location": { "type": "Point", "coordinates": [105.8421, 21.0042] },
  "images": [],
  "semanticTags": ["bún bò huế", "ăn trưa", "đậm đà"],
  "features": ["gia đình", "đông khách"],
  "source": "google",
  "googlePlaceId": "ChIJ...abc",
  "google": {
    "types": ["restaurant","food"],
    "rating": 4.4,
    "userRatingsTotal": 1200,
    "photoRefs": ["Aap_uE...","Aap_uE..."],
    "lastSyncedAt": "2025-12-30T00:00:00.000Z"
  }
}


Lưu ý: priceRange Google không có → bạn có thể để default hoặc dùng AI gợi ý.

4) Save vào DB (chống trùng & update)

Bạn cần chống trùng bằng googlePlaceId.

Cách làm chuẩn

Nếu chưa có place với googlePlaceId → tạo mới

Nếu đã có → update vài trường + refresh google.lastSyncedAt

Index khuyên dùng:

googlePlaceId unique (khi source = google)

5) Enrich bằng AI (sau khi đã lưu)

Sau khi bạn có “flat place” trong DB, bạn chạy AI để tạo “giá trị gia tăng”.

Input cho AI (gọn thôi)

name, address, types, rating (optional)

maybe menu/description nếu có

Output AI

category nội bộ (“Ăn uống”, “Vui chơi”…)

district (nếu parse chưa chắc)

semanticTags

features

description “đẹp”

6) Ảnh Google: hiển thị sao cho đúng & tiện

Khuyến nghị: không download ảnh Google về Cloudinary.

Lưu photo_reference trong DB

Khi cần hiển thị, bạn build URL ảnh (hoặc proxy qua server)

Ví dụ: GET /api/places/:id/photo?ref=...&maxwidth=800

7) Tóm tắt flow bằng sơ đồ
Admin nhập keyword + lat/lng/radius
        |
        v
Backend: Places Search -> trả preview list (place_id + name + address + photoRef)
        |
        v
Admin tick chọn -> POST import(placeIds)
        |
        v
Backend: với mỗi placeId -> Place Details -> flatten -> upsert DB
        |
        v
(Optional) AI enrich -> update tags/description/category/district
        |
        v
Client/RAG dùng DB nội bộ để search & chat

Bạn muốn mình đi tiếp phần nào?

Mình có thể viết luôn “khung code” theo dự án của bạn:

server/routes/adminGoogleRoutes.js (search/details/import)

controllers/googlePlacesController.js (gọi API + flatten)

utils/placesMapper.js (map raw → flat)

Admin UI: modal “Import từ Google” + checkbox list

Chỉ cần bạn chọn 1: bạn muốn dùng Places API (New) hay Places API cũ?
(Nếu bạn không chắc, mình sẽ chọn Places API (New) và làm theo hướng đó.)