import { useState, useRef, useEffect } from "react";

export interface ResponseData {
  videoUrl: string;
  videoBlob?: Blob;
}

// --- NEW: Props interface updated ---
interface QuestionBodyProps {
  currentQuestionIndex: number;
  question: string;
  company?: string;
  positionTitle?: string;
  experience?: string;
  response: ResponseData | null;
  onResponseChange: (response: ResponseData | null) => void;
  onNavigateNext: () => void;
  isLastQuestion: boolean;
}

const QuestionBody = ({
  question,
  company = "Amazon",
  positionTitle = "Software Engineer",
  experience = "Senior",
  response,
  onResponseChange,
  onNavigateNext,
  isLastQuestion,
}: QuestionBodyProps) => {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (permission && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [permission, stream]);

  const getCameraPermission = async () => {
    if (
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setPermission(true);
        setStream(videoStream);
      } catch (err) {
        console.error("Error accessing camera and microphone:", err);
      }
    } else {
      alert("Media API not supported in your browser.");
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleSubmitClick = async (
    question: string,
    company: string,
    positionTitle: string,
    experience: string,
    videoBlob: Blob
  ) => {
    const apiUrl = "http://localhost:3000/api/app/generate-reviews";
    const requestBody = {
      positionTitle: positionTitle,
      company: company,
      experience: experience,
      question: { question },
      video: videoBlob,
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

        console.error(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }

      // Optional: You can process the response from the server if needed.
      // const data = await response.json();
      // console.log("Received data from server:", data);

      // 3. If the request was successful, navigate to the interview page.
      // This uses the same routing mechanism as your Link component to prevent a page refresh.
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Failed to start interview:", error);
      // Inform the user that something went wrong.
      alert(
        "Could not start the interview. Please ensure the local server is running and try again."
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onResponseChange({
        videoUrl: URL.createObjectURL(file),
        videoBlob: file,
      });
    }
  };

  const handleReset = () => {
    onResponseChange(null);
  };

  const startRecording = () => {
    if (!stream) return;
    setIsRecording(true);
    videoChunks.current = [];
    const media = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunks.current.push(e.data);
    };
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.onstop = () => {
      const videoBlob = new Blob(videoChunks.current, { type: "video/webm" });
      onResponseChange({
        videoUrl: URL.createObjectURL(videoBlob),
        videoBlob: videoBlob,
      });
      stream?.getTracks().forEach((track) => track.stop());
      setPermission(false);
      setStream(null);
    };
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  if (response) {
    return (
      <div className="question-body">
        <h2>{question}</h2>
        <div className="video-player">
          <h3>Your Response:</h3>
          <video
            src={response.videoUrl}
            controls
            playsInline
            key={response.videoUrl}
          ></video>
          <div className="action-buttons">
            <a href={response.videoUrl} download={`response.mp4`}>
              Download
            </a>
            <button onClick={handleReset} className="delete-btn">
              Delete Response
            </button>
            {/* --- NEW: Conditional "Next" Button --- */}
            {!isLastQuestion && (
              <button onClick={onNavigateNext} className="next-btn">
                Next Question &rarr;
              </button>
            )}
            {isLastQuestion && (
              <button
                onClick={() => {
                  if (response.videoBlob) {
                    handleSubmitClick(question, company, positionTitle, experience, response.videoBlob);
                  } else {
                    alert("No video response found to submit.");
                  }
                }}
                className="next-btn"
              >
                Submit Interview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- (The rest of the component's return statements are unchanged) ---
  if (permission && stream) {
    return (
      <div className="question-body">
        <h2>{question}</h2>
        <div className="video-player">
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            className="live-preview"
          ></video>
        </div>
        <div className="action-buttons">
          {!isRecording ? (
            <button onClick={startRecording} className="record-btn">
              Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="recording-btn">
              Stop Recording
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="question-body">
      <h2>{question}</h2>
      <div className="initial-choice-buttons">
        <button onClick={getCameraPermission}>Record a Response</button>
        <button onClick={handleUploadClick}>Upload a Video</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          style={{ display: "none" }}
        />
      </div>
      {/* --- NEW: Style for the "Next" button --- */}
      <style>{`
          .next-btn {
            background-color: #28a745;
            color: white;
          }
      `}</style>
    </div>
  );
};

export default QuestionBody;
