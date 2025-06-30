import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import * as fs from "node:fs";
import path from "path";

dotenv.config();

const appRoutes = Router();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

//Generate reviews
const upload = multer();
const model = "gemini-1.5-flash";

appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

// Helper function to validate required fields
function cleanJSONResponse(text) {
  return text.replace(/```json|```/g, "").trim();
}

function validateRequestData(req) {
  const { question, company, position, experience } = req.body;
  const errors = [];

  if (!question || question.trim() === "") {
    errors.push("Question is required");
  }
  if (!company || company.trim() === "") {
    errors.push("Company is required");
  }
  if (!position || position.trim() === "") {
    errors.push("Position is required");
  }
  if (!experience || experience.trim() === "") {
    errors.push("Experience level is required");
  }
  if (!req.file) {
    errors.push("Video file is required");
  }

  return errors;
}

async function generateInterviewQuestions(
  positionTitle,
  company,
  experience,
  count
) {
  const prompt =
    `You are an expert Interview Question Generator. Your role is to act as a seasoned hiring manager for the specified company.

Your task is to generate exactly ${count} diverse and realistic interview questions for a candidate with the following profile:
- Company: "${company}"
- Position: "${positionTitle}"
- Experience Level: "${experience}"

The questions must be a thoughtful mix covering several of the following key areas:
- Technical skills relevant to the role (e.g., algorithms, system design, language-specific knowledge)
- Behavioral and situational judgment
- Problem-solving and analytical thinking
- Teamwork and collaboration
- Cultural alignment with "${company}"

**CRITICAL INSTRUCTIONS FOR OUTPUT:**
1.  You MUST generate exactly ${count} questions.
2.  Your response must be ONLY a single, valid JSON object.
3.  The JSON object must contain keys as strings, starting from "0" and incrementing for each question.
4.  Do NOT include any introductory text, explanations, or markdown formatting like \`\`\`json before or after the JSON object.

**EXAMPLE OUTPUT for count = 3:**
{
  "0": "This would be the first generated question, tailored to the role.",
  "1": "This would be the second, distinct question.",
  "2": "This would be the third and final question."
}
`.trim();
  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });
  const rawText = result.text;
  const cleanedText = cleanJSONResponse(rawText);

  const parsed = JSON.parse(cleanedText);
  return parsed;
}

// Generate interview questions
appRoutes.post("/generate-questions", async (req, res) => {
  const { positionTitle, company, experience, count } = req.body;

  if (!positionTitle || !company || !experience || !count) {
    return res.status(400).json({
      error: "positionTitle, company, experience, and count are required",
    });
  }

  const questions = await generateInterviewQuestions(
    positionTitle,
    company,
    experience,
    count
  );
  return res.json(questions);
});

// Route for generating reviews
appRoutes.post(
  "/generate-reviews",
  upload.single("video"),
  async (req, res) => {
    try {
      const question = req.body.question;
      const company = req.body.company;
      const position = req.body.positionTitle;
      const experience = req.body.experience;
      const tempPath = path.resolve("./temp/video.mp4");

      if (!req.file) {
        throw new Error("Video file is required");
      }

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
Review the candidate's answer to this interview question honestly and score the response from 1 to 10.
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

      return res.json({ review: reviewJson });
    } catch (error) {
      console.error("Error generating review:", error);
      res.status(500).json({ error: "Failed to generate review" });
      return;
    }
  }
);

export default appRoutes;
