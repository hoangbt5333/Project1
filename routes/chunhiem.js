const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAdmin } = require('../middleware/auth');

// Hiển thị danh sách chủ nhiệm
router.get('/', isAdmin, (req, res) => {
  const sqlGV = `SELECT gv.ma_gv, gv.ho_ten, gv.email
                FROM giangvien gv
                ORDER BY gv.ma_gv ASC`;

  const sqlLop = `
    SELECT ma_lop, ten_lop
    FROM lop 
    ORDER BY ten_lop ASC
  `;

  const sqlPhanCong = `
    SELECT cn.ma_gv, cn.ma_lop, cn.time_start, cn.time_end, gv.ho_ten, l.ten_lop
    FROM chunhiem cn
    JOIN lop l ON cn.ma_lop = l.ma_lop
    JOIN giangvien gv ON cn.ma_gv = gv.ma_gv
  `;

  const message = req.session.message;
  delete req.session.message;

  db.query(sqlGV, (err, giangvienList) => {
    if (err) {
      console.error('❌ Lỗi lấy danh sách giảng viên:', err);
      return res.status(500).send('Lỗi truy vấn giảng viên');
    }
    db.query(sqlLop, (err2, lopList) => {
        if (err2) {
          console.error('❌ Lỗi lấy danh sách lớp:', err2);
          return res.status(500).send('Lỗi truy vấn lớp');
        }
        db.query(sqlPhanCong, (err3, chunhiemList) => {
            if (err3) {
              console.error('❌ Lỗi lấy danh sách phân công chủ nhiệm:', err3);
              return res.status(500).send('Lỗi truy vấn phân công chủ nhiệm');
            }
            res.render('chunhiem', {
                title: 'Quản lý chủ nhiệm',
                giangvienList,
                lopList,
                chunhiemList,
                message: message || null
            });
        });
    });
  });
});

// Thêm phân công chủ nhiệm
router.post('/add', isAdmin, (req, res) => {
  const { ma_gv, ma_lop, time_start, time_end } = req.body;
  const sql = `
    INSERT INTO chunhiem (ma_gv, ma_lop, time_start, time_end)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [ma_gv, ma_lop, time_start, time_end], (err, result) => {
    if (err) {
      console.error('❌ Lỗi thêm phân công chủ nhiệm:', err);
      return res.status(500).send('Lỗi thêm phân công chủ nhiệm');
    }
    req.session.message = '✅Thêm phân công chủ nhiệm thành công';
    res.redirect('/chunhiem');
  });
});

module.exports = router;