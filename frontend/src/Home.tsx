import React, { useState, useCallback, useRef } from 'react';
import { Search, Briefcase, Building, Users, CheckCircle, Plus } from 'lucide-react';

interface Company {
  name: string;
  color: string;
  initials: string;
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

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchId: string;
}

interface BubbleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Company[] | Position[] | Level[] | QuestionCount[];
  selectedItem: string | number;
  onSelect: (item: any) => void; // More flexible typing
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: 'company' | 'position' | 'level' | 'questionCount';
  searchId: string;
  showCustom: boolean;
  onCustomToggle: () => void;
  customValue: string;
  onCustomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customPlaceholder: string;
  customRef: React.RefObject<HTMLInputElement | null>;
}

const COMPANIES: Company[] = [
  { name: 'Google', color: 'bg-blue-600', initials: 'G' },
  { name: 'Microsoft', color: 'bg-blue-700', initials: 'MS' },
  { name: 'Apple', color: 'bg-gray-600', initials: 'A' },
  { name: 'Meta', color: 'bg-blue-800', initials: 'M' },
  { name: 'Amazon', color: 'bg-orange-600', initials: 'A' },
  { name: 'Netflix', color: 'bg-red-600', initials: 'N' },
  { name: 'Tesla', color: 'bg-red-700', initials: 'T' },
  { name: 'Spotify', color: 'bg-green-600', initials: 'S' },
  { name: 'Uber', color: 'bg-gray-800', initials: 'U' },
  { name: 'Airbnb', color: 'bg-pink-600', initials: 'A' },
  { name: 'Stripe', color: 'bg-purple-600', initials: 'S' },
  { name: 'GitHub', color: 'bg-gray-700', initials: 'GH' },
  { name: 'Adobe', color: 'bg-red-700', initials: 'AD' },
  { name: 'Salesforce', color: 'bg-blue-500', initials: 'SF' },
  { name: 'LinkedIn', color: 'bg-blue-700', initials: 'LI' },
  { name: 'NVIDIA', color: 'bg-green-700', initials: 'NV' }
];

const POSITIONS: Position[] = [
  { name: 'Software Engineer', icon: '💻', color: 'bg-blue-600' },
  { name: 'Frontend Developer', icon: '🎨', color: 'bg-pink-600' },
  { name: 'Backend Developer', icon: '⚙️', color: 'bg-gray-700' },
  { name: 'Full Stack Developer', icon: '🚀', color: 'bg-purple-600' },
  { name: 'Data Scientist', icon: '📊', color: 'bg-green-600' },
  { name: 'ML Engineer', icon: '🤖', color: 'bg-orange-600' },
  { name: 'DevOps Engineer', icon: '🔧', color: 'bg-yellow-600' },
  { name: 'Mobile Developer', icon: '📱', color: 'bg-indigo-600' },
  { name: 'Product Manager', icon: '📋', color: 'bg-teal-600' },
  { name: 'UI/UX Designer', icon: '✨', color: 'bg-pink-700' },
  { name: 'Data Engineer', icon: '🗃️', color: 'bg-blue-700' },
  { name: 'Security Engineer', icon: '🔒', color: 'bg-red-700' }
];

const LEVELS: Level[] = [
  { name: 'Intern', icon: '🌱', color: 'bg-green-500', description: 'Learning & Growing' },
  { name: 'Entry Level', icon: '🚪', color: 'bg-blue-500', description: '0-2 years' },
  { name: 'Junior', icon: '📈', color: 'bg-cyan-500', description: '1-3 years' },
  { name: 'Mid Level', icon: '⚡', color: 'bg-yellow-600', description: '3-5 years' },
  { name: 'Senior', icon: '🎯', color: 'bg-orange-600', description: '5-8 years' },
  { name: 'Staff', icon: '👑', color: 'bg-purple-600', description: '8+ years' },
  { name: 'Principal', icon: '🏆', color: 'bg-indigo-700', description: 'Technical Leader' },
  { name: 'Distinguished', icon: '💎', color: 'bg-purple-800', description: 'Industry Expert' },
  { name: 'Postgraduate', icon: '🎓', color: 'bg-teal-600', description: 'Advanced Degree' },
  { name: 'New Graduate', icon: '🌟', color: 'bg-blue-600', description: 'Fresh Graduate' }
];

interface QuestionCount {
  name: string;
  value: number;
  color: string;
}

const QUESTION_COUNTS: QuestionCount[] = [
  { name: '3 Questions', value: 3, color: 'bg-blue-500' },
  { name: '4 Questions', value: 4, color: 'bg-purple-500' },
  { name: '5 Questions', value: 5, color: 'bg-green-500' },
];

const SearchInput: React.FC<SearchInputProps> = ({ placeholder, value, onChange, searchId }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      id={searchId}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="bg-gray-800 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
    />
  </div>
);

