const express = require('express');
const router = express.Router();
const db = require('../db');

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

function isGiangVien(req, res, next) {
  if (req.session.user && req.session.user.role === 'giangvien') return next();
  res.render('access_denied', { title: 'Access Denied', message: 'Bạn không có quyền truy cập trang này.' });
}

// Hiển thị danh sách điểm
router.get('/', isLoggedIn, (req, res) => {
  const search = (req.query.search || '').trim();
  const monhoc = (req.query.monhoc || '').trim();

  // SQL chính
  let sql = 'SELECT * FROM diem_view WHERE 1=1';
  const params = [];

  // Thêm tìm kiếm 
  if (search) {
    sql += ' AND (ho_ten LIKE ? OR ma_sv LIKE ? OR ten_mon_hoc LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Thêm lọc môn học 
  if (monhoc) {
    sql += ' AND ten_mon_hoc = ?';
    params.push(monhoc);
  }

  sql += ' ORDER BY ma_sv ASC';

  // Truy vấn danh sách môn học
  const sqlMonHoc = 'SELECT ten_mon_hoc FROM monhoc ORDER BY ten_mon_hoc ASC';

  db.query(sqlMonHoc, (err, monhocList) => {
    if (err) {
      console.error('❌ Lỗi lấy danh sách môn học:', err);
      return res.status(500).send('Lỗi truy vấn môn học');
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('❌ Lỗi lấy danh sách điểm:', err);
        return res.status(500).send('Lỗi truy vấn điểm');
      }

      res.render('diem', {
        title: 'Quản lý điểm',
        scores: results,
        search,
        monhoc: monhoc,
        monhocList
      });
    });
  });
});

// Hiển thị form nhập điểm
router.get("/add",isGiangVien, (req, res) => {
  const maMonHoc = req.query.ma_mon_hoc || null;
  const sqlMon = "SELECT * FROM monhoc";

  // Lấy danh sách môn học trước
  db.query(sqlMon, (err, monhocList) => {
    if (err) return res.status(500).send("Lỗi khi lấy danh sách môn học");

    if (!maMonHoc) {
      // Chưa chọn môn => chỉ hiển thị form chọn
      return res.render("diem_add", { title: 'Thêm điểm', monhocList, sinhvienList: [], maMonHoc: null });
    }

    // Nếu đã chọn môn => lấy danh sách sinh viên đăng ký
    const sqlSV = `
      SELECT sv.ma_sv, sv.ho_ten, d.diem_chu, d.diem_so
      FROM dangky dk
      LEFT JOIN sinhvien sv ON sv.ma_sv = dk.ma_sv
      LEFT JOIN diem d ON d.ma_sv = sv.ma_sv AND d.ma_mon_hoc = ?
      WHERE dk.ma_mon_hoc = ?
      ORDER BY sv.ma_sv
    `;
    db.query(sqlSV, [maMonHoc, maMonHoc], (err, sinhvienList) => {
      if (err) return res.status(500).send("Lỗi khi lấy danh sách sinh viên");
      res.render("diem_add", { title: 'Thêm điểm', monhocList, sinhvienList, maMonHoc });
    });
  });
});

//Xử lý lấy sinh viên theo môn học
router.post("/add",isGiangVien, (req, res) => {
  const maMonHoc = req.body.ma_mon_hoc;
  const sinhvienList = req.body.sinhvien; // { ma_sv: [..], diem_so: [..], diem_chu: [..] }

  if (!sinhvienList || !maMonHoc) return res.send("Thiếu dữ liệu");

  // Duyệt từng sinh viên và cập nhật
  const sqlUpsert = `
    INSERT INTO diem (ma_sv, ma_mon_hoc, diem_chu, diem_so)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE diem_chu = VALUES(diem_chu), diem_so = VALUES(diem_so)
  `;

  let count = 0;
  sinhvienList.forEach((sv) => {
    db.query(sqlUpsert, [sv.ma_sv, maMonHoc, sv.diem_chu, sv.diem_so], (err) => {
      if (err) console.error(err);
      count++;
      if (count === sinhvienList.length) {
        res.redirect("/diem"); // sau khi lưu xong quay lại trang điểm
      }
    });
  });
});


// Xử lý lưu điểm
router.post("/save",isGiangVien, (req, res) => {
  const { ma_mon_hoc, diem } = req.body;

  const sqlUpsert = `
    INSERT INTO diem (ma_sv, ma_mon_hoc, hoc_ky, diem_chu, diem_so)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE hoc_ky = VALUES(hoc_ky), diem_chu = VALUES(diem_chu), diem_so = VALUES(diem_so)
  `;

  db.query(sqlUpsert, [ma_sv, ma_mon_hoc, hoc_ky, diem_chu, diem_so], (err, result) => {
    if (err) {
      console.error('❌ Lỗi khi lưu điểm:', err);
      return res.status(500).send('Lỗi khi lưu điểm');
    }
    res.redirect(`/diem/add?ma_mon_hoc=${ma_mon_hoc}`);
  });
});

module.exports = router;

