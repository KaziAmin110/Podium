import React, { useState, useEffect, useRef } from "react";

interface QuestionBodyProps {
  currentQuestionIndex: number;
  question: string;
  response: ResponseData | null; // Receives the video response from the parent
  onResponseChange: (response: ResponseData | null) => void; // Function to notify the parent
}

export interface ResponseData {
  videoUrl: string; // The local URL for the video preview
  videoBlob?: Blob; // The raw data of the video file (for future uploads)
}

const QuestionBody = ({
  question,
  response,
  onResponseChange,
}: QuestionBodyProps) => {
  // Local state is now only for the *process* of recording, not the final result.
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This effect ensures the camera turns off if the component is hidden
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // When live preview is active, attach the stream to the video element
  useEffect(() => {
    if (permission && stream && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
    }
  }, [permission, stream]);


  const getCameraPermission = async () => {
    if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
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
      // Don't set state here. Call the parent function with the new data.
      onResponseChange({
        videoUrl: URL.createObjectURL(file),
        videoBlob: file,
      });
    }
  };

  const handleReset = () => {
    // Tell the parent to set its state for this question to null.
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
      // Recording is done. Call the parent function with the new data.
      onResponseChange({
        videoUrl: URL.createObjectURL(videoBlob),
        videoBlob: videoBlob,
      });
      // Clean up the recording stream
      stream?.getTracks().forEach((track) => track.stop());
      setPermission(false);
      setStream(null);
    };
    mediaRecorder.current.stop();
    setIsRecording(false);
  };
  
  // --- Conditional Rendering Logic ---

  // 1. If a response already exists for this question, show the preview and action buttons.
  if (response) {
    return (
      <div className="question-body">
        <h2>{question}</h2>
        <div className="video-player">
          <h3>Your Response:</h3>
          {/* Using key={response.videoUrl} forces React to re-mount the video element when the URL changes */}
          <video src={response.videoUrl} controls playsInline key={response.videoUrl}></video>
          <div className="action-buttons">
            <a href={response.videoUrl} download={`response.webm`}>
              Download
            </a>
            <button onClick={handleReset} className="delete-btn">
              Delete Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If the user has given permission and is ready to record.
  if (permission && stream) {
    return (
      <div className="question-body">
        <h2>{question}</h2>
        <div className="video-player">
          <video ref={liveVideoRef} autoPlay muted playsInline className="live-preview"></video>
        </div>
        <div className="action-buttons">
            {!isRecording ? (
            <button onClick={startRecording} className="record-btn">Start Recording</button>
            ) : (
            <button onClick={stopRecording} className="recording-btn">Stop Recording</button>
            )}
        </div>
      </div>
    );
  }

  // 3. The initial view, asking the user to either record or upload.
  return (
    <div className="question-body">
      <h2>{question}</h2>
      <div className="initial-choice-buttons">
        <button onClick={getCameraPermission}>Record a Response</button>
        <button onClick={handleUploadClick}>Upload a Video</button>
        <input
          type="file" ref={fileInputRef} onChange={handleFileChange}
          accept="video/*" style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default QuestionBody;