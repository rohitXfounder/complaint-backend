// ==============================
// 🚀 STARTING SERVER
// ==============================
console.log("STARTING SERVER...");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==============================
// 📁 DIRECTORY SETUP
// ==============================
// This ensures the 'uploads' folder exists on Render so image uploads don't crash the server
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const app = express();

// ==============================
// 🔧 MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ==============================
// 📁 IMAGE UPLOAD
// ==============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// ==============================
// 📦 SCHEMAS
// ==============================

// Complaint Schema
const complaintSchema = new mongoose.Schema({
    id: String,
    name: String,
    branch: String,
    division: String,
    roll: String,
    issue: String,
    description: String,
    status: String,
    createdAt: String,
    imagePath: String
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    message: String,
    type: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model("Notification", notificationSchema);

// ==============================
// 🔔 NOTIFICATION FUNCTION
// ==============================
async function addNotification(message, type) {
    try {
        await Notification.create({ message, type });
        console.log("🔔 Notification:", message);
    } catch (err) {
        console.log("❌ Notification error:", err);
    }
}

// ==============================
// 🔐 ADMIN LOGIN
// ==============================
// (Simple version without DB)
app.post("/admin-login", (req, res) => {
    const { password } = req.body;

    if (password === "admin123") {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// ==============================
// ➕ ADD COMPLAINT
// ==============================
app.post("/add", upload.single("image"), async (req, res) => {
    try {
        const newComplaint = new Complaint({
            ...req.body,
            imagePath: req.file ? req.file.filename : null
        });

        await newComplaint.save();

        res.send("Inserted");
    } catch (err) {
        console.log("❌ INSERT ERROR:", err);
        res.status(500).send("Insert failed");
    }
});

// ==============================
// 🔍 GET SINGLE
// ==============================
app.get("/get/:id", async (req, res) => {
    const data = await Complaint.find({ id: req.params.id });
    res.json(data);
});

// ==============================
// 📄 GET ALL
// ==============================
app.get("/all", async (req, res) => {
    const data = await Complaint.find().sort({ _id: -1 });
    res.json(data);
});

// ==============================
// 🔄 UPDATE STATUS
// ==============================
app.put("/update/:id", async (req, res) => {
    const { status } = req.body;

    await Complaint.updateOne(
        { id: req.params.id },
        { status }
    );

    await addNotification(`Status updated for ${req.params.id}`, "UPDATE");

    res.send("Updated");
});

// ==============================
// 🗑️ DELETE
// ==============================
app.delete("/delete/:id", async (req, res) => {
    await Complaint.deleteOne({ id: req.params.id });

    await addNotification(`Complaint deleted: ${req.params.id}`, "DELETE");

    res.send("Deleted");
});

// ==============================
// 🔔 GET NOTIFICATIONS
// ==============================
app.get("/notifications", async (req, res) => {
    const data = await Notification.find().sort({ _id: -1 }).limit(10);
    res.json(data);
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
