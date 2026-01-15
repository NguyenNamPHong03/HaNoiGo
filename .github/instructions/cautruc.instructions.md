🔹 Tổng quan Dự án HANOIGO

HANOIGO là một nền tảng web hỗ trợ tìm kiếm và khám phá địa điểm ăn uống, vui chơi tại Hà Nội, hướng đến người dùng trẻ có nhu cầu trải nghiệm theo cách cá nhân hóa và linh hoạt.

🎯 Vấn đề đặt ra

Các nền tảng hiện tại chủ yếu dựa vào bộ lọc tĩnh, khiến người dùng:

Mất nhiều thời gian tìm kiếm

Khó diễn đạt nhu cầu theo ngữ cảnh (tâm trạng, mục đích, ngân sách)

Nhận gợi ý chưa đủ “đúng gu”

💡 Giải pháp của HANOIGO

HANOIGO kết hợp tìm kiếm truyền thống và AI Chatbot thông minh (RAG), cho phép:

Tìm địa điểm bằng ngôn ngữ tự nhiên

Gợi ý dựa trên sở thích cá nhân + ngữ cảnh truy vấn

Liên tục cải thiện chất lượng gợi ý nhờ vòng lặp phản hồi từ người dùng

⚙️ Kiến trúc & Công nghệ

MERN Stack: MongoDB, Express.js, React, Node.js

AI Chatbot: OpenAI API + Retrieval-Augmented Generation (RAG)

Database NoSQL (MongoDB): linh hoạt, phù hợp dữ liệu ngữ nghĩa

Cloud Storage: Cloudinary

Authentication: JWT

👥 Đối tượng sử dụng

Người dùng (End-User):

Tìm kiếm địa điểm thủ công hoặc qua AI Chatbot

Xem chi tiết địa điểm, đánh giá, phản hồi chatbot

Quản trị viên (Admin):

Quản lý địa điểm, người dùng

Gắn thẻ ngữ nghĩa (semantic tags)

Cấu hình & huấn luyện AI (prompt, few-shot, feedback)

🧠 Điểm nổi bật của HANOIGO

AI hiểu ngữ cảnh, không chỉ lọc dữ liệu

Semantic Enrichment giúp AI “hiểu” địa điểm (mood, không gian, mức độ phù hợp)

Feedback Loop giúp hệ thống ngày càng thông minh

Admin có thể huấn luyện AI không cần code

✅ Kết luận ngắn

HANOIGO là một hệ thống kết hợp giữa:

Web Application + Cơ sở dữ liệu ngữ nghĩa + AI Chatbot cá nhân hóa

Giải pháp này giúp:

Giảm thời gian tìm kiếm

Tăng độ chính xác gợi ý

Dễ mở rộng và cải tiến trong tương lai
1) Collection: users (Người dùng)

Mục đích: lưu tài khoản người dùng và hồ sơ sở thích để cá nhân hóa gợi ý.

Fields tiêu biểu:

_id: ObjectId

role: user

email: string (unique)
avatarUrl: String, // ← URL Cloudinary

password: string (đã hash)

displayName: string

avatarUrl: string

createdAt: date

isBanned: boolean

Preferences (cực quan trọng cho AI):

preferences: object

favoriteFoods: [string] (vd: “lẩu”, “nướng”, “cafe”)

styles: [string] (vd: “yên tĩnh”, “sang trọng”, “vintage”)

dietary: [string] (vd: “vegetarian”, “eat-clean”, “không cay”)

2) Collection: admins (Quản trị viên)

Mục đích: quản lý hệ thống + dữ liệu + cấu hình/huấn luyện AI.

Fields tiêu biểu:

_id: ObjectId

role: admin

username: string (unique)

password: string (đã hash)

displayName: string

role: string (vd: “superAdmin”, “editor”)

permissions: [string] (vd: “places.create”, “places.update”, “ai.tune”)

lastLogin: date

3) Collection: places (Địa điểm)

Mục đích: “kho kiến thức trung tâm” cho hệ thống search + RAG chatbot.

Fields tiêu biểu:

_id: ObjectId

name: string

address: string

district: string (khuyến nghị thêm để lọc theo quận/huyện)

category: string (“Ăn uống” / “Vui chơi” / …)

description: string

priceRange: object

min: number

max: number

images: [string] (URL Cloudinary)

menu: [object] (tuỳ mô hình, ví dụ: {name, price})

AI Semantic Tags (làm giàu ngữ nghĩa):

aiTags: object

space: [string] (vd: “ấm cúng”, “ngoài trời”)

mood: [string] (vd: “lãng mạn”, “chill”, “sôi động”)

suitability: [string] (vd: “hẹn hò”, “học bài”, “tụ tập”)

(có thể mở rộng thêm: “crowdLevel”, “music”, “view”...)

4) Collection: reviews (Đánh giá)

Mục đích: tạo cộng đồng review + là dữ liệu feedback giúp AI cải thiện.

Fields tiêu biểu:

_id: ObjectId

userId: ObjectId (ref users._id)

placeId: ObjectId (ref places._id)

rating: number (1–5)

comment: string

createdAt: date

Gợi ý mở rộng (nếu muốn mạnh hơn):

images: [string] (ảnh review)

tags: [string] (vd: “đồ ngon”, “phục vụ tốt”, “giá cao”)