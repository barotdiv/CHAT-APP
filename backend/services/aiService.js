import { GoogleGenerativeAI } from '@google/generative-ai';

// Supported Gemini Models list in order of preference
const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
].filter(Boolean);

const BASE_SYSTEM_INSTRUCTION = "You are a helpful AI assistant. If the user asks you to generate, draw, or create an image of something, you must respond with EXACTLY this URL string format and nothing else: https://image.pollinations.ai/prompt/{url_encoded_prompt} (where {url_encoded_prompt} is a highly detailed, comma-separated visual description of the requested image with spaces replaced by %20). Do not include any markdown syntax or other text in your reply when generating an image.";

/**
 * Exponential Backoff Retry Helper
 */
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isRetryable = err.status === 429 || err.status >= 500 || err.message?.includes('fetch failed') || err.message?.includes('ETIMEDOUT');
      if (!isRetryable || attempt >= retries) {
        throw err;
      }
      console.warn(`[AI Service] Attempt ${attempt} failed with error: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

/**
 * Helper to limit history window
 */
function prepareContextHistory(history, maxTurns = 20) {
  if (!history || history.length === 0) return [];
  return history.slice(-maxTurns);
}

/**
 * Normalizes error messages to provide clear actionable feedback
 */
export function formatAIError(error) {
  console.error("[AI Service Error]:", error);
  const msg = error?.message || String(error);

  if (msg.includes("401") || msg.includes("API key not valid")) {
    return "Gemini API 401 Unauthorized: Invalid API key. Please set a valid GEMINI_API_KEY in backend/.env from https://aistudio.google.com/app/apikey";
  }
  if (msg.includes("429") || msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini API Rate Limit Exceeded: You have hit the API rate limit or quota. Please wait a moment and try again.";
  }
  if (msg.includes("SAFETY")) {
    return "Response blocked by Gemini safety filters. Please rephrase your request.";
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT") || msg.includes("abort")) {
    return "Gemini API Request Timed Out: The AI service took too long to respond. Please try again.";
  }
  return msg || "An unexpected error occurred while communicating with the Gemini API.";
}

/**
 * Streams AI responses chunk by chunk and returns token usage statistics upon completion.
 * 
 * @param {Object} params
 * @param {Array} params.formattedHistory - History formatted for Gemini chat
 * @param {Array} params.currentMessageParts - Parts array for the current prompt (text + optional image)
 * @param {Function} params.onChunk - Callback invoked with each text delta
 * @param {string} params.requestedModel - Specific model requested by user/chat
 * @param {string} params.customSystemInstruction - Custom system prompt override
 * @param {number} params.timeoutMs - Request timeout limit in milliseconds
 * @returns {Promise<Object>} Returns { fullText, usage: { promptTokens, candidateTokens, totalTokens, model } }
 */
export async function streamChatResponse({
  formattedHistory = [],
  currentMessageParts = [],
  onChunk = () => {},
  requestedModel = null,
  customSystemInstruction = null,
  timeoutMs = 60000
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith("AQ.")) {
    throw new Error("Invalid or missing GEMINI_API_KEY in backend/.env. Please get a free key from https://aistudio.google.com/app/apikey");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const sanitizedHistory = prepareContextHistory(formattedHistory);

  // Combine system instruction if custom instruction provided
  const effectiveSystemInstruction = customSystemInstruction && customSystemInstruction.trim()
    ? `${customSystemInstruction.trim()}\n\n${BASE_SYSTEM_INSTRUCTION}`
    : BASE_SYSTEM_INSTRUCTION;

  // Build model priority list starting with requestedModel if provided
  const modelsToTry = [
    requestedModel,
    ...DEFAULT_MODELS
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: effectiveSystemInstruction
      });

      const chatSession = model.startChat({ history: sanitizedHistory });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let resultStream;
      try {
        resultStream = await retryWithBackoff(async () => {
          return await chatSession.sendMessageStream(currentMessageParts);
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let fullText = "";
      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }

      let promptTokens = 0;
      let candidateTokens = 0;
      let totalTokens = 0;

      try {
        const responseMeta = await resultStream.response;
        if (responseMeta && responseMeta.usageMetadata) {
          promptTokens = responseMeta.usageMetadata.promptTokenCount || 0;
          candidateTokens = responseMeta.usageMetadata.candidatesTokenCount || 0;
          totalTokens = responseMeta.usageMetadata.totalTokenCount || (promptTokens + candidateTokens);
        }
      } catch (usageErr) {
        promptTokens = Math.ceil((JSON.stringify(sanitizedHistory).length + JSON.stringify(currentMessageParts).length) / 4);
        candidateTokens = Math.ceil(fullText.length / 4);
        totalTokens = promptTokens + candidateTokens;
      }

      return {
        fullText,
        usage: {
          promptTokens,
          candidateTokens,
          totalTokens,
          model: modelName
        }
      };

    } catch (err) {
      console.warn(`[AI Service] Model '${modelName}' encountered error:`, err.message);
      lastError = err;
      if (!err.message?.includes("404") && !err.message?.includes("not found")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate response with available Gemini models.");
}
