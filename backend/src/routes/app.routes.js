import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import * as fs from "node:fs";
import path from "path";
import rateLimit from "express-rate-limit";

dotenv.config();

const appRoutes = Router();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

//Generate reviews
const upload = multer();
const flash_model = "gemini-2.5-flash";
const pro_model = "gemini-2.5-pro";

// Rate limiting configurations
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for AI-powered endpoints
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 AI requests per hour
  message: {
    error:
      "AI request limit exceeded. Please wait before making more requests.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limit for video processing (resource intensive)
const videoRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 video uploads per hour
  message: {
    error:
      "Video processing limit exceeded. Please wait before uploading more videos.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
appRoutes.use(generalRateLimit);

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
    `You are an expert Interview Question Generator. Your role is to give the most relevant interview questions for a candidate applying for a job at ${company} with the title "${positionTitle}. These Questions should be behavioral in nature and not technical. Prefer questions which have been asked more frequently at the given company".

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
    model: flash_model,
    contents: prompt,
  });
  const rawText = result.text;
  const cleanedText = cleanJSONResponse(rawText);

  const parsed = JSON.parse(cleanedText);
  return parsed;
}

// Generate interview questions with AI rate limiting
appRoutes.post("/generate-questions", aiRateLimit, async (req, res) => {
  const { positionTitle, company, experience, count } = req.body;

  if (!positionTitle || !company || !experience || !count) {
    return res.status(400).json({
      error: "positionTitle, company, experience, and count are required",
    });
  }

  try {
    const questions = await generateInterviewQuestions(
      positionTitle,
      company,
      experience,
      count
    );
    return res.json(questions);
  } catch (error) {
    console.error("Error generating questions:", error);
    return res.status(500).json({
      error: "Failed to generate interview questions",
    });
  }
});

// Route for generating reviews with both AI and video rate limiting
appRoutes.post(
  "/generate-reviews",
  videoRateLimit, // Apply video-specific rate limit first
  aiRateLimit, // Then apply AI rate limit
  upload.single("video"),
  async (req, res) => {
    // Generate unique filename using timestamp and random number
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempPath = path.resolve(`./temp/video_${uniqueId}.mp4`);

    try {
      const question = req.body.question;
      const company = req.body.company;
      const position = req.body.positionTitle;
      const experience = req.body.experience;

      if (!req.file) {
        throw new Error("Video file is required");
      }

      // Ensure temp directory exists
      await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });

      // Write the uploaded file to unique temp path
      await fs.promises.writeFile(tempPath, req.file.buffer);

      // Read the file as base64
      const base64VideoFile = fs.readFileSync(tempPath, { encoding: "base64" });

      const contents = [
        {
          inlineData: {
            mimeType: "video/mp4",
            data: base64VideoFile,
          },
        },
        {
          text: `Take on the role of a hiring manager at ${company}. Review the candidate's answer to this interview question honestly and score the response from 1 to 10. You are also responding to the user; you are supposed to give genuine applicable advice. Make sure to address them as "you" Tell them their faults but also tell them how to improve in overall feedback. If a video response doesnt answer the question, does not contain any content, score it 0.

Provide a JSON output with these keys:
- score (int)
- strengths (list of strings)
- weaknesses (list of strings)
- overall_feedback (string)
- overall_tips (list of strings)

Do not add any extra formatting or text outside the JSON.

The company is "${company}". The position is "${position}". The experience level is "${experience}".

Question: "${question}".`,
        },
      ];

      const response = await ai.models.generateContent({
        model: pro_model,
        contents,
      });

      // Clean up: delete the temporary file
      await fs.promises.unlink(tempPath);

      const reviewJson = JSON.parse(cleanJSONResponse(response.text));

      return res.json({ review: reviewJson });
    } catch (error) {
      console.error("Error generating review:", error);

      // Clean up: delete temp file even if there's an error
      try {
        await fs.promises.unlink(tempPath);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError);
      }

      res.status(500).json({ error: "Failed to generate review" });
      return;
    }
  }
);

export default appRoutes;
