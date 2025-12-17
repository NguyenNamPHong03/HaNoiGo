THÔNG TIN DỰ ÁN: HANOIGO
1. Bối cảnh & Mục tiêu Dự án (Project Context & Objectives)
HANOIGO là một nền tảng web hỗ trợ tìm kiếm địa điểm ẩm thực và vui chơi tại Hà Nội, hướng đến nhóm người dùng trẻ, có nhu cầu khám phá và trải nghiệm theo cách cá nhân hóa.
Dự án được xây dựng nhằm giải quyết vấn đề phổ biến hiện nay:
Người dùng mất nhiều thời gian tìm kiếm địa điểm phù hợp với nhu cầu, tâm trạng và ngân sách, trong khi các nền tảng truyền thống chỉ cung cấp bộ lọc tĩnh.
Mục tiêu chính của dự án:
Cung cấp hệ thống gợi ý địa điểm thông minh, cá nhân hóa.
Ứng dụng AI Chatbot (RAG) để người dùng tìm địa điểm bằng ngôn ngữ tự nhiên.
Xây dựng cơ sở dữ liệu địa điểm được làm giàu ngữ nghĩa (Semantic Enrichment).
Tạo vòng lặp phản hồi để liên tục cải thiện chất lượng AI.
Hỗ trợ Admin quản lý dữ liệu & huấn luyện AI mà không cần can thiệp code.
2. Phân hệ & Luồng hoạt động của Hệ thống
Hệ thống HANOIGO được chia thành hai phân hệ chính, có mối quan hệ tương tác chặt chẽ:
Phân hệ Người dùng (Front-office)
Phân hệ Quản trị & Huấn luyện AI (Back-office)
2.1. Luồng hoạt động Người dùng (User Flow)
Người dùng là đối tượng thụ hưởng dịch vụ và đồng thời cung cấp dữ liệu phản hồi cho hệ thống.
a. Đăng ký & Thiết lập hồ sơ cá nhân
Người dùng đăng ký và đăng nhập hệ thống.
Sau khi đăng nhập, hệ thống yêu cầu người dùng cập nhật Sở thích cá nhân (User Preferences), bao gồm:
Món ăn yêu thích
Phong cách không gian
Chế độ ăn uống
👉 Đây là dữ liệu nền tảng giúp AI cá nhân hóa gợi ý.
b. Khám phá & Tìm kiếm địa điểm
Người dùng có thể:
Duyệt theo danh mục (Ăn uống / Vui chơi)
Duyệt theo khu vực (Quận / Huyện)
Xem các danh sách địa điểm nổi bật
c. Tương tác với Chatbot AI (Tính năng cốt lõi)
Người dùng trò chuyện trực tiếp với Chatbot bằng ngôn ngữ tự nhiên.
Ví dụ:
“Tìm chỗ hẹn hò lãng mạn ở Hoàn Kiếm, giá dưới 500k”
Hệ thống sử dụng RAG (Retrieval-Augmented Generation) để:
Truy xuất địa điểm phù hợp từ cơ sở dữ liệu
Kết hợp với sở thích người dùng
Sinh câu trả lời tự nhiên, chính xác
d. Trải nghiệm & Phản hồi
Sau khi trải nghiệm địa điểm, người dùng:
Viết đánh giá (Review)
Chấm điểm
Đánh giá chất lượng phiên Chatbot
👉 Dữ liệu này được dùng cho Feedback Loop cải thiện AI.
2.2. Luồng Quản trị viên & Huấn luyện AI (Admin Flow)
Admin đóng vai trò quản lý hệ thống và huấn luyện AI.
a. Quản lý dữ liệu cơ bản
Quản lý tài khoản người dùng
Thêm, sửa, xóa địa điểm (Places)
b. Làm giàu dữ liệu (Data Enrichment)
Đây là bước quan trọng nhất để AI hoạt động hiệu quả.
Khi thêm địa điểm, Admin thực hiện:
Gắn thẻ ngữ nghĩa (Semantic Tagging)
Xác định các thuộc tính trừu tượng:
Mood
Không gian
Mức độ phù hợp
👉 Các thẻ này giúp AI hiểu “ngữ cảnh” địa điểm, không chỉ dữ liệu thô.
c. Cấu hình & Huấn luyện AI
System Prompt Tuning: cấu hình tính cách chatbot
Few-Shot Learning: cung cấp các cặp hỏi–đáp mẫu
Feedback Loop: điều chỉnh dữ liệu khi AI trả lời sai hoặc bị Dislike
3. Thiết kế Cơ sở dữ liệu (Database Design)
Hệ thống sử dụng MongoDB (NoSQL) nhằm:
Linh hoạt với dữ liệu phi cấu trúc
Dễ mở rộng
Phù hợp với AI & RAG
3.1. Nhóm Thực thể Người dùng & Quản trị
3.1.1. Collection: admins
Lưu trữ thông tin quản trị viên hệ thống.
Fields chính:
_id
username
password
displayName
role
permissions
lastLogin
3.1.2. Collection: users
Lưu trữ thông tin người dùng cuối.
Fields chính:
_id
email
password
displayName
avatarUrl
createdAt
isBanned
preferences (favoriteFoods, styles, dietary)
3.2. Nhóm Thực thể Nghiệp vụ
3.2.1. Collection: places
Kho kiến thức trung tâm của hệ thống.
Fields chính:
_id
name
address
category
description
priceRange
images
menu
aiTags (space, suitability, mood)
3.2.2. Collection: reviews
Lưu trữ đánh giá từ cộng đồng.
Fields chính:
_id
userId
placeId
rating
comment
createdAt
3.3. Nhóm Thực thể Cấu hình AI & Chatbot
3.3.1. Collection: ai_configs
Dùng để cấu hình System Prompt.
Fields chính:
_id
model
systemInstruction
isActive
3.3.2. Collection: ai_training_examples
Phục vụ Few-Shot Learning.
Fields chính:
_id
inputQuery
outputResponse
category
3.3.3. Collection: chat_sessions
Lưu lịch sử hội thoại và phản hồi người dùng.
Fields chính:
_id
userId
messages
feedback
feedbackReason
4. Kết luận
HANOIGO là hệ thống kết hợp giữa:
Web Application
Cơ sở dữ liệu ngữ nghĩa
AI Chatbot cá nhân hóa
Kiến trúc này cho phép hệ thống:
Không ngừng học hỏi từ người dùng
Cải thiện chất lượng gợi ý
Mở rộng quy mô trong tương lai
Nếu bạn muốn, bước tiếp theo mình có thể:
✍️ Viết Use Case Diagram / Sequence Diagram
🧠 Viết riêng chương AI & RAG cho báo cáo
🧾 Chuẩn hóa sang form luận văn / đồ án tốt nghiệp
👉 Bạn đang dùng tài liệu này cho đồ án môn, đồ án tốt nghiệp, hay proposal dự án?
//////////////////////////////////////////////////////////////////////////////////////////
Thông tin Dự án: HANOIGO
1. Bối cảnh & Mục tiêu Dự án (Project Context & Objectives)
HANOIGO là một nền tảng web hỗ trợ tìm kiếm và khám phá địa điểm ẩm thực, vui chơi tại Hà Nội, hướng đến nhóm người dùng trẻ có nhu cầu trải nghiệm theo cách cá nhân hóa[cite: 1]. Dự án được xây dựng trên kiến trúc MERN Stack (MongoDB, Express.js, React, Node.js) và tối ưu hóa cho khả năng mở rộng và tích hợp AI[cite: 1].
Mục tiêu chính của dự án:
Giải quyết vấn đề tìm kiếm địa điểm ăn uống và vui chơi nhanh chóng, giảm thao tác lọc thủ công và tăng tính chính xác trong gợi ý[cite: 2].
Kết hợp tìm kiếm thủ công (Manual Search) và AI Chatbot (RAG) để đáp ứng đa dạng nhu cầu người dùng[cite: 3].
Ứng dụng AI (Retrieval-Augmented Generation) để cho phép người dùng tìm địa điểm bằng ngôn ngữ tự nhiên, dựa trên dữ liệu thực trong hệ thống[cite: 4].
Xây dựng cơ sở dữ liệu địa điểm được làm giàu ngữ nghĩa (Semantic Enrichment) nhằm giúp AI hiểu sâu về không gian, tâm trạng và mức độ phù hợp của từng địa điểm[cite: 5].
Tạo vòng lặp phản hồi (Feedback Loop) từ đánh giá và lịch sử chat để liên tục cải thiện chất lượng gợi ý của hệ thống[cite: 6].
2. Nhóm Đối tượng sử dụng (User Roles)
Dự án có hai vai trò người dùng chính[cite: 7]:
Người dùng (End-User):[cite: 8]
Truy cập website để tìm kiếm và khám phá địa điểm ẩm thực, vui chơi tại Hà Nội[cite: 9].
Sử dụng tìm kiếm thủ công theo các tiêu chí:
Tìm theo tên địa điểm[cite: 10].
Lọc theo khu vực (Quận/Huyện)[cite: 10].
Lọc theo khoảng giá và danh mục (Ăn uống/Vui chơi)[cite: 11].
Tương tác với AI Chatbot (RAG) để tìm kiếm bằng ngôn ngữ tự nhiên, bổ trợ hoặc thay thế cho các bộ lọc truyền thống (ví dụ: “Tìm quán cafe yên tĩnh ở Cầu Giấy, giá dưới 100k”)[cite: 12].
Xem thông tin chi tiết địa điểm bao gồm mô tả, menu, hình ảnh, khoảng giá và các đặc điểm nổi bật[cite: 13].
Thực hiện đánh giá và phản hồi sau trải nghiệm (chấm điểm, viết review, đánh giá chất lượng câu trả lời của Chatbot)[cite: 14].
Quản trị viên (Administrator):[cite: 15]
Truy cập Bảng điều khiển quản trị (Admin Dashboard) để quản lý toàn bộ dữ liệu hệ thống[cite: 16].
Quản lý danh sách địa điểm (Places): thêm, sửa, xóa, cập nhật thông tin, menu và hình ảnh[cite: 17].
Thực hiện làm giàu dữ liệu (Data Enrichment) bằng cách gắn thẻ ngữ nghĩa (Semantic Tags) cho địa điểm (không gian, tâm trạng, mức độ phù hợp)[cite: 18].
Cấu hình và huấn luyện AI Chatbot thông qua:
System Prompt Tuning.
Few-Shot Learning (các cặp câu hỏi – câu trả lời mẫu)[cite: 19].
Theo dõi lịch sử hội thoại và phản hồi người dùng để điều chỉnh dữ liệu, cải thiện chất lượng gợi ý của AI (Feedback Loop)[cite: 20].
3. Các Tính năng Cốt lõi (Core Features)
A. Tính năng cho Người dùng (End-User Features)
Xác thực: Đăng ký/Đăng nhập bằng Email/Password đã mã hóa (JWT)[cite: 21].
Tìm kiếm thủ công: Tìm theo tên địa điểm, khu vực, danh mục và khoảng giá[cite: 22].
Tìm kiếm bằng AI (RAG Chatbot):
Tìm địa điểm bằng ngôn ngữ tự nhiên[cite: 23].
Gợi ý địa điểm dựa trên sở thích cá nhân và ngữ cảnh truy vấn[cite: 24].
Chi tiết địa điểm: Xem mô tả, menu, hình ảnh, giá và các đặc điểm nổi bật[cite: 25].
Đánh giá & Phản hồi: Viết review, chấm điểm và đánh giá chất lượng chatbot[cite: 26].
B. Tính năng cho Quản trị viên (Admin Features)
Dashboard tổng quan: Thống kê số lượng địa điểm, đánh giá và phản hồi chatbot[cite: 27].
Quản lý dữ liệu (CRUD):
Địa điểm (Places): Quản lý thông tin, menu, hình ảnh và thẻ ngữ nghĩa[cite: 28].
Người dùng: Quản lý trạng thái tài khoản[cite: 29].
Hỗ trợ AI (Admin Assistant):
Cấu hình System Prompt và Few-Shot Learning[cite: 30].
Theo dõi & cải thiện AI: Phân tích lịch sử chat và phản hồi để điều chỉnh dữ liệu huấn luyện[cite: 31].
4. Bối cảnh Kỹ thuật (Technical Context & Stack)
Kiến trúc: MERN Stack[cite: 1].
Frontend: React + Vite, axios, React Query[cite: 21].
Backend: Node.js + Express.js (RESTful API)[cite: 21].
Database: MongoDB Atlas (NoSQL), sử dụng Mongoose Schemas[cite: 21].
Authentication: JWT (JSON Web Tokens)[cite: 21].
Media Storage: Cloudinary (lưu trữ hình ảnh địa điểm)[cite: 21].
AI: OpenAI API + RAG (Retrieval-Augmented Generation)[cite: 32].
Hosting: Vercel/Netlify (Frontend) và Render/Railway (Backend)[cite: 33].
5. Các chuẩn đặt tên (Naming Conventions)
Database (MongoDB):
Collections: plural, lowercase (users, places, reviews)[cite: 34].
Fields: camelCase (priceRange, createdAt)[cite: 35].
Backend (Node.js/Express):
Files (Controllers, Models): PascalCase[cite: 36].
Files (Routes): camelCase[cite: 37].
Frontend (React):
Components: PascalCase[cite: 38].
CSS: CSS Modules[cite: 39].
6. Quy tắc Error Handling (Xử lý lỗi)
Dự án sử dụng middleware xử lý lỗi tập trung của Express[cite: 40].
Trong Controllers (server/controllers/):
Logic nghiệp vụ được bọc trong try...catch.
Khi có lỗi, gọi next(error).
Middleware xử lý lỗi (server/middleware/):
Bắt toàn bộ lỗi được đẩy từ controller.
Trả về phản hồi JSON với HTTP status code phù hợp (400, 401, 404, 500).
✅ Kết luận ngắn cho bạn
Đoạn này rất phù hợp để làm Copilot Context
AI sẽ:
Hiểu rõ manual search + AI search
Không gợi ý sai nghiệp vụ
Fix bug đúng domain HANOIGO
Nếu bạn muốn, bước tiếp theo mình có thể giúp:
✨ Viết Copilot Instruction Prompt riêng (rất mạnh)
🧠 Tách đoạn này thành system context cho Cursor / Copilot Chat
