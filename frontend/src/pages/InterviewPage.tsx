import { useState } from "react";
import QuestionBody, { type ResponseData } from "../components/QuestionBody";

const InterviewPage = ({
  questions,
}: {
  questions: Record<number, string>;
}) => {
  // State remains 0-indexed, which is correct.
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<
    Record<number, ResponseData | null>
  >({});

  // FIX: This now correctly determines the total number of questions from the props.
  const totalQuestions = Object.keys(questions).length;

  // FIX: This logic now correctly uses 0-based indices.
  const highestAnswered = Object.keys(responses)
    .filter((key) => responses[Number(key)] !== null)
    .map(Number)
    .reduce((max, current) => Math.max(max, current), -1); // CHANGED: Start with -1 for better empty-state logic

  const maxUnlockedQuestion = highestAnswered + 1;

  const handleResponseChange = (response: ResponseData | null) => {
    setResponses((prevResponses) => {
      const oldResponse = prevResponses[currentQuestion];
      if (oldResponse?.videoUrl) {
        URL.revokeObjectURL(oldResponse.videoUrl);
      }
      return {
        ...prevResponses,
        [currentQuestion]: response, // Uses the correct 0-indexed currentQuestion
      };
    });
  };

  // FIX: This handler now correctly receives and sets a 0-based index.
  const handleNavClick = (questionIndex: number) => {
    if (questionIndex <= maxUnlockedQuestion) {
      setCurrentQuestion(questionIndex);
    }
  };

  const handleNavigateNext = () => {
    const nextQuestionIndex = currentQuestion + 1;
    // FIX: The boundary check now correctly uses '<' with a 0-based index.
    if (nextQuestionIndex < totalQuestions) {
      setCurrentQuestion(nextQuestionIndex);
    }
  };

  // If there are no questions (e.g., API failed or is loading), show a message.
  if (totalQuestions === 0) {
    return (
      <div className="page-content">
        <h2>Loading questions or no questions found...</h2>
        <p>
          If you just started the interview, please wait a moment. Otherwise,
          try returning to the home page.
        </p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="nav-header">
        {/* FIX: Replaced hardcoded buttons with a dynamic map based on totalQuestions. */}
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isUnlocked = index <= maxUnlockedQuestion;
          const questionNumberForDisplay = index + 1; // For the UI

          return (
            <button
              key={index}
              // CHANGED: onClick now passes the correct 0-based index.
              onClick={() => handleNavClick(index)}
              disabled={!isUnlocked}
              // CHANGED: Class name logic now correctly uses the 0-based index.
              className={`${responses[index] ? "answered" : ""} ${
                currentQuestion === index ? "active" : ""
              }`}
            >
              {questionNumberForDisplay} {/* Display the 1-based number */}
            </button>
          );
        })}
      </section>
      <section className="question-display">
        <QuestionBody
          // All props are now passed with the correct 0-indexed values.
          currentQuestionIndex={currentQuestion}
          question={questions[currentQuestion]}
          response={responses[currentQuestion] || null}
          onResponseChange={handleResponseChange}
          onNavigateNext={handleNavigateNext}
          // FIX: The check for the last question is now correct for a 0-based index.
          isLastQuestion={currentQuestion === totalQuestions - 1}
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
