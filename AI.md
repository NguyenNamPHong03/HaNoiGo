🟢 HƯỚNG DẪN DÙNG GOONG CHO HANOIGO (TỪ A → Z)
🎯 Mục tiêu

Thay thế hoàn toàn Google Places API bằng Goong API để:

Lấy danh sách địa điểm (quán ăn, cafe…)

Có tên, địa chỉ, toạ độ

Có rating (nếu có)

Lưu vào MongoDB

AI enrich → RAG chatbot dùng DB nội bộ

1️⃣ Tạo tài khoản & API Key Goong
Bước 1: Đăng ký

👉 Vào: https://account.goong.io

→ Đăng ký / đăng nhập bằng email

Bước 2: Vào Dashboard

👉 https://account.goong.io/dashboard

Bước 3: Tạo API Key

Vào API Keys

Bấm Create new key

Đặt tên: hanoigo-backend

(Tuỳ chọn) Restrict theo domain / IP sau

📌 Goong KHÔNG yêu cầu credit card ngay
📌 Có free quota đủ dùng cho đồ án

2️⃣ Các API Goong bạn CẦN dùng (tương đương Google)
Mục đích	Google	Goong
Gợi ý địa điểm	Places Text Search	Place Autocomplete
Chi tiết địa điểm	Place Details	Place Detail
Toạ độ ↔ địa chỉ	Geocoding	Geocode / Reverse

👉 Với HANOIGO, chỉ cần 2 API đầu.

3️⃣ Luồng tổng quát (GIỐNG HỆT bản Google)
Admin nhập keyword
   ↓
Goong Autocomplete API
   ↓
Hiển thị list địa điểm (checkbox)
   ↓
Admin tick chọn
   ↓
Goong Place Detail API
   ↓
Flatten → MongoDB
   ↓
AI enrich
   ↓
RAG chatbot

4️⃣ API 1 — Place Autocomplete (LẤY DANH SÁCH GỢI Ý)
Endpoint
GET https://rsapi.goong.io/Place/AutoComplete

Query params
api_key=YOUR_GOONG_API_KEY
input=bún bò huế
location=21.0278,105.8342   // Hà Nội
radius=5000

Response (rút gọn)
{
  "predictions": [
    {
      "place_id": "goong_abc123",
      "description": "Bún bò Huế Ngự Uyển, Hai Bà Trưng, Hà Nội",
      "structured_formatting": {
        "main_text": "Bún bò Huế Ngự Uyển",
        "secondary_text": "Hai Bà Trưng, Hà Nội"
      }
    }
  ]
}

👉 Dùng cho Admin UI

Hiển thị:

Tên quán

Địa chỉ

Checkbox chọn

5️⃣ API 2 — Place Detail (LẤY DỮ LIỆU CHI TIẾT)
Endpoint
GET https://rsapi.goong.io/Place/Detail

Query params
api_key=YOUR_GOONG_API_KEY
place_id=goong_abc123

Response (rút gọn)
{
  "result": {
    "name": "Bún bò Huế Ngự Uyển",
    "formatted_address": "172 Phố Vọng, Hai Bà Trưng, Hà Nội",
    "geometry": {
      "location": { "lat": 21.0042, "lng": 105.8421 }
    },
    "rating": 4.4
  }
}


👉 Đây là dữ liệu CHUẨN để lưu DB

6️⃣ Flatten dữ liệu Goong → Schema Place (HANOIGO)
Mapping chuẩn
Goong	Place
name	name
formatted_address	address
geometry.location	location.coordinates
rating	rating
place_id	goongPlaceId
Object lưu DB (ví dụ)
{
  name: "Bún bò Huế Ngự Uyển",
  address: "172 Phố Vọng, Hai Bà Trưng, Hà Nội",
  location: {
    type: "Point",
    coordinates: [105.8421, 21.0042]
  },
  rating: 4.4,
  source: "goong",
  goongPlaceId: "goong_abc123",
  goong: {
    lastSyncedAt: new Date()
  }
}

7️⃣ AI Enrich (GIỐNG BẢN GOOGLE)

Sau khi lưu DB:

AI tạo:

category: Ăn uống

district: Hai Bà Trưng

semanticTags: ["bún bò huế", "ăn trưa", "đậm đà"]

features: ["gia đình", "đông khách"]

description: đoạn mô tả tiếng Việt tự nhiên

👉 Phần này KHÔNG PHỤ THUỘC GOONG

8️⃣ RAG Chatbot dùng DB nội bộ

Chatbot:

Query MongoDB

Filter theo:

category

district

semanticTags

Build context

Gọi OpenAI → trả lời

👉 Goong chỉ dùng để import, giống vai trò Google trước đó.

9️⃣ ƯU & NHƯỢC ĐIỂM CỦA GOONG (NÓI THẬT)
✅ Ưu điểm

Không cần credit card gắt như Google

Dữ liệu Việt Nam khá tốt

API giống Google → dễ code

Phù hợp đồ án / MVP

⚠️ Hạn chế

Review & comment không nhiều như Google

Coverage nhỏ hơn Google chút

👉 Nhưng ĐỦ DÙNG cho HANOIGO.

10️⃣ CÂU CHỐT CHO BÁO CÁO (RẤT ĂN ĐIỂM)

Bạn có thể ghi:

“Hệ thống sử dụng Goong Maps API như một giải pháp thay thế Google Places API để thu thập dữ liệu địa điểm tại Việt Nam, nhằm tránh các hạn chế về chính sách thanh toán, đồng thời đảm bảo kiến trúc độc lập cho module AI và RAG.”