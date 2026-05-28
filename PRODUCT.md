# Product

## Register

product

## Users

Ba nhóm người dùng với ngữ cảnh sử dụng khác nhau:

**Khách hàng (USER):** Người Việt muốn đặt tour trong nước hoặc quốc tế ngắn ngày, đặt phòng khách sạn và bàn nhà hàng trọn gói trong một lần. Họ quen đặt qua Zalo/điện thoại và đang chuyển sang online lần đầu, nên cần flow đặt dịch vụ thật rõ ràng, ít bước, không gây nhầm lẫn. Công việc chính: tìm kiếm, lọc, xem chi tiết, đặt và theo dõi đơn.

**Nhân viên/Hướng dẫn viên (STAFF):** Người được Admin phân công dẫn tour. Họ cần xem lịch, danh sách hành khách, cập nhật trạng thái tour và báo cáo sự cố nhanh, thường từ điện thoại trong lúc di chuyển. Workflow ngắn, tập trung vào hành động tức thì.

**Quản trị viên (ADMIN):** Người vận hành toàn bộ hệ thống, ngồi ở văn phòng trên màn hình lớn. Cần quản lý tour/khách sạn/nhà hàng, xử lý đơn hàng, xem thống kê doanh thu, xuất báo cáo PDF/Excel. Ưu tiên hiệu quả và kiểm soát toàn diện.

## Product Purpose

Số hóa toàn bộ quy trình vận hành của công ty du lịch vừa và nhỏ tại Việt Nam, thay thế Excel/Zalo/sổ tay bằng một nền tảng tập trung. Khách hàng tự tìm và đặt dịch vụ trọn gói (tour + phòng + bàn) và thanh toán qua VNPay mà không cần gọi điện. Staff xem lịch và cập nhật tiến độ trực tiếp trên app. Admin kiểm soát toàn bộ từ dashboard, không còn tổng hợp thủ công cuối tháng.

Thành công trông như thế nào: giảm thời gian xử lý đơn thủ công, loại bỏ overbooking, khách hàng tự phục vụ được 80% nhu cầu mà không cần liên hệ nhân viên.

## Brand Personality

Tin cậy, gọn gàng, thuần Việt. Không cứng nhắc như cổng doanh nghiệp, không hào nhoáng như OTA lớn. Cảm giác của một công ty du lịch chuyên nghiệp, am hiểu thị trường nội địa, không cố trông như startup Silicon Valley.

Ba từ: Đáng tin, Rõ ràng, Việt Nam.

## Anti-references

- **iVIVU, Mytour:** Banner giảm giá nhấp nháy, màu sắc lộn xộn, cảm giác chợ online — không phải phong cách này.
- **Generic SaaS (cream + purple gradient):** Giao diện AI-generated không có bản sắc, dùng hero metric template, gradient text — tuyệt đối tránh.
- **SAP Concur, Amadeus:** Giao diện doanh nghiệp nặng nề, xám xịt, không phù hợp với người dùng phổ thông Việt Nam.
- **Clone Booking.com:** Mật độ thông tin quá cao, thiếu cá tính, không phân biệt được với hàng trăm OTA khác.

## Design Principles

1. **Rõ luồng hơn rõ tính năng.** Người dùng cần biết bước tiếp theo là gì, không phải danh sách tất cả những gì hệ thống có thể làm. Mỗi màn hình có một hành động chính.

2. **Ba vai trò, ba tốc độ.** Admin cần mật độ thông tin. Staff cần thao tác nhanh trên mobile. Customer cần sự rõ ràng và tin tưởng. Không thiết kế một giao diện cho cả ba.

3. **Việt Nam không phải bản dịch.** Copy, layout và luồng phải phù hợp với thói quen người Việt (đặt qua mobile, quen VNPay, hay so sánh giá). Không dịch pattern của Airbnb rồi đổi ngôn ngữ.

4. **Dữ liệu thật, không placeholder.** Hình ảnh tour, tên địa điểm, giá cả phải hiển thị đúng và đẹp ngay cả khi dữ liệu thô từ backend. Design phải xử lý được tên dài, giá lớn, hình ảnh thiếu.

5. **Tin tưởng trước, chi tiết sau.** Khách hàng quyết định có đặt không trong 10 giây đầu. Thông tin quan trọng nhất (giá, địa điểm, ngày) phải nổi bật; chi tiết điều khoản có thể ẩn đi.

## Accessibility & Inclusion

- Tiêu chuẩn WCAG AA là mức tối thiểu, đặc biệt về contrast ratio (text trên nền màu xanh navy và cam).
- Hỗ trợ font size lớn hơn mà không vỡ layout (người dùng lớn tuổi).
- Touch target tối thiểu 44x44px trên mobile (Staff dùng nhiều trên điện thoại).
- Giao diện chủ yếu tiếng Việt; i18n chưa cần trong phiên bản này.
