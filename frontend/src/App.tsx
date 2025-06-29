import { useState } from 'react'
import Home from './Home'
import Interview from './Interview';
import Report from './Report';

interface InterviewData {
  questions: string[];
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
  const [currentView, setCurrentView] = useState<'home' | 'interview' | 'report'>('home');
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [interviewSetup, setInterviewSetup] = useState<{
    company: string;
    position: string;
    experience: string;
    questionsCount: number;
  } | null>(null);

  const handleInterviewStart = (data: InterviewData, setup: {
    company: string;
    position: string;
    experience: string;
    questionsCount: number;
  }): void => {
    setInterviewData(data);
    setInterviewSetup(setup);
    setCurrentView('interview');
  };

  const handleBackToHome = (): void => {
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setCurrentView('home');
  };

  const handleInterviewComplete = async (answers: string[]): Promise<void> => {
    // Here you would typically send the answers to your backend for analysis
    try {
      const response = await fetch('http://localhost:3000/api/app/analyze-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: interviewData?.questions || [],
          answers: answers,
          setup: interviewSetup
        })
      });

      if (response.ok) {
        const reportResult: ReportData = await response.json();
        
        // Add interview details to the report data
        const enhancedReportData: ReportData = {
          ...reportResult,
          interviewDetails: {
            company: interviewSetup?.company || '',
            position: interviewSetup?.position || '',
            experience: interviewSetup?.experience || '',
            questionsCount: interviewSetup?.questionsCount || 0,
            duration: '25 minutes' // You can calculate this based on actual time spent
          }
        };
        
        setReportData(enhancedReportData);
        setCurrentView('report');
      } else {
        throw new Error('Failed to analyze interview');
      }
    } catch (error) {
      console.error('Error analyzing interview:', error);
      
      // For development/testing, you can use your sample JSON data:
      const mockReportData: ReportData = {
        feedbacks: [
          {
            question: "Tell me about yourself",
            error: "Analysis failed"
          },
          {
            question: "What are your strengths?",
            score: 1,
            strengths: [
              "Maintained eye contact with the camera throughout the response.",
              "Spoke clearly and audibly."
            ],
            weaknesses: [
              "You completely failed to answer the question asked. The question was \"What are your strengths?\", not \"Why do you want to work at [Company Name]?\"",
              "You mentioned the wrong company multiple times (\"Amazon\" instead of \"Spotify\"). This demonstrates a critical lack of preparation, attention to detail, and genuine interest in the specific opportunity.",
              "You explicitly stated, \"I have no skills.\" This is an incredibly detrimental statement for any job interview, especially for a technical position like a Frontend Developer."
            ],
            overall_feedback: "Your response to the question was highly problematic. You failed to answer the question posed, demonstrated a clear lack of preparation by naming the wrong company, and made a critical error by stating you have no skills for a technical role."
          }
        ],
        summary: "The interviewee demonstrated a critical lack of preparation, resulting in a highly problematic response to the 'strengths' question. Failing to answer the question, mentioning the wrong company, and claiming a lack of skills for a technical role would likely lead to immediate disqualification.",
        tips: [
          "Thoroughly research the company before the interview.",
          "Understand the specific requirements of the job description.",
          "Prepare concise and compelling answers to common interview questions, especially 'Tell me about yourself' and 'What are your strengths?'.",
          "Clearly articulate your relevant skills and experiences, even for junior roles. Focus on what you *can* do.",
          "Frame your desire to learn within the context of specific technologies or challenges related to the role.",
          "Practice your answers out loud to ensure they are natural and confident."
        ],
        score: 2,
        interviewDetails: {
          company: interviewSetup?.company || '',
          position: interviewSetup?.position || '',
          experience: interviewSetup?.experience || '',
          questionsCount: interviewSetup?.questionsCount || 0,
          duration: '25 minutes'
        }
      };
      
      setReportData(mockReportData);
      setCurrentView('report');
    }
  };

  const handleStartNewInterview = (): void => {
    setInterviewData(null);
    setReportData(null);
    setInterviewSetup(null);
    setCurrentView('home');
  };

  return (
    <>
      {currentView === 'home' && (
        <Home onInterviewStart={handleInterviewStart} />
      )}
      {currentView === 'interview' && (
        <Interview 
          data={interviewData} 
          onExit={handleBackToHome}
          onComplete={handleInterviewComplete}
        />
      )}
      {currentView === 'report' && (
        <Report 
          data={reportData}
          onReturnHome={handleBackToHome}
          onStartNewInterview={handleStartNewInterview}
        />
      )}
    </>
  )
}

export default App