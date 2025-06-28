import { useState } from 'react'
import Home from './Home'
import Interview from './Interview';

interface InterviewData {
  questions: string[];
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'interview'>('home');
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);

  const handleInterviewStart = (data: InterviewData): void => {
    setInterviewData(data);
    setCurrentView('interview'); // Switch to interview component
  };

  const handleBackToHome = (): void => {
    setInterviewData(null);
    setCurrentView('home');
  };

  return (
    <>
      {currentView === 'home' && <Home onInterviewStart={handleInterviewStart} />}
      {currentView === 'interview' && (
        <Interview 
          data={interviewData} 
          onExit={handleBackToHome}
        />
      )}
    </>
  )
}

export default App