import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const appRoutes = Router();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

function cleanJSONResponse(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function generateInterviewQuestions(positionTitle, company, experience) {
  const prompt = `
You are an interview assistant. Generate 5 interview questions for a candidate applying for the position of "${positionTitle}" at "${company}" with an experience level of "${experience}".
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
  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });
  const rawText = result.text;
  const cleanedText = cleanJSONResponse(rawText);

  const parsed = JSON.parse(cleanedText);
  return parsed;
}

appRoutes.post("/generate-questions", async (req, res) => {
  const { positionTitle, company, experience } = req.body;
  if (!positionTitle || !company || !experience) {
    return res
      .status(400)
      .json({ error: "positionTitle, company, and experience are required" });
  }

  const questions = await generateInterviewQuestions(
    positionTitle,
    company,
    experience
  );
  res.json(questions);
});

//Generate reviews
const upload = multer();
const model = "gemini-1.5-flash";

import multer from "multer";
import * as fs from "node:fs";
import path from "path";

appRoutes.post(
  "/generate-reviews",
  upload.single("video"),
  async (req, res) => {
    const question = req.body.question;
    const company = req.body.company;
    const position = req.body.positionTitle;
    const experience = req.body.experience;
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
      const parsed = JSON.parse(cleanJSONResponse(result.text));
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

    const summaryData = JSON.parse(cleanJSONResponse(result.text));

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

    res.json({ review: reviewJson });
  }
});

export default appRoutes;
