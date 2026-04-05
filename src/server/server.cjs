const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


const connectDB = require("./config/db.cjs");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Najar Nepal API is running");
});

app.use("/api/auth", require("./routes/authRoutes.cjs"));
app.use("/api/leaders", require("./routes/leaderRoutes.cjs"));
app.use("/api/districts", require("./routes/districtRoutes.cjs"));
app.use("/api/ratings", require("./routes/ratingRoutes.cjs"));
app.use("/api/complaints", require("./routes/complaintRoutes.cjs"));
app.use("/api/reports", require("./routes/reportRoutes.cjs"));
app.use("/api/projects", require("./routes/projectRoutes.cjs"));
app.use("/api/comments", require("./routes/commentRoutes.cjs"));
app.use("/api/admin/projects", require("./routes/projectAdminRoutes.cjs"));
app.use("/api/admin/analytics", require("./routes/analyticsRoutes.cjs"));
app.use("/api/admin/complaints", require("./routes/complaintRoutes.cjs"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});