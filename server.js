const express = require("express");
const cors = require("cors");
const midtransClient = require("midtrans-client");

const app = express();

// Konfigurasi CORS penuh
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// 1. Inisialisasi Midtrans Snap SDK
// Mendukung pembacaan Server Key dari Environment Variable (proses cloud) atau fallback ke key kamu
const snap = new midtransClient.Snap({
  isProduction: false, // Gunakan mode Sandbox (ubah ke true jika sudah produksi)
  serverKey:
    process.env.MIDTRANS_SERVER_KEY || "Mid-server-bLGxyTKwa8IZlArWY_20lh4P",
});

// Endpoint Testing (Penting untuk cek status kesehatan server di cloud/Render)
app.get("/", (req, res) => {
  res.send("REWEAR Backend API berjalan dengan baik!");
});

// 2. Endpoint Pembuatan Token Transaksi
app.post("/api/create-snap-token", async (req, res) => {
  try {
    const { orderId, amount, customerName, customerEmail, items } = req.body;

    if (!orderId || !amount || !items) {
      return res.status(400).json({
        error:
          "Data transaksi tidak lengkap (orderId, amount, items wajib ada)",
      });
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(amount),
      },
      customer_details: {
        first_name: customerName || "Customer",
        email: customerEmail || "customer@mail.com",
      },
      item_details: items.map((item) => ({
        id: String(item.id),
        price: Number(item.price),
        quantity: Number(item.qty),
        name: item.title ? item.title.substring(0, 50) : "Item REWEAR", // Batasi max 50 karakter
      })),
    };

    // Membuat token via SDK Midtrans
    const transaction = await snap.createTransaction(parameter);

    console.log(`[SUCCESS] Token berhasil dibuat untuk Order ID: ${orderId}`);
    res.json({ token: transaction.token });
  } catch (error) {
    console.error("Error Detail Midtrans:", error.ApiResponse || error.message);
    res.status(500).json({
      error: "Gagal membuat transaksi",
      details: error.message,
    });
  }
});

// 3. Endpoint Filter Pendapatan Berdasarkan Tanggal
app.get("/api/admin/revenue-by-date", (req, res) => {
  try {
    const { date } = req.query; // Format tanggal: YYYY-MM-DD

    res.json({
      success: true,
      filterDate: date || "Semua Tanggal",
      totalRevenue: 0,
      message: `Data pendapatan untuk tanggal ${date || "semua"} berhasil dimuat`,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data pendapatan" });
  }
});

// 4. Jalankan Server di Port Dinamis (Mendukung Render & Localhost)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server REWEAR Backend berjalan pada port ${PORT}`);
});
