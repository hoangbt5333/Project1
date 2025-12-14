# 🎓 Website Quản lý Sinh viên

Dự án web giúp quản lý sinh viên, lớp học, khoa, môn học,... được xây dựng bằng **Node.js**, **Express**, **EJS**, và **MySQL**.  
Giao diện thân thiện, dễ mở rộng, phù hợp cho giáo viên các cấp.

---

## 🚀 Tính năng chính

- 👤 **Quản lý tài khoản**
  - Đăng ký, đăng nhập, đăng xuất
  - Phân quyền (Admin, người dùng thường)

- 🎓 **Quản lý sinh viên**
  - Thêm / sửa / xoá / tìm kiếm sinh viên
  - Hiển thị danh sách sinh viên theo lớp, khoa

- 🏫 **Quản lý lớp học & khoa**
  - Quản lý danh sách lớp, khoa, giảng viên

- 📚 **Quản lý môn học**
  - Tạo, chỉnh sửa, xoá môn học
  - Quản lý điểm và điểm danh

- 💻 **Giao diện người dùng**
  - Thiết kế với **Bootstrap 5**
  - Sử dụng **EJS layout** cho cấu trúc đồng nhất
  - Sidebar, Header, Footer hiển thị chuyên nghiệp

---

## 🧱 Cấu trúc thư mục

---

## Dashboard m?i & i?m danh th?ng minh

- Trang ch? ?� ??c n�ng c?p v?i hero section, th�ng k� nhanh v� bi?u ?? Chart.js (line, bar, doughnut).
- QR ?i?m danh ??c sinh t? backend, hi?n th? tr?n trang v� t? ??ng c?p nh?t l??t ?i?m danh t?i thi?.
- Sinh vi�n ??c qu?t QR, g?i form ?i?m danh (kh�ng c?n ??ng nh?p) v� h? th?ng t? ??ng c?p nh?t danh s�ch cho gi?ng vi�n.
- Li�n k?t sao ch�p nhanh (copy to clipboard) v� toast tr?c quan, b�o tr?ng th�i sau khi thao t�c.

### T?o b?ng ph?c v? ?i?m danh

```
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

> Tip: Thi?t l?p bi?n m�i tr??ng `APP_BASE_URL` n?u deploy (VD: `https://quanlysinhvien.myuniversity.edu`) ?? QR sinh ra ??ng ch�nh domain.


## Giao di?n Tailwind m?i
- Giao di?n d� chuy?n sang Tailwind CSS qua CDN (kh�ng c�n d�ng Bootstrap).
- C�c view d� du?c vi?t l?i b?ng utility class Tailwind; CSS t�y ch?nh n?m t?i `public/css/style.css` cho hi?u ?ng ph? tr? (sidebar, toast, glass).
- Kh�ng c?n build bu?c Tailwind; ch? c?n ch?y server nhu b�nh thu?ng.

## C?u h�nh m�i tru?ng
- Sao ch�p `.env.example` th�nh `.env` v� c?p nh?t th�ng tin DB, `SESSION_SECRET`.
- File `.env` v� thu m?c `uploads/` d� du?c th�m v�o `.gitignore` d? tr�nh l? d? li?u.
