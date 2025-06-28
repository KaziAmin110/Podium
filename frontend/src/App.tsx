import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Interview from './Interview';
import { InterviewProvider } from './context/InterviewContext';

function App() {
  return (
    <InterviewProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </InterviewProvider>
  );
}

export default App;