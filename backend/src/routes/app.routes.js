import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const appRoutes = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

appRoutes.get("/test", (req, res) => {
  res.send("Hello from the App API!");
});

function cleanJSONResponse(text) {
  return text
    .replace(/```json|```/g, '')
    .trim();
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const rawText = result.response.candidates[0].content.parts[0].text;
  const cleanedText = cleanJSONResponse(rawText);

  try {
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (err) {
    return { error: "Failed to parse response from AI", raw: cleanedText };
  }
}

appRoutes.post("/generate-questions", async (req, res) => {
  const { positionTitle, company, experience } = req.body;
  if (!positionTitle || !company || !experience) {
    return res.status(400).json({ error: "positionTitle, company, and experience are required" });
  }

  try {
    const questions = await generateInterviewQuestions(positionTitle, company, experience);
    if (questions.error) return res.status(500).json(questions);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


//Generate reviews
import { getDatabase, ref, get, child } from "firebase/database";

const db = getDatabase();
const dbRef = ref(db);

appRoutes.post("/generate-reviews", async (req, res) => {
  const { userID, videoID } = req.body;

  try {
    const snapshot = await get(child(dbRef, `reviews/${userID}/${videoID}`));

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No reviews found" });
    }

    const reviews = snapshot.val();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving reviews", error });
  }
});

export default appRoutes;
