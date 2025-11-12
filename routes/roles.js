const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).send('Access denied');
}

router.get('/', isAdmin, (req, res) => {
  const sql = `
    SELECT id, username, role 
    FROM users 
    WHERE username != 'admin' 
    ORDER BY id ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    // console.log('✅ Kết quả truy vấn users:', results);
    const message = req.session.message;
    delete req.session.message;
    res.render('roles', { title: 'Quản lý vai trò', users: results, user: req.session.user, message});
  });
});

router.post('/update/:id', isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    db.query('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
      if (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        req.session.message = '⚠️ Lỗi cập nhật vai trò';
      } else {
        req.session.message = '✅ Cập nhật vai trò thành công';
      }
      res.redirect('/roles');
    });
  } catch (error) {
    console.error('Lỗi cập nhật vai trò:', error);
    res.status(500).send('Internal Server Error');
  }
});
    
module.exports = router;
