import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface InterviewData {
  company: string;
  position: string;
  level: string;
  timestamp: string;
  questions: string[]; // Array of 5 question strings
}

interface InterviewContextType {
  interviewData: InterviewData | null;
  setInterviewData: (data: InterviewData | null) => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);

  return (
    <InterviewContext.Provider value={{ interviewData, setInterviewData }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
};
