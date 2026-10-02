// lib/db.ts
import mysql from "mysql2/promise";

const HK_OFFSET = "+08:00"; // Hong Kong has no DST, so a fixed offset is safe

export const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  charset: "utf8mb4",
  dateStrings: true,
  connectionLimit: 10,
  timezone: HK_OFFSET, // how mysql2 serializes JS Date parameters
});

// Make the MySQL session itself use Hong Kong time for every pooled connection,
// so CURRENT_TIMESTAMP / NOW() / CURDATE() return HK time.
db.pool.on("connection", (conn) => {
  conn.query(`SET time_zone = '${HK_OFFSET}'`);
});