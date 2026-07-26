import axios from "axios";

class GroqClient {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = "https://api.groq.com/openai/v1";
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  async chatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY not configured");
    }

    const defaultOptions = {
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
    };

    const response = await this.client.post("/chat/completions", {
      messages,
      ...defaultOptions,
      ...options,
    });

    return response.data;
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

export default new GroqClient();
