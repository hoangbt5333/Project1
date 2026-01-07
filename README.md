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
   
   Có sẵn tài khoản admin: ('admin', '123456789')

## Cấu hình môi trường (.env)
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME: thông tin MySQL
- SESSION_SECRET: khóa phiên
- SESSION_SECURE/SESSION_SAMESITE, RATE_LIMIT_WINDOW_MS/RATE_LIMIT_MAX (tùy chọn) để tinh chỉnh cookie & rate limit

## Copy và chạy
```sql
CREATE DATABASE quanlysv;
use quanlysv;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'giangvien', 'sinhvien') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khoa (
    stt INT AUTO_INCREMENT PRIMARY KEY,
    ma_khoa VARCHAR(10) UNIQUE NOT NULL,
    ten_khoa VARCHAR(100) NOT NULL,
    truong_khoa VARCHAR(100)
);

CREATE TABLE lop (
    ma_lop VARCHAR(10) PRIMARY KEY,
    ten_lop VARCHAR(100) NOT NULL,
    ma_khoa VARCHAR(10),
    so_sinh_vien INT DEFAULT 0,
    FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa) ON DELETE SET NULL
);

CREATE TABLE sinhvien (
    stt INT AUTO_INCREMENT PRIMARY KEY,
    ma_sv VARCHAR(15) UNIQUE NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    ngay_sinh DATE,
    gioi_tinh ENUM('Nam', 'Nữ', 'Khác'),
    dia_chi VARCHAR(255),
    email VARCHAR(100),
    so_dien_thoai VARCHAR(15),
    ma_lop VARCHAR(10),
    FOREIGN KEY (ma_lop) REFERENCES lop(ma_lop) ON DELETE SET NULL
);

create table monhoc(
	ma_mon_hoc varchar(10) primary key,
    ten_mon_hoc varchar(100) not null,
    ma_khoa varchar(10),
    tin_chi smallint,
    foreign key (ma_khoa) references khoa(ma_khoa) on delete set null
);

create table diem(
	ma_sv varchar(15) not null,
    ma_mon_hoc varchar(10) not null,
    diem_chu varchar(2),
    diem_so decimal(2,1) check(diem_so between 0 and 4),
    hoc_ky varchar(6),
    primary key (ma_sv, ma_mon_hoc),
    constraint fk_diem_sv foreign key (ma_sv) references sinhvien(ma_sv) on delete cascade on update cascade,
    constraint fk_diem_monhoc foreign key (ma_mon_hoc) references monhoc(ma_mon_hoc) on delete cascade on update cascade
);

CREATE TABLE dangky (
  ma_sv VARCHAR(15) NOT NULL,
  ma_mon_hoc VARCHAR(10) NOT NULL,
  hoc_ky VARCHAR(6),
  PRIMARY KEY (ma_sv, ma_mon_hoc),
  CONSTRAINT fk_dkh_sv FOREIGN KEY (ma_sv)
    REFERENCES sinhvien(ma_sv)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dkh_mh FOREIGN KEY (ma_mon_hoc)
    REFERENCES monhoc(ma_mon_hoc)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE giangvien (
  ma_gv VARCHAR(15) PRIMARY KEY ,
  ho_ten VARCHAR(100) NOT NULL,
  ngay_sinh DATE,
  gioi_tinh ENUM('Nam', 'Nữ', 'Khác'),
  email VARCHAR(100) UNIQUE,
  so_dien_thoai VARCHAR(15),
  dia_chi VARCHAR(255),
  ma_khoa VARCHAR(10),
  user_id INT,
  FOREIGN KEY (ma_khoa) REFERENCES khoa(ma_khoa)
    ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE chunhiem (
  ma_gv VARCHAR(15) NOT NULL,
  ma_lop VARCHAR(10) NOT NULL,
  time_start DATETIME,
  time_end DATETIME,
  PRIMARY KEY (ma_gv, ma_lop),
  FOREIGN KEY (ma_gv) REFERENCES giangvien(ma_gv)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (ma_lop) REFERENCES lop(ma_lop)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Buổi học',
  `ma_lop` VARCHAR(50),
  `ma_mon_hoc` VARCHAR(50),
  `token` VARCHAR(100) UNIQUE NOT NULL,
  `status` ENUM('scheduled', 'ongoing', 'closed', 'expired') DEFAULT 'scheduled',
  `expired_at` DATETIME,
  `created_by` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ma_lop`) REFERENCES `lop`(`ma_lop`) ON DELETE SET NULL,
  FOREIGN KEY (`ma_mon_hoc`) REFERENCES `monhoc`(`ma_mon_hoc`) ON DELETE SET NULL,
  INDEX `idx_token` (`token`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
);
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `ma_sv` VARCHAR(50) NOT NULL,
  `ho_ten` VARCHAR(255) NOT NULL,
  `ghi_chu` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attendance` (`session_id`, `ma_sv`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_ma_sv` (`ma_sv`)
);



