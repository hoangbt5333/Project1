require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const session = require('express-session');
const db = require('./db');

const app = express();
const dbPromise = db.promise();

// Thiết lập session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Thiết lập EJS và layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Cho phép nhận dữ liệu form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

const userRouter = require('./routes/user');
const sinhvienRouter = require('./routes/sinhvien');
const lopRouter = require('./routes/lop');
const khoaRouter = require('./routes/khoa');
const monhocRouter = require('./routes/monhoc');
const diemRouter = require('./routes/diem');
const rolesRouter = require('./routes/roles');
const profileRouter = require('./routes/profile');
const chunhiemRouter = require('./routes/chunhiem');
const attendanceRouter = require('./routes/attendance');

app.use('/chunhiem', chunhiemRouter);
app.use('/profile', profileRouter);
app.use('/roles', rolesRouter);
app.use('/user', userRouter);
app.use('/sinhvien', sinhvienRouter);
app.use('/lop', lopRouter);
app.use('/khoa', khoaRouter);
app.use('/diem', diemRouter);
app.use('/monhoc', monhocRouter);
app.use('/attendance', attendanceRouter);

// Cấu hình thư mục public chứa các file tĩnh
app.use(express.static(path.join(__dirname, 'public')));

const safeDashboardQuery = async (sql, params = []) => {
  try {
    const [rows] = await dbPromise.query(sql, params);
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('[Dashboard] Bảng chưa tồn tại cho truy vấn:', sql);
      return [];
    }
    console.error('[Dashboard] Lỗi truy vấn:', error.message);
    return [];
  }
};

app.get('/', async (req, res, next) => {
  try {
    const [statsRows, semesterAvgRows, topSubjectRows, gradeRows, recentAttendance] = await Promise.all([
      safeDashboardQuery(`
        SELECT
          (SELECT COUNT(*) FROM sinhvien) AS totalStudents,
          (SELECT COUNT(*) FROM lop) AS totalClasses,
          (SELECT COUNT(*) FROM monhoc) AS totalSubjects,
          (SELECT COUNT(*) FROM khoa) AS totalDepartments,
          (SELECT COUNT(*) FROM attendance_sessions WHERE DATE(created_at) = CURDATE()) AS todayAttendance
      `),
      safeDashboardQuery(`
        SELECT hoc_ky AS label, ROUND(AVG(diem_so), 2) AS value
        FROM diem
        WHERE hoc_ky IS NOT NULL
        GROUP BY hoc_ky
        ORDER BY hoc_ky ASC
      `),
      safeDashboardQuery(`
        SELECT mh.ten_mon_hoc AS label, ROUND(AVG(d.diem_so), 2) AS value
        FROM diem d
        LEFT JOIN monhoc mh ON mh.ma_mon_hoc = d.ma_mon_hoc
        WHERE mh.ten_mon_hoc IS NOT NULL
        GROUP BY d.ma_mon_hoc
        ORDER BY value DESC
        LIMIT 6
      `),
      safeDashboardQuery(`
        SELECT
          SUM(CASE WHEN diem_so >= 3.2 THEN 1 ELSE 0 END) AS gioi,
          SUM(CASE WHEN diem_so BETWEEN 2.5 AND 3.19 THEN 1 ELSE 0 END) AS kha,
          SUM(CASE WHEN diem_so BETWEEN 2.0 AND 2.49 THEN 1 ELSE 0 END) AS trungbinh,
          SUM(CASE WHEN diem_so < 1.99 THEN 1 ELSE 0 END) AS yeu
        FROM diem
      `),
      safeDashboardQuery(`
        SELECT s.id, s.title, s.expired_at, s.created_at, s.status,
               l.ten_lop, mh.ten_mon_hoc,
               COUNT(DISTINCT r.id) AS presentCount
        FROM attendance_sessions s
        LEFT JOIN attendance_records r ON r.session_id = s.id
        LEFT JOIN lop l ON l.ma_lop = s.ma_lop
        LEFT JOIN monhoc mh ON mh.ma_mon_hoc = s.ma_mon_hoc
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 4
      `)
    ]);

    const stats = statsRows[0] || {
      totalStudents: 0,
      totalClasses: 0,
      totalSubjects: 0,
      totalDepartments: 0,
      todayAttendance: 0
    };

    const gradeData = gradeRows[0] || { gioi: 0, kha: 0, trungbinh: 0, yeu: 0 };

    res.render('index', {
      title: 'Trang chủ',
      stats,
      chartData: {
        semester: semesterAvgRows,
        subjects: topSubjectRows,
        grade: gradeData
      },
      recentAttendance
    });
  } catch (error) {
    next(error);
  }
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

app.get('/roles', (req, res) => {
  res.render('roles', { title: 'Quản lý vai trò', users: [] });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
