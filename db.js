const mysql = require('mysql2');
const env = require('./config/env');

const db = mysql.createConnection({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
});

db.connect((err) => {
  if (err) {
    console.error('Lỗi kết nối đến MySQL:', err.message);
  } else {
    console.log('Kết nối thành công đến MySQL');
  }
});

module.exports = db;
