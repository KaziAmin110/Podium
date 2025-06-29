import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Video,
  Camera,
  Download,
  Trash2,
  SkipForward,
  Send,
  AlertCircle,
} from "lucide-react";

// Define the interfaces
interface InterviewData {
  questions: string[];
}

interface InterviewSetup {
  company: string;
  position: string;
  experience: string;
  questionsCount: number;
}

interface ResponseData {
  videoUrl: string;
  videoBlob?: Blob;
}

interface InterviewProps {
  data: InterviewData | null;
  setup: InterviewSetup | null;
  onExit: () => void;
  onComplete: (responses: ResponseData[]) => void;
}

const Interview: React.FC<InterviewProps> = ({
  data,
  setup,
  onExit,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<
    Record<number, ResponseData | null>
  >({});
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Cleanup video URLs on unmount
      Object.values(responses).forEach((response) => {
        if (response?.videoUrl) {
          URL.revokeObjectURL(response.videoUrl);
        }
      });
    };
  }, [stream, responses]);

  useEffect(() => {
    if (permission && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [permission, stream]);

  // Handle case where no interview data exists
  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl text-white mb-3">No interview data found</h1>
          <button
            onClick={onExit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = data.questions.length;
  const highestAnswered = Object.keys(responses)
    .filter((key) => responses[Number(key)] !== null)
    .map(Number)
    .reduce((max, current) => Math.max(max, current), -1);
  const maxUnlockedQuestion = Math.min(highestAnswered + 1, totalQuestions - 1);

  const handleExitInterview = (): void => {
    if (
      window.confirm(
        "Are you sure you want to exit the interview? Your progress will be lost."
      )
    ) {
      onExit();
    }
  };

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
        alert(
          "Unable to access camera and microphone. Please ensure you've granted permission and try again."
        );
      }
    } else {
      alert("Media API not supported in your browser.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    setIsRecording(true);
    videoChunks.current = [];

    // Try different MIME types for better compatibility
    let mimeType = "video/mp4";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp9,opus";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm:;codecs=vp8,opus";
    }

    console.log("Using MIME type:", mimeType);

    const media = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1000000, // 1 Mbps
      audioBitsPerSecond: 128000, // 128 kbps
    });

    mediaRecorder.current = media;

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        console.log("Received chunk:", e.data.size, "bytes");
        videoChunks.current.push(e.data);
      }
    };

    mediaRecorder.current.onerror = (e) => {
      console.error("MediaRecorder error:", e);
    };

    // Record in smaller chunks for better compatibility
    mediaRecorder.current.start(1000); // 1 second chunks
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;

    mediaRecorder.current.onstop = () => {
      // Wait a brief moment for all data to be collected
      setTimeout(() => {
        if (videoChunks.current.length === 0) {
          console.error("No video chunks recorded");
          alert("Recording failed - no data was captured. Please try again.");
          return;
        }

        const mimeType = mediaRecorder.current?.mimeType || "video/mp4";
        const videoBlob = new Blob(videoChunks.current, { type: mimeType });

        console.log("Created video blob:", {
          size: videoBlob.size,
          type: videoBlob.type,
          chunks: videoChunks.current.length,
        });

        // Create the video URL immediately
        const videoUrl = URL.createObjectURL(videoBlob);

        const newResponse: ResponseData = {
          videoUrl: videoUrl,
          videoBlob: videoBlob,
        };

        setResponses((prev) => {
          const oldResponse = prev[currentQuestionIndex];
          if (oldResponse?.videoUrl) {
            URL.revokeObjectURL(oldResponse.videoUrl);
          }
          return { ...prev, [currentQuestionIndex]: newResponse };
        });

        // Stop the camera stream after recording
        stream?.getTracks().forEach((track) => track.stop());
        setPermission(false);
        setStream(null);
      }, 100);
    };

    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newResponse: ResponseData = {
        videoUrl: URL.createObjectURL(file),
        videoBlob: file,
      };

      setResponses((prev) => {
        const oldResponse = prev[currentQuestionIndex];
        if (oldResponse?.videoUrl) {
          URL.revokeObjectURL(oldResponse.videoUrl);
        }
        return { ...prev, [currentQuestionIndex]: newResponse };
      });
    }
  };

  const handleReset = () => {
    const oldResponse = responses[currentQuestionIndex];
    if (oldResponse?.videoUrl) {
      URL.revokeObjectURL(oldResponse.videoUrl);
    }
    setResponses((prev) => ({ ...prev, [currentQuestionIndex]: null }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNavClick = (questionIndex: number) => {
    if (questionIndex <= maxUnlockedQuestion) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  const handleCompleteInterview = async () => {
    setIsSubmitting(true);
    try {
      // Convert responses to array format for the parent component
      const responseArray: ResponseData[] = [];
      for (let i = 0; i < totalQuestions; i++) {
        const response = responses[i];
        if (response) {
          responseArray.push(response);
        } else {
          // Create empty response for missing answers
          responseArray.push({
            videoUrl: "",
            videoBlob: undefined,
          });
        }
      }

      await onComplete(responseArray);
    } catch (error) {
      console.error("Error completing interview:", error);
      alert("Failed to submit interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = data.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Enhanced video response display
  const renderVideoResponse = () => {
    if (!currentResponse) return null;

    return (
      <div className="bg-gray-700 rounded-lg p-3">
        <h4 className="text-white font-medium mb-2 flex items-center text-xl">
          <Video className="w-8 h-8 mr-2 text-purple-400" />
          Your Response
        </h4>
        <video
          key={currentResponse.videoUrl} // Force re-render when URL changes
          src={currentResponse.videoUrl}
          controls
          playsInline
          preload="auto"
          muted={false}
          className="rounded-lg bg-black border border-purple-500 object-cover"
          style={{ maxHeight: "300px" }}
          onLoadStart={() => {
            console.log("Video loading started for:", currentResponse.videoUrl);
          }}
          onLoadedData={() => {
            console.log("Video data loaded successfully");
          }}
          onCanPlay={() => {
            console.log("Video can play");
          }}
          onCanPlayThrough={() => {
            console.log("Video can play through");
          }}
          onError={(e) => {
            console.error("Video playback error:", e);
            console.log("Current video URL:", currentResponse.videoUrl);
            console.log("Video blob exists:", !!currentResponse.videoBlob);
            console.log("Video element error:", e.currentTarget.error);

            // If there's an error and we have a blob, try recreating the URL
            if (
              currentResponse.videoBlob &&
              e.currentTarget.error?.code !== 4
            ) {
              console.log("Attempting to recreate video URL...");
              const newUrl = URL.createObjectURL(currentResponse.videoBlob);
              console.log("New URL created:", newUrl);

              // Update the response with the new URL
              setResponses((prev) => ({
                ...prev,
                [currentQuestionIndex]: {
                  ...currentResponse,
                  videoUrl: newUrl,
                },
              }));
            }
          }}
          onPlay={() => {
            console.log("Video started playing");
          }}
          onPause={() => {
            console.log("Video paused");
          }}
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          <a
            href={currentResponse.videoUrl}
            download={`response-question-${currentQuestionIndex + 1}.${
              currentResponse.videoBlob?.type.includes("mp4") ? "mp4" : "webm"
            }`}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </a>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </button>
          {/* Manual play button for troubleshooting */}
          <button
            onClick={(e) => {
              const video =
                e.currentTarget.parentElement?.parentElement?.querySelector(
                  "video"
                ) as HTMLVideoElement;
              if (video) {
                video.currentTime = 0;
                video.play().catch((err) => {
                  console.error("Manual play failed:", err);
                  alert(
                    "Unable to play video. This might be due to browser restrictions or video format issues."
                  );
                });
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
          >
            ▶ Play
          </button>
        </div>
      </div>
    );
  };

  // Recording interface
  const renderRecordingInterface = () => {
    if (!permission || !stream) return null;

    return (
      <div className="bg-gray-700 flex flex-col  p-5 rounded-lg">
        <h4 className="text-white font-medium mb-2 flex items-center text-xl">
          <Camera className="w-8 h-8 mr-2 text-purple-400" />
          {isRecording ? "Recording..." : "Camera Ready"}
        </h4>
        <video
          ref={liveVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-black border border-purple-500 object-cover"
          style={{ maxHeight: "300px" }}
        />
        <div className="bg-gray-700 flex gap-2 mt-3 rounded-full">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center transition-colors mt-5"
            >
              <Camera className="w-4 h-4 mr-1" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-800 text-white px-3 py-2 rounded text-sm flex items-center animate-pulse mt-5"
            >
              <div className="w-3 h-3 mr-1 bg-white rounded-full animate-pulse"></div>
              Stop Recording
            </button>
          )}
        </div>
      </div>
    );
  };

  // Initial choice interface
  const renderInitialChoice = () => (
    <div className="rounded-lg p-3 self-center flex flex-col gap-4">
      <h4 className="text-white font-medium mb-2 text-xl">
        Choose response method:
      </h4>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={getCameraPermission}
          className="flex-1 bg-purple-600 flex items-center justify-center hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors min-w-fit"
        >
          <Camera className="w-4 h-4 mr-1" />
          Record
        </button>
        <button
          onClick={handleUploadClick}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center transition-colors text-sm min-w-fit"
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-10 max-h-screen overflow-y-auto flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {setup?.company} Mock Interview
          </h1>
          <div className="flex gap-4 text-gray-400 text-sm mt-1">
            <span>Position: {setup?.position}</span>
            <span>Experience: {setup?.experience}</span>
          </div>
        </div>
        <button
          onClick={handleExitInterview}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Exit
        </button>
      </div>

      <div className="flex flex-col gap-2 justify-center mt-4">
        {/* Compact Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-300 text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
            <p className="text-xs text-gray-400">
              {Object.values(responses).filter((r) => r !== null).length}{" "}
              completed
            </p>
          </div>
          <div className="bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / totalQuestions) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Main Content in Two Columns */}
        <div className="flex flex-col gap-10 mb-4 mt-5 md:flex-row md:gap-5 md:justify-between md:min-h-150">
          {/* Question Column */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 md:basis-1/2">
            <h2 className="text-2xl font-semibold text-purple-300 mb-2">
              Question {currentQuestionIndex + 1}
            </h2>
            <p className="text-white text-xl mb-3 leading-relaxed">
              {currentQuestion}
            </p>
          </div>

          {/* Response Column */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 md:basis-1/2 flex justify-center">
            {currentResponse
              ? renderVideoResponse()
              : permission && stream
              ? renderRecordingInterface()
              : renderInitialChoice()}
          </div>
        </div>
      </div>

      {/* Compact Navigation */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors flex items-center mt-10"
        >
          Previous
        </button>

        <div className="flex gap-2 flex-wrap justify-center mt-10">
          {data.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => handleNavClick(index)}
              disabled={index > maxUnlockedQuestion}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index === currentQuestionIndex
                  ? "bg-purple-600 text-white"
                  : responses[index]
                  ? "bg-green-600 text-white"
                  : index <= maxUnlockedQuestion
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleCompleteInterview}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors font-semibold flex items-center mt-10"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Submit
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors flex items-center mt-10"
          >
            Next
            <SkipForward className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Interview;
