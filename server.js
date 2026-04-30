const cors = require("cors");
app.use(cors());
console.log("STARTING SERVER...");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const app = express();

// ==============================
// MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// ==============================
// MYSQL CONNECTION
// ==============================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "@Rohit9699",
    database: "bolcampus"
});

db.connect(err => {
    if (err) {
        console.log("❌ DB Connection Failed:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});


// ==============================
// 🔔 NOTIFICATION FUNCTION (CORE FIX)
// ==============================
function addNotification(message, type) {

    console.log("🔔 Notification:", message);

    const sql = "INSERT INTO notifications (message, type) VALUES (?, ?)";

    db.query(sql, [message, type], (err) => {
        if (err) {
            console.log("❌ Notification error:", err);
        }
    });
}


// ==============================
// 🔐 ADMIN LOGIN
// ==============================
app.post("/admin-login", (req, res) => {

    const { password } = req.body;

    const sql = "SELECT * FROM admin WHERE password = ? LIMIT 1";

    db.query(sql, [password], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    });
});


// ==============================
// 📌 ADD COMPLAINT
// ==============================
app.post("/add", upload.single("image"), (req, res) => {

    const {
        id,
        name,
        branch,
        division,
        roll,
        issue,
        description,
        status,
        createdAt
    } = req.body;

    const imagePath = req.file ? req.file.filename : null;

    const sql = `
        INSERT INTO complaints 
        (id, name, branch, division, roll, issue, description, status, createdAt, imagePath)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        id,
        name,
        branch,
        division,
        roll,
        issue,
        description,
        status,
        createdAt,
        imagePath
    ], (err) => {

        if (err) {
            console.log("❌ INSERT ERROR:", err);
            return res.status(500).send("Insert failed");
        }

        console.log("✅ Complaint inserted with image");
        res.send("Inserted");
    });
});


// ==============================
// 📌 GET SINGLE COMPLAINT
// ==============================
app.get("/get/:id", (req, res) => {

    db.query(
        "SELECT * FROM complaints WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) return res.send("Error");

            res.json(result);
        }
    );
});


// ==============================
// 📌 GET ALL COMPLAINTS
// ==============================
app.get("/all", (req, res) => {

    db.query("SELECT * FROM complaints", (err, result) => {

        if (err) return res.send("Error");

        res.json(result);
    });
});


// ==============================
// 🔍 FILTER COMPLAINTS
// ==============================
app.get("/filter", (req, res) => {

    const search = req.query.search || "";
    const status = req.query.status || "All";

    let sql = "SELECT * FROM complaints WHERE (id LIKE ? OR name LIKE ?)";
    let values = [`%${search}%`, `%${search}%`];

    if (status !== "All") {
        sql += " AND status = ?";
        values.push(status);
    }

    db.query(sql, values, (err, result) => {

        if (err) return res.send("Error");

        res.json(result);
    });
});


// ==============================
// 🔄 UPDATE STATUS
// ==============================
app.put("/update/:id", (req, res) => {

    const { status } = req.body;

    const sql = "UPDATE complaints SET status = ? WHERE id = ?";

    db.query(sql, [status, req.params.id], (err) => {

        if (err) return res.send("Error updating");

        addNotification(`Status updated for ${req.params.id}`, "UPDATE");

        res.send("Updated");
    });
});


// ==============================
// 🗑️ DELETE COMPLAINT
// ==============================
app.delete("/delete/:id", (req, res) => {

    const sql = "DELETE FROM complaints WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {

        if (err) return res.send("Error deleting");

        addNotification(`Complaint deleted: ${req.params.id}`, "DELETE");

        res.send("Deleted");
    });
});


// ==============================
// 🔔 GET NOTIFICATIONS
// ==============================
app.get("/notifications", (req, res) => {

    db.query(
        "SELECT * FROM notifications ORDER BY id DESC LIMIT 10",
        (err, result) => {

            if (err) return res.send("Error");

            res.json(result);
        }
    );
});


// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});