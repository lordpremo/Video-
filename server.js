import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";
import { writeFile } from "fs/promises";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY
});

// ---------------------- HOME PAGE ----------------------
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Lord Broken — Replicate Video API</title>
        <style>
          body { background:#020617; color:#e5e7eb; font-family:system-ui; padding:24px; }
          h1 { color:#38bdf8; }
          code { background:#020617; padding:2px 6px; border-radius:4px; }
          .card { border:1px solid #1f2937; border-radius:10px; padding:12px; margin-top:10px; }
          pre { background:#020617; border-radius:6px; padding:8px; font-size:13px; }
        </style>
      </head>
      <body>
        <h1>Lord Broken — Replicate Video API</h1>
        <p>POST /video to generate video</p>

        <div class="card">
          <div class="ep">POST /video</div>
          <pre>Body:
{
  "prompt": "a woman walking in Tokyo at night"
}</pre>
        </div>

        <p>Made by <b>Lord Broken</b></p>
      </body>
    </html>
  `);
});

// ---------------------- VIDEO GENERATION ----------------------
app.post("/video", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const output = await replicate.run("minimax/video-01", {
      input: { prompt }
    });

    res.json({
      video_url: output.url
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lord Broken Replicate Video API running on port ${PORT}`);
});
