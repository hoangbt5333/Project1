const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

router.get('/', isLoggedIn, (req, res) => {
  const sql = `
    SELECT * FROM lop
  `;

  db.query(sql, (err, results) => {
    if (err) {
      // console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    res.render('lop', { title: 'Quản lý lớp', classes: results });
  });
});

module.exports = router;
