import React, { useState } from 'react';

// Define the interfaces
interface InterviewData {
  questions: string[];
}

interface InterviewProps {
  data: InterviewData | null;
  onExit: () => void;
}

const Interview: React.FC<InterviewProps> = ({ data, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  // Handle case where no interview data exists
  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">No interview data found</h1>
          <button 
            onClick={onExit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleExitInterview = (): void => {
    if (window.confirm('Are you sure you want to exit the interview?')) {
      onExit();
    }
  };

  const handleNextQuestion = (): void => {
    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteInterview = (): void => {
    alert('Interview completed! Great job!');
    onExit(); // Go back to home
  };

  const currentQuestion = data.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mock Interview</h1>
            <p className="text-gray-300">
              Question {currentQuestionIndex + 1} of {data.questions.length}
            </p>
          </div>
          <button
            onClick={handleExitInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Exit Interview
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            Question {currentQuestionIndex + 1}
          </h2>
          <p className="text-white text-lg mb-6 leading-relaxed">
            {currentQuestion}
          </p>
          
          {/* Answer Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Answer:
            </label>
            <textarea
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Type your answer here..."
              value={answers[currentQuestionIndex] || ''}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[currentQuestionIndex] = e.target.value;
                setAnswers(newAnswers);
              }}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-4">
            {currentQuestionIndex === data.questions.length - 1 ? (
              <button
                onClick={handleCompleteInterview}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
              >
                Complete Interview
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        </div>

        {/* Question Counter */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-2">
            {data.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-purple-600 text-white'
                    : answers[index]
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
