import { useState } from "react";
import QuestionBody, { type ResponseData } from "../components/QuestionBody";

const InterviewPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<
    Record<number, ResponseData | null>
  >({});

  const questions: Record<number, string> = {
    1: "What is your greatest strength?",
    2: "What is your greatest weakness?",
    3: "Why do you want to work here?",
    4: "Describe a challenge you've faced at work.",
    5: "Where do you see yourself in five years?",
  };

  const highestAnswered = Object.keys(responses)
    .filter((key) => responses[Number(key)] !== null)
    .map(Number)
    .reduce((max, current) => Math.max(max, current), 0);

  const maxUnlockedQuestion = highestAnswered + 1;

  const handleResponseChange = (response: ResponseData | null) => {
    setResponses((prevResponses) => {
      const oldResponse = prevResponses[currentQuestion];
      if (oldResponse?.videoUrl) {
        URL.revokeObjectURL(oldResponse.videoUrl);
      }
      return {
        ...prevResponses,
        [currentQuestion]: response,
      };
    });
  };

  const handleNavClick = (questionNumber: number) => {
    if (questionNumber <= maxUnlockedQuestion) {
      setCurrentQuestion(questionNumber);
    }
  };

  return (
    <div className="page-content">
      <section className="nav-header">
        {[1, 2, 3, 4, 5].map((item) => {
          const isUnlocked = item <= maxUnlockedQuestion;
          return (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              disabled={!isUnlocked}
              className={`${responses[item] ? "answered" : ""} ${
                currentQuestion === item ? "active" : ""
              }`}
            >
              {item}
            </button>
          );
        })}
      </section>
      <section className="question-display">
        <QuestionBody
          question={questions[currentQuestion]}
          response={responses[currentQuestion] || null}
          onResponseChange={handleResponseChange}
          currentQuestionIndex={0}
        />
      </section>
      {/* Style for disabled buttons */}
      <style>{`
          .page-content { max-width: 800px; margin: 0 auto; background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .nav-header { display: flex; justify-content: center; gap: 10px; margin-bottom: 2rem; flex-wrap: wrap; }
          .nav-header button { padding: 10px 15px; border: 2px solid #ddd; border-radius: 20px; cursor: pointer; background-color: #f9f9f9; font-weight: 500; transition: all 0.2s; }
          .nav-header button:hover { background-color: #e9e9e9; border-color: #ccc; }
          .nav-header button.active { border-color: #007bff; background-color: #007bff; color: white; }
          .nav-header button.answered { border-color: #28a745; background-color: #28a745; color: white; }
          .nav-header button:disabled { background-color: #f8f9fa; border-color: #e9ecef; color: #adb5bd; cursor: not-allowed; }
          .nav-header button:disabled:hover { background-color: #f8f9fa; border-color: #e9ecef; }
          .question-body { text-align: center; }
          .question-body h2 { color: #1a1a1a; margin-bottom: 1rem; }
          .video-player { margin-top: 1rem; }
          .video-player video { width: 100%; max-width: 550px; border-radius: 8px; background-color: #000; margin-bottom: 1rem; }
          .initial-choice-buttons, .action-buttons, .record-btn { display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; }
          button, .action-buttons a { padding: 10px 20px; border-radius: 6px; border: none; font-size: 1rem; font-weight: 500; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; }
          button:hover, .action-buttons a:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .delete-btn { background-color: #dc3545; color: white; }
          .recording-btn, .record-btn { background-color: #ffc107; color: #212529; }
          .action-buttons a { background-color: #007bff; color: white; text-decoration: none; display: inline-block; }
        `}</style>
    </div>
  );
};

export default InterviewPage;
