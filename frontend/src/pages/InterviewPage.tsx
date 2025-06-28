import { useState } from "react";
// Assuming QuestionBody is in the same directory or adjust the path.
import QuestionBody, { type ResponseData } from "../components/QuestionBody";

const InterviewPage = ({
  questions,
}: {
  questions: Record<number, string>;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<
    Record<number, ResponseData | null>
  >({});

  const totalQuestions = Object.keys(questions).length;

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

  // --- NEW: Function to handle moving to the next question ---
  const handleNavigateNext = () => {
    const nextQuestionNumber = currentQuestion + 1;
    if (nextQuestionNumber <= totalQuestions) {
      setCurrentQuestion(nextQuestionNumber);
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
          currentQuestionIndex={currentQuestion}
          question={questions[currentQuestion]}
          response={responses[currentQuestion] || null}
          onResponseChange={handleResponseChange}
          // --- NEW PROPS passed down ---
          onNavigateNext={handleNavigateNext}
          isLastQuestion={currentQuestion === totalQuestions}
        />
      </section>
      <style>{`
          .nav-header button:disabled {
            background-color: #f8f9fa;
            border-color: #e9ecef;
            color: #adb5bd;
            cursor: not-allowed;
          }
          .nav-header button:disabled:hover {
            background-color: #f8f9fa;
            border-color: #e9ecef;
          }
      `}</style>
    </div>
  );
};

export default InterviewPage;
