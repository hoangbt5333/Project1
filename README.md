# Student Management

Ứng dụng quản lý sinh viên xây dựng bằng Node.js, Express, EJS, MySQL. Giao diện Tailwind, hỗ trợ nhập/xuất Excel, điểm danh bằng QR.

## Tính năng chính
- Quản lý tài khoản, phân quyền (admin, giảng viên, sinh viên)
- Sinh viên/lớp/khoa/môn học: thêm/sửa/xóa/tìm kiếm, import/export Excel
- Quản lý điểm: lọc, nhập tay hoặc import Excel
- Điểm danh QR: tạo phiên, sinh QR/link, sinh viên tự check-in, cập nhật realtime
- Dashboard: thẻ thống kê + biểu đồ Chart.js (line/doughnut/bar)

## Cài đặt & chạy
1. Cài Node.js và MySQL.
2. Sao chép cấu hình môi trường:
   ```bash
   cp .env.example .env
   # chỉnh DB_HOST/DB_USER/DB_PASSWORD/DB_NAME và SESSION_SECRET
   ```
3. Cài phụ thuộc:
   ```bash
   npm install
   ```
4. Chạy ứng dụng:
   ```bash
   node app.js
   ```
   Mặc định chạy tại http://localhost:3000

## Cấu hình môi trường (.env)
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME: thông tin MySQL
- SESSION_SECRET: khóa phiên
- APP_BASE_URL (tùy chọn khi deploy) để QR sinh đúng domain

## Bảng phục vụ điểm danh
```sql
CREATE TABLE attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  ma_lop VARCHAR(20),
  ma_mon_hoc VARCHAR(20),
  token VARCHAR(64) NOT NULL UNIQUE,
  expired_at DATETIME,
  created_by VARCHAR(100),
  status ENUM('scheduled','closed','expired') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  ma_sv VARCHAR(50) NOT NULL,
  ho_ten VARCHAR(255),
  ghi_chu TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_session_student (session_id, ma_sv)
);
```

## Lưu ý bảo mật
- `.env` đã được thêm vào `.gitignore`, không commit thông tin nhạy cảm.
- Thư mục `uploads/` cũng bị bỏ qua để tránh đẩy file người dùng lên repo.
