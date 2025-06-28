import React from "react";

const HomePage = ({
  setQuestions,
}: {
  setQuestions: (questions: Record<number, string>) => void;
}) => {
  const handleStartInterview = async () => {
    const apiUrl = "http://localhost:3000/api/app/generate-questions";
    const requestBody = {
      positionTitle: "Software Engineer",
      company: "Amazon",
      experience: "Senior",
    };

    try {
      // 1. Send the POST request and wait for the response.
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // 2. Get the questions data from the response.
      const data = await response.json();

      // 3. Set the questions state.
      setQuestions(data);

      // 4. NOW, navigate to the interview page.
      window.history.pushState({}, "", "/interview");
      window.dispatchEvent(new PopStateEvent("navigate"));
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert(
        "Could not start the interview. Please ensure the local server is running and try again."
      );
    }
  };

  return (
    <div className="page-content">
      <h1 className="page-title">Welcome to the Interview App</h1>
      <p className="page-text">
        Click the button below to generate your interview questions and begin.
      </p>
      <button onClick={handleStartInterview} className="start-button">
        Start Interview
      </button>

      {/* Adding some styles for the new elements */}
      <style>{`
        /* ... your styles ... */
      `}</style>
    </div>
  );
};

export default HomePage;
