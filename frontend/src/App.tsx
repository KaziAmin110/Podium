import { useState } from "react";
import Home from "./Home";
import Interview from "./Interview";
import Report from "./Report";

interface InterviewData {
  questions: string[];
}

interface InterviewSetup {
  company: string;
  position: string;
  experience: string;
  questionsCount: number;
}

interface ResponseData {
  videoUrl: string;
  videoBlob?: Blob;
}

// Updated ReportData interface to match your JSON structure
interface QuestionFeedback {
  question: string;
  score?: number; // 1-10 scale from your JSON
  strengths?: string[];
  weaknesses?: string[];
  overall_feedback?: string;
  error?: string; // For failed analysis
}

interface ReportData {
  feedbacks: QuestionFeedback[];
  summary: string;
  tips: string[];
  score: number; // 1-10 scale from your JSON
  interviewDetails?: {
    company: string;
    position: string;
    experience: string;
    questionsCount: number;
    duration?: string;
  };
}

function App() {
  const [currentView, setCurrentView] = useState<
    "home" | "interview" | "report"
  >("home");
  const [interviewData, setInterviewData] = useState<InterviewData | null>(
    null
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [interviewSetup, setInterviewSetup] = useState<{
    company: string;
    position: string;
    experience: string;
    questionsCount: number;
  } | null>(null);

  const handleInterviewStart = (
    data: InterviewData,
    setup: InterviewSetup
  ): void => {
    setInterviewData(data);
    setInterviewSetup(setup);
    setCurrentView("interview");
  };

  const handleBackToHome = (): void => {
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setCurrentView("home");
  };

  const submitVideoToBackend = async (
    question: string,
    videoBlob: Blob,
    questionIndex: number
  ): Promise<any> => {
    const apiUrl = "http://localhost:3000/api/app/generate-reviews";

    // Create FormData to match your existing API format
    const formData = new FormData();
    formData.append("question", question);
    formData.append("company", interviewSetup?.company || "");
    formData.append("positionTitle", interviewSetup?.position || "");
    formData.append("experience", interviewSetup?.experience || "");
    formData.append(
      "video",
      videoBlob,
      `response-question-${questionIndex + 1}.mp4`
    );

    console.log(`Submitting question ${questionIndex + 1}:`, question);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received analysis for question ${questionIndex + 1}:`, data);
      return data;
    } catch (error) {
      console.error(`Failed to analyze question ${questionIndex + 1}:`, error);
      return {
        question: question,
        error: "Analysis failed",
      };
    }
  };

  const handleInterviewComplete = async (
    responses: ResponseData[]
  ): Promise<void> => {
    if (!interviewData || !interviewSetup) return;

    try {
      console.log("Starting interview analysis...");

      // Submit all videos to backend and collect responses
      const analysisPromises = responses.map(async (response, index) => {
        const question = interviewData.questions[index];

        if (response.videoBlob && question) {
          return await submitVideoToBackend(
            question,
            response.videoBlob,
            index
          );
        } else {
          return {
            question: question || `Question ${index + 1}`,
            error: "No video response provided",
          };
        }
      });

      // Wait for all analyses to complete
      const analysisResults = await Promise.all(analysisPromises);

      console.log("All analyses completed:", analysisResults);
      console.log("Processing results into report format...");

      // Process the results into your expected JSON format
      const feedbacks: QuestionFeedback[] = analysisResults.map(
        (result, index) => {
          const question = interviewData.questions[index];

          console.log(`Processing result ${index + 1}:`, result);

          if (result.error) {
            return {
              question: question,
              error: result.error,
            };
          }

          // Handle the nested review structure from your backend
          if (result.review) {
            console.log(
              `Found review data for question ${index + 1}:`,
              result.review
            );
            return {
              question: question,
              score: result.review.score || undefined,
              strengths: result.review.strengths || [],
              weaknesses: result.review.weaknesses || [],
              overall_feedback: result.review.overall_feedback || "",
            };
          }

          // Fallback for direct structure (if backend format changes)
          console.log(`Using fallback structure for question ${index + 1}`);
          return {
            question: question,
            score: result.score || undefined,
            strengths: result.strengths || [],
            weaknesses: result.weaknesses || [],
            overall_feedback: result.overall_feedback || "",
          };
        }
      );

      console.log("Processed feedbacks:", feedbacks);

      // Calculate overall score (average of individual scores, excluding errors)
      const validScores = feedbacks
        .filter((f) => f.score !== undefined)
        .map((f) => f.score!);
      const overallScore =
        validScores.length > 0
          ? Math.round(
              validScores.reduce((sum, score) => sum + score, 0) /
                validScores.length
            )
          : 1;

      // Extract summary and tips from the first successful analysis, or use defaults
      const firstSuccessfulResult = analysisResults.find(
        (result) => result.review
      );
      const summary =
        firstSuccessfulResult?.review?.summary ||
        firstSuccessfulResult?.summary ||
        (feedbacks.some((f) => f.error)
          ? "Some questions could not be analyzed due to technical issues. Please review the individual question feedback below."
          : "Interview analysis completed. Review your performance below.");

      const tips = firstSuccessfulResult?.review?.tips ||
        firstSuccessfulResult?.tips || [
          "Practice answering common interview questions",
          "Speak clearly and maintain good eye contact with the camera",
          "Provide specific examples to support your answers",
          "Research the company and role thoroughly before interviews",
        ];

      const enhancedReportData: ReportData = {
        feedbacks,
        summary,
        tips,
        score: overallScore,
        interviewDetails: {
          company: interviewSetup.company,
          position: interviewSetup.position,
          experience: interviewSetup.experience,
          questionsCount: interviewSetup.questionsCount,
          duration: "25 minutes", // You could calculate actual duration
        },
      };

      console.log("Final report data:", enhancedReportData);
      console.log("Setting report data and navigating to report view...");

      setReportData(enhancedReportData);
      setCurrentView("report");
    } catch (error) {
      console.error("Error completing interview:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        interviewData,
        interviewSetup,
        responsesLength: responses.length,
      });

      // Fallback to mock data if analysis fails completely
      console.log("Creating fallback report data...");
      const mockReportData: ReportData = {
        feedbacks: interviewData.questions.map((question) => ({
          question,
          error: "Analysis service temporarily unavailable",
        })),
        summary:
          "Unable to complete interview analysis due to a technical issue. Please try again later.",
        tips: [
          "Ensure you have a stable internet connection",
          "Try recording shorter video responses",
          "Contact support if the issue persists",
        ],
        score: 1,
        interviewDetails: {
          company: interviewSetup.company,
          position: interviewSetup.position,
          experience: interviewSetup.experience,
          questionsCount: interviewSetup.questionsCount,
          duration: "25 minutes",
        },
      };

      console.log("Fallback report data:", mockReportData);
      setReportData(mockReportData);
      setCurrentView("report");
    }
  };

  const handleStartNewInterview = (): void => {
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setCurrentView("home");
  };

  return (
    <>
      {currentView === "home" && (
        <Home onInterviewStart={handleInterviewStart} />
      )}
      {currentView === "interview" && (
        <Interview
          data={interviewData}
          setup={interviewSetup}
          onExit={handleBackToHome}
          onComplete={handleInterviewComplete}
        />
      )}
      {currentView === "report" && (
        <Report
          data={reportData}
          onReturnHome={handleBackToHome}
          onStartNewInterview={handleStartNewInterview}
        />
      )}
    </>
  );
}

export default App;
