## 📋 MÔ TẢ BÀI TOÁN HANOIGO

### **Bài toán**

Người dùng trẻ tại Hà Nội gặp khó khăn khi tìm địa điểm ăn uống, vui chơi phù hợp vì các nền tảng hiện tại chỉ có bộ lọc tĩnh, không hiểu ngữ cảnh cá nhân như tâm trạng, mục đích hay ngân sách. Việc tìm kiếm mất thời gian và gợi ý thường không đúng gu.

### **Giải pháp**

HANOIGO là nền tảng web tích hợp AI Chatbot thông minh sử dụng công nghệ RAG (Retrieval-Augmented Generation) để người dùng có thể tìm kiếm địa điểm bằng ngôn ngữ tự nhiên, nhận gợi ý cá nhân hóa dựa trên sở thích và ngữ cảnh, đồng thời hệ thống liên tục học hỏi từ phản hồi người dùng.

## 🛠️ CÔNG NGHỆ SỬ DỤNG     

### **Nền tảng chính**

- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **AI Engine**: OpenAI API kết hợp RAG Architecture
- **Database**: MongoDB, Pinecone
- **Cloud Storage**: Cloudinary lưu trữ hình ảnh
- **Bảo mật**: JWT Authentication


### **Kiến trúc AI**

Hệ thống sử dụng RAG để kết hợp semantic search từ database với khả năng sinh ngôn ngữ tự nhiên của LLM, tạo câu trả lời chính xác và có ngữ cảnh.

## 📊 CẤU TRÚC DỮ LIỆU

### **Collection users**

Lưu thông tin tài khoản người dùng bao gồm email, mật khẩu đã mã hóa, ảnh đại diện từ Cloudinary. Đặc biệt quan trọng là phần preferences lưu sở thích về món ăn yêu thích, phong cách không gian và chế độ ăn uống để hệ thống cá nhân hóa gợi ý.

### **Collection admins**

Quản lý tài khoản quản trị viên với phân quyền chi tiết. Admin có thể quản lý địa điểm, gắn semantic tags, và cấu hình/huấn luyện AI mà không cần code thông qua giao diện web.

### **Collection places (RAG Knowledge Base)**

Đây là "bộ não" của hệ thống, lưu thông tin chi tiết địa điểm gồm tên, địa chỉ, quận/huyện, danh mục, mô tả, khoảng giá, hình ảnh và menu. Điểm đặc biệt là aiTags - bộ semantic tags gồm:

- **space**: mô tả không gian vật lý (ấm cúng, ngoài trời, rộng rãi)
- **mood**: cảm xúc/không khí (lãng mạn, chill, sôi động)
- **suitability**: mục đích sử dụng (hẹn hò, học bài, tụ tập nhóm)


### **Collection reviews (Feedback Loop)**

Lưu đánh giá của người dùng gồm rating 1-5 sao, bình luận, ảnh review và các tags mô tả trải nghiệm. Dữ liệu này được sử dụng để cải thiện độ chính xác của AI qua thời gian.

## 🔄 LUỒNG HOẠT ĐỘNG

### **Tìm kiếm truyền thống**

Người dùng dùng bộ lọc thông thường theo danh mục, quận, khoảng giá để xem danh sách địa điểm.

### **AI Chatbot (RAG)**

1. Người dùng nhập câu hỏi tự nhiên tiếng Việt như "Tìm quán cafe yên tĩnh để học bài, giá dưới 100k"
2. Hệ thống phân tích và trích xuất semantic intent: suitability=học bài, mood=yên tĩnh, priceRange=dưới 100k
3. RAG retrieval tìm kiếm trong MongoDB dựa trên semantic tags và preferences của user
4. Kết quả được kết hợp với ngữ cảnh và gửi đến OpenAI API
5. AI sinh câu trả lời tự nhiên kèm danh sách địa điểm phù hợp nhất

### **Feedback Loop**

Sau mỗi gợi ý, người dùng có thể đánh giá mức độ hữu ích. Dữ liệu này được thu thập vào reviews collection để tinh chỉnh thuật toán gợi ý, giúp hệ thống ngày càng thông minh hơn.

## ✨ ĐIỂM NỔI BẬT

**Hybrid Search**: Kết hợp tìm kiếm theo từ khóa cứng (tên địa điểm, địa chỉ) và semantic search (tâm trạng, ngữ cảnh sử dụng) để cho kết quả toàn diện.

**Cá nhân hóa thông minh**: Hệ thống ưu tiên gợi ý địa điểm phù hợp với sở thích cá nhân từ preferences, không chỉ dựa vào query hiện tại.

**Admin-friendly AI Control**: Quản trị viên có thể làm giàu dữ liệu bằng cách gắn semantic tags và điều chỉnh prompt AI qua giao diện web, không cần kiến thức lập trình.

**Học liên tục**: Mỗi review và phản hồi từ người dùng đều giúp cải thiện độ chính xác của gợi ý trong tương lai, tạo vòng lặp cải tiến không ngừng.

