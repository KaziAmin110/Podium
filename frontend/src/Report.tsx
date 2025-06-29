import React from 'react';
import { Home, RefreshCw, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Target, Star } from 'lucide-react';

// Define the interfaces for the report data (matching your JSON structure)
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

interface ReportProps {
  data: ReportData | null;
  onReturnHome: () => void;
  onStartNewInterview: () => void;
}

const Report: React.FC<ReportProps> = ({ data, onReturnHome, onStartNewInterview }) => {
  // Handle case where no report data exists
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl text-white mb-4">No report data available</h1>
          <p className="text-gray-400 mb-6">Unable to generate your interview report.</p>
          <button 
            onClick={onReturnHome}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Convert 1-10 score to percentage
  const overallScorePercentage = data.score * 10;

  // Helper function to get score category
  const getScoreCategory = (score: number): string => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Average';
    if (score >= 3) return 'Needs Improvement';
    return 'Poor';
  };

  // Helper function to get score color (based on 1-10 scale)
  const getScoreColor = (score: number): string => {
    if (score >= 9) return 'text-green-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 5) return 'text-yellow-400';
    if (score >= 3) return 'text-orange-400';
    return 'text-red-400';
  };

  // Helper function to get score background color (based on 1-10 scale)
  const getScoreBgColor = (score: number): string => {
    if (score >= 9) return 'bg-green-600';
    if (score >= 7) return 'bg-blue-600';
    if (score >= 5) return 'bg-yellow-600';
    if (score >= 3) return 'bg-orange-600';
    return 'bg-red-600';
  };

  // Helper function to get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Excellent': return 'text-green-400';
      case 'Good': return 'text-blue-400';
      case 'Average': return 'text-yellow-400';
      case 'Needs Improvement': return 'text-orange-400';
      case 'Poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const scoreCategory = getScoreCategory(data.score);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Interview Report</h1>
          {data.interviewDetails && (
            <>
              <p className="text-gray-300">
                {data.interviewDetails.position} at {data.interviewDetails.company}
              </p>
              <p className="text-gray-400 text-sm">
                {data.interviewDetails.experience} • {data.interviewDetails.questionsCount} Questions
                {data.interviewDetails.duration && ` • ${data.interviewDetails.duration}`}
              </p>
            </>
          )}
        </div>

        {/* Overall Score Section */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className={`relative w-32 h-32 rounded-full ${getScoreBgColor(data.score)} flex items-center justify-center`}>
                <div className="text-4xl font-bold text-white">
                  {data.score}/10
                </div>
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${getCategoryColor(scoreCategory)} mb-2`}>
              {scoreCategory}
            </h2>
            <div className="bg-gray-700 rounded-full h-3 mb-4 max-w-md mx-auto">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${getScoreBgColor(data.score)}`}
                style={{ width: `${overallScorePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Feedback */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Target className="mr-3 w-7 h-7 text-purple-400" />
            Question Analysis
          </h2>
          
          <div className="space-y-6">
            {data.feedbacks.map((feedback, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-purple-300">
                    Question {index + 1}
                  </h3>
                  <div className="flex items-center">
                    {feedback.error ? (
                      <div className="flex items-center text-red-400">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Analysis Failed</span>
                      </div>
                    ) : feedback.score !== undefined ? (
                      <>
                        <span className={`text-2xl font-bold ${getScoreColor(feedback.score)} mr-2`}>
                          {feedback.score}/10
                        </span>
                        <Star className={`w-5 h-5 ${feedback.score >= 8 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                      </>
                    ) : null}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4 italic">"{feedback.question}"</p>
                
                {feedback.error ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-300 text-sm">{feedback.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Strengths and Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Strengths */}
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Strengths
                        </h4>
                        {feedback.strengths && feedback.strengths.length > 0 ? (
                          <ul className="space-y-2">
                            {feedback.strengths.map((strength, idx) => (
                              <li key={idx} className="text-green-300 text-sm flex items-start">
                                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-green-300 text-sm">No specific strengths identified</p>
                        )}
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                        <h4 className="text-red-400 font-semibold mb-3 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Areas for Improvement
                        </h4>
                        {feedback.weaknesses && feedback.weaknesses.length > 0 ? (
                          <ul className="space-y-2">
                            {feedback.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-red-300 text-sm flex items-start">
                                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-red-300 text-sm">No specific areas for improvement identified</p>
                        )}
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    {feedback.overall_feedback && (
                      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                        <h4 className="text-blue-400 font-semibold mb-3">Overall Feedback</h4>
                        <p className="text-blue-300 text-sm leading-relaxed">{feedback.overall_feedback}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Feedback Section */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="mr-3 w-7 h-7 text-purple-400" />
            Overall Feedback
          </h2>

          {/* Summary */}
          <div className="mb-6 bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">Summary</h3>
            <p className="text-gray-300 leading-relaxed">{data.summary}</p>
          </div>

          {/* Tips for Improvement */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h3 className="text-blue-400 font-semibold mb-4">Tips for Improvement</h3>
            <ul className="space-y-3">
              {data.tips.map((tip, idx) => (
                <li key={idx} className="text-blue-300 flex items-start">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onReturnHome}
            className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-lg transition-colors flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Return Home
          </button>
          <button
            onClick={onStartNewInterview}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;