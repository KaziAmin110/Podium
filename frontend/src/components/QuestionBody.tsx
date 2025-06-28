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
  currentQuestionIndex,
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

    // Create FormData to match the curl request format
    const formData = new FormData();
    formData.append("question", question);
    formData.append("company", company);
    formData.append("positionTitle", positionTitle);
    formData.append("experience", experience);
    formData.append(
      "video",
      videoBlob,
      `response-question-${currentQuestionIndex}.mp4`
    );

    console.log("Sending FormData with video blob:", videoBlob);

    try {
      // Send the POST request with FormData (no Content-Type header needed - browser sets it automatically)
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData, // Send FormData directly, not JSON
      });

      // Check if the request was successful
      if (!response.ok) {
        console.error(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process the response from the server
      const data = await response.json();
      console.log("Received data from server:", data);
      return data;
    } catch (error) {
      console.error("Failed to start interview:", error);
      // Inform the user that something went wrong
      alert(
        "Could not start the interview. Please ensure the local server is running and try again."
      );
      throw error; // Re-throw to allow caller to handle if needed
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

    // Check if video/mp4 is supported, fallback to video/webm
    let mimeType = "video/mp4";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    const media = new MediaRecorder(stream, { mimeType });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunks.current.push(e.data);
    };
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.onstop = () => {
      // Use the same mimeType that was used for recording
      const mimeType = mediaRecorder.current?.mimeType || "video/webm";
      const videoBlob = new Blob(videoChunks.current, { type: mimeType });

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
    // Ensure we have a valid video URL
    let displayVideoUrl = response.videoUrl;

    // If video URL is invalid but we have a blob, create a new URL
    if (
      response.videoBlob &&
      (!displayVideoUrl || !displayVideoUrl.startsWith("blob:"))
    ) {
      displayVideoUrl = URL.createObjectURL(response.videoBlob);
    }

    return (
      <div className="question-body">
        <h2>{question}</h2>
        <div className="video-player">
          <h3>Your Response:</h3>
          <video
            src={displayVideoUrl}
            controls
            playsInline
            key={displayVideoUrl} // Force re-render when URL changes
            onError={(e) => {
              console.error("Video playback error:", e);
              if (response.videoBlob) {
                const newUrl = URL.createObjectURL(response.videoBlob);
                e.currentTarget.src = newUrl;
              }
            }}
          ></video>
          <div className="action-buttons">
            <a
              href={displayVideoUrl}
              download={`response-question-${currentQuestionIndex}.mp4`}
            >
              Download
            </a>
            <button onClick={handleReset} className="delete-btn">
              Delete Response
            </button>

            {!isLastQuestion && (
              <button onClick={onNavigateNext} className="next-btn">
                Next Question &rarr;
              </button>
            )}
            {isLastQuestion && (
              <button
                onClick={async () => {
                  if (response.videoBlob) {
                    try {
                      await handleSubmitClick(
                        question,
                        company,
                        positionTitle,
                        experience,
                        response.videoBlob
                      );
                      alert("Interview submitted successfully!");
                    } catch (error) {

                      console.error("Submission failed:", error);
                    }
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

  // --- Recording view ---
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
      <style>{`
          .next-btn {
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
          }
          .next-btn:hover {
            background-color: #218838;
          }
          .delete-btn {
            background-color: #dc3545;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
          }
          .delete-btn:hover {
            background-color: #c82333;
          }
          .record-btn {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .record-btn:hover {
            background-color: #0056b3;
          }
          .recording-btn {
            background-color: #dc3545;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          .action-buttons a {
            background-color: #6c757d;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          }
          .action-buttons a:hover {
            background-color: #545b62;
          }
          .initial-choice-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
          }
          .initial-choice-buttons button {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          .initial-choice-buttons button:hover {
            background-color: #0056b3;
          }
          .video-player {
            margin-top: 20px;
          }
          .video-player video {
            width: 100%;
            max-width: 600px;
            border-radius: 8px;
          }
          .live-preview {
            width: 100%;
            max-width: 600px;
            border-radius: 8px;
            border: 2px solid #007bff;
          }
      `}</style>
    </div>
  );
};

export default QuestionBody;
