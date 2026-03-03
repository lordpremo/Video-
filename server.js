import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// ---------------------- VOICE CHAT ----------------------
app.post("/voice-chat", async (req, res) => {
  try {
    const { audio_url, audio_base64 } = req.body;

    if (!audio_url && !audio_base64) {
      return res.status(400).json({ error: "audio_url or audio_base64 required" });
    }

    // ---------------------- 1. Deepgram STT ----------------------
    const sttPayload = audio_url
      ? { url: audio_url }
      : { buffer: audio_base64 };

    const stt = await axios.post(
      "https://api.deepgram.com/v1/listen",
      sttPayload,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const userText =
      stt.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    // ---------------------- 2. Groq LLM ----------------------
    const ai = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a friendly voice assistant." },
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

    // ---------------------- 3. Deepgram TTS ----------------------
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

    // ---------------------- 4. Return voice response ----------------------
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
  console.log("Voice Chat API running on port 3000");
});
