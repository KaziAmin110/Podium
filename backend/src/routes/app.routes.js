import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

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
The list size should be the same as the question count, meaning no null values should appear in the json you return.
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

// Generate interview questions
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

// Helper function to validate required fields
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

// Route for generating reviews
appRoutes.post(
  "/generate-reviews",
  upload.single("video"),
  async (req, res) => {
    let tempPath = null;

    try {
      // Validate request data
      const validationErrors = validateRequestData(req);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      const { question, company, position, experience } = req.body;

      // Validate file size (optional - adjust limit as needed)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxFileSize) {
        return res.status(400).json({
          error: "File too large",
          message: "Video file must be smaller than 50MB",
        });
      }

      // Validate file type
      const allowedMimeTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
          message: "Only MP4, MPEG, MOV, and AVI files are allowed",
        });
      }

      // Generate unique filename to prevent conflicts
      const uniqueId = uuidv4();
      const fileExtension = path.extname(req.file.originalname) || ".mp4";
      tempPath = path.resolve(`./temp/video_${uniqueId}${fileExtension}`);

      // Ensure temp directory exists
      await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });

      // Write video file to temp location
      await fs.promises.writeFile(tempPath, req.file.buffer);

      // Convert to base64
      const base64VideoFile = await fs.promises.readFile(tempPath, {
        encoding: "base64",
      });

      console.log("Comopany :", company);
      console.log("Position :", position);
      console.log("Experience :", experience);

      // Construct the prompt for Gemini
      const prompt = `
You are an expert AI Interview Coach for a platform named "Podium". Your mission is to provide world-class, constructive, and actionable feedback to help users ace their job interviews. You are providing feedback directly to the user who is practicing for an interview.

Analyze the user's spoken answer to the provided video based on the context of the company, position, and the user's experience level.

**Evaluation Criteria:**
When reviewing the answer, focus on the following key areas:
1.  **Clarity & Structure:** Is the answer well-organized, easy to follow, and concise? For behavioral questions, does it effectively use a structure like the STAR method (Situation, Task, Action, Result)?
2.  **Relevance & Specificity:** Does the answer directly address the question? Does it provide concrete examples, data, or metrics to support the claims, or is it too general?
3.  **Impact & Results:** Does the user effectively communicate the impact of their actions and the positive results they achieved?
4.  **Alignment:** How well is the answer tailored to the specific **${position}**, the values of **${company}**, and the expectations for a candidate with an **${experience}** level?

**Feedback Style:**
- Address the user directly as "you".
- The tone should be encouraging yet professional, like a real interview coach.
- For weaknesses, provide specific, actionable suggestions for improvement. For example, instead of saying "You were too vague," suggest "You could strengthen this by adding a specific metric, like the percentage of efficiency you increased."

**Scoring Rubric (1-10):**
Use this scale to guide your score:
- **1-3:** Needs major revision. The answer is unclear, irrelevant, or fails to address the question.
- **4-6:** Good start, but has significant room for improvement in structure, specificity, or impact.
- **7-8:** Solid, competent answer. Well-structured and relevant, with minor areas for refinement.
- **9-10:** Exceptional, hire-worthy answer. It is clear, compelling, data-driven, and perfectly aligned with the role.

**Context:**
- Company: "${company}"
- Position: "${position}"
- Experience Level: "${experience}"
- Question: "${question}"

Provide your response as a single, valid JSON object with exactly these keys:
- score (integer from 1-10)
- strengths (array of strings)
- weaknesses (array of strings)
- overall_feedback (string summarizing the key takeaways and encouragement)

Do not include any text, code blocks, or explanations outside of the final JSON object`.trim();

      const contents = [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64VideoFile,
          },
        },
        {
          text: prompt,
        },
      ];

      // Call Gemini API
      console.log(
        `Analyzing video for question: ${question.substring(0, 50)}...`
      );

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents,
      });

      if (!response || !response.text) {
        throw new Error("No response received from AI model");
      }

      // Parse the JSON response
      let reviewJson;
      try {
        const cleanedResponse = cleanJSONResponse(response.text);
        reviewJson = JSON.parse(cleanedResponse);

        // Validate the response structure
        if (
          typeof reviewJson.score !== "number" ||
          !Array.isArray(reviewJson.strengths) ||
          !Array.isArray(reviewJson.weaknesses) ||
          typeof reviewJson.overall_feedback !== "string"
        ) {
          throw new Error("Invalid response structure from AI model");
        }

        // Ensure score is within valid range
        if (reviewJson.score < 1 || reviewJson.score > 10) {
          reviewJson.score = Math.max(1, Math.min(10, reviewJson.score));
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw response:", response.text);

        // Provide fallback response
        reviewJson = {
          score: 5,
          strengths: ["Response received and processed"],
          weaknesses: [
            "Unable to provide detailed analysis due to parsing error",
          ],
          overall_feedback:
            "Your response was recorded but could not be fully analyzed. Please try again or contact support if the issue persists.",
        };
      }

      // Clean up temp file
      await fs.promises.unlink(tempPath);
      tempPath = null; // Reset so cleanup doesn't try again

      console.log(
        `Analysis completed for question: ${question.substring(0, 50)}...`
      );

      return res.json({
        review: reviewJson,
        metadata: {
          question: question,
          timestamp: new Date().toISOString(),
          fileSize: req.file.size,
          processingTime: Date.now() - req.startTime, // You can add req.startTime = Date.now() in middleware
        },
      });
    } catch (error) {
      console.error("Error in generate-reviews route:", error);

      // Clean up temp file if it exists
      if (tempPath) {
        try {
          await fs.promises.unlink(tempPath);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      }

      // Determine appropriate error response
      if (error.message && error.message.includes("AI model")) {
        return res.status(503).json({
          error: "AI service temporarily unavailable",
          message: "Please try again in a few moments",
        });
      } else if (error.code === "ENOSPC") {
        return res.status(507).json({
          error: "Server storage full",
          message: "Unable to process video at this time",
        });
      } else {
        return res.status(500).json({
          error: "Internal server error",
          message: "An unexpected error occurred while processing your request",
        });
      }
    }
  }
);

export default appRoutes;
