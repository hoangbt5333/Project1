const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { isAdminOrGiangVien } = require('../middleware/auth');

const router = express.Router();
const dbPromise = db.promise();

const baseUrl = (req) => {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
};

const safeListQuery = async (sql, params = []) => {
  try {
    const [rows] = await dbPromise.query(sql, params);
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }
};

const findSessionByToken = async (token) => {
  const [rows] = await dbPromise.query(`
    SELECT s.*, l.ten_lop, mh.ten_mon_hoc
    FROM attendance_sessions s
    LEFT JOIN lop l ON l.ma_lop = s.ma_lop
    LEFT JOIN monhoc mh ON mh.ma_mon_hoc = s.ma_mon_hoc
    WHERE s.token = ?
    LIMIT 1
  `, [token]);
  return rows[0];
};

router.get('/', isAdminOrGiangVien, async (req, res) => {
  const message = req.session.message;
  delete req.session.message;

  try {
    const [classes, subjects, sessions] = await Promise.all([
      safeListQuery('SELECT ma_lop, ten_lop FROM lop ORDER BY ten_lop ASC'),
      safeListQuery('SELECT ma_mon_hoc, ten_mon_hoc FROM monhoc ORDER BY ten_mon_hoc ASC'),
      safeListQuery(`
        SELECT s.*, l.ten_lop, mh.ten_mon_hoc,
               COUNT(DISTINCT r.id) AS presentCount
        FROM attendance_sessions s
        LEFT JOIN attendance_records r ON r.session_id = s.id
        LEFT JOIN lop l ON l.ma_lop = s.ma_lop
        LEFT JOIN monhoc mh ON mh.ma_mon_hoc = s.ma_mon_hoc
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 15
      `)
    ]);

    const mappedSessions = await Promise.all(sessions.map(async (session) => {
      const shareUrl = `${baseUrl(req)}/attendance/check/${session.token}`;
      let qr = null;
      try {
        qr = await QRCode.toDataURL(shareUrl);
      } catch (error) {
        console.error('Không tạo được QR:', error.message);
      }
      const expiredAt = session.expired_at ? new Date(session.expired_at) : null;
      const isExpired = expiredAt ? expiredAt.getTime() < Date.now() : false;
      const status = session.status || (isExpired ? 'expired' : 'scheduled');
      return {
        ...session,
        status,
        shareUrl,
        qr,
        isExpired
      };
    }));

    res.render('attendance/index', {
      title: 'Điểm danh',
      message: message || null,
      classes,
      subjects,
      sessions: mappedSessions
    });
  } catch (error) {
    console.error('[Attendance] Lỗi tải trang:', error);
    res.status(500).send('Không tải được trang điểm danh');
  }
});

router.post('/create', isAdminOrGiangVien, async (req, res) => {
  const { title, ma_lop, ma_mon_hoc, expired_at } = req.body;
  const sessionTitle = title || 'Buổi học chưa đặt tên';
  const dateObj = expired_at ? new Date(expired_at) : new Date(Date.now() + 30 * 60000);

  if (Number.isNaN(dateObj.getTime())) {
    req.session.message = 'Thời gian kết thúc không hợp lệ.';
    return res.redirect('/attendance');
  }

  try {
    await dbPromise.query(`
      INSERT INTO attendance_sessions (title, ma_lop, ma_mon_hoc, token, expired_at, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `, [
      sessionTitle,
      ma_lop || null,
      ma_mon_hoc || null,
      uuidv4(),
      dateObj,
      req.session.user ? req.session.user.username : null
    ]);

    req.session.message = 'Tạo buổi điểm danh thành công.';
  } catch (error) {
    console.error('[Attendance] Lỗi tạo phiên:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      req.session.message = 'Chưa có bảng attendance_sessions. Hãy tạo bảng trước khi sử dụng tính năng.';
    } else {
      req.session.message = 'Không thể tạo buổi điểm danh.';
    }
  }

  res.redirect('/attendance');
});

