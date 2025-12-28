Google Places API thuộc nền tảng Google Maps Platform.

1. Text Search (New) - Dùng để "Quét" diện rộng
Đây là dịch vụ chính để bạn lấy dữ liệu thô ban đầu.

Cách hoạt động: Bạn gửi một câu lệnh văn bản (vd: "cafe yên tĩnh Cầu Giấy" hoặc "nhà hàng lẩu Hoàn Kiếm").

Dữ liệu trả về: Một danh sách các địa điểm khớp với mô tả kèm theo Place ID (mã định danh duy nhất), tên, địa chỉ, và xếp hạng cơ bản.

Mẹo tiết kiệm: Sử dụng Field Masking (chỉ yêu cầu các trường cần thiết như id, displayName, formattedAddress) để giảm chi phí API.

2. Place Details (New) - Dùng để "Đào sâu" chi tiết
Sau khi có Place ID từ bước trên, bạn dùng dịch vụ này để lấy toàn bộ thông tin "vàng" cho AI.

Dữ liệu quan trọng: Giờ mở cửa, số điện thoại, ảnh (URL), và đặc biệt là Reviews (Đánh giá của người dùng).

Ứng dụng cho HANOIGO: Bạn lấy khoảng 5-10 review mới nhất của quán. Sau đó, đẩy các review này vào AI (OpenAI) để nó tự động phân tích và gắn các aiTags như #chill, #henho, #vỉahè.

3. Place Photos - Dùng để lấy hình ảnh
Cách hoạt động: Từ thông tin Place Details, bạn sẽ nhận được các photo_reference. Bạn gửi mã này qua dịch vụ Photos để lấy link ảnh hiển thị lên website.

Lưu ý: Ảnh của Google có thể tốn phí hiển thị nếu lượng traffic lớn. Bạn nên tải ảnh về và lưu trữ trên Cloudinary như kế hoạch ban đầu để tối ưu tốc độ load.

🛠 Lộ trình triển khai kỹ thuật (Workflow)
Thiết lập: Lên Google Cloud Console, tạo Project và kích hoạt Places API.

Thu thập (Scripting): Viết một script Node.js chạy định kỳ:

Gọi Text Search để tìm quán mới tại Hà Nội.

Với mỗi quán mới, gọi Place Details để lấy reviews.

Làm giàu (AI Processing): * Gửi text reviews qua OpenAI API.

Nhận về bộ Tag ngữ nghĩa.

Lưu trữ: Đẩy tất cả vào MongoDB.