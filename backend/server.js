// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// load HF token
const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_API_KEY;
if (!HF_TOKEN) {
  console.error("Missing HF_TOKEN in .env");
  // we still start, but requests will fail with helpful message
}

const client = new InferenceClient(HF_TOKEN);

// MODEL: change here if you deploy a dedicated HF Inference Endpoint
const MODEL_NAME = "meta-llama/Llama-3.1-8B-Instruct";

// safety limits (character counts — approximate)
// Llama-3.1-8B supports many tokens but keep a margin. Adjust if you know your provider limits.
const MAX_INPUT_CHARS = 6000;

app.get("/", (req, res) => {
  res.send("✅ AI Code Explainer backend running.");
});

/**
 * POST /explain
 * body: { codeSnippet: string }
 * returns: { explanation: string }
 */
app.post("/explain", async (req, res) => {
  try {
    const { codeSnippet } = req.body ?? {};

    if (!codeSnippet || typeof codeSnippet !== "string" || !codeSnippet.trim()) {
      return res.status(400).json({ explanation: "⚠️ Please provide code in `codeSnippet`." });
    }

    // input length check
    if (codeSnippet.length > MAX_INPUT_CHARS) {
      return res.status(413).json({
        explanation: `⚠️ Code too long (${codeSnippet.length} chars). Please shorten to under ${MAX_INPUT_CHARS} characters.`,
      });
    }

    // build messages for instruction-style model
    const messages = [
      {
        role: "system",
        content:
          "You are an assistant that explains code clearly and simply. " +
          "Break it down step-by-step, describe important lines, and summarize the overall behavior. " +
          "Give time/space complexity if you can, and show a short example if helpful.",
      },
      {
        role: "user",
        content: `Please explain the following code:\n\n${codeSnippet}`,
      },
    ];

    let explanation = "";

    // stream output from Hugging Face InferenceClient
    try {
      for await (const chunk of client.chatCompletionStream({
        model: MODEL_NAME,
        messages,
        max_tokens: 600,
        temperature: 0.1,
      })) {
        // chunk structure can vary — try several common fields
        const delta =
          chunk?.choices?.[0]?.delta?.content ||
          chunk?.choices?.[0]?.message?.content ||
          chunk?.generated_text;
        if (delta) {
          explanation += delta;
        }
      }

      // If explanation empty, fallback to a minimal message
      if (!explanation.trim()) {
        explanation = "⚠️ AI returned an empty explanation. Try a smaller snippet or a different model.";
      }

      return res.json({ explanation: explanation.trim() });
    } catch (hfErr) {
      // Detect the common situation where no provider is available
      const errMsg = hfErr?.message ?? String(hfErr);
      console.error("Hugging Face streaming error:", errMsg);

      if (errMsg.includes("No Inference Provider") || errMsg.includes("Auto selected provider: undefined")) {
        return res.status(502).json({
          explanation:
            "❌ No Inference Provider available for the requested model. " +
            "This means your Hugging Face token cannot use that hosted model. Options:\n" +
            " • Deploy the model as a Hugging Face Inference Endpoint for your account (recommended for meta-llama/Llama-3.1-8B-Instruct),\n" +
            " • Use a smaller publicly-hosted model (e.g., gpt2 or bloom-560m) by changing MODEL_NAME,\n" +
            " • Or run a local inference server and point the backend to it.\n" +
            `\n\n(Original error: ${errMsg})`,
        });
      }

      // Generic HF error fallback
      return res.status(500).json({
        explanation: `❌ Hugging Face error: ${errMsg}`,
      });
    }
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ explanation: "❌ Unexpected server error" });
  }
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
