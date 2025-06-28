import { useState, useEffect } from "react";
import Link from "./components/Link";
import HomePage from "./pages/HomePage";
import InterviewPage from "./pages/InterviewPage";

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname
  );
  const [questions, setQuestions] = useState<Record<number, string>>({});

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener("navigate", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("navigate", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case "/interview":
        return <InterviewPage questions={questions} />;
      case "/":
      default:
        return <HomePage setQuestions={setQuestions} />;
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <nav className="navbar">
          <span className="brand-title">Interview Practice</span>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/interview">Interview</Link>
          </div>
        </nav>
      </header>
      <main className="container">{renderPage()}</main>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; }
        .app-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
        .app-header { background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 0 2rem; }
        .navbar { display: flex; justify-content: space-between; align-items: center; height: 64px; max-width: 1100px; margin: 0 auto; }
        .brand-title { font-size: 1.5rem; font-weight: bold; color: #1a1a1a; }
        .nav-links { display: flex; gap: 1.5rem; }
        .nav-link { color: #333; text-decoration: none; font-weight: 500; font-size: 1rem; padding: 8px 12px; border-radius: 6px; transition: background-color 0.2s; }
        .nav-link:hover { background-color: #f0f0f0; }
        .container { flex-grow: 1; padding: 2rem; }
        .page-content { max-width: 800px; margin: 0 auto; background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .page-title, .question-body h2 { color: #1a1a1a; margin-bottom: 1rem; }
        .nav-header { display: flex; justify-content: center; gap: 10px; margin-bottom: 2rem; flex-wrap: wrap; }
        .nav-header button { padding: 10px 15px; border: 2px solid #ddd; border-radius: 20px; cursor: pointer; background-color: #f9f9f9; font-weight: 500; transition: all 0.2s; }
        .nav-header button:hover { background-color: #e9e9e9; border-color: #ccc; }
        .nav-header button.active { border-color: #007bff; background-color: #007bff; color: white; }
        .nav-header button.answered { border-color: #28a745; background-color: #28a745; color: white; }
        .question-body { text-align: center; }
        .video-player { margin-top: 1rem; }
        .video-player video { width: 100%; max-width: 550px; border-radius: 8px; background-color: #000; margin-bottom: 1rem; }
        .initial-choice-buttons, .action-buttons, .record-btn { display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; }
        button, .action-buttons a { padding: 10px 20px; border-radius: 6px; border: none; font-size: 1rem; font-weight: 500; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; }
        button:hover, .action-buttons a:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .delete-btn { background-color: #dc3545; color: white; }
        .recording-btn, .record-btn { background-color: #ffc107; color: #212529; }
        .action-buttons a { background-color: #007bff; color: white; text-decoration: none; display: inline-block; }
      `}</style>
    </div>
  );
}
