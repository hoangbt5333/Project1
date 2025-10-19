const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

// Hiển thị danh sách khoa
router.get('/', isLoggedIn, (req, res) => {
  const sql = `
    SELECT * FROM khoa
  `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.render('khoa', { title: 'Quản lý khoa', departments: results });
  });
});

//Hiển thị form thêm khoa
router.get('/add', isLoggedIn, (req, res) => {
  res.render('khoa_add', { title: 'Thêm khoa' });
});

// Thêm khoa mới
router.post('/add', isLoggedIn, (req, res) => {
  const { ma_khoa, ten_khoa, truong_khoa } = req.body;
  const sql = `
    INSERT INTO khoa (ma_khoa, ten_khoa, truong_khoa) VALUES (?, ?, ?)
  `;
  db.query(sql, [ma_khoa, ten_khoa, truong_khoa], (err, results) => {
    if (err) throw err;
    res.redirect('/khoa');
  });
});

//Sua thong tin khoa
router.get('/edit/:ma_khoa', isLoggedIn, (req, res) => {
  const ma_khoa = req.params.ma_khoa;
  const sql = `
    SELECT * FROM khoa WHERE ma_khoa = ?
  `;
  db.query(sql, [ma_khoa], (err, results) => {
    if (err) throw err;
    res.render('khoa_edit', { title: 'Sửa khoa', departments: results[0] });
  });
});

// Cập nhật thông tin khoa
router.post('/edit/:ma_khoa', isLoggedIn, (req, res) => {
  const ma_khoa = req.params.ma_khoa;
  const { ten_khoa, truong_khoa } = req.body;
  const sql = `
    UPDATE khoa SET ten_khoa = ?, truong_khoa = ? WHERE ma_khoa = ?
  `;
  db.query(sql, [ten_khoa, truong_khoa, ma_khoa], (err, results) => {
    if (err) throw err;
    res.redirect('/khoa');
  });
});

// Xóa khoa
router.get('/delete/:ma_khoa', isLoggedIn, (req, res) => {
  const ma_khoa = req.params.ma_khoa;
  const sql = `
    DELETE FROM khoa WHERE ma_khoa = ?
  `;
  db.query(sql, [ma_khoa], (err, results) => {
    if (err) throw err;
    res.redirect('/khoa');
  });
});

module.exports = router;