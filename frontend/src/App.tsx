import { useEffect, useState } from "react";
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

export interface ResponseData {
  videoUrl: string; // URL of the recorded video
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

  const [responses, setResponses] = useState<
    Record<number, ResponseData | null>
  >({});

  useEffect(() => {
    // Resets Interview Data, Report Data, and Interview Setup when the component mounts
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setResponses({});
  }, []);

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

  const handleStartNewInterview = (): void => {
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setCurrentView("home");
  };

  const submitVideoToBackend = async (
    question: string,
    videoBlob: Blob,
    questionIndex: number
  ): Promise<Record<string, any>> => {
    const apiUrl = "http://localhost:3000/api/app/generate-reviews";

    // Create FormData to match your existing API format
    console.log(videoBlob);
    if (!(videoBlob instanceof Blob)) {
      console.error("Invalid video blob:", videoBlob);
      return {
        question: question,
        error: "Invalid video blob",
      };
    }
    const formData = new FormData();
    formData.append("question", question);
    formData.append("company", interviewSetup?.company || "");
    formData.append("position", interviewSetup?.position || "");
    formData.append("experience", interviewSetup?.experience || "");
    formData.append(
      "video",
      videoBlob,
      `response-question-${questionIndex + 1}.mp4`
    );

    console.log("Sent to Backend");
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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

      // Process the results into your expected JSON format
      const feedbacks: QuestionFeedback[] = analysisResults.map(
        (result, index) => {
          const question = interviewData.questions[index];

          if (result.error) {
            return {
              question: question,
              error: result.error,
            };
          }

          // Handle the nested review structure from your backend
          if (result.review) {
            return {
              question: question,
              score: result.review.score || undefined,
              strengths: result.review.strengths || [],
              weaknesses: result.review.weaknesses || [],
              overall_feedback: result.review.overall_feedback || "",
            };
          }

          // Fallback for direct structure (if backend format changes)
          return {
            question: question,
            score: result.score || undefined,
            strengths: result.strengths || [],
            weaknesses: result.weaknesses || [],
            overall_feedback: result.overall_feedback || "",
          };
        }
      );

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

      setReportData(mockReportData);
      setCurrentView("report");
    }
  };

  return (
    <>
      {currentView === "home" && (
        <Home onInterviewStart={handleInterviewStart} />
      )}
      {currentView === "interview" && (
        <Interview
          data={interviewData}
          setData={setInterviewData}
          setup={interviewSetup}
          setSetup={setInterviewSetup}
          onExit={handleBackToHome}
          responses={responses}
          setResponses={setResponses}
          onInterviewComplete={handleInterviewComplete}
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
