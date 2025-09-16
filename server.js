const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

let rounds = [];

// Upload CSV
app.post("/api/upload", upload.single("file"), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      rounds = results.map((r, i) => ({
        id: i + 1,
        odd: parseFloat(r.odd || r.Odd || 0),
        time: r.time || r.Time || new Date().toISOString(),
      }));
      res.json({ rounds });
    });
});

app.get("/api/rounds", (req, res) => {
  res.json({ rounds });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
