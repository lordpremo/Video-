import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------------------- AI CALL ----------------------
app.post("/call", async (req, res) => {
  try {
    const { audio_url } = req.body;
    if (!audio_url) return res.status(400).json({ error: "audio_url is required" });

    // 1. Deepgram → Speech to Text
    const stt = await axios.post(
      "https://api.deepgram.com/v1/listen",
      { url: audio_url },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const userText = stt.data.results.channels[0].alternatives[0].transcript;

    // 2. Groq → AI Response
    const ai = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an AI phone assistant." },
          { role: "user", content: userText }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = ai.data.choices[0].message.content;

    // 3. Deepgram TTS → Convert AI text to audio
    const tts = await axios.post(
      "https://api.deepgram.com/v1/speak",
      { text: aiText },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_KEY}`,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    const base64Audio = Buffer.from(tts.data).toString("base64");

    res.json({
      user_text: userText,
      ai_text: aiText,
      ai_audio: `data:audio/mp3;base64,${base64Audio}`
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------- START SERVER ----------------------
app.listen(3000, () => {
  console.log("AI Call API running on port 3000");
});
