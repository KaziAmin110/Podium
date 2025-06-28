import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import InterviewPage from "./pages/InterviewPage";
import Link from "./components/Link";

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname
  );

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("navigate", onLocationChange);
    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("navigate", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  // The routing logic now lives here, in the parent component.
  const renderPage = () => {
    switch (currentPath) {
      case "/":
        // It renders HomePage, but is not PART of HomePage.
        return <HomePage />;
      case "/about":
        return <InterviewPage />;
      default:
        // A 404 page or redirecting to home is a good default.
        return <HomePage />;
    }
  };

  return (
    <div className="app-wrapper">
      {/* Your shared layout, like a header, can live here */}
      <header className="app-header">
        <nav className="navbar">
          <span className="brand-title">My App</span>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </div>
        </nav>
      </header>

      {/* The renderPage function displays the correct page component */}
      <main>{renderPage()}</main>

      {/* Basic CSS styles for the application */}
      <style>{`
        .app-wrapper {
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: sans-serif;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .app-header {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 1.25rem;
          margin-bottom: 2rem;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #4f46e5;
        }
        .nav-links {
          display: flex;
          gap: 1.5rem;
        }
        .nav-link {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 500;
        }
        .nav-link:hover {
          text-decoration: underline;
        }
        .page-content {
          background-color: white;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .page-title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .page-text {
          color: #374151;
        }
      `}</style>
    </div>
  );
}
