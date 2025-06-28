import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const appRoutes = Router();
const ai = new GoogleGenAI({});

appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ...existing code...
export async function generateInterviewQuestions(positionTitle, company, experience) {
  const prompt = `
You are an interview assistant. Generate 5 interview questions for a candidate applying for the position of "${positionTitle}" at "${company} with an experience level of "${experience}".
The user has likely never worked at this organization before. Respond with questions typically askes at this company along with some general and technical ones.
Do not include any explanations or additional text, just return the questions in a JSON format like this. This is being used in an API which expects a JSON response exactly as follows.
Respond ONLY in the following JSON format:
{
  "0": "First question?",
  "1": "Second question?",
  "2": "Third question?",
  "3": "Fourth question?",
  "4": "Fifth question?"
}
`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-preview-06-17",
    contents: prompt,
  });
  const text = response.text;
  return text;
}
//

appRoutes.post("/generate-questions", async (req, res) => {
  console.log("Received POST /generate-questions with body:", req.body);
  const { positionTitle, company, experience } = req.body;
  if ((!positionTitle || !company) || ! experience) {
    return res.status(400).json({ error: "positionTitle and company are required" });
  }
  const questions = await generateInterviewQuestions(positionTitle, company);
  console.log("Generated questions:", questions);
  res.send(questions);
});


export default appRoutes;