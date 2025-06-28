import { useState } from "react";
// Update the import path and extension if needed, e.g.:
import QuestionBody from "../components/QuestionBody";

const InterviewPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const questions: Record<number, string> = {
    1: "What is your greatest strength?",
    2: "What is your greatest weakness?",
    3: "Why do you want to work here?",
    4: "Describe a challenge you've faced at work.",
    5: "Where do you see yourself in five years?",
  };
  return (
    <div className="page-content">
      <section className="nav-header">
        {[1, 2, 3, 4, 5].map((item) => {
          return (
            <button key={item} onClick={() => setCurrentQuestion(item)}>
              {item}
            </button>
          );
        })}
      </section>
      <section>
        <QuestionBody
          currentQuestionIndex={currentQuestion}
          question={questions[currentQuestion]}
          auth={null}
          storage={null}
        />
      </section>
    </div>
  );
};

export default InterviewPage;
