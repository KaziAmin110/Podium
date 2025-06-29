import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";
import * as fs from "node:fs";
import path from "path";
import { supabase } from "../utils/supabaseClient.js";

dotenv.config();

const appRoutes = Router();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const upload = multer();
const TEMP_DIR = "./temp";

// --- Helpers ---
function cleanJSONResponse(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function ensureTempDir() {
  await fs.promises.mkdir(TEMP_DIR, { recursive: true });
}

async function saveTempFile(fileBuffer, filename) {
  const filePath = path.join(TEMP_DIR, filename);
  await fs.promises.writeFile(filePath, fileBuffer);
  return filePath;
}

// --- Test Route ---
appRoutes.get("/test", (req, res) => {
  res.send("Hello from DevPodium backend!");
});

// --- 1. Generate Interview Questions ---
appRoutes.post("/generate-questions", async (req, res) => {
  const {
    userId,
    positionTitle = "unknown",
    company = "unknown",
    experience = "unknown",
    count = 5
  } = req.body;

  const prompt = `
You are an interview assistant. Generate "${count}" interview questions for a candidate applying for "${positionTitle}" at "${company}" with an experience level of "${experience}".
Respond ONLY in this JSON format:
{
  "0": "Question 1?",
  "1": "Question 2?",
  ...
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const parsed = JSON.parse(cleanJSONResponse(response.text));
    const questions = Object.values(parsed);

    res.json({ questions });
  } catch (err) {
    console.error("❌ Question generation failed:", err);
    res.status(500).json({ error: "Failed to generate questions", detail: err.message });
  }
});

// --- 2. Submit All Reviews + Summary ---
appRoutes.post("/submit-all-reviews", upload.array("videos"), async (req, res) => {
  const {
    userId,
    positionTitle = "unknown",
    company = "unknown",
    experience = "unknown",
    questions: rawQuestions
  } = req.body;

  const questions = JSON.parse(rawQuestions);
  const files = req.files;

  if (!questions || !files || files.length !== questions.length) {
    return res.status(400).json({ error: "Mismatch between questions and video files" });
  }

  await ensureTempDir();

  const feedbacks = [];

  // --- Step 1: Generate feedback for each question ---
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const file = files[i];
    const tempPath = await saveTempFile(file.buffer, `video-${i}.mp4`);
    const base64 = fs.readFileSync(tempPath, { encoding: "base64" });

    const contents = [
      {
        inlineData: {
          mimeType: "video/mp4",
          data: base64,
        },
      },
      {
        text: `
You are a strict evaluation assistant. You must ONLY return a valid JSON object with no extra explanation or commentary.

Review the candidate’s answer to this interview question harshly and score it from 1 to 10.

Speak directly to the user in second person ("you"). Focus on their knowledge, communication, and body language.

⚠️ Return only this valid JSON format, with nothing else:
{
  "score": int,
  "strengths": [string],
  "weaknesses": [string],
  "overall_feedback": string
}

Company: "${company}"
Position: "${positionTitle}"
Experience: "${experience}"
Question: "${question}"
`
      }
    ];

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const cleaned = cleanJSONResponse(result.text);
      if (!cleaned.trim().startsWith("{")) throw new Error("Non-JSON response from Gemini");

      const parsed = JSON.parse(cleaned);
      if (!parsed.overall_feedback) throw new Error("Missing field in Gemini response");

      feedbacks.push({ question, ...parsed });
    } catch (err) {
      console.error(`❌ Failed to analyze question ${i}:`, err);
      feedbacks.push({ question, error: "Analysis failed" });
    }

    await fs.promises.unlink(tempPath).catch(() => {});
  }

  // --- Step 2: Generate summary ---
  const summaryPrompt = `
You are an interview coach. Based on the following feedbacks, summarize the user's overall performance.

Return this JSON:
{
  "summary": string,
  "tips": [string],
  "score": int
}

${feedbacks
  .map((fb, i) => `Q${i + 1}: ${fb.question}\nFeedback: ${fb.overall_feedback ?? "Skipped"}`)
  .join("\n\n")}
`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: summaryPrompt,
    });

    const cleaned = cleanJSONResponse(result.text);
    if (!cleaned.trim().startsWith("{")) throw new Error("Invalid summary format");

    const summaryData = JSON.parse(cleaned);

    // --- Step 3: Store in Supabase ---
    const { error } = await supabase.from("interview_feedbacks").insert({
      user_id: userId,
      position: positionTitle,
      company,
      experience,
      questions,
      feedbacks,
      summary: summaryData.summary,
      tips: summaryData.tips,
      final_score: summaryData.score
    });

    if (error) throw error;

    res.json({
      feedbacks,
      summary: summaryData.summary,
      tips: summaryData.tips,
      score: summaryData.score
    });
  } catch (err) {
    console.error("❌ Summary or DB insert failed:", err);
    res.status(500).json({ error: "Failed to generate summary or save results", detail: err.message });
  }
});



export default appRoutes;
