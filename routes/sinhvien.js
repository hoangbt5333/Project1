const express = require('express');
const router = express.Router();
const db = require('../db');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { isLoggedIn, isAdminOrGiangVien } = require('../middleware/auth');



// Xuất danh sách sinh viên ra file Excel
router.get('/export', isLoggedIn, (req, res) => {
  const sql = `
    SELECT sv.ma_sv as 'MSSV', sv.ho_ten as 'Họ tên', sv.ngay_sinh as 'Ngày sinh', sv.gioi_tinh as 'Giới tính', sv.dia_chi as 'Địa chỉ', sv.so_dien_thoai as 'Số điện thoại', sv.email as 'Email', l.ten_lop as 'Tên lớp'
    FROM sinhvien sv
    LEFT JOIN lop l ON sv.ma_lop = l.ma_lop
    ORDER BY sv.ma_sv ASC
  `;
  db.query(sql, (err, results) => {
    if (err){
      console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }

    if (results.length === 0) {
      return res.status(404).send('No data to export');
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);

    ws['!cols'] = [
      { wch: 10 }, // Mã sinh viên
      { wch: 25 }, // Họ tên
      { wch: 15 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 30 }, // Địa chỉ
      { wch: 15 }, // Số điện thoại
      { wch: 30 }, // Email
      { wch: 20 }  // Tên lớp
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'SinhVien');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="sinhvien.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

router.post('/import', isAdminOrGiangVien, upload.single('excelFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const sql = `
    INSERT INTO sinhvien (ma_sv, ho_ten, ma_lop)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), ma_lop = VALUES(ma_lop)
  `;

  data.forEach((row) => {
    const { ma_sv, ho_ten, ma_lop } = row;
    db.query(sql, [ma_sv, ho_ten, ma_lop], (err) => {
      if (err) {
        // console.error('❌ Lỗi chèn dữ liệu từ Excel:', err);
      }
    });
  });

  res.redirect('/sinhvien');
});

// Hiển thị danh sách sinh viên
router.get('/', isLoggedIn, (req, res) => {
  const keyword = req.query.search ? req.query.search.trim() : '';
  
  const sql = `
    SELECT sv.stt, sv.ma_sv, sv.ho_ten, l.ten_lop
    FROM sinhvien sv
    LEFT JOIN lop l ON sv.ma_lop = l.ma_lop
    ${keyword ? "WHERE sv.ma_sv LIKE ? OR sv.ho_ten LIKE ?" : ""}
    ORDER BY sv.stt ASC
    `;

  const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];

  db.query(sql, params, (err, results) => {
    if (err){
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.render('sinhvien', { title: 'Quản lý sinh viên', students: results, keyword : keyword});
  });
});

// Hiển thị form thêm sinh viên
router.get('/add', isAdminOrGiangVien, (req, res) => {
  const sqlLop = `
    SELECT * FROM lop
  `;

  db.query(sqlLop, (err, lopList) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.render('sinhvien_add', { title: 'Thêm sinh viên', lopList: lopList });
  });
});

// Thêm sinh viên mới
router.post('/add', isAdminOrGiangVien, (req, res) => {
  const { ma_sv, ho_ten, ma_lop } = req.body;

  const sqlInsert = `
    INSERT INTO sinhvien (ma_sv, ho_ten, ma_lop)
    VALUES (?, ?, ?)
  `;

  db.query(sqlInsert, [ma_sv, ho_ten, ma_lop], (err, result) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error inserting data');
    }
    res.redirect('/sinhvien');
  });
});

// Hiển thị form sửa sinh viên
router.get('/edit/:ma_sv', isAdminOrGiangVien, (req, res) => {
  const ma_sv = req.params.ma_sv;

  const sqlSV = `
    SELECT * FROM sinhvien WHERE ma_sv = ?
  `;

  const sqlLop = `
    SELECT * FROM lop
  `

  db.query(sqlSV, [ma_sv], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    if (results.length === 0) {
      return res.status(404).send('Sinh viên không tồn tại');
    }
    db.query(sqlLop, (err, lopList) => {
      if (err) {
        // console.error('❌ Lỗi truy vấn SQL:', err);
        return res.status(500).send('Error querying database');
      }
      res.render('sinhvien_edit', { title: 'Sửa sinh viên', students: results[0], lopList: lopList });
    });
  });
});
// Cập nhật thông tin sinh viên
router.post('/edit/:ma_sv', isAdminOrGiangVien, (req, res) => {
  const ma_sv = req.params.ma_sv;
  const { ho_ten, ngay_sinh, gioi_tinh, dia_chi, email, so_dien_thoai, ma_lop } = req.body;
  const sql = `
    UPDATE sinhvien
    SET ho_ten = ?, ngay_sinh = ?, gioi_tinh = ?, dia_chi = ?, email = ?, so_dien_thoai = ?, ma_lop = ?
    WHERE ma_sv = ?
  `;

  db.query(sql, [ho_ten, ngay_sinh, gioi_tinh, dia_chi, email, so_dien_thoai, ma_lop, ma_sv], (err, result) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error updating data');
    }
    res.redirect('/sinhvien');
  });
});

//Xem thông tin sinh viên
router.get('/view/:ma_sv', isLoggedIn, (req, res) => {
  const ma_sv = req.params.ma_sv;

  const sql = `
    SELECT 
      sv.*, 
      l.ten_lop, 
      k.ten_khoa
    FROM sinhvien sv
    LEFT JOIN lop l ON sv.ma_lop = l.ma_lop
    LEFT JOIN khoa k ON l.ma_khoa = k.ma_khoa
    WHERE sv.ma_sv = ?
  `;

  db.query(sql, [ma_sv], (err, result) => {
    if (err) {
      console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Lỗi máy chủ (truy vấn)');
    }

    if (result.length === 0) {
      return res.status(404).send('Không tìm thấy sinh viên');
    }
    res.render('sinhvien_detail', { title: 'Thông tin sinh viên', student: result[0] });
  });
});


// Xóa sinh viên
router.post('/delete/:ma_sv', isAdminOrGiangVien, (req, res) => {
  const ma_sv = req.params.ma_sv;

  const sql = `
    DELETE FROM sinhvien
    WHERE ma_sv = ?
  `;
  db.query(sql, [ma_sv], (err, result) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error deleting data');
    }
    res.redirect('/sinhvien');
  });
});

module.exports = router;
