function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.render('access_denied', { title: 'Access Denied', message: 'Bạn không có quyền truy cập trang này.' });
}

function isGiangVien(req, res, next) {
  if (req.session.user && req.session.user.role === 'giangvien') return next();
  res.render('access_denied', { title: 'Access Denied', message: 'Bạn không có quyền truy cập trang này.' });
}

module.exports = { isLoggedIn, isAdmin, isGiangVien };