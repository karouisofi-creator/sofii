import express from "express";
import groq from "../utils/groqClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call Groq chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      model: "openai/gpt-oss-20b", // Groq model
    });

    const reply =
      chatCompletion.choices[0]?.message?.content || "No response from AI";

    res.json({ reply });
  } catch (error) {
    console.error("Groq AI ERROR:", error);
    res.status(500).json({ error: "Error communicating with Groq AI" });
  }
});

export default router;
