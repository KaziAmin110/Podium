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

// --- Helpers ---
function cleanJSONResponse(text) {
  return text.replace(/```json|```/g, "").trim();
}

// --- Test ---
appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

// --- Generate Questions ---
async function generateInterviewQuestions(positionTitle, company, experience, count) {
  const prompt = `
You are an interview assistant. Generate "${count}" interview questions for a candidate applying for the position of "${positionTitle}" at "${company}" with an experience level of "${experience}".
If the company listed is small and unknown, ask more general questions. If the company is large, ask company-specific questions and general questions.
Respond ONLY in this JSON format:
{
  "0": "First question?",
  "1": "Second question?",
  "2": "Third question?",
  "3": "Fourth question?",
  "4": "Fifth question?"
}
`;
  const result = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: prompt });
  const rawText = result.text;
  return JSON.parse(cleanJSONResponse(rawText));
}

appRoutes.post("/generate-questions", async (req, res) => {
  const { positionTitle = "unknown", company = "unknown", experience = "unknown", count = 5, userId } = req.body;
  try {
    const questions = await generateInterviewQuestions(positionTitle, company, experience, count);

    const { error } = await supabase.from("questions").insert({
      user_id: userId,
      position_title: positionTitle,
      company,
      experience,
      questions,
    });

    if (error) throw error;
    res.json(questions);
  } catch (err) {
    console.error("❌ Failed to generate or store questions:", err);
    res.status(500).json({ error: "Failed to generate or store questions", detail: err.message });
  }
});

// --- Generate Reviews ---
appRoutes.post("/generate-reviews", upload.single("video"), async (req, res) => {
  const { userId, question = "unknown", company = "unknown", positionTitle = "unknown", experience = "unknown", questionIndex } = req.body;

  const tempPath = path.resolve("./temp/video.mp4");
  await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
  await fs.promises.writeFile(tempPath, req.file.buffer);

  const base64VideoFile = fs.readFileSync(tempPath, { encoding: "base64" });

  const contents = [
    {
      inlineData: {
        mimeType: "video/mp4",
        data: base64VideoFile,
      },
    },
    {
      text: `
Review the candidate's answer to this interview question harshly and score it from 1 to 10.
You are also responding to the user; you are supposed to give advice. Make sure to address them as "you"
Tell them their faults but also tell them how to improve in overall feedback.
Make sure to take posture and how they look into account but it should not overshadow their actual knowledge.

Provide a JSON output with these keys:
- score (int)
- strengths (list of strings)
- weaknesses (list of strings)
- overall_feedback (string)

Do not add any extra formatting or text outside the JSON.

The company is "${company}".
The position is "${positionTitle}".
The experience level is "${experience}".

Question: "${question}".
`
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const parsed = JSON.parse(cleanJSONResponse(response.text));

    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      question,
      question_index: parseInt(questionIndex),
      position: positionTitle,
      company,
      experience,
      score: parsed.score,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      overall_feedback: parsed.overall_feedback
    });

    if (error) throw error;
    res.json({ review: parsed });
  } catch (err) {
    console.error("❌ Review generation failed:", err);
    res.status(500).json({ error: "Failed to generate review", detail: err.message });
  } finally {
    try {
      await fs.promises.unlink(tempPath);
    } catch (cleanupErr) {
      console.warn("⚠️ Temp cleanup failed:", cleanupErr.message);
    }
  }
});

// --- Generate Summary ---
appRoutes.post("/generate-summary", async (req, res) => {
  const { userId } = req.body;

  try {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("question_index", { ascending: true });

    if (error) throw error;
    if (!reviews || reviews.length === 0) {
      return res.status(400).json({ error: "No reviews found for summary" });
    }

    const summaryPrompt = `
You are a professional interview coach. Based on the following reviews, summarize the user's performance.

Give a brief performance summary, 3 improvement tips, and a final score out of 10. Use JSON with:
- summary (string)
- tips (array of strings)
- score (int)

Only return the JSON.

${reviews.map((r, i) => `Question ${i + 1}: ${r.question}\nFeedback: ${r.overall_feedback}`).join("\n\n")}
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: summaryPrompt,
    });

    const parsed = JSON.parse(cleanJSONResponse(response.text));

    const { error: insertError } = await supabase.from("summaries").insert({
      user_id: userId,
      summary: parsed.summary,
      tips: parsed.tips,
      score: parsed.score
    });

    if (insertError) throw insertError;

    res.json(parsed);
  } catch (err) {
    console.error("❌ Summary generation failed:", err);
    res.status(500).json({ error: "Failed to generate summary", detail: err.message });
  }
});

export default appRoutes;
