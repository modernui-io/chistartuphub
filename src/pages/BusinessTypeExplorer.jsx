import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Rocket,
  Briefcase,
  Store,
  ChevronLeft,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";

const QUESTIONS = [
  {
    id: 'selling',
    question: 'What are you primarily selling?',
    subtitle: 'At its core, how does your business generate value?',
    options: [
      { id: 'time', label: 'My time or expertise', sublabel: 'Consulting, services, freelance', value: 'service' },
      { id: 'product', label: 'A product or software', sublabel: 'Apps, goods, tech, consumer products', value: 'product' }
    ]
  },
  {
    id: 'geography',
    question: 'Where are your customers?',
    subtitle: 'Is your growth tied to a specific location?',
    options: [
      { id: 'local', label: 'Mostly local', sublabel: 'Serving a specific neighborhood or city', value: 'local' },
      { id: 'anywhere', label: 'Anywhere', sublabel: 'Can serve customers globally or remotely', value: 'global' }
    ]
  }
];

const getResult = (answers) => {
  const { selling, geography } = answers;
  
  // Product + Global = Startup
  if (selling === 'product' && geography === 'global') {
    return {
      type: 'startup',
      title: 'Startup',
      description: "You're building something designed to scale. Chicago has incredible resources for founders like you.",
      icon: Rocket,
      link: '/resources',
      linkText: 'View Startup Resources'
    };
  }
  
  // Service + Global = Service/Consulting
  if (selling === 'service' && geography === 'global') {
    return {
      type: 'service',
      title: 'Service & Consulting',
      description: "Your expertise is your superpower — and you can serve clients anywhere.",
      icon: Briefcase,
      link: '/service-resources',
      linkText: 'View Service Resources'
    };
  }
  
  // Local (either) = Small Business
  if (geography === 'local') {
    return {
      type: 'small-business',
      title: 'Small Business',
      description: "Your path is rooted in community and local impact. Here are resources designed for you.",
      icon: Store,
      link: '/small-business-resources',
      linkText: 'View Small Business Resources'
    };
  }
  
  // Product + Local = Small Business (product-based)
  if (selling === 'product' && geography === 'local') {
    return {
      type: 'small-business',
      title: 'Local Product Business',
      description: "You're building a product for your local community.",
      icon: Store,
      link: '/small-business-resources',
      linkText: 'View Small Business Resources'
    };
  }
  
  // Fallback
  return {
    type: 'startup',
    title: 'Startup',
    description: "Based on your answers, startup resources may be most relevant.",
    icon: Rocket,
    link: '/resources',
    linkText: 'View Startup Resources'
  };
};

export default function BusinessTypeExplorer() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAnswer = (questionId, value) => {
    setSelectedOption(value);
    
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Brief delay for visual feedback
    setTimeout(() => {
      setSelectedOption(null);
      
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResult(true);
      }
    }, 300);
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const result = showResult ? getResult(answers) : null;
  const ResultIcon = result?.icon;

  return (
    <div className="min-h-screen relative" data-page="business-type-explorer">
      <SEO
        title="Find Your Path"
        description="Answer two quick questions to find the most relevant resources for your business."
        keywords="startup assessment, business type, Chicago resources"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Back Navigation */}
        <div className="pt-24 px-6">
          <div className="max-w-2xl mx-auto">
            <Link 
              to="/before-you-start"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-crosshair"
            >
              <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
              <span>Back to Start</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <section className="pt-8 pb-24 px-6">
          <div className="max-w-2xl mx-auto">
            
            {!showResult ? (
              <>
                {/* Progress */}
                <div className={`mb-12 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bureau-label">[ASSESSMENT: QUESTION_{currentQuestion + 1}_OF_{QUESTIONS.length}]</span>
                    <span className="font-mono text-[10px] text-white/30">
                      {Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-px bg-white/10 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-white/40 transition-all duration-500"
                      style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className={`mb-12 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-[1.1] mb-4">
                    {QUESTIONS[currentQuestion].question}
                  </h1>
                  <p className="text-white/50 text-lg">
                    {QUESTIONS[currentQuestion].subtitle}
                  </p>
                </div>

                {/* Options */}
                <div 
                  className={`space-y-4 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
                  style={{ animationDelay: '300ms' }}
                >
                  {QUESTIONS[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedOption === option.value;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswer(QUESTIONS[currentQuestion].id, option.value)}
                        className={`
                          w-full p-6 md:p-8 text-left border transition-all duration-0 cursor-crosshair
                          ${isSelected 
                            ? 'bg-white border-white' 
                            : 'bg-transparent border-white/10 hover:bg-white/5'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <span className={`font-mono text-[10px] pt-1 transition-colors duration-0 ${isSelected ? 'text-black/30' : 'text-white/30'}`}>
                            0{index + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className={`font-serif text-xl md:text-2xl mb-2 transition-colors duration-0 ${isSelected ? 'text-black' : 'text-white'}`}>
                              {option.label}
                            </h3>
                            <p className={`text-sm transition-colors duration-0 ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                              {option.sublabel}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-black" strokeWidth={1.5} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Back Button */}
                {currentQuestion > 0 && (
                  <button
                    onClick={handleBack}
                    className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-crosshair"
                  >
                    <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                    <span>Previous Question</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Result */}
                <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                  <span className="bureau-label block mb-6">[RESULT: PATH_IDENTIFIED]</span>
                </div>

                <div 
                  className={`p-8 md:p-12 border border-white/20 mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: '200ms' }}
                >
                  <div className="flex items-start gap-6 mb-8">
                    <div className="p-4 border border-white/20">
                      <ResultIcon className="w-8 h-8 text-white/60" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">
                        {result.title}
                      </h1>
                      <p className="text-white/50 text-lg">
                        {result.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(result.link)}
                    className="w-full p-4 bg-white text-black font-mono text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-white/90 transition-colors cursor-crosshair"
                  >
                    <span>{result.linkText}</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Retake */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setAnswers({});
                      setCurrentQuestion(0);
                      setShowResult(false);
                    }}
                    className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-crosshair"
                  >
                    <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
                    <span>Start Over</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
