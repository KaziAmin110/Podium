import React from "react";

const HomePage = ({
  setQuestions,
}: {
  setQuestions: (questions: Record<number, string>) => void;
}) => {
  // This function will handle both the API call and the navigation.
  const handleStartInterview = async () => {
    const apiUrl = "http://localhost:3000/api/app/generate-questions";
    const requestBody = {
      positionTitle: "Software Engineer",
      company: "Amazon",
      experience: "Senior",
    };

    try {
      // 1. Send the POST request to your backend API.
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // 2. Check if the request was successful.
      if (!response.ok) {
        // If the server responds with an error status (e.g., 404, 500), throw an error.
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Optional: You can process the response from the server if needed.
      // const data = await response.json();
      // console.log("Received data from server:", data);

      // 3. If the request was successful, navigate to the interview page.
      // This uses the same routing mechanism as your Link component to prevent a page refresh.
      window.history.pushState({}, "", "/interview");
      window.dispatchEvent(new PopStateEvent("navigate"));
      const data = await response.json();
      setQuestions(data);
      return data;
    } catch (error) {
      console.error("Failed to start interview:", error);
      // Inform the user that something went wrong.
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
      {/* The button now calls the new handler function. */}
      <button onClick={handleStartInterview} className="start-button">
        Start Interview
      </button>

      {/* Adding some styles for the new elements */}
      <style>{`
        .page-text {
          font-size: 1.1rem;
          color: #495057;
          margin-bottom: 2rem;
          text-align: center;
        }
        .start-button {
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          font-size: 1.1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }
        .start-button:hover {
          background-color: #0056b3;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default HomePage;
