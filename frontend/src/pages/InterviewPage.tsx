import { useState } from "react";
import QuestionBody, { type ResponseData } from "../components/QuestionBody";
const InterviewPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  // THE SINGLE SOURCE OF TRUTH for all video responses.
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

  // This function is passed to the child to allow it to update the parent's state.
  const handleResponseChange = (response: ResponseData | null) => {
    setResponses((prevResponses) => {
      const oldResponse = prevResponses[currentQuestion];
      // IMPORTANT: Prevent memory leaks by revoking the old video URL
      if (oldResponse?.videoUrl) {
        URL.revokeObjectURL(oldResponse.videoUrl);
      }
      return {
        ...prevResponses,
        [currentQuestion]: response,
      };
    });
  };

  return (
    <div className="page-content">
      <section className="nav-header">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            onClick={() => setCurrentQuestion(item)}
            // Add styling based on whether the question is answered or active
            className={`${responses[item] ? "answered" : ""} ${
              currentQuestion === item ? "active" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </section>
      <section className="question-display">
        <QuestionBody
          currentQuestionIndex={currentQuestion}
          question={questions[currentQuestion]}
          // Pass down the SPECIFIC response for the current question
          response={responses[currentQuestion] || null}
          // Pass down the function that allows the child to update the parent
          onResponseChange={handleResponseChange}
        />
      </section>
    </div>
  );
};

export default InterviewPage;