CREATE VIEW lop_view AS
SELECT 
    l.ma_lop,
    l.ten_lop,
    l.ma_khoa,
    COUNT(sv.ma_sv) AS so_sv
FROM lop l
LEFT JOIN sinhvien sv ON l.ma_lop = sv.ma_lop
GROUP BY l.ma_lop, l.ten_lop, l.ma_khoa;

create view monhoc_view as
select m.ma_mon_hoc, m.ten_mon_hoc, k.ten_khoa, m.tin_chi
from monhoc m
left join khoa k ON m.ma_khoa = k.ma_khoa;

create view diem_view as
select sv.ma_sv, sv.ho_ten, d.hoc_ky, m.ten_mon_hoc, d.diem_chu, d.diem_so
from diem d
left join sinhvien sv on sv.ma_sv = d.ma_sv
left join monhoc m on m.ma_mon_hoc = d.ma_mon_hoc;

CREATE VIEW diem_view_vn AS
SELECT 
    sv.ma_sv       AS `MSSV`,
    sv.ho_ten      AS `họ tên`,
    d.hoc_ky       AS `học kỳ`,
    m.ten_mon_hoc  AS `tên môn học`,
    d.diem_chu     AS `điểm chữ`,
    d.diem_so      AS `điểm số`
FROM diem d
LEFT JOIN sinhvien sv ON sv.ma_sv = d.ma_sv
LEFT JOIN monhoc m ON m.ma_mon_hoc = d.ma_mon_hoc;



INSERT INTO sinhvien (ma_sv, ho_ten) VALUES
('SV001', 'Nguyễn Văn A'),
('SV002', 'Trần Thị B'),
('SV003', 'Lê Văn C'),
('SV004', 'Phạm Thị D'),
('SV005', 'Hoàng Văn E'),
('SV006', 'Đỗ Thị F'),
('SV007', 'Vũ Văn G'),
('SV008', 'Ngô Thị H'),
('SV009', 'Bùi Văn I'),
('SV010', 'Đặng Thị K'),
('SV011', 'Trịnh Văn L'),
('SV012', 'Phan Thị M'),
('SV013', 'Lương Văn N'),
('SV014', 'Tạ Thị O'),
('SV015', 'Cao Văn P'),
('SV016', 'Nguyễn Thị Q'),
('SV017', 'Trần Văn R'),
('SV018', 'Lê Thị S'),
('SV019', 'Phạm Văn T'),
('SV020', 'Hoàng Thị U');

INSERT INTO lop (ma_lop, ten_lop)
VALUE ('000001', 'Lớp 1'),
	('000002', 'Lớp 2'),
    ('000003', 'Lớp 3'),
    ('000004', 'Lớp 4'),
    ('000005', 'Lớp 5');

insert into khoa(ma_khoa, ten_khoa, truong_khoa) 
value ('SOICT', 'Công nghệ thông tin', 'Phạm Văn A'),
	('CN1', 'Công nghệ 1', 'Nguyễn Văn B');

INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@gmail.com', '$2b$10$alsp7lGzuWVNkAfL/4ojKum5GrXFK9gkMDfLy3lQvZmIg5q4Pg4oO', 'admin');





```

## Lưu ý bảo mật
- `.env` đã được thêm vào `.gitignore`, không commit thông tin nhạy cảm.
- Thư mục `uploads/` cũng bị bỏ qua để tránh đẩy file người dùng lên repo.
- Đã bật helmet, nén gzip, rate limiting, và CSRF (token tự gắn vào form qua script). Nếu gặp lỗi CSRF khi phiên hết hạn, hãy refresh trang.
