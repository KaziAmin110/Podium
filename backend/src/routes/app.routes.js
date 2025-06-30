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
const flash_model = "gemini-1.5-flash";
const pro_model = "gemini-2.5-pro";

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
    model: flash_model,
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
      // Validate required fields
      const { question, company, position, experience } = req.body;

      if (!question || !company || !position || !experience) {
        console.log("Missing required fields:");
        return res.status(400).json({
          error:
            "Missing required fields: question, company, positionTitle, and experience are required",
        });
      }

      if (!req.file) {
        console.log("Video file is required");
        return res.status(400).json({
          error: "Video file is required",
        });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith("video/")) {
        console.log("Uploaded file is not a video");
        return res.status(400).json({
          error: "Uploaded file must be a video",
        });
      }

      // Create unique temp file path to avoid conflicts
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      tempPath = path.resolve(`./temp/video_${timestamp}_${randomId}.mp4`);

      // Ensure temp directory exists
      await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
      await fs.promises.writeFile(tempPath, req.file.buffer);

      // Convert video to base64
      const base64VideoFile = await fs.promises.readFile(tempPath, {
        encoding: "base64",
      });

      const contents = [
        {
          inlineData: {
            mimeType: req.file.mimetype, // Use actual mimetype from uploaded file
            data: base64VideoFile,
          },
        },
        {
          text: `Review the candidate's answer to this interview question honestly and score the response from 1 to 10. You are responding directly to the candidate; address them as "you" and provide constructive feedback on their faults while also giving specific advice on how to improve.

Provide a JSON output with these keys:
- score (integer from 1-10)
- strengths (array of strings)
- weaknesses (array of strings)  
- overall_feedback (string with specific, actionable advice)

Do not add any extra formatting or text outside the JSON.

Interview Context:
- Company: "${company}"
- Position: "${position}"
- Experience Level: "${experience}"
- Question: "${question}"

Please analyze the candidate's video response and provide detailed feedback.`,
        },
      ];

      // Generate content using AI
      const response = await ai.models.generateContent({
        model: pro_model, // Updated to newer model
        contents,
      });

      // Clean up temp file immediately after processing
      if (tempPath) {
        try {
          await fs.promises.unlink(tempPath);
          tempPath = null; // Reset to avoid double cleanup
        } catch (unlinkError) {
          console.warn(
            "Warning: Could not delete temp file:",
            unlinkError.message
          );
        }
      }

      // Parse and validate AI response
      let reviewJson;
      try {
        const cleanedResponse = cleanJSONResponse(response.text);
        reviewJson = JSON.parse(cleanedResponse);

        // Validate required fields in response
        if (
          !reviewJson.score ||
          !reviewJson.strengths ||
          !reviewJson.weaknesses ||
          !reviewJson.overall_feedback
        ) {
          throw new Error("Invalid AI response format");
        }

        // Validate score is within range
        if (reviewJson.score < 1 || reviewJson.score > 10) {
          reviewJson.score = Math.max(1, Math.min(10, reviewJson.score));
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        return res.status(500).json({
          error: "Failed to parse AI response. Please try again.",
        });
      }

      return res.json({
        success: true,
        review: reviewJson,
      });
    } catch (error) {
      console.error("Error generating review:", error);

      // Clean up temp file in case of error
      if (tempPath) {
        try {
          await fs.promises.unlink(tempPath);
        } catch (unlinkError) {
          console.warn(
            "Warning: Could not delete temp file after error:",
            unlinkError.message
          );
        }
      }

      // Return appropriate error response
      if (error.message.includes("Video file is required")) {
        console.log("Video file is required");
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({
        error: "Failed to generate review. Please try again.",
      });
    }
  }
);

export default appRoutes;