router.get('/session/:id', isAdminOrGiangVien, async (req, res) => {
  const sessionId = req.params.id;

  try {
    const [sessionRows, recordRows] = await Promise.all([
      safeListQuery(`
        SELECT s.*, l.ten_lop, mh.ten_mon_hoc
        FROM attendance_sessions s
        LEFT JOIN lop l ON l.ma_lop = s.ma_lop
        LEFT JOIN monhoc mh ON mh.ma_mon_hoc = s.ma_mon_hoc
        WHERE s.id = ?
      `, [sessionId]),
      safeListQuery(`
        SELECT r.id, r.ma_sv, r.ho_ten, r.ghi_chu, r.created_at
        FROM attendance_records r
        WHERE r.session_id = ?
        ORDER BY r.created_at DESC
      `, [sessionId])
    ]);

    const session = sessionRows[0];
    if (!session) {
      return res.status(404).send('Không tìm thấy buổi điểm danh');
    }

    const shareUrl = `${baseUrl(req)}/attendance/check/${session.token}`;
    const qr = await QRCode.toDataURL(shareUrl);

    res.render('attendance/session_detail', {
      title: 'Chi tiết điểm danh',
      session,
      shareUrl,
      qr,
      records: recordRows
    });
  } catch (error) {
    console.error('[Attendance] Lỗi xem chi tiết:', error);
    res.status(500).send('Không thể tải chi tiết buổi điểm danh');
  }
});

router.post('/session/:id/close', isAdminOrGiangVien, async (req, res) => {
  const sessionId = req.params.id;
  try {
    await dbPromise.query(`
      UPDATE attendance_sessions
      SET status = 'closed'
      WHERE id = ?
    `, [sessionId]);
    req.session.message = 'Đã kết thúc phiên điểm danh.';
  } catch (error) {
    console.error('[Attendance] Lỗi kết thúc phiên:', error);
    req.session.message = 'Không thể kết thúc phiên.';
  }
  res.redirect('/attendance/session/' + sessionId);
});

router.get('/session/:id/records.json', isAdminOrGiangVien, async (req, res) => {
  try {
    const rows = await safeListQuery(`
      SELECT r.id, r.ma_sv, r.ho_ten, r.ghi_chu, r.created_at
      FROM attendance_records r
      WHERE r.session_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json({ records: rows });
  } catch (error) {
    console.error('[Attendance] Lỗi lặp lại dữ liệu:', error);
    res.status(500).json({ records: [] });
  }
});

router.get('/check/:token', async (req, res) => {
  try {
    const session = await findSessionByToken(req.params.token);
    if (!session) {
      return res.render('attendance/check', { title: 'Điểm danh', session: null, error: 'Mã điểm danh không hợp lệ.' });
    }

    const expired = session.expired_at ? new Date(session.expired_at).getTime() < Date.now() : false;
    if (session.status === 'closed' || expired) {
      return res.render('attendance/check', {
        title: 'Điểm danh',
        session,
        error: 'Buổi điểm danh đã kết thúc.'
      });
    }

    res.render('attendance/check', { title: 'Điểm danh', session, error: null, success: null });
  } catch (error) {
    console.error('[Attendance] Lỗi mở form checkin:', error);
    res.status(500).send('Không thể tải form điểm danh');
  }
});

router.post('/check/:token', async (req, res) => {
  const { ma_sv, ho_ten, ghi_chu } = req.body;

  try {
    const session = await findSessionByToken(req.params.token);
    if (!session) {
      return res.render('attendance/check', { title: 'Điểm danh', session: null, error: 'Không tìm thấy buổi điểm danh.' });
    }

    const expired = session.expired_at ? new Date(session.expired_at).getTime() < Date.now() : false;
    if (session.status === 'closed' || expired) {
      return res.render('attendance/check', {
        title: 'Điểm danh',
        session,
        error: 'Buổi điểm danh đã kết thúc.'
      });
    }

    if (!ma_sv || !ho_ten) {
      return res.render('attendance/check', {
        title: 'Điểm danh',
        session,
        error: 'Vui lòng nhập đầy đủ MSSV và họ tên.'
      });
    }

    await dbPromise.query(`
      INSERT INTO attendance_records (session_id, ma_sv, ho_ten, ghi_chu)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), ghi_chu = VALUES(ghi_chu)
    `, [session.id, ma_sv, ho_ten, ghi_chu || null]);

    res.render('attendance/check', {
      title: 'Điểm danh',
      session,
      success: 'Điểm danh thành công. Cảm ơn bạn!',
      error: null
    });
  } catch (error) {
    console.error('[Attendance] Lỗi nộp điểm danh:', error);
    res.render('attendance/check', {
      title: 'Điểm danh',
      session: null,
      error: 'Có lỗi khi lưu điểm danh. Vui lòng thử lại.'
    });
  }
});

module.exports = router;
