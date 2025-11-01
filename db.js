const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Hoang[85147]',
  database: 'quanlysv',
});

db.connect((err) => {
  if (err) {
    console.error('Lỗi kết nối đến MySQL:', err.message);
  } else {
    console.log('Kết nối thành công đến MySQL');
  }
});

module.exports = db;