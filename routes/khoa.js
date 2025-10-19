const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

router.get('/', isLoggedIn, (req, res) => {
  const sql = `
    SELECT * FROM khoa
  `;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.render('khoa', { title: 'Quản lý khoa', departments: results });
  });
});

module.exports = router;