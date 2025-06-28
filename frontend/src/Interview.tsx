import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from './context/InterviewContext';

const Interview: React.FC = () => {
  const navigate = useNavigate();
  const { interviewData, setInterviewData } = useInterview();

  // Handle case where no interview data exists
  if (!interviewData) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">No interview data found</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleExitInterview = (): void => {
    setInterviewData(null); // Clear interview data
    navigate('/'); // Go back to home
  };

  const handleCompleteInterview = (): void => {
    // Handle interview completion logic here
    setInterviewData(null);
    navigate('/'); // Or navigate to results page
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-white mb-4">
              Mock Interview: {interviewData.position} at {interviewData.company}
            </h1>
            <p className="text-xl text-gray-300">Level: {interviewData.level}</p>
          </div>
          <button
            onClick={handleExitInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Exit Interview
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Interview Questions</h2>
          
          {interviewData.questions.map((question, index) => (
            <div key={index} className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">
                Question {index + 1}
              </h3>
              <p className="text-white mb-4">{question}</p>
              {/* Add your answer input/recording functionality here */}
            </div>
          ))}

          <div className="mt-8 text-center">
            <button
              onClick={handleCompleteInterview}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg"
            >
              Complete Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;