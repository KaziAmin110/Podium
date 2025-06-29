import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, Camera, Download, Trash2, SkipForward, Send, AlertCircle } from 'lucide-react';

// Define the interfaces
interface InterviewData {
  questions: string[];
}

interface ResponseData {
  videoUrl: string;
  videoBlob?: Blob;
}

interface InterviewProps {
  data: InterviewData | null;
  onExit: () => void;
  onComplete: (responses: ResponseData[]) => void;
}

const Interview: React.FC<InterviewProps> = ({ data, onExit, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, ResponseData | null>>({});
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle case where no interview data exists
  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl text-white mb-4">No interview data found</h1>
          <button 
            onClick={onExit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
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

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Cleanup video URLs on unmount
      Object.values(responses).forEach(response => {
        if (response?.videoUrl) {
          URL.revokeObjectURL(response.videoUrl);
        }
      });
    };
  }, [stream]);

  useEffect(() => {
    if (permission && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [permission, stream]);

  const handleExitInterview = (): void => {
    if (window.confirm('Are you sure you want to exit the interview? Your progress will be lost.')) {
      onExit();
    }
  };

  const getCameraPermission = async () => {
    if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setPermission(true);
        setStream(videoStream);
      } catch (err) {
        console.error("Error accessing camera and microphone:", err);
        alert("Unable to access camera and microphone. Please ensure you've granted permission and try again.");
      }
    } else {
      alert("Media API not supported in your browser.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    setIsRecording(true);
    videoChunks.current = [];

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
      const mimeType = mediaRecorder.current?.mimeType || "video/webm";
      const videoBlob = new Blob(videoChunks.current, { type: mimeType });

      const newResponse: ResponseData = {
        videoUrl: URL.createObjectURL(videoBlob),
        videoBlob: videoBlob,
      };

      setResponses(prev => {
        const oldResponse = prev[currentQuestionIndex];
        if (oldResponse?.videoUrl) {
          URL.revokeObjectURL(oldResponse.videoUrl);
        }
        return { ...prev, [currentQuestionIndex]: newResponse };
      });

      stream?.getTracks().forEach((track) => track.stop());
      setPermission(false);
      setStream(null);
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

      setResponses(prev => {
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
    setResponses(prev => ({ ...prev, [currentQuestionIndex]: null }));
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
            videoUrl: '',
            videoBlob: undefined
          });
        }
      }
      
      await onComplete(responseArray);
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Failed to submit interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = data.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Video response display
  const renderVideoResponse = () => {
    if (!currentResponse) return null;

    let displayVideoUrl = currentResponse.videoUrl;
    if (currentResponse.videoBlob && (!displayVideoUrl || !displayVideoUrl.startsWith("blob:"))) {
      displayVideoUrl = URL.createObjectURL(currentResponse.videoBlob);
    }

    return (
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Video className="w-5 h-5 mr-2 text-purple-400" />
          Your Response
        </h4>
        <video
          src={displayVideoUrl}
          controls
          playsInline
          className="w-full rounded-lg bg-black"
          onError={(e) => {
            console.error("Video playback error:", e);
            if (currentResponse.videoBlob) {
              const newUrl = URL.createObjectURL(currentResponse.videoBlob);
              e.currentTarget.src = newUrl;
            }
          }}
        />
        <div className="flex gap-3 mt-4 flex-wrap">
          <a
            href={displayVideoUrl}
            download={`response-question-${currentQuestionIndex + 1}.mp4`}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </a>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    );
  };

  // Recording interface
  const renderRecordingInterface = () => {
    if (!permission || !stream) return null;

    return (
      <div className="bg-gray-700 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-purple-400" />
          {isRecording ? 'Recording in Progress...' : 'Camera Ready'}
        </h4>
        <video
          ref={liveVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-black border-2 border-purple-500"
        />
        <div className="flex gap-3 mt-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-lg flex items-center animate-pulse"
            >
              <div className="w-5 h-5 mr-2 bg-white rounded-full animate-pulse"></div>
              Stop Recording
            </button>
          )}
        </div>
      </div>
    );
  };

  // Initial choice interface
  const renderInitialChoice = () => (
    <div className="bg-gray-700 rounded-lg p-6">
      <h4 className="text-white font-medium mb-4">Choose how to respond:</h4>
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={getCameraPermission}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
        >
          <Camera className="w-5 h-5 mr-2" />
          Record Response
        </button>
        <button
          onClick={handleUploadClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
        >
          <Upload className="w-5 h-5 mr-2" />
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
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Video Interview</h1>
            <p className="text-gray-300">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <button
            onClick={handleExitInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Exit Interview
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            Question {currentQuestionIndex + 1}
          </h2>
          <p className="text-white text-lg mb-6 leading-relaxed">
            {currentQuestion}
          </p>
          
          {/* Response Area */}
          <div className="space-y-4">
            {currentResponse ? renderVideoResponse() : 
             permission && stream ? renderRecordingInterface() : 
             renderInitialChoice()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-4">
            {isLastQuestion ? (
              <button
                onClick={handleCompleteInterview}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg transition-colors font-semibold flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Interview
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
              >
                Next
                <SkipForward className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Question Counter */}
        <div className="text-center">
          <div className="flex justify-center gap-2 flex-wrap">
            {data.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(index)}
                disabled={index > maxUnlockedQuestion}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-purple-600 text-white'
                    : responses[index]
                    ? 'bg-green-600 text-white'
                    : index <= maxUnlockedQuestion
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {Object.values(responses).filter(r => r !== null).length} of {totalQuestions} questions completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Interview;