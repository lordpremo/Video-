import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------------------- HOME PAGE ----------------------
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Lord Broken — Video API</title>
        <style>
          body { background:#020617; color:#e5e7eb; font-family:system-ui; padding:24px; }
          h1 { color:#38bdf8; }
          code { background:#020617; padding:2px 6px; border-radius:4px; }
          .card { border:1px solid #1f2937; border-radius:10px; padding:12px; margin-top:10px; }
          pre { background:#020617; border-radius:6px; padding:8px; font-size:13px; }
        </style>
      </head>
      <body>
        <h1>Lord Broken — Stability Video API</h1>
        <p>Base URL: <code>https://your-render-domain.onrender.com</code></p>

        <div class="card">
          <div class="ep">POST /video</div>
          <p>Generate video using Stability Video.</p>
          <pre>Body:
{
  "prompt": "a cyberpunk city at night"
}</pre>
        </div>

        <p>Made by <b>Lord Broken</b></p>
      </body>
    </html>
  `);
});

// ---------------------- VIDEO (STABILITY VIDEO) ----------------------
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", "stable-video-core");
    form.append("output_format", "mp4");

    const r = await axios.post(
      "https://api.stability.ai/v2beta/stable-video/generate",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_KEY}`
        },
        responseType: "arraybuffer"
      }
    );

    const base64Video = Buffer.from(r.data).toString("base64");
    const videoUrl = `data:video/mp4;base64,${base64Video}`;

    res.json({ video_url: videoUrl });
  } catch (e) {
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lord Broken Video API running on port ${PORT}`);
});
