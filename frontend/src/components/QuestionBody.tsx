import { useState, useRef, useEffect, type ReactNode } from "react";

// --- QuestionBody Component with Upload and Record Logic ---

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
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input

  // --- NEW: Reset state when question changes ---
  useEffect(() => {
    setPermission(false);
    setStream(null);
    setRecordingStatus("inactive");
    setRecordedVideo(null);
    videoChunks.current = [];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentQuestionIndex]);

  // Function to get camera and microphone permissions
  const getCameraPermission = async () => {
    // Reset previous recording state if any
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

  // --- NEW: Handler for the "Upload from File" button ---
  const handleUploadClick = () => {
    // Programmatically click the hidden file input element
    fileInputRef.current?.click();
  };

  // --- NEW: Handler for when a user selects a file ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Create a URL for the selected file
      const videoUrl = URL.createObjectURL(file);
      // Set the video to be displayed and update the status
      setRecordedVideo(videoUrl);
      setRecordingStatus("recorded");
    }
  };

  // Assign the stream to the video element for live preview
  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Function to start recording the media stream
  const startRecording = () => {
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

  // Function to stop the recording
  const stopRecording = () => {
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

      {/* --- Video Recording UI --- */}
      <div className="video-controls">
        {/* Step 1: Show initial choice buttons */}
        {recordingStatus === "inactive" && !permission && (
          <div className="initial-choice-buttons">
            <button onClick={getCameraPermission} type="button">
              Record Response
            </button>
            <button onClick={handleUploadClick} type="button">
              Upload Response
            </button>
            {/* Hidden file input, controlled by the ref */}
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

        {/* Step 3: Show Recorded OR Uploaded Video and Download Link */}
        {recordingStatus === "recorded" && recordedVideo && (
          <div className="video-player">
            <h2>Your Response:</h2>
            <video src={recordedVideo} controls playsInline></video>
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
          </div>
        )}
      </div>
      {/* Simple styles to make the buttons appear next to each other */}
      <style>{`
          .initial-choice-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }
        `}</style>
    </div>
  );
};

export default QuestionBody;
