
import { filterAndSortPlaces } from '../services/ai/utils/reorderUtils.js';

const mockPlaces = [
    { name: "Quán Phở Cồ Đạt" },
    { name: "Highlands Coffee The Light Hà Nội" },
    { name: "Lăng Chủ tịch Hồ Chí Minh" },
    { name: "Bún chả, bún đậu mẹt cô Hằng Béo" },
    { name: "Nhà hàng HP3 Buffet Lẩu" },
    { name: "Văn Miếu – Quốc Tử Giám" }, // Note the dash
    { name: "Công Viên Starlake Tây Hồ Tây" }
];

const mockAnswer = `
Dạ em tìm được lịch trình 1 ngày khám phá Hà Nội cho bạn với 8 hoạt động thú vị và đầy đủ, giúp bạn trải nghiệm ẩm thực và văn hóa đặc sắc của Thủ đô nhé!

**1. 08:00 - Ăn phở**
Bắt đầu ngày mới với bát phở nóng hổi đặc trưng của Hà Nội tại **Quán Phở Cồ Đạt**. Bát phở truyền thống đậm đà hương vị sẽ giúp bạn có năng lượng cho cả ngày dài khám phá.

**2. 09:30 - Uống cafe**
Thưởng thức cà phê và thư giãn tại **Highlands Coffee The Light Hà Nội** để chuẩn bị cho hành trình khám phá tiếp theo.

**3. 10:30 - Tham quan Lăng Bác Hồ Chí Minh**
Ghé thăm **Lăng Chủ tịch Hồ Chí Minh** để tìm hiểu về lịch sử và văn hóa Việt Nam, nơi ghi dấu những trang sử hào hùng của dân tộc.

**4. 12:00 - Ăn trưa bún chả**
Thưởng thức món ăn đặc sản bún chả nổi tiếng tại **Bún chả, bún đậu mẹt cô Hằng Béo**, món ăn mà cả Tổng thống Obama cũng từng thưởng thức khi đến Hà Nội.

**5. 14:00 - Văn Miếu Quốc Tử Giám**
Khám phá ngôi đền văn hóa đầu tiên của Việt Nam tại **Văn Miếu – Quốc Tử Giám**, nơi lưu giữ nét kiến trúc cổ kính và giá trị văn hóa nghìn năm.

**6. 16:00 - Dạo chơi Hồ Tây**
Ngắm hoàng hôn và thư giãn tại **Công Viên Starlake Tây Hồ Tây**, hồ nước rộng lớn nhất Hà Nội với không khí trong lành và phong cảnh thơ mộng.

**7. 18:30 - Ăn tối lẩu**
Thưởng thức bữa tối với lẩu thơm ngon tại **Nhà hàng HP3 Buffet Lẩu**, thực đơn đa dạng với không khí ấm cúng bên bạn bè.
`;

console.log("Testing filterAndSortPlaces...");
const result = filterAndSortPlaces(mockPlaces, mockAnswer);

console.log("\nmatched results:");
result.forEach(p => console.log(`- ${p.name}`));

const missing = mockPlaces.filter(p => !result.find(r => r.name === p.name));
console.log("\nMissing:", missing.map(p => p.name));
