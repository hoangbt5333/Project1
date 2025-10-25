const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

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
router.get('/add', isLoggedIn, (req, res) => {
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
router.post('/add', isLoggedIn, (req, res) => {
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
router.get('/edit/:ma_sv', isLoggedIn, (req, res) => {
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
router.post('/edit/:ma_sv', isLoggedIn, (req, res) => {
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
router.get('/view/:ma_sv', (req, res) => {
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
router.post('/delete/:ma_sv', isLoggedIn, (req, res) => {
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
