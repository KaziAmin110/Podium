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
import type { ResponseData } from "./App"; // Import the ResponseData interface

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

interface InterviewProps {
  data: InterviewData | null;
  setData: React.Dispatch<React.SetStateAction<InterviewData | null>>;
  setup: InterviewSetup | null;
  setSetup: React.Dispatch<React.SetStateAction<InterviewSetup | null>>;
  onInterviewComplete: (responses: ResponseData[]) => Promise<void>;
  responses: Record<number, ResponseData | null>;
  setResponses: React.Dispatch<
    React.SetStateAction<Record<number, ResponseData | null>>
  >;
  onExit: () => void;
}

const Interview: React.FC<InterviewProps> = ({
  data,
  setData,
  setup,
  setSetup,
  onInterviewComplete,
  responses,
  setResponses,
  onExit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const currentQuestion = data.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleExitInterview = (): void => {
    if (
      window.confirm(
        "Are you sure you want to exit the interview? Your progress will be lost."
      )
    ) {
      onExit();
      handleCleanupVideos();
    }
  };

  const handleCleanupVideos = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setData(null);
    setSetup(null);
    setResponses({});
    setCurrentQuestionIndex(0);
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

    // Enhanced MIME type detection with explicit codec specifications
    const getOptimalMimeType = () => {
      // Test configurations in order of preference for video compatibility
      const configurations = [
        { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
        { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
        { mimeType: "video/mp4;codecs=h264,aac", extension: "mp4" },
        { mimeType: "video/webm", extension: "webm" },
        { mimeType: "video/mp4", extension: "mp4" },
      ];

      for (const config of configurations) {
        if (MediaRecorder.isTypeSupported(config.mimeType)) {
          console.log("Selected optimal MIME type:", config.mimeType);
          return config;
        }
      }

      // Ultimate fallback
      return { mimeType: "video/webm", extension: "webm" };
    };

    const selectedConfig = getOptimalMimeType();

    try {
      // Create MediaRecorder with optimized settings for video compatibility
      const options = {
        mimeType: selectedConfig.mimeType,
        videoBitsPerSecond: 2500000, // Increased to 2.5 Mbps
        audioBitsPerSecond: 128000,
      };

      // Only add bitrate if supported (some browsers don't support this)
      const media = new MediaRecorder(stream, options);
      mediaRecorder.current = media;

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log("Chunk received:", {
            size: e.data.size,
            type: e.data.type,
            timestamp: Date.now(),
          });
          videoChunks.current.push(e.data);
        } else {
          console.warn("Empty or invalid chunk received");
        }
      };

      mediaRecorder.current.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setIsRecording(false);
        alert("Recording error occurred. Please try again.");
      };

      mediaRecorder.current.onstart = () => {
        console.log("Recording started with config:", selectedConfig);
      };

      mediaRecorder.current.onpause = () => {
        console.log("Recording paused");
      };

      mediaRecorder.current.onresume = () => {
        console.log("Recording resumed");
      };

      // Start recording - using shorter intervals for better data collection
      mediaRecorder.current.start(1000); // Back to 1 second for consistent data flow
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
      alert(
        "Failed to start recording. Please check your browser compatibility."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder.current || mediaRecorder.current.state !== "recording") {
      console.warn(
        "MediaRecorder is not in recording state:",
        mediaRecorder.current?.state
      );
      setIsRecording(false);
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorder.current!;
      const originalMimeType = recorder.mimeType;

      recorder.onstop = () => {
        console.log("Recording stopped, processing data...");
        console.log("Original MIME type:", originalMimeType);
        console.log("Chunks collected:", videoChunks.current.length);

        // Process immediately, then wait for any additional data
        const processRecording = () => {
          if (videoChunks.current.length === 0) {
            console.error("No video chunks recorded");
            alert("Recording failed - no data was captured. Please try again.");
            setIsRecording(false);
            resolve();
            return;
          }

          // Log chunk details for debugging
          videoChunks.current.forEach((chunk, index) => {
            console.log(`Chunk ${index}:`, {
              size: chunk.size,
              type: chunk.type,
            });
          });

          // Create blob with multiple fallback strategies
          const createVideoBlob = () => {
            // Strategy 1: Use the exact MIME type from MediaRecorder
            try {
              const blob1 = new Blob(videoChunks.current, {
                type: originalMimeType,
              });
              if (blob1.size > 0) {
                console.log(
                  "Created blob with original MIME type:",
                  originalMimeType
                );
                return blob1;
              }
            } catch (e) {
              console.warn("Failed with original MIME type:", e);
            }

            // Strategy 2: Use generic webm
            try {
              const blob2 = new Blob(videoChunks.current, {
                type: "video/webm",
              });
              if (blob2.size > 0) {
                console.log("Created blob with video/webm");
                return blob2;
              }
            } catch (e) {
              console.warn("Failed with video/webm:", e);
            }

            // Strategy 3: Use no MIME type (let browser decide)
            try {
              const blob3 = new Blob(videoChunks.current);
              console.log("Created blob without MIME type");
              return blob3;
            } catch (e) {
              console.error("Failed to create any blob:", e);
              return null;
            }
          };

          const videoBlob = createVideoBlob();

          if (!videoBlob || videoBlob.size === 0) {
            console.error("Failed to create valid video blob");
            alert(
              "Recording failed - could not process video data. Please try again."
            );
            setIsRecording(false);
            resolve();
            return;
          }

          console.log("Final video blob:", {
            size: videoBlob.size,
            type: videoBlob.type,
            sizeInMB: (videoBlob.size / (1024 * 1024)).toFixed(2),
          });

          // Create object URL with error handling
          let videoUrl;
          try {
            videoUrl = URL.createObjectURL(videoBlob);
            console.log("Created video URL successfully:", videoUrl);
          } catch (error) {
            console.error("Failed to create object URL:", error);
            alert("Failed to create video URL. Please try again.");
            setIsRecording(false);
            resolve();
            return;
          }

          // Test the video URL by creating a temporary video element
          const testVideo = document.createElement("video");
          testVideo.preload = "metadata";

          testVideo.onloadedmetadata = () => {
            console.log("Video metadata loaded successfully:", {
              duration: testVideo.duration,
              videoWidth: testVideo.videoWidth,
              videoHeight: testVideo.videoHeight,
            });

            // Clean up test video
            testVideo.remove();

            // Create response object
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

            // Clean up camera stream
            if (stream) {
              stream.getTracks().forEach((track) => {
                track.stop();
                console.log("Stopped track:", track.kind, track.label);
              });
            }
            setPermission(false);
            setStream(null);
            setIsRecording(false);

            console.log("Recording processing completed successfully");
            resolve();
          };

          testVideo.onerror = (e) => {
            console.error("Video validation failed:", e);
            console.log("Attempting to use video anyway...");

            // Even if validation fails, try to use the video
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

            // Clean up camera stream
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
            }
            setPermission(false);
            setStream(null);
            setIsRecording(false);

            resolve();
          };

          // Set the source to test the video
          testVideo.src = videoUrl;
        };

        // Process the recording with a small delay to ensure all data is collected
        setTimeout(processRecording, 300);
      };

      try {
        console.log("Attempting to stop MediaRecorder...");
        recorder.stop();
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
        setIsRecording(false);
        resolve();
      }
    });
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

  // Handle interview completion - FIXED VERSION
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
          throw new Error(`Missing response for question ${i + 1}`);
        }
      }

      console.log("Completed interview responses:", responseArray);

      // Pass the array to parent, but DON'T overwrite the local responses state
      await onInterviewComplete(responseArray);
      handleCleanupVideos();
    } catch (error) {
      console.error("Error completing interview:", error);
      alert("Failed to submit interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced video response display with better sizing
  const renderVideoResponse = () => {
    if (!currentResponse) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center mb-4">
          <Video className="w-6 h-6 mr-2 text-purple-400" />
          <h4 className="text-white font-medium text-lg">Your Response</h4>
        </div>

        {/* Video container with proper aspect ratio and sizing */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-lg">
            <video
              key={currentResponse.videoUrl}
              src={currentResponse.videoUrl}
              controls
              playsInline
              preload="auto"
              muted={false}
              className="w-full h-full object-contain"
              style={{ minHeight: "200px" }}
              onError={(e) => {
                console.error("Video playback error:", e);
                console.log("Current video URL:", currentResponse.videoUrl);
                console.log("Video blob exists:", !!currentResponse.videoBlob);
                console.log("Video element error:", e.currentTarget.error);

                if (
                  currentResponse.videoBlob &&
                  e.currentTarget.error?.code !== 4
                ) {
                  console.log("Attempting to recreate video URL...");
                  const newUrl = URL.createObjectURL(currentResponse.videoBlob);
                  console.log("New URL created:", newUrl);

                  setResponses((prev) => ({
                    ...prev,
                    [currentQuestionIndex]: {
                      ...currentResponse,
                      videoUrl: newUrl,
                    },
                  }));
                }
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <a
              href={currentResponse.videoUrl}
              download={`response-question-${currentQuestionIndex + 1}.${
                currentResponse.videoBlob?.type.includes("mp4") ? "mp4" : "webm"
              }`}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
            <button
              disabled={isSubmitting}
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Recording interface with better sizing
  const renderRecordingInterface = () => {
    if (!permission || !stream) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center mb-4">
          <Camera className="w-6 h-6 mr-2 text-purple-400" />
          <h4 className="text-white font-medium text-lg">
            {isRecording ? "Recording..." : "Camera Ready"}
          </h4>
          {isRecording && (
            <div className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Video preview container */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden border-2 border-purple-500/50 shadow-lg">
            <video
              ref={liveVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ minHeight: "200px" }}
            />
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                REC
              </div>
            )}
          </div>

          {/* Recording controls */}
          <div className="flex justify-center mt-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-lg"
              >
                <div className="w-4 h-4 mr-2 bg-white rounded-full"></div>
                Start Recording
              </button>
            ) : (
              <button
                onClick={() => stopRecording()}
                className="bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-lg"
              >
                <div className="w-4 h-4 mr-2 bg-white"></div>
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Initial choice interface with better layout
  const renderInitialChoice = () => (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h4 className="text-white font-medium text-xl mb-2">
          Choose Response Method
        </h4>
        <p className="text-gray-400 text-sm">
          Record a new video or upload an existing one
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={getCameraPermission}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg group"
        >
          <Camera className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Record Video
        </button>
        <button
          onClick={handleUploadClick}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg group"
        >
          <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Upload Video
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
    <div className="min-h-screen bg-gray-900 p-4 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {setup?.company} Mock Interview
          </h1>
          <div className="flex gap-4 text-gray-400 text-sm mt-1">
            <span>Position: {setup?.position}</span>
            <span>Experience: {setup?.experience}</span>
          </div>
        </div>
        <button
          onClick={handleExitInterview}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Exit Interview
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-300">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
          <p className="text-sm text-gray-400">
            {Object.values(responses).filter((r) => r !== null).length}{" "}
            completed
          </p>
        </div>
        <div className="bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Question Column */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:flex-1 flex flex-col">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 underline">
            Question {currentQuestionIndex + 1}
          </h2>
          <div className="flex-1 flex items-center">
            <p className="text-white text-2xl leading-relaxed">
              {currentQuestion}
            </p>
          </div>
        </div>

        {/* Response Column */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:flex-1 flex flex-col min-h-[400px] justify-center">
          {currentResponse
            ? renderVideoResponse()
            : permission && stream
            ? renderRecordingInterface()
            : renderInitialChoice()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 gap-4">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
        >
          Previous
        </button>

        <div className="flex gap-2 justify-center">
          {data.questions.map((question, index) => (
            <button
              key={question}
              onClick={() => handleNavClick(index)}
              disabled={index > maxUnlockedQuestion || isSubmitting}
              className={`w-10 h-10 rounded-full font-medium transition-colors ${
                index === currentQuestionIndex
                  ? "bg-purple-600 text-white shadow-lg"
                  : responses[index]
                  ? "bg-green-600 text-white shadow-md"
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
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-semibold flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Interview
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center ${
              currentQuestionIndex >= maxUnlockedQuestion &&
              "cursor-not-allowed"
            }`}
            disabled={
              currentQuestionIndex >= maxUnlockedQuestion || isSubmitting
            }
          >
            Next
            <SkipForward className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Interview;
