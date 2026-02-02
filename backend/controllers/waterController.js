const db = require('../config/db');

// =====================
// 1. DATA TERBARU
// =====================
exports.latest = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT timestamp, distance_cm AS level
      FROM water_levels
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    if (rows.length === 0)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    const { timestamp, level } = rows[0];

    const status = 
      level <= 100 ? "Awas" :
      level <= 200 ? "Waspada" :
      "Aman";

    res.json({ timestamp, level, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil data terbaru" });
  }
};


// =====================
// 2. TAHUN DATA
// =====================
exports.years = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT YEAR(timestamp) AS year
      FROM water_levels
      ORDER BY year DESC
    `);

    res.json(rows.map(r => r.year));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil tahun" });
  }
};


// =====================
// 3. RIWAYAT (HISTORY)
// =====================
exports.history = async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = `
      SELECT 
        DATE(timestamp) AS date,
        ROUND(AVG(distance_cm), 2) AS avg_distance,
        ROUND(MIN(distance_cm), 2) AS min_distance,
        ROUND(MAX(distance_cm), 2) AS max_distance
      FROM water_levels
    `;

    const params = [];
    const conditions = [];

    if (year) {
      conditions.push("YEAR(timestamp) = ?");
      params.push(year);
    }

    if (month) {
      conditions.push("MONTH(timestamp) = ?");
      params.push(month);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY DATE(timestamp) ORDER BY date DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil riwayat" });
  }
};


// =====================
// 4. LIST SEMUA DATA
// =====================
exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, sensor_id, timestamp,
        distance_cm AS level
      FROM water_levels
      ORDER BY timestamp DESC
    `);

    if (!rows.length)
      return res.json({ message: "Belum ada data" });

    const data = rows.map(row => ({
      ...row,
      status:
        row.level < 20 ? "Bahaya" :
        row.level < 50 ? "Waspada" :
        "Aman"
    }));

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil data air" });
  }
};


// =====================
// 5. INSERT DATA
// =====================
exports.insert = async (req, res) => {
  try {
    const { sensor_id, distance_cm } = req.body;

    if (!sensor_id || !distance_cm)
      return res.status(400).json({ message: "Data tidak lengkap" });

    await db.query(
      "INSERT INTO water_levels (sensor_id, distance_cm) VALUES (?, ?)",
      [sensor_id, distance_cm]
    );

    // Kirim Telegram jika bahaya
    if (distance_cm < 40) {
      const { sendAlert } = require("../utils/telegram");

      await sendAlert(
        `🚨 <b>Peringatan Banjir!</b>\n` +
        `Sensor: <b>${sensor_id}</b>\n` +
        `Ketinggian air: <b>${distance_cm} cm</b>\n` +
        `Status: <b>Bahaya</b>\n\n` +
        `Segera lakukan tindakan pencegahan!`
      );
    }

    res.json({ message: "Data berhasil disimpan" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal simpan data" });
  }
};
