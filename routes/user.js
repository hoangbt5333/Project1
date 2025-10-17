const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// Trang đăng ký
router.get('/register', (req, res) => {
  res.render('user/register', { title: 'Đăng ký' });
});

// Xử lý đăng ký
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email)
    return res.send('Vui lòng nhập đầy đủ thông tin.');

  // Mã hóa mật khẩu
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hashedPassword, email],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.send('Tên người dùng đã tồn tại.');
        }
        throw err;
      }
      res.redirect('/user/login');
    });
});

// Trang đăng nhập
router.get('/login', (req, res) => {
  res.render('user/login', { title: 'Đăng nhập' });
});

// Xử lý đăng nhập
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.send('Sai tên đăng nhập hoặc mật khẩu.');
    }

    const user = results[0];

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.send('Sai tên đăng nhập hoặc mật khẩu.');
    }
  });
});

// Đăng xuất
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/user/login');
  });
});

module.exports = router;
