import { useState, useRef, useEffect } from "react";

// --- Type Definition ---
export interface ResponseData {
  videoUrl: string;
  videoBlob?: Blob;
}

// --- NEW: Configuration for Video Recording ---
// Check if the browser supports recording in MP4 format. Fallback to webm if not.
const supportedMimeType = MediaRecorder.isTypeSupported("video/mp4")
  ? "video/mp4"
  : "video/webm";
// Determine the file extension based on the supported MIME type.
const fileExtension = supportedMimeType.split("/")[1];

// --- Props Interface ---
interface QuestionBodyProps {
  currentQuestionIndex: number;
  question: string;
  response: ResponseData | null;
  onResponseChange: (response: ResponseData | null) => void;
  onNavigateNext: () => void;
  isLastQuestion: boolean;
}

const QuestionBody = ({
  question,
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
    // --- MODIFIED: Use the dynamically determined MIME type ---
    const media = new MediaRecorder(stream, { mimeType: supportedMimeType });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunks.current.push(e.data);
    };
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.onstop = () => {
      // --- MODIFIED: Create a Blob with the correct MIME type ---
      const videoBlob = new Blob(videoChunks.current, {
        type: supportedMimeType,
      });
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
            {/* --- MODIFIED: Use the dynamic file extension for download --- */}
            <a href={response.videoUrl} download={`response.${fileExtension}`}>
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
          </div>
        </div>
      </div>
    );
  }

  // --- (The rest of the component is unchanged) ---
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
          }
      `}</style>
    </div>
  );
};

export default QuestionBody;
