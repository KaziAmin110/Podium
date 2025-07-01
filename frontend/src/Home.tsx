import React, { useState, useCallback, useRef } from "react";
import {
  Search,
  Briefcase,
  Building,
  Users,
  CheckCircle,
  Plus,
} from "lucide-react";

interface InterviewData {
  questions: string[];
}

interface InterviewRequestData {
  company: string;
  positionTitle: string;
  experience: string;
  count: number;
}

interface PodiumJobSearchProps {
  onInterviewStart?: (
    data: InterviewData,
    setup: {
      company: string;
      position: string;
      experience: string;
      questionsCount: number;
    }
  ) => void;
}

interface Company {
  name: string;
  color: string;
  logo: string;
}

interface Position {
  name: string;
  icon: string;
  color: string;
}

interface Level {
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface QuestionCount {
  name: string;
  value: number;
  color: string;
}

const COMPANIES: Company[] = [
  { name: "Google", color: "bg-blue-600", logo: "/company_logos/google.svg" },
  {
    name: "Microsoft",
    color: "bg-blue-700",
    logo: "/company_logos/microsoft.svg",
  },
  { name: "Apple", color: "bg-gray-600", logo: "/company_logos/apple.svg" },
  { name: "Meta", color: "bg-blue-800", logo: "/company_logos/meta.svg" },
  { name: "Amazon", color: "bg-orange-600", logo: "/company_logos/amazon.svg" },
  { name: "Netflix", color: "bg-red-600", logo: "/company_logos/netflix.svg" },
  { name: "Tesla", color: "bg-red-700", logo: "/company_logos/tesla.svg" },
  {
    name: "Spotify",
    color: "bg-green-600",
    logo: "/company_logos/spotify.svg",
  },
  { name: "Uber", color: "bg-gray-800", logo: "/company_logos/uber.svg" },
  { name: "Airbnb", color: "bg-pink-600", logo: "/company_logos/airbnb.svg" },
  { name: "Stripe", color: "bg-purple-600", logo: "/company_logos/stripe.svg" },
  { name: "GitHub", color: "bg-gray-700", logo: "/company_logos/github.svg" },
  { name: "Adobe", color: "bg-red-700", logo: "/company_logos/adobe.svg" },
  {
    name: "Salesforce",
    color: "bg-blue-500",
    logo: "/company_logos/salesforce.svg",
  },
  {
    name: "LinkedIn",
    color: "bg-blue-700",
    logo: "/company_logos/linkedin.svg",
  },
  { name: "NVIDIA", color: "bg-green-700", logo: "/company_logos/nvidia.svg" },
];

const POSITIONS: Position[] = [
  { name: "Software Engineer", icon: "💻", color: "bg-blue-600" },
  { name: "Frontend Developer", icon: "🎨", color: "bg-pink-600" },
  { name: "Backend Developer", icon: "⚙️", color: "bg-gray-700" },
  { name: "Full Stack Developer", icon: "🚀", color: "bg-purple-600" },
  { name: "Data Scientist", icon: "📊", color: "bg-green-600" },
  { name: "ML Engineer", icon: "🤖", color: "bg-orange-600" },
  { name: "DevOps Engineer", icon: "🔧", color: "bg-yellow-600" },
  { name: "Mobile Developer", icon: "📱", color: "bg-indigo-600" },
  { name: "Product Manager", icon: "📋", color: "bg-teal-600" },
  { name: "UI/UX Designer", icon: "✨", color: "bg-pink-700" },
  { name: "Data Engineer", icon: "🗃️", color: "bg-blue-700" },
  { name: "Security Engineer", icon: "🔒", color: "bg-red-700" },
];

const LEVELS: Level[] = [
  {
    name: "Intern",
    icon: "🌱",
    color: "bg-green-500",
    description: "Learning & Growing",
  },
  {
    name: "Entry Level",
    icon: "🚪",
    color: "bg-blue-500",
    description: "0-2 years",
  },
  {
    name: "Junior",
    icon: "📈",
    color: "bg-cyan-500",
    description: "1-3 years",
  },
  {
    name: "Mid Level",
    icon: "⚡",
    color: "bg-yellow-600",
    description: "3-5 years",
  },
  {
    name: "Senior",
    icon: "🎯",
    color: "bg-orange-600",
    description: "5-8 years",
  },
  {
    name: "Staff",
    icon: "👑",
    color: "bg-purple-600",
    description: "8+ years",
  },
  {
    name: "Principal",
    icon: "🏆",
    color: "bg-indigo-700",
    description: "Technical Leader",
  },
  {
    name: "Distinguished",
    icon: "💎",
    color: "bg-purple-800",
    description: "Industry Expert",
  },
  {
    name: "Postgraduate",
    icon: "🎓",
    color: "bg-teal-600",
    description: "Advanced Degree",
  },
  {
    name: "New Graduate",
    icon: "🌟",
    color: "bg-blue-600",
    description: "Fresh Graduate",
  },
];

const QUESTION_COUNTS: QuestionCount[] = [
  { name: "3 Questions", value: 3, color: "bg-blue-500" },
  { name: "4 Questions", value: 4, color: "bg-purple-500" },
  { name: "5 Questions", value: 5, color: "bg-green-500" },
];

const PodiumJobSearch: React.FC<PodiumJobSearchProps> = ({
  onInterviewStart,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
  const [companySearch, setCompanySearch] = useState<string>("");
  const [positionSearch, setPositionSearch] = useState<string>("");
  const [levelSearch, setLevelSearch] = useState<string>("");
  const [customCompany, setCustomCompany] = useState<string>("");
  const [customPosition, setCustomPosition] = useState<string>("");
  const [customLevel, setCustomLevel] = useState<string>("");
  const [customQuestionCount, setCustomQuestionCount] = useState<string>("");
  const [showCustomCompany, setShowCustomCompany] = useState<boolean>(false);
  const [showCustomPosition, setShowCustomPosition] = useState<boolean>(false);
  const [showCustomLevel, setShowCustomLevel] = useState<boolean>(false);
  const [showCustomQuestionCount, setShowCustomQuestionCount] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Refs for custom inputs
  const customCompanyRef = useRef<HTMLInputElement | null>(null);
  const customPositionRef = useRef<HTMLInputElement | null>(null);
  const customLevelRef = useRef<HTMLInputElement | null>(null);
  const customQuestionCountRef = useRef<HTMLInputElement | null>(null);

  // Filter data
  const filteredCompanies = COMPANIES.filter((company) =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredPositions = POSITIONS.filter((position) =>
    position.name.toLowerCase().includes(positionSearch.toLowerCase())
  );

  const filteredLevels = LEVELS.filter((level) =>
    level.name.toLowerCase().includes(levelSearch.toLowerCase())
  );

  // Validate question count
  const validateQuestionCount = (value: string): number => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return 1;
    if (num > 8) return 8;
    return num;
  };

  // Final values
  const finalCompany = showCustomCompany ? customCompany : selectedCompany;
  const finalPosition = showCustomPosition ? customPosition : selectedPosition;
  const finalLevel = showCustomLevel ? customLevel : selectedLevel;
  const finalQuestionCount = showCustomQuestionCount
    ? validateQuestionCount(customQuestionCount)
    : selectedQuestionCount;

  // Handlers
  const handleCompanySelect = useCallback((companyName: string): void => {
    setSelectedCompany(companyName);
    setShowCustomCompany(false);
    setCustomCompany("");
  }, []);

  const handlePositionSelect = useCallback((positionName: string): void => {
    setSelectedPosition(positionName);
    setShowCustomPosition(false);
    setCustomPosition("");
  }, []);

  const handleLevelSelect = useCallback((levelName: string): void => {
    setSelectedLevel(levelName);
    setShowCustomLevel(false);
    setCustomLevel("");
  }, []);

  const handleQuestionCountSelect = useCallback((count: number): void => {
    setSelectedQuestionCount(count);
    setShowCustomQuestionCount(false);
    setCustomQuestionCount("");
  }, []);

  const handleCustomCompanyToggle = useCallback((): void => {
    setShowCustomCompany(true);
    setSelectedCompany("");
  }, []);

  const handleCustomPositionToggle = useCallback((): void => {
    setShowCustomPosition(true);
    setSelectedPosition("");
  }, []);

  const handleCustomLevelToggle = useCallback((): void => {
    setShowCustomLevel(true);
    setSelectedLevel("");
  }, []);

  const handleCustomQuestionCountToggle = useCallback((): void => {
    setShowCustomQuestionCount(true);
    setSelectedQuestionCount(0);
  }, []);

  const handleCustomQuestionCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "" || /^\d+$/.test(value)) {
        setCustomQuestionCount(value);
      }
    },
    []
  );

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    const interviewData: InterviewRequestData = {
      company: finalCompany,
      positionTitle: finalPosition,
      experience: finalLevel,
      count: finalQuestionCount,
    };

    // Store the setup details for later use
    const setupDetails = {
      company: finalCompany,
      position: finalPosition,
      experience: finalLevel,
      questionsCount: finalQuestionCount,
    };

    try {
      const response = await fetch(
        "http://localhost:3000/api/app/generate-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(interviewData),
        }
      );

      const data: Record<string, string> = await response.json();
      let questionsArray: string[] = [];

      if (data && typeof data === "object") {
        if (data.questions && Array.isArray(data.questions)) {
          questionsArray = data.questions;
        } else {
          const numericKeys: string[] = Object.keys(data)
            .filter((key: string) => !isNaN(Number(key)))
            .sort((a, b) => Number(a) - Number(b));

          questionsArray = numericKeys.map((key) => data[key]);

          if (questionsArray.length === 0) {
            questionsArray = Object.values(data).filter(
              (value) => typeof value === "string" && value.length > 10
            ) as string[];
          }
        }
      }
      console.log("Generated questions:", questionsArray);

      if (questionsArray && questionsArray.length > 0) {
        const interviewResult: InterviewData = {
          questions: questionsArray,
        };

        if (onInterviewStart) {
          // Pass both the interview data and setup details
          onInterviewStart(interviewResult, setupDetails);
        }
      } else {
        throw new Error("Failed to create mock interview session");
      }
    } catch (error) {
      console.error("Error creating mock interview:", error);
      alert("Error starting mock interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mx-auto  bg-gray-800 rounded-2xl p-8 border border-gray-600 shadow-2xl w-full">
        {/* Header */}
        <div className="text-center mb-16 mt-14">
          <h1 className="text-6xl font-bold text-white mb-4">
            Welcome to Podium
          </h1>
          <p className="text-xl text-gray-300">
            Practice with AI-powered mock interviews tailored to your dream
            career!
          </p>
        </div>

        {/* Companies Section */}
        <div className="flex flex-col mb-8 w-full">
          <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-3xl font-bold text-white flex items-center mb-4 md:mb-0">
              <Building className="mr-3 w-8 h-8 text-purple-400" />
              Select Company
            </h2>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search company..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-800 transition-all duration-200 w-full shadow-lg"
              />
            </div>
          </div>

          {showCustomCompany && (
            <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 shadow-xl">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Company Name
              </label>
              <input
                ref={customCompanyRef}
                type="text"
                placeholder="Enter your company name..."
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-500 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-700 transition-all duration-200 shadow-inner"
              />
            </div>
          )}

          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 w-full">
              {/* Custom Company Option */}
              <div
                onClick={handleCustomCompanyToggle}
                className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <div
                  className={`bg-gradient-to-br from-slate-200 to-slate-300 p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${
                    showCustomCompany
                      ? "border-purple-500 shadow-purple-500/40 shadow-2xl bg-gradient-to-br from-purple-100 to-purple-200"
                      : "border-slate-300 hover:border-slate-400 hover:shadow-2xl hover:from-slate-100 hover:to-slate-200"
                  }`}
                >
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex flex-col items-center text-center z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-2 shadow-lg backdrop-blur-sm border border-slate-600">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-sm">
                      Custom
                    </span>
                  </div>

                  {showCustomCompany && (
                    <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Company Options */}
              {filteredCompanies.map((company) => (
                <div
                  key={company.name}
                  onClick={() => handleCompanySelect(company.name)}
                  className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                >
                  <div
                    className={`relative p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${
                      // Dynamic background based on company color with better contrast
                      company.color.includes("bg-blue")
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : company.color.includes("bg-red")
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : company.color.includes("bg-green")
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                        : company.color.includes("bg-yellow")
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-slate-800"
                        : company.color.includes("bg-purple")
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : company.color.includes("bg-pink")
                        ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                        : company.color.includes("bg-indigo")
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                        : company.color.includes("bg-orange")
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : company.color.includes("bg-teal")
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white"
                        : company.color.includes("bg-cyan")
                        ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                        : company.color.includes("bg-lime")
                        ? "bg-gradient-to-br from-lime-500 to-lime-600 text-slate-800"
                        : company.color.includes("bg-emerald")
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                        : company.color.includes("bg-rose")
                        ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white"
                        : company.color.includes("bg-violet")
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                        : company.color.includes("bg-fuchsia")
                        ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white"
                        : company.color.includes("bg-sky")
                        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white"
                        : company.color.includes("bg-amber")
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-800"
                        : "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
                    } ${
                      selectedCompany === company.name
                        ? "border-white shadow-white/40 shadow-2xl scale-105 ring-2 ring-white/50"
                        : "border-white/30 hover:border-white/70 hover:shadow-2xl hover:scale-[1.02]"
                    }`}
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="flex flex-col items-center text-center z-10">
                      {/* Logo container with better contrast */}
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 shadow-lg border border-white/40 group-hover:bg-white transition-all duration-300">
                        <img
                          src={company.logo}
                          alt={`${company.name} logo`}
                          className="w-6 h-6 object-contain filter drop-shadow-sm"
                          onError={(e) => {
                            // Fallback to company initial if logo fails to load
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            if (img.nextSibling && img.nextSibling instanceof HTMLElement) {
                              (img.nextSibling as HTMLElement).style.display = "block";
                            }
                          }}
                        />
                        <span
                          className="text-slate-700 font-bold text-lg hidden"
                          style={{ display: "none" }}
                        >
                          {company.name.charAt(0)}
                        </span>
                      </div>

                      <span className="font-semibold text-sm leading-tight text-center px-1 max-w-full drop-shadow-sm">
                        {company.name.length > 12
                          ? company.name.substring(0, 12) + "..."
                          : company.name}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    {selectedCompany === company.name && (
                      <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Ripple effect on click */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-30 bg-slate-600 transition-opacity duration-150" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Positions Section */}
        <div className="flex flex-col mb-8">
          <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-3xl font-bold text-white flex items-center mb-4 md:mb-0">
              <Briefcase className="mr-3 w-8 h-8 text-purple-400" />
              Choose Position
            </h2>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search position..."
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-800 transition-all duration-200 w-full shadow-lg"
              />
            </div>
          </div>

          {showCustomPosition && (
            <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 shadow-xl">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Position Title
              </label>
              <input
                ref={customPositionRef}
                type="text"
                placeholder="Enter your position title..."
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-500 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-700 transition-all duration-200 shadow-inner"
              />
            </div>
          )}

          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 w-full">
              {/* Custom Position Option */}
              <div
                onClick={handleCustomPositionToggle}
                className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <div
                  className={`bg-gradient-to-br from-slate-200 to-slate-300 p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${
                    showCustomPosition
                      ? "border-purple-500 shadow-purple-500/40 shadow-2xl bg-gradient-to-br from-purple-100 to-purple-200"
                      : "border-slate-300 hover:border-slate-400 hover:shadow-2xl hover:from-slate-100 hover:to-slate-200"
                  }`}
                >
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex flex-col items-center text-center z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-2 shadow-lg backdrop-blur-sm border border-slate-600">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-sm">
                      Custom
                    </span>
                  </div>

                  {showCustomPosition && (
                    <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-30 bg-slate-600 transition-opacity duration-150" />
                </div>
              </div>

              {/* Position Options */}
              {filteredPositions.map((position) => (
                <div
                  key={position.name}
                  onClick={() => handlePositionSelect(position.name)}
                  className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 w-full"
                >
                  <div
                    className={`relative p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${
                      // Dynamic background based on position color with better contrast
                      position.color.includes("bg-blue")
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : position.color.includes("bg-red")
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : position.color.includes("bg-green")
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                        : position.color.includes("bg-yellow")
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                        : position.color.includes("bg-purple")
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : position.color.includes("bg-pink")
                        ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                        : position.color.includes("bg-indigo")
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                        : position.color.includes("bg-orange")
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : position.color.includes("bg-teal")
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white"
                        : position.color.includes("bg-cyan")
                        ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                        : position.color.includes("bg-lime")
                        ? "bg-gradient-to-br from-lime-500 to-lime-600 text-slate-800"
                        : position.color.includes("bg-emerald")
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                        : position.color.includes("bg-rose")
                        ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white"
                        : position.color.includes("bg-violet")
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                        : position.color.includes("bg-fuchsia")
                        ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white"
                        : position.color.includes("bg-sky")
                        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white"
                        : position.color.includes("bg-amber")
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                        : "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
                    } ${
                      selectedPosition === position.name
                        ? "border-white shadow-white/40 shadow-2xl scale-105 ring-2 ring-white/50"
                        : "border-white/30 hover:border-white/70 hover:shadow-2xl hover:scale-[1.02]"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center z-10">
                      {/* Icon container with better contrast */}
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 shadow-lg border border-white/40 group-hover:bg-white transition-all duration-300">
                        <span className="text-2xl">{position.icon}</span>
                      </div>

                      <span className="font-semibold text-sm leading-tight text-center px-1 max-w-full drop-shadow-sm ">
                        {position.name.length > 12
                          ? position.name.substring(0, 12) + "..."
                          : position.name}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    {selectedPosition === position.name && (
                      <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Ripple effect on click */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Experience Level Section */}
        <div className="flex flex-col mb-8">
          <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-3xl font-bold text-white flex items-center mb-4 md:mb-0">
              <Users className="mr-3 w-8 h-8 text-purple-400" />
              Experience Level
            </h2>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search experience level..."
                value={levelSearch}
                onChange={(e) => setLevelSearch(e.target.value)}
                className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-800 transition-all duration-200 w-full shadow-lg"
              />
            </div>
          </div>

          {showCustomLevel && (
            <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 shadow-xl">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Experience Level
              </label>
              <input
                ref={customLevelRef}
                type="text"
                placeholder="Enter your experience level..."
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value)}
                className="w-full bg-gray-700/80 backdrop-blur-sm border border-gray-500 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-700 transition-all duration-200 shadow-inner"
              />
            </div>
          )}

          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 w-full">
              {/* Custom Level Option */}
              <div
                onClick={handleCustomLevelToggle}
                className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <div
                  className={`bg-gradient-to-br from-slate-200 to-slate-300 p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${
                    showCustomLevel
                      ? "border-purple-500 shadow-purple-500/40 shadow-2xl bg-gradient-to-br from-purple-100 to-purple-200"
                      : "border-slate-300 hover:border-slate-400 hover:shadow-2xl hover:from-slate-100 hover:to-slate-200"
                  }`}
                >
                  <div className="flex flex-col items-center text-center z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-2 shadow-lg backdrop-blur-sm border border-slate-600">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-sm">
                      Custom
                    </span>
                  </div>

                  {showCustomLevel && (
                    <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-30 bg-slate-600 transition-opacity duration-150" />
                </div>
              </div>

              {/* Experience Level Options */}
              {filteredLevels.map((level) => (
                <div
                  key={level.name}
                  onClick={() => handleLevelSelect(level.name)}
                  className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                >
                  <div
                    className={`relative p-4 rounded-2xl shadow-xl border-2 h-24 w-full flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${
                      // Dynamic background based on level color with better contrast
                      level.color.includes("bg-blue")
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : level.color.includes("bg-red")
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : level.color.includes("bg-green")
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                        : level.color.includes("bg-yellow")
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                        : level.color.includes("bg-purple")
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : level.color.includes("bg-pink")
                        ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                        : level.color.includes("bg-indigo")
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                        : level.color.includes("bg-orange")
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : level.color.includes("bg-teal")
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white"
                        : level.color.includes("bg-cyan")
                        ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                        : level.color.includes("bg-lime")
                        ? "bg-gradient-to-br from-lime-500 to-lime-600 text-white"
                        : level.color.includes("bg-emerald")
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                        : level.color.includes("bg-rose")
                        ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white"
                        : level.color.includes("bg-violet")
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                        : level.color.includes("bg-fuchsia")
                        ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white"
                        : level.color.includes("bg-sky")
                        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white"
                        : level.color.includes("bg-amber")
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                        : "bg-gradient-to-br from-slate-500 to-slate-600 text-white"
                    } ${
                      selectedLevel === level.name
                        ? "border-white shadow-white/40 shadow-2xl scale-105 ring-2 ring-white/50"
                        : "border-white/30 hover:border-white/70 hover:shadow-2xl hover:scale-[1.02]"
                    }`}
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="flex flex-col items-center text-center z-10">
                      {/* Icon container with better contrast */}
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 shadow-lg border border-white/40 group-hover:bg-white transition-all duration-300">
                        <span className="text-2xl">{level.icon}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-sm leading-tight text-center px-1 max-w-full drop-shadow-sm">
                          {level.name.length > 12
                            ? level.name.substring(0, 12) + "..."
                            : level.name}
                        </span>
                        <span className="text-xs opacity-80 leading-tight text-center px-1 max-w-full drop-shadow-sm mt-1">
                          {level.description && level.description.length > 15
                            ? level.description.substring(0, 15) + "..."
                            : level.description}
                        </span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedLevel === level.name && (
                      <div className="absolute -top-0 -right-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-b-gray-200">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Ripple effect on click */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Number of Questions Section */}
        <div className="flex flex-col mb-8">
          <div className="flex flex-col items-center justify-between mb-4 md:flex-row">
            <h2 className="text-2xl font-bold text-white flex items-center mb-3">
              <Search className="mr-3 w-7 h-7 text-purple-400" />
              Number of Questions
            </h2>
          </div>

          {showCustomQuestionCount && (
            <div className="mb-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <input
                ref={customQuestionCountRef}
                type="text"
                placeholder="Enter number (1-8)..."
                value={customQuestionCount}
                onChange={handleCustomQuestionCountChange}
                maxLength={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="txt-md text-gray-400 mt-2">
                Enter a number between 1 and 8
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <div className="flex flex-col md:grid grid-cols-4 gap-3 w-full">
              <div
                onClick={handleCustomQuestionCountToggle}
                className="relative cursor-pointer transition-all duration-300 transform hover:scale-105"
              >
                <div
                  className={`bg-gray-600 p-3 rounded-xl shadow-lg border-2 h-20 w-full flex flex-col justify-center ${
                    showCustomQuestionCount
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1 text-white font-bold text-sm">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-white font-semibold txt-md">
                      Custom
                    </span>
                  </div>
                  {showCustomQuestionCount && (
                    <CheckCircle className="absolute -top-0 -right-0 w-5 h-5 text-green-400 bg-gray-900 rounded-full" />
                  )}
                </div>
              </div>

              {QUESTION_COUNTS.map((count) => (
                <div
                  key={count.value}
                  onClick={() => handleQuestionCountSelect(count.value)}
                  className="relative cursor-pointer transition-all duration-300 transform hover:scale-105"
                >
                  <div
                    className={`${
                      count.color
                    } p-3 rounded-xl shadow-lg border-2 h-20 w-full flex flex-col justify-center ${
                      selectedQuestionCount === count.value
                        ? "border-white"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center text-center">
                      <span className="text-white font-semibold text-md truncate w-full text-center px-1">
                        {count.name}
                      </span>
                    </div>
                    {selectedQuestionCount === count.value && (
                      <CheckCircle className="absolute -top-0 -right-0 w-5 h-5 text-green-400 bg-gray-900 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="flex justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl w-full md:w-3/4 lg:w-2/3 xl:w-1/2">
            {finalCompany &&
              finalPosition &&
              finalLevel &&
              finalQuestionCount && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">
                    Your Mock Interview Setup:
                  </h3>
                  <p className="text-purple-300">
                    {finalPosition} at {finalCompany} ({finalLevel})
                  </p>
                  <p className="text-purple-300 text-sm mt-1">
                    {finalQuestionCount} questions
                  </p>
                </div>
              )}

            <button
              onClick={handleSubmit}
              disabled={
                !finalCompany ||
                !finalPosition ||
                !finalLevel ||
                !finalQuestionCount ||
                isSubmitting
              }
              className="bg-purple-600 w-full flex justify-center items-center cursor-pointer hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Starting Interview...
                </>
              ) : (
                <>
                  <Search className="inline w-6 h-6 mr-2" />
                  Start Mock Interview
                </>
              )}
            </button>

            {(!finalCompany ||
              !finalPosition ||
              !finalLevel ||
              !finalQuestionCount) &&
              !isSubmitting && (
                <p className="text-gray-400 text-sm mt-4 text-center">
                  Please select company, position, experience level, and number
                  of questions (1-8)
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodiumJobSearch;
