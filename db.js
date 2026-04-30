const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",   // ⚠️ IMPORTANT: put your MySQL password here
    database: "bolcampus"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL ✅");
    }
});

module.exports = db;