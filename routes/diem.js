const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const xlsx = require('xlsx');
const { isLoggedIn, isAdminOrGiangVien } = require('../middleware/auth');


// Xuât điểm
router.get('/export', isAdminOrGiangVien, (req, res) => {
  const sql = 'SELECT * FROM diem_view_vn ORDER BY MSSV ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Lỗi truy vấn SQL:', err);
      return res.status(500).send('Error querying database');
    }
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();

    worksheet['!cols'] = [
      { wch: 10 }, // MSSV
      { wch: 25 }, // Họ tên
      { wch: 10 }, // Học kỳ
      { wch: 30 }, // Môn học
      { wch: 10 }, // Điểm chữ
      { wch: 10 }  // Điểm số
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Diem');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="diem.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

// Nhập điểm
router.post('/import', isAdminOrGiangVien, upload.single('excelFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const sqlUpsert = `
    INSERT INTO diem (ma_sv, ma_mon_hoc, hoc_ky, diem_chu, diem_so)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE hoc_ky = VALUES(hoc_ky), diem_chu = VALUES(diem_chu), diem_so = VALUES(diem_so)
  `;

  data.forEach((row) => {
    db.query(sqlUpsert, [row.ma_sv, row.ma_mon_hoc, row.hoc_ky, row.diem_chu, row.diem_so], (err) => {
      if (err) {
        console.error('❌ Lỗi khi nhập điểm:', err);
        req.session.message = '⚠️ Lỗi chèn dữ liệu từ Excel';
      }
    });
  });
  req.session.message = '✅ Dữ liệu từ Excel đã được nhập thành công';
  res.redirect('/diem');
});

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
  const message = req.session.message;
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
        monhocList,
        message: message || null
      });
    });
  });
});

// Hiển thị form nhập điểm
router.get("/add",isAdminOrGiangVien, (req, res) => {
  const maMonHoc = req.query.ma_mon_hoc || null;
  const sqlMon = "SELECT * FROM monhoc";
  const message = req.session.message;
  delete req.session.message;

  // Lấy danh sách môn học trước
  db.query(sqlMon, (err, monhocList) => {
    if (err) return res.status(500).send("Lỗi khi lấy danh sách môn học");

    if (!maMonHoc) {
      // Chưa chọn môn => chỉ hiển thị form chọn
      return res.render("diem_add", { title: 'Thêm điểm', monhocList, sinhvienList: [], maMonHoc: null, message: message || null });
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
      res.render("diem_add", { title: 'Thêm điểm', monhocList, sinhvienList, maMonHoc, message: message || null });
    });
  });
});

//Xử lý lấy sinh viên theo môn học
router.post("/add",isAdminOrGiangVien, (req, res) => {
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
        req.session.message = '✅ Điểm đã được lưu thành công';
        res.redirect("/diem"); // sau khi lưu xong quay lại trang điểm
      }
    });
  });
});


// Xử lý lưu điểm
router.post("/save",isAdminOrGiangVien, (req, res) => {
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
    req.session.message = '✅ Điểm đã được lưu thành công';
  });
});

module.exports = router;

