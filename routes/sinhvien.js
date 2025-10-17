const express = require('express');
const router = express.Router();

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

router.get('/', isLoggedIn, (req, res) => {
	res.render('sinhvien', { title: 'Quản lý sinh viên', students: [] });
});

module.exports = router;
