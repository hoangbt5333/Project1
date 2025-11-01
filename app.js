const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');


// Thiết lập session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Thiết lập EJS và layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Cho phép nhập dữ liệu từ form
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});




const userRouter = require('./routes/user');
const sinhvienRouter = require('./routes/sinhvien');
const lopRouter = require('./routes/lop');
const khoaRouter = require('./routes/khoa');
const monhocRouter = require('./routes/monhoc');
const diemRouter = require('./routes/diem');

app.use('/user', userRouter);
app.use('/sinhvien', sinhvienRouter);
app.use('/lop', lopRouter);
app.use('/khoa', khoaRouter);
app.use('/diem', diemRouter);
app.use('/monhoc', monhocRouter);


// Cấu hình thư mục public để chứa các file tĩnh
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.render('index', { title: 'Trang chủ' });
});

app.get('/sinhvien', (req, res) => {
  res.render('sinhvien', { title: 'Quản lý sinh viên', students: [] });
});

app.get('/lop', (req, res) => {
  res.render('lop', { title: 'Quản lý lớp', classes: [] });
});

app.get('/khoa', (req, res) => {
  res.render('khoa', { title: 'Quản lý khoa', departments: [] });
});

app.get('/monhoc', (req, res) => {
  res.render('monhoc', { title: 'Quản lý môn học', subjects: [] });
});

app.get('/diem', (req, res) => {
  res.render('diem', { title: 'Quản lý điểm', scores: [] });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
