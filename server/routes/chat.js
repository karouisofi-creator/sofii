import express from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

const SYSTEM_PROMPT = `
Tu es l'assistant vocal et textuel "DataFlow IA", intégré au sein de la plateforme DataFlow Assurance.
Tu es là pour aider les gestionnaires de sinistres santé de l'équipe Claims.
Tu interviens sur quatre grands domaines :
1. Aide sur la base de données SQL Server et les requêtes métier (Claims, rejets, taux de validation).
2. Orientation sur l'outil "Batch Processing" : recommander le bon batch selon le besoin exprimé.
3. Explications sur le module "Demandes de Reporting" et le formulaire de ticketing.
4. Connaissances générales sur les médicaments (remboursement, taux Sécu, ALD, molécules).

Règles de comportement :
- Sois professionnel, concis, et précis.
- Si on te pose une question hors du contexte de l'assurance santé ou de la plateforme technique DataFlow, rappelle poliment ton rôle.
- Pour les questions sur la base de données, n'invente pas de requêtes SQL complexes, donne simplement des pistes de logique métier ou oriente vers un Batch existant.
`;

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Le champ "messages" est requis et doit être un tableau.' })
    }

    if (!process.env.OPENROUTER_API_KEY) {
       // Fallback for development if no API key is provided
       return res.json({
         reply: "Je suis DataFlow IA. (Mode hors ligne : la clé d'API OpenRouter n'est pas configurée sur le serveur. Je ne peux pas traiter votre demande).",
       })
    }

    // Call OpenRouter API combining System Prompt and History
    const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
    ]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5173", // Optional, for OpenRouter rankings
        "X-Title": "DataFlow Assurance PFE", // Optional, for OpenRouter rankings
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "anthropic/claude-3.5-sonnet",
        "messages": apiMessages,
        "max_tokens": 1024
      })
    })

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API Error:", errorData);
        throw new Error(`OpenRouter API failed with status ${response.status}`);
    }

    const data = await response.json()

    res.json({
      reply: data.choices[0].message.content
    })

  } catch (error) {
    console.error('Erreur API Chatbot:', error)
    res.status(500).json({ 
      error: 'Erreur lors de la communication avec le Chatbot IA.',
      details: error.message 
    })
  }
})

export default router
