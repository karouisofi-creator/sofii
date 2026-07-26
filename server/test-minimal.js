import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Route de test simple
app.get("/ping", (req, res) => {
  res.json({ message: "pong", groqKey: !!process.env.GROQ_API_KEY });
});

// Route chat avec Groq
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  console.log("📩 Message:", message);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          { role: "system", content: "Tu es un assistant médical utile." },
          { role: "user", content: message },
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const reply = response.data.choices[0].message.content;
    console.log("✅ Réponse envoyée");
    res.json({ reply });
  } catch (error) {
    console.error(
      "❌ Erreur:",
      error.response?.data?.error?.message || error.message,
    );
    res.status(500).json({ error: "Erreur API Groq" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur TEST démarré sur http://localhost:${PORT}`);
  console.log(
    `🔑 GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "✅ Configurée" : "❌ Manquante"}`,
  );
  console.log(
    `📝 Test avec: curl -X POST http://localhost:${PORT}/chat -H "Content-Type: application/json" -d '{"message":"Bonjour"}'`,
  );
});
