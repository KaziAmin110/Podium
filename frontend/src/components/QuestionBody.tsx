import { useState, useRef, useEffect, type ReactNode } from "react";

// --- QuestionBody Component with Upload, Record, and Delete Logic ---

const QuestionBody = ({
  currentQuestionIndex,
  question,
}: {
  currentQuestionIndex: ReactNode;
  question: string;
}) => {
  // State to manage permissions and recording status
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<
    "inactive" | "recording" | "recorded"
  >("inactive");
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);

  // Refs for recorder, video chunks, and the new file input
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when the question changes
  useEffect(() => {
    handleReset(); // Use the new reset handler to clear everything
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  const getCameraPermission = async () => {
    // ... (This function remains the same)
    setRecordedVideo(null);
    setRecordingStatus("inactive");
    videoChunks.current = [];

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
        console.error("Error getting media permissions:", err);
        alert(
          "Could not access your camera and microphone. Please check permissions."
        );
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const videoUrl = URL.createObjectURL(file);
      setRecordedVideo(videoUrl);
      setRecordingStatus("recorded");
    }
  };

  // --- NEW: Handler to reset the state and delete the video ---
  const handleReset = () => {
    // Revoke the object URL to free up memory
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    // Reset all relevant states to their initial values
    setPermission(false);
    setStream(null);
    setRecordingStatus("inactive");
    setRecordedVideo(null);
    videoChunks.current = [];
    // Clear the file input in case a file was selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startRecording = () => {
    // ... (This function remains the same)
    if (stream === null) return;
    setRecordingStatus("recording");
    const media = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined" || event.data.size === 0) return;
      videoChunks.current.push(event.data);
    };
  };

  const stopRecording = () => {
    // ... (This function remains the same)
    if (mediaRecorder.current === null) return;
    setRecordingStatus("recorded");
    mediaRecorder.current.stop();
    mediaRecorder.current.onstop = () => {
      const videoBlob = new Blob(videoChunks.current, {
        type: "video/webm",
      });
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideo(videoUrl);
      videoChunks.current = [];
      stream?.getTracks().forEach((track) => track.stop());
      setPermission(false);
      setStream(null);
    };
  };

  return (
    <div className="question-body">
      <h1>Question {currentQuestionIndex}:</h1>
      <p className="question-text">{question}</p>

      <div className="video-controls">
        {/* Step 1: Show initial choice buttons */}
        {recordingStatus === "inactive" && !permission && (
          <div className="initial-choice-buttons">
            <button onClick={getCameraPermission} type="button">
              Record Response
            </button>
            <button onClick={handleUploadClick} type="button">
              Upload from File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* Step 2: Show Live Preview and Record/Stop Buttons */}
        {permission && (
          <>
            <div className="video-player">
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className="live-preview"
              ></video>
            </div>
            {recordingStatus === "inactive" && (
              <button onClick={startRecording} type="button">
                Start Recording
              </button>
            )}
            {recordingStatus === "recording" && (
              <button
                onClick={stopRecording}
                type="button"
                className="recording-btn"
              >
                Stop Recording
              </button>
            )}
          </>
        )}

        {/* Step 3: Show recorded video with Download and new Delete button */}
        {recordingStatus === "recorded" && recordedVideo && (
          <div className="video-player">
            <h2>Your Response:</h2>
            <video src={recordedVideo} controls playsInline></video>
            <div className="action-buttons">
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = recordedVideo;
                  link.download = `response-question-${currentQuestionIndex}.webm`;
                  link.click();
                }}
              >
                Download Response
              </button>
              {/* --- NEW "DELETE" BUTTON --- */}
              <button onClick={handleReset} className="delete-btn">
                Remove Response
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simple styles for the buttons */}
      <style>{`
          .initial-choice-buttons, .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1rem;
          }
          .delete-btn {
            background-color: #e74c3c; /* Red color for delete */
            color: white;
          }
          .delete-btn:hover {
            background-color: #c0392b;
          }
        `}</style>
    </div>
  );
};

export default QuestionBody;
