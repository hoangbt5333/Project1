const express = require('express');
const router = express.Router();
const db = require('../db');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Hiển thị danh sách môn học
router.get('/', isLoggedIn, (req, res) => {
  const sql = `
    SELECT * FROM monhoc_view
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Lỗi hệ thống');
    res.render('monhoc', { title: 'Quản lý môn học', subjects: results });
  });
});

// Hiển thị form thêm môn học
router.get('/add', isAdmin, (req, res) => {
  const sqlKhoa = `
    SELECT * FROM khoa
  `;
  db.query(sqlKhoa, (err, khoaList) => {
    if (err) return res.status(500).send('Lỗi hệ thống');
    res.render('monhoc_add', { title: 'Thêm môn học', khoaList: khoaList });
  });
});

// Thêm môn học mới
router.post('/add', isAdmin, (req, res) => {
  const { ma_mon_hoc, ten_mon_hoc, ma_khoa, tin_chi } = req.body;

  const sql = `
    INSERT INTO monhoc (ma_mon_hoc, ten_mon_hoc, ma_khoa, tin_chi)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [ma_mon_hoc, ten_mon_hoc, ma_khoa, tin_chi], (err, result) => {
    if (err) return res.status(500).send('Lỗi hệ thống');
    res.redirect('/monhoc');
  });
});

// Hiển thị form sửa môn học
router.get('/edit/:ma_mon_hoc', isAdmin, (req, res) => {
  const ma_mon_hoc = req.params.ma_mon_hoc;

  const sql = `
    SELECT * FROM monhoc WHERE ma_mon_hoc = ?
  `;
  const sqlKhoa = `
      SELECT * FROM khoa
  `;
  db.query(sql, [ma_mon_hoc], (err, results) => {
    if (err) return res.status(500).send('Error querying database');
    if (results.length === 0) return res.status(404).send('Không tìm thấy môn học');
    
    db.query(sqlKhoa, (err, khoaList) => {
      if (err) return res.status(500).send('Error querying database');
      res.render('monhoc_edit', { title: 'Sửa môn học', subjects: results[0], khoaList: khoaList });
    });
  });
});
// Cập nhật môn học
router.post('/edit/:ma_mon_hoc', isAdmin, (req, res) => {
  const ma_mon_hoc = req.params.ma_mon_hoc;
  const { ma_mon_hoc: new_ma_mon_hoc, ten_mon_hoc, ma_khoa, tin_chi } = req.body;
  const sql = `
    UPDATE monhoc
    SET ma_mon_hoc = ?, ten_mon_hoc = ?, ma_khoa = ?, tin_chi = ?
    WHERE ma_mon_hoc = ?
  `;
  db.query(sql, [new_ma_mon_hoc, ten_mon_hoc, ma_khoa, tin_chi, ma_mon_hoc], (err, result) => {
    if (err) return res.status(500).send('Lỗi hệ thống');
    res.redirect('/monhoc');
  });
});

// Xóa môn học
router.post('/delete/:ma_mon_hoc', isAdmin, (req, res) => {
  const ma_mon_hoc = req.params.ma_mon_hoc;

  const sql = `
    DELETE FROM monhoc WHERE ma_mon_hoc = ?
  `;
  db.query(sql, [ma_mon_hoc], (err, result) => {
    if (err) return res.status(500).send('Lỗi hệ thống');
    res.redirect('/monhoc');
  });
});

module.exports = router;
