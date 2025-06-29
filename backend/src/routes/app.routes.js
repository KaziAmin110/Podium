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
Review the candidate's answer to this interview question harshly and score it from 1 to 10.
You are also responding to the user; you are supposed to give advice. Make sure to address them as "you"
Tell them their faults but also tell them how to improve in overall feedback

Provide a JSON output with these keys:
- score (int)
- strengths (list of strings)
- weaknesses (list of strings)
- overall_feedback (string)

Do not add any extra formatting or text outside the JSON.

The company is "${company}".
The position is "${position}".
The experience level is "${experience}".

Question: "${question}".
`,
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    await fs.promises.unlink(tempPath);

    const reviewJson = JSON.parse(cleanJSONResponse(response.text));

    res.json({ review: reviewJson });
  }
);

export default appRoutes;
