const db = require("../config/db");

exports.list = async (req, res) => {
  try {
    // Ambil daftar sensor unik dari water_levels
    const [rows] = await db.query(`
      SELECT 
        sensor_id AS id,
        sensor_id AS name,
        'Rowosari' AS location,
        'Aktif' AS status
      FROM water_levels
      GROUP BY sensor_id
      ORDER BY sensor_id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Gagal ambil data sensor:", err);
    res.status(500).json({ message: "Gagal ambil data sensor" });
  }
};
