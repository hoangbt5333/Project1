const express = require('express');
const router = express.Router();
const db = require('../db');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Hiển thị danh sách lớp
router.get('/', isLoggedIn, (req, res) => {
  const sql = `
    SELECT * FROM lop_view
  `;

  db.query(sql, (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.render('lop', { title: 'Quản lý lớp', classes: results });
  });
});

// Hiển thị form thêm lớp
router.get('/add', isAdmin, (req, res) => {
  const sqlKhoa = `
    SELECT * FROM khoa
  `;

  db.query(sqlKhoa, (err, khoaList) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.render('lop_add', { title: 'Thêm lớp', khoaList: khoaList });
  });
});

// Thêm lớp mới
router.post('/add', isAdmin, (req, res) => {
  const { ma_lop, ten_lop, ma_khoa } = req.body;

  const sql = `
    INSERT INTO lop (ma_lop, ten_lop, ma_khoa)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [ma_lop, ten_lop, ma_khoa], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.redirect('/lop');
  });
});

// Hiển thị form sửa lớp
router.get('/edit/:ma_lop', isAdmin, (req, res) => {
  const ma_lop = req.params.ma_lop;

  const sqlLop = `
    SELECT * FROM lop WHERE ma_lop = ?
  `;
  const sqlKhoa = `
    SELECT * FROM khoa
  `;

  db.query(sqlLop, [ma_lop], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    if (results.length === 0) {
      return res.status(404).send('Lớp học không tồn tại');
    }

    db.query(sqlKhoa, (err, khoaList) => {
      if (err) {
        // console.error('❌ Lỗi truy vấn SQL:', err);
        return res.status(500).send('Error querying database');
      }
      res.render('lop_edit', { title: 'Sửa lớp', classes: results[0], khoaList: khoaList });
    });
  });
});
// Cập nhật thông tin lớp
router.post('/edit/:ma_lop', isAdmin, (req, res) => {
  const ma_lop = req.params.ma_lop;
  const { ten_lop, ma_khoa } = req.body;
  const sql = `
    UPDATE lop SET ten_lop = ?, ma_khoa = ? WHERE ma_lop = ?
  `;
  db.query(sql, [ten_lop, ma_khoa, ma_lop], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.redirect('/lop');
  });
});
// Xóa lớp
router.get('/delete/:ma_lop', isAdmin, (req, res) => {
  const ma_lop = req.params.ma_lop;
  const sql = `
    DELETE FROM lop WHERE ma_lop = ?
  `;
  db.query(sql, [ma_lop], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.redirect('/lop');
  });
});

module.exports = router;