const BubbleSection: React.FC<BubbleSectionProps> = ({ 
  title, 
  icon: Icon, 
  items, 
  selectedItem, 
  onSelect, 
  searchValue, 
  onSearchChange, 
  type, 
  searchId, 
  showCustom, 
  onCustomToggle, 
  customValue, 
  onCustomChange, 
  customPlaceholder, 
  customRef 
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold text-white flex items-center">
        <Icon className="mr-3 w-7 h-7 text-purple-400" />
        {title}
      </h2>
      {type !== 'questionCount' && (
        <SearchInput
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={onSearchChange}
          searchId={searchId}
        />
      )}
    </div>

    {/* Custom input box below header */}
    {showCustom && (
      <div className="mb-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <input
          ref={customRef}
          type="text"
          placeholder={customPlaceholder}
          value={customValue}
          onChange={onCustomChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    )}

    <div className="flex justify-center">
      <div className="grid grid-cols-5 lg:grid-cols-6 gap-3 max-w-4xl">
        {/* Custom bubble for all sections - same size as others */}
        <div
          onClick={onCustomToggle}
          className="relative cursor-pointer transition-all duration-300"
        >
          <div className={`bg-gray-600 p-3 rounded-xl shadow-lg border-2 transition-all h-20 w-full flex flex-col justify-center ${
            showCustom ? 'border-white' : 'border-transparent'
          }`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1 text-white font-bold text-sm">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-white font-semibold text-xs">Custom</span>
            </div>
            {showCustom && (
              <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-green-400 bg-gray-900 rounded-full" />
            )}
          </div>
        </div>

        {items.map((item) => {
          const isQuestionCount = type === 'questionCount';
          const itemValue = isQuestionCount ? (item as QuestionCount).value : (item as any).name;
          const isSelected = selectedItem === itemValue;
          
          return (
            <div
              key={isQuestionCount ? `count-${(item as QuestionCount).value}` : (item as any).name}
              onClick={() => onSelect(itemValue)}
              className="relative cursor-pointer transition-all duration-300"
            >
              <div className={`${item.color} p-3 rounded-xl shadow-lg border-2 transition-all h-20 w-full flex flex-col justify-center ${
                isSelected ? 'border-white' : 'border-transparent'
              }`}>
                {type === 'company' && (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1 text-white font-bold text-xs">
                      {(item as Company).initials}
                    </div>
                    <span className="text-white font-semibold text-xs truncate w-full px-1">{(item as any).name}</span>
                  </div>
                )}

                {type === 'position' && (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-lg mb-1">{(item as Position).icon}</div>
                    <span className="text-white font-semibold text-xs leading-tight text-center px-1 truncate w-full">{(item as any).name}</span>
                  </div>
                )}

                {type === 'level' && (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-lg mb-1">{(item as Level).icon}</div>
                    <span className="text-white font-semibold text-xs mb-0 truncate w-full text-center">{(item as any).name}</span>
                    <span className="text-white/70 text-xs truncate w-full text-center px-1">{(item as Level).description}</span>
                  </div>
                )}

                {type === 'questionCount' && (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-lg mb-1 text-white font-bold">{(item as QuestionCount).value}</div>
                    <span className="text-white font-semibold text-xs truncate w-full text-center px-1">{(item as QuestionCount).name}</span>
                  </div>
                )}

                {isSelected && (
                  <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-green-400 bg-gray-900 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {items.length === 0 && (
      <div className="text-center py-8 text-gray-400">
        No results found for "{searchValue}"
      </div>
    )}
  </div>
);

interface InterviewData {
  questions: string[]; // Array of question strings from backend
}

interface InterviewRequestData {
  company: string;
  positionTitle: string;
  experience: string;
  count: number;
}

interface PodiumJobSearchProps {
  onInterviewStart?: (data: InterviewData) => void;
}

const PodiumJobSearch: React.FC<PodiumJobSearchProps> = ({ onInterviewStart }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5); // Default to 5
  const [companySearch, setCompanySearch] = useState<string>('');
  const [positionSearch, setPositionSearch] = useState<string>('');
  const [levelSearch, setLevelSearch] = useState<string>('');
  const [customCompany, setCustomCompany] = useState<string>('');
  const [customPosition, setCustomPosition] = useState<string>('');
  const [customLevel, setCustomLevel] = useState<string>('');
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const [showCustomCompany, setShowCustomCompany] = useState<boolean>(false);
  const [showCustomPosition, setShowCustomPosition] = useState<boolean>(false);
  const [showCustomLevel, setShowCustomLevel] = useState<boolean>(false);
  const [showCustomQuestionCount, setShowCustomQuestionCount] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<InterviewData | null>(null);

  // Refs for custom inputs to maintain focus
  const customCompanyRef = useRef<HTMLInputElement | null>(null);
  const customPositionRef = useRef<HTMLInputElement | null>(null);
  const customLevelRef = useRef<HTMLInputElement | null>(null);
  const customQuestionCountRef = useRef<HTMLInputElement | null>(null);

  // Filter data based on search
  const filteredCompanies = COMPANIES.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredPositions = POSITIONS.filter(position =>
    position.name.toLowerCase().includes(positionSearch.toLowerCase())
  );

  const filteredLevels = LEVELS.filter(level =>
    level.name.toLowerCase().includes(levelSearch.toLowerCase())
  );

  // Determine final values
  const finalCompany = showCustomCompany ? customCompany : selectedCompany;
  const finalPosition = showCustomPosition ? customPosition : selectedPosition;
  const finalLevel = showCustomLevel ? customLevel : selectedLevel;
  const finalQuestionCount = showCustomQuestionCount ? parseInt(customQuestionCount) || 5 : selectedQuestionCount;

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    
    const interviewData: InterviewRequestData = {
      company: finalCompany,
      positionTitle: finalPosition,
      experience: finalLevel,
      count: finalQuestionCount,
    };

    try {
      const response = await fetch('http://localhost:3000/api/app/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData)
      });
      console.log(interviewData);
      
      if (response.ok) {
        const data: any = await response.json(); // Keep as any since backend returns object
        console.log('Mock interview session created:', data);
        
        // Convert object to array - extract question values
        let questionsArray: string[] = [];
        
        if (data && typeof data === 'object') {
          // If data has a questions property that's already an array
          if (data.questions && Array.isArray(data.questions)) {
            questionsArray = data.questions;
          } 
          // If data is an object with numeric keys (0, 1, 2, 3, 4...)
          else {
            // Get all numeric keys and sort them
            const numericKeys = Object.keys(data)
              .filter(key => !isNaN(Number(key))) // Only numeric keys
              .sort((a, b) => Number(a) - Number(b)); // Sort numerically
            
            questionsArray = numericKeys.map(key => data[key]);
            
            // Alternative fallback: if no numeric keys, try any string values
            if (questionsArray.length === 0) {
              questionsArray = Object.values(data).filter(value => 
                typeof value === 'string' && value.length > 10
              ) as string[];
            }
          }
        }
        
        console.log('Converted questions array:', questionsArray);
        
        // Validate that we have questions
        if (questionsArray && questionsArray.length > 0) {
          const interviewData: InterviewData = {
            questions: questionsArray
          };
          
          setSearchResults(interviewData);
          
          // Pass questions to parent component via callback
          if (onInterviewStart) {
            onInterviewStart(interviewData);
          }
          
        } else {
          throw new Error('Invalid response: No questions found in backend response');
        }
      } else {
        throw new Error('Failed to create mock interview session');
      }
    } catch (error) {
      console.error('Error creating mock interview:', error);
      alert('Error starting mock interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanySelect = useCallback((companyName: string): void => {
    setSelectedCompany(companyName);
    setShowCustomCompany(false);
    setCustomCompany('');
  }, []);

  const handlePositionSelect = useCallback((positionName: string): void => {
    setSelectedPosition(positionName);
    setShowCustomPosition(false);
    setCustomPosition('');
  }, []);

  const handleLevelSelect = useCallback((levelName: string): void => {
    setSelectedLevel(levelName);
    setShowCustomLevel(false);
    setCustomLevel('');
  }, []);

  const handleCustomCompanyToggle = useCallback((): void => {
    setShowCustomCompany(true);
    setSelectedCompany('');
  }, []);

  const handleCustomPositionToggle = useCallback((): void => {
    setShowCustomPosition(true);
    setSelectedPosition('');
  }, []);

  const handleCustomLevelToggle = useCallback((): void => {
    setShowCustomLevel(true);
    setSelectedLevel('');
  }, []);

  const handleQuestionCountSelect = useCallback((count: number): void => {
    setSelectedQuestionCount(count);
    setShowCustomQuestionCount(false);
    setCustomQuestionCount('');
  }, []);

  const handleCustomQuestionCountToggle = useCallback((): void => {
    setShowCustomQuestionCount(true);
    setSelectedQuestionCount(0);
  }, []);

  // Type-safe wrappers for onSelect handlers
  const handleCompanySelectWrapper = useCallback((item: any) => {
    handleCompanySelect(item as string);
  }, []);

  const handlePositionSelectWrapper = useCallback((item: any) => {
    handlePositionSelect(item as string);
  }, []);

  const handleLevelSelectWrapper = useCallback((item: any) => {
    handleLevelSelect(item as string);
  }, []);

  const handleQuestionCountSelectWrapper = useCallback((item: any) => {
    handleQuestionCountSelect(item as number);
  }, []);

  // Optional preview component (can remove if using direct router navigation)
  const InterviewSetupResults: React.FC = () => (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">Interview Ready!</h1>
          <p className="text-xl text-gray-300">
            Your AI mock interview for {finalPosition} at {finalCompany} ({finalLevel}) is ready to begin
          </p>
          <p className="text-lg text-gray-400 mt-2">{finalQuestionCount} questions prepared</p>
        </div>
        
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Interview Questions Ready</h2>
            <button
              onClick={() => setShowResults(false)}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Setup
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-300 mb-2">Company</h3>
              <p className="text-white">{finalCompany}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-300 mb-2">Position</h3>
              <p className="text-white">{finalPosition}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-300 mb-2">Level</h3>
              <p className="text-white">{finalLevel}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-300 mb-2">Questions</h3>
              <p className="text-white">{finalQuestionCount}</p>
            </div>
          </div>

          {searchResults && (
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Preview Questions</h3>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="mb-4 text-green-400">✅ {searchResults.questions.length} interview questions generated successfully!</p>
                
                <div className="bg-gray-600 p-4 rounded-lg">
                  {searchResults.questions.map((question, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-500 rounded">
                      <span className="text-purple-300 font-medium">Q{index + 1}:</span>
                      <span className="text-white ml-2">{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Show interview setup results if successful (optional - can remove if using router)
  if (showResults) {
    return <InterviewSetupResults />;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            Welcome to Podium
          </h1>
          <p className="text-xl text-gray-300">Practice with AI-powered mock interviews tailored to your role</p>
        </div>

        {/* Companies Section */}
        <BubbleSection
          title="Select Company"
          icon={Building}
          items={filteredCompanies}
          selectedItem={selectedCompany}
          onSelect={handleCompanySelectWrapper}
          searchValue={companySearch}
          onSearchChange={(e) => setCompanySearch(e.target.value)}
          type="company"
          searchId="company-search"
          showCustom={showCustomCompany}
          onCustomToggle={handleCustomCompanyToggle}
          customValue={customCompany}
          onCustomChange={(e) => setCustomCompany(e.target.value)}
          customPlaceholder="Type company name..."
          customRef={customCompanyRef}
        />

        {/* Positions Section */}
        <BubbleSection
          title="Choose Position"
          icon={Briefcase}
          items={filteredPositions}
          selectedItem={selectedPosition}
          onSelect={handlePositionSelectWrapper}
          searchValue={positionSearch}
          onSearchChange={(e) => setPositionSearch(e.target.value)}
          type="position"
          searchId="position-search"
          showCustom={showCustomPosition}
          onCustomToggle={handleCustomPositionToggle}
          customValue={customPosition}
          onCustomChange={(e) => setCustomPosition(e.target.value)}
          customPlaceholder="Type position name..."
          customRef={customPositionRef}
        />

        {/* Experience Level Section */}
        <BubbleSection
          title="Experience Level"
          icon={Users}
          items={filteredLevels}
          selectedItem={selectedLevel}
          onSelect={handleLevelSelectWrapper}
          searchValue={levelSearch}
          onSearchChange={(e) => setLevelSearch(e.target.value)}
          type="level"
          searchId="level-search"
          showCustom={showCustomLevel}
          onCustomToggle={handleCustomLevelToggle}
          customValue={customLevel}
          onCustomChange={(e) => setCustomLevel(e.target.value)}
          customPlaceholder="Type experience level..."
          customRef={customLevelRef}
        />

        {/* Number of Questions Section */}
        <BubbleSection
          title="Number of Questions"
          icon={Search}
          items={QUESTION_COUNTS}
          selectedItem={selectedQuestionCount}
          onSelect={handleQuestionCountSelectWrapper}
          searchValue="" // No search for question count
          onSearchChange={() => {}} // No search for question count
          type="questionCount"
          searchId="question-count-search"
          showCustom={showCustomQuestionCount}
          onCustomToggle={handleCustomQuestionCountToggle}
          customValue={customQuestionCount}
          onCustomChange={(e) => setCustomQuestionCount(e.target.value)}
          customPlaceholder="Enter number (1-20)..."
          customRef={customQuestionCountRef}
        />

        {/* Submit Section */}
        <div className="flex justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            {finalCompany && finalPosition && finalLevel && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Your Mock Interview Setup:</h3>
                <p className="text-purple-300">{finalPosition} at {finalCompany} ({finalLevel})</p>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={!finalCompany || !finalPosition || !finalLevel || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg text-lg"
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
            
            {(!finalCompany || !finalPosition || !finalLevel) && !isSubmitting && (
              <p className="text-gray-400 text-sm mt-4 text-center">
                Please select company, position, and experience level to begin
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodiumJobSearch;