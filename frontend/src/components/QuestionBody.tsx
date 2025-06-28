import { useState, useRef, useEffect, type ReactNode } from "react";

// --- QuestionBody Component (with Video Recording Logic) ---

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

  // Refs to hold the media recorder instance and video chunks
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);

  // Ref for the live video preview element
  const liveVideoRef = useRef<HTMLVideoElement>(null);

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

    // Store video chunks as they become available
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

    // When recording stops, create a video file from the stored chunks
    mediaRecorder.current.onstop = () => {
      const videoBlob = new Blob(videoChunks.current, {
        type: "video/webm",
      });
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideo(videoUrl);

      // Clear the chunks for the next recording
      videoChunks.current = [];

      // Stop all tracks in the stream to turn off the camera light
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
        {/* Step 1: Get Permissions */}
        {!permission && (
          <button onClick={getCameraPermission} type="button">
            Enable Camera & Mic
          </button>
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
                Record Response
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

        {/* Step 3: Show Recorded Video and Download Link */}
        {recordingStatus === "recorded" && recordedVideo && (
          <div className="video-player">
            <h2>Your Response:</h2>
            <video src={recordedVideo} controls playsInline></video>
            <a
              href={recordedVideo}
              download={`response-question-${currentQuestionIndex}.webm`}
            >
              Download Response
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBody;
