const express = require('express');
const router = express.Router();
const db = require('../db');
const { isGiangVien } = require('../middleware/auth');

// GET: Trang hồ sơ cá nhân
router.get('/', isGiangVien, (req, res) => {
  const user_id = req.session.user.id;

  const sql = `
    SELECT 
      u.id,
      u.email,
      gv.ho_ten,
      gv.ngay_sinh,
      gv.gioi_tinh,
      gv.so_dien_thoai,
      gv.dia_chi
    FROM users u
    LEFT JOIN giangvien gv ON gv.user_id = u.id
    WHERE u.id = ?
  `;

  const message = req.session.message;
  delete req.session.message;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }

    const profile = results[0] || {}; // nếu chưa có dòng giangvien thì vẫn render được
    profile.email = profile.email_user || profile.email_gv || '';

    res.render('profile', { 
      title: 'Hồ sơ cá nhân',
      profile: profile,
      message: message || null
    });
  });
});

// POST: Cập nhật hồ sơ cá nhân
router.post('/', isGiangVien, (req, res) => {
  const user_id = req.session.user.id;
  const ma_gv = req.session.user.username; 
  const { ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi } = req.body;

  const sqlGetEmail = `
    SELECT email FROM users WHERE id = ?
  `;

  db.query(sqlGetEmail, [user_id], (err, result) => {
    if (err) {
      // console.error('❌ Lỗi cập nhật users:', err);
      return res.status(500).send('Error updating user data');
    }
    if (result.length === 0) {
      return res.status(404).send('User not found');
    }

    const email = result[0].email;

    // Kiểm tra xem giảng viên đã có dòng trong bảng giangvien chưa
    const sqlCheckGV = `
      SELECT * FROM giangvien WHERE user_id = ?
    `;

    db.query(sqlCheckGV, [user_id], (err, gvRows) => {
      if (err) {
        // console.error('❌ Lỗi truy vấn giangvien:', err);
        return res.status(500).send('Error querying giangvien');
      }

      // Nếu chưa có => INSERT
      if (gvRows.length === 0) {
        const sqlInsertGV = `
          INSERT INTO giangvien (user_id, ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi, ma_gv, email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsertGV, [user_id, ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi, ma_gv, email], (err2) => {
          if (err2) {
            // console.error('❌ Lỗi thêm giangvien:', err2);
            return res.status(500).send('Error inserting giangvien');
          }
          req.session.message = '✅ Cập nhật hồ sơ thành công';
          res.redirect('/profile');
        });
      } else {
        // Đã có => UPDATE
        const sqlUpdateGV = `
          UPDATE giangvien
          SET ho_ten = ?, ngay_sinh = ?, gioi_tinh = ?, so_dien_thoai = ?, dia_chi = ?, email = ?
          WHERE user_id = ?
        `;
        db.query(sqlUpdateGV, [ho_ten, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi, email, user_id], (err2) => {
          if (err2) {
            // console.error('❌ Lỗi cập nhật giangvien:', err2);
            return res.status(500).send('Error updating giangvien');
          }
          req.session.message = '✅ Cập nhật hồ sơ thành công';
          res.redirect('/profile');
        });
      }
    });
  });
});

module.exports = router;
