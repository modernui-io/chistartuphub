import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Briefcase,
  Store,
  Rocket,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";

export default function BusinessTypeExplorer() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [showCompass, setShowCompass] = useState(false);
  const [showAcknowledgment, setShowAcknowledgment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [compassAnswers, setCompassAnswers] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Legend definitions
  const definitions = [
    {
      id: "startup",
      icon: Rocket,
      title: "Startup",
      description: "A product designed to scale quickly",
      color: "text-purple-400"
    },
    {
      id: "service",
      icon: Briefcase,
      title: "Service Business",
      description: "Expertise you offer to clients",
      color: "text-blue-400"
    },
    {
      id: "small-biz",
      icon: Store,
      title: "Small Business",
      description: "Local business serving your community",
      color: "text-emerald-400"
    }
  ];

  // Selection cards
  const businessTypes = [
    {
      id: "tech",
      icon: Rocket,
      title: "High-Growth Startup",
      description: "You're building a product designed to scale—software, tech, biotech, or consumer products.",
      action: "Browse Resources",
      accentColor: "purple",
      borderHover: "hover:border-purple-500",
      iconColor: "text-purple-400",
      primary: true
    },
    {
      id: "idea",
      icon: Lightbulb,
      title: "I'm Exploring an Idea",
      description: "You have a spark and want to understand what's possible. Let's help you find clarity.",
      action: "Explore Options",
      accentColor: "amber",
      borderHover: "hover:border-amber-500",
      iconColor: "text-amber-400"
    },
    {
      id: "service",
      icon: Briefcase,
      title: "Service & Consulting",
      description: "You offer expertise, skills, or professional services to clients. Your time is your value.",
      action: "Find Resources",
      accentColor: "blue",
      borderHover: "hover:border-blue-500",
      iconColor: "text-blue-400"
    },
    {
      id: "small-biz",
      icon: Store,
      title: "Small Business",
      description: "You're building something for your local community—a shop, restaurant, or neighborhood service.",
      action: "Find Resources",
      accentColor: "emerald",
      borderHover: "hover:border-emerald-500",
      iconColor: "text-emerald-400"
    },
    {
      id: "unsure",
      icon: HelpCircle,
      title: "Not Sure Yet",
      description: "That's okay. Answer a few quick questions and we'll help point you in the right direction.",
      action: "Take Assessment",
      accentColor: "gray",
      borderHover: "hover:border-gray-500",
      iconColor: "text-gray-400"
    }
  ];

  // Refined 3-Question Compass
  const compassQuestions = [
    {
      id: 'revenue',
      question: 'What are you primarily selling?',
      subtitle: 'At its core, how does the business generate value?',
      answers: [
        { id: 'a', label: 'My time or expertise', sublabel: 'Consulting, Services, Freelance', value: 'service' },
        { id: 'b', label: 'A tangible product or software', sublabel: 'Apps, Goods, CPG', value: 'product' },
        { id: 'c', label: 'I haven\'t decided yet', sublabel: 'Still exploring options', value: 'unsure' }
      ]
    },
    {
      id: 'geography',
      question: 'Where do your customers live?',
      subtitle: 'Is your growth tied to a specific physical place?',
      answers: [
        { id: 'a', label: 'Mostly local', sublabel: 'I serve a specific neighborhood or city', value: 'local' },
        { id: 'b', label: 'Anywhere', sublabel: 'I can serve customers globally/remotely', value: 'global' },
        { id: 'c', label: 'Not sure yet', sublabel: 'Still figuring this out', value: 'unsure' }
      ]
    },
    {
      id: 'scalability',
      question: 'If you gained 1,000 customers overnight, what breaks first?',
      subtitle: 'This helps us understand your growth mechanics.',
      answers: [
        { id: 'a', label: 'Human constraints', sublabel: 'I\'d need to hire significantly more people', value: 'people' },
        { id: 'b', label: 'Physical constraints', sublabel: 'I\'d need more space, inventory, or trucks', value: 'physical' },
        { id: 'c', label: 'Nothing major', sublabel: 'My software/platform handles the volume automatically', value: 'scalable' },
        { id: 'd', label: 'I haven\'t thought about this yet', sublabel: 'Too early to know', value: 'unsure' }
      ]
    }
  ];

  const getCompassResult = () => {
    const { revenue, geography, scalability } = compassAnswers;

    if (revenue === 'product' && geography === 'global' && scalability === 'scalable') {
      return {
        type: 'startup',
        title: 'High-Growth Startup',
        description: 'You\'re building something designed to scale automatically. Chicago has incredible resources for founders like you.',
        icon: Rocket,
        color: 'purple',
        resources: [
          { name: 'Explore Startup Resources', url: '/Resources' },
          { name: 'Founder Guides', url: '/Resources#guides' },
          { name: '1871 Chicago Tech Hub', url: 'https://1871.com' },
          { name: 'Polsky Center (UChicago)', url: 'https://polsky.uchicago.edu' }
        ]
      };
    }

    if (geography === 'local' || scalability === 'physical') {
      return {
        type: 'small-business',
        title: 'Small Business',
        description: 'Your path is rooted in community and local impact. Here are resources designed for businesses like yours.',
        icon: Store,
        color: 'emerald',
        resources: [
          { name: 'City of Chicago Small Business Center', url: 'https://www.chicago.gov/city/en/sites/chicago-business-licensing/home.html' },
          { name: 'Chicago Business Centers Program', url: 'https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html' },
          { name: 'Illinois SBDC Network', url: 'https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html' },
          { name: 'Women\'s Business Development Center', url: 'https://www.wbdc.org/en/' }
        ]
      };
    }

    if (revenue === 'service' && geography === 'global') {
      return {
        type: 'service-agency',
        title: 'Service / Agency',
        description: 'Your expertise is your superpower—and you can serve clients anywhere. Here are resources to help you grow.',
        icon: Briefcase,
        color: 'blue',
        resources: [
          { name: 'SCORE Chicago (Free Mentoring)', url: 'https://www.score.org/chicago' },
          { name: 'Illinois SBDC at Polsky Exchange', url: 'https://polsky.uchicago.edu/polsky-exchange/small-business-development-center/' },
          { name: 'Women\'s Business Development Center', url: 'https://www.wbdc.org/en/' },
          { name: 'Chicagoland Chamber SBDC', url: 'https://www.chicagolandchamber.org/sbdc/' }
        ]
      };
    }

    if (revenue === 'service' && geography === 'local') {
      return {
        type: 'small-business',
        title: 'Local Service Business',
        description: 'You\'re building a service business that serves your local community. These resources are tailored for you.',
        icon: Store,
        color: 'emerald',
        resources: [
          { name: 'Chicago Small Business Centers', url: 'https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html' },
          { name: 'SCORE Chicago (Free Mentoring)', url: 'https://www.score.org/chicago' },
          { name: 'Illinois SBDC Network', url: 'https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html' }
        ]
      };
    }

    if (revenue === 'product') {
      return {
        type: 'startup',
        title: 'Product Business',
        description: 'You\'re building a product. Here are resources to help you take it to the next level.',
        icon: Rocket,
        color: 'purple',
        resources: [
          { name: 'Explore Startup Resources', url: '/Resources' },
          { name: 'Founder Guides', url: '/Resources#guides' }
        ]
      };
    }

    return {
      type: 'explorer',
      title: 'Still Exploring',
      description: 'No pressure—here are some helpful reads to spark clarity on your path.',
      icon: HelpCircle,
      color: 'gray',
      resources: [
        { name: 'Tale of Two Entrepreneurs (Kauffman)', url: 'https://www.kauffman.org/reports/a-tale-of-two-entrepreneurs-understanding-differences-in-the-types-of-entrepreneurship-in-the-economy/' },
        { name: 'Are You Ready to Start? (Michigan SBDC)', url: 'https://michigansbdc.org/starting-a-business/are-you-ready-to-start-a-small-business/' },
        { name: 'Explore All Resources', url: '/Resources' }
      ]
    };
  };

  const handleSelection = (type) => {
    setSelectedType(type);

    if (type === 'unsure' || type === 'idea') {
      setShowCompass(true);
      setCurrentQuestion(0);
      setCompassAnswers({});
    } else if (type === 'service') {
      setShowAcknowledgment('service');
    } else if (type === 'small-biz') {
      setShowAcknowledgment('small-business');
    } else if (type === 'tech') {
      navigate('/Resources');
    }
  };

  const handleBackToSelection = () => {
    setShowAcknowledgment(null);
    setSelectedType(null);
  };

  const handleCompassAnswer = (questionId, answerValue) => {
    setCompassAnswers(prev => ({ ...prev, [questionId]: answerValue }));

    if (currentQuestion < compassQuestions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 400);
    } else {
      setTimeout(() => {
        setIsCalculating(true);
        setTimeout(() => {
          setIsCalculating(false);
          setShowCompass('results');
        }, 1500);
      }, 400);
    }
  };

  const handleCompassBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      handleCompassBackToTypes();
    }
  };

  const handleCompassBackToTypes = () => {
    setShowCompass(false);
    setSelectedType(null);
    setCurrentQuestion(0);
    setCompassAnswers({});
    setIsCalculating(false);
  };

  // Dark Professional Background
  const PageBackground = () => (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80')`,
          filter: 'grayscale(100%) brightness(0.3)'
        }}
      />
      <div className="absolute inset-0 bg-slate-950/95" />
    </>
  );

  // Calculating State
  if (isCalculating) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <PageBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-white mb-2">Analyzing your answers...</h2>
              <p className="text-gray-500">Finding the best path for you</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Compass Questions View
  if (showCompass === true) {
    const question = compassQuestions[currentQuestion];

    return (
      <div className="min-h-screen relative overflow-hidden">
        <PageBackground />
        <div className="relative z-10 pt-28 md:pt-32 pb-20 px-4 md:px-6">
          <SEO title="Find Your Path" description="Answer a few questions to discover your best path" />
          <div className="max-w-2xl mx-auto">

            {/* Progress Bar */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Step {currentQuestion + 1} of {compassQuestions.length}</span>
                <span className="text-sm text-gray-600">{Math.round(((currentQuestion + 1) / compassQuestions.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: `${(currentQuestion / compassQuestions.length) * 100}%` }}
                  animate={{ width: `${((currentQuestion + 1) / compassQuestions.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-10 mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{question.question}</h2>
                  <p className="text-gray-500">{question.subtitle}</p>
                </div>

                <div className="space-y-3">
                  {question.answers.map((answer, index) => {
                    const isSelected = compassAnswers[question.id] === answer.value;
                    return (
                      <motion.button
                        key={answer.id}
                        onClick={() => handleCompassAnswer(question.id, answer.value)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-full text-left rounded-xl p-5 transition-all duration-200 group
                          ${isSelected
                            ? 'bg-white text-gray-900 border-2 border-white'
                            : 'bg-gray-900 border border-gray-800 hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                            ${isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-600 group-hover:border-gray-400'}`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className={`font-medium ${isSelected ? 'text-gray-900' : 'text-white'}`}>{answer.label}</p>
                            <p className={`text-sm ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>{answer.sublabel}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
              <Button onClick={handleCompassBack} variant="ghost" className="text-gray-500 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentQuestion === 0 ? 'Back to Selection' : 'Previous'}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Compass Results View
  if (showCompass === 'results') {
    const result = getCompassResult();
    const ResultIcon = result.icon;

    const colorMap = {
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
      emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' }
    };
    const colors = colorMap[result.color] || colorMap.gray;

    return (
      <div className="min-h-screen relative overflow-hidden">
        <PageBackground />
        <div className="relative z-10 pt-28 md:pt-32 pb-20 px-4 md:px-6">
          <SEO title="Your Path" description="Here's where you should focus" />
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${colors.bg} ${colors.border} border mb-6`}
                >
                  <ResultIcon className={`w-10 h-10 ${colors.text}`} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Your Recommended Path</span>
                  </div>
                </motion.div>

                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-4">{result.title}</motion.h2>

                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="text-lg text-gray-400 max-w-xl mx-auto">{result.description}</motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-10">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Recommended Resources</h3>
                <div className="space-y-3">
                  {result.resources.map((resource, idx) => (
                    <motion.a
                      key={idx}
                      href={resource.url}
                      target={resource.url.startsWith('/') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      className="block bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-xl p-4 group transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white group-hover:text-gray-200">{resource.name}</span>
                        {resource.url.startsWith('http') ? (
                          <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleCompassBackToTypes} variant="ghost" className="text-gray-500 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />Start Over
                </Button>
                <Button onClick={() => navigate('/Resources')} className="bg-white hover:bg-gray-100 text-gray-900">
                  Explore All Resources<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Service Business Acknowledgment
  if (showAcknowledgment === 'service') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <PageBackground />
        <div className="relative z-10 pt-28 md:pt-32 pb-20 px-4 md:px-6">
          <SEO title="Service Business Resources" description="Resources for service-based businesses" />
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 mb-6">
                  <Briefcase className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Service businesses are the backbone of any economy.</h2>
                <p className="text-lg text-gray-400">Here are resources tailored specifically for service businesses:</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Service Business Resources</h3>
                <div className="space-y-3">
                  <a href="https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ SBDC Chicago (free consulting & workshops)</a>
                  <a href="https://www.score.org/chicago" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ SCORE Chicago (mentorship)</a>
                  <a href="https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ Chicago Small Business Centers</a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/Resources')} className="bg-white hover:bg-gray-100 text-gray-900">Explore All Resources</Button>
                <Button onClick={handleBackToSelection} variant="ghost" className="text-gray-500 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />Go Back
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Small Business Acknowledgment
  if (showAcknowledgment === 'small-business') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <PageBackground />
        <div className="relative z-10 pt-28 md:pt-32 pb-20 px-4 md:px-6">
          <SEO title="Small Business Resources" description="Resources for small businesses" />
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
                  <Store className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Small businesses are the heart of Chicago's neighborhoods.</h2>
                <p className="text-lg text-gray-400">Here are resources designed specifically for local businesses:</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Small Business Resources</h3>
                <div className="space-y-3">
                  <a href="https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ SBDC Chicago (free consulting & workshops)</a>
                  <a href="https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ Chicago Small Business Centers</a>
                  <a href="https://www.sba.gov/funding-programs/loans" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">→ SBA Loan Programs</a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/Resources')} className="bg-white hover:bg-gray-100 text-gray-900">Explore All Resources</Button>
                <Button onClick={handleBackToSelection} variant="ghost" className="text-gray-500 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />Go Back
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // DEFAULT VIEW: Business Type Selection
  // =====================================
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEO
        title="Define Your Starting Point"
        description="Tell us what you're building so we can guide you to the right resources."
        keywords="business type, startup, small business, service business, Chicago founders"
      />

      <PageBackground />

      <div className="relative z-10 pt-28 md:pt-36 pb-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Define Your Starting Point.
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              To provide the right resources, we need to know what you are building. This tailors your experience.
            </p>
          </motion.div>

          {/* Legend / Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 py-6 border-y border-gray-800">
              {definitions.map((def, index) => {
                const Icon = def.icon;
                return (
                  <motion.div
                    key={def.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <Icon className={`w-5 h-5 ${def.color}`} />
                    <div>
                      <span className="text-white font-medium">{def.title}</span>
                      <span className="text-gray-600 mx-2">—</span>
                      <span className="text-gray-500 text-sm">{def.description}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Selection Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => handleSelection(type.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.08 }}
                    className={`group relative text-left w-full bg-gray-900 border border-gray-800 ${type.borderHover} rounded-xl p-6 transition-all duration-200 hover:bg-gray-900/80`}
                  >
                    {type.primary && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-1 rounded">Primary</span>
                      </div>
                    )}

                    <Icon className={`w-8 h-8 ${type.iconColor} mb-4`} />

                    <h3 className="text-lg font-semibold text-white mb-2">{type.title}</h3>

                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{type.description}</p>

                    <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                      <span>{type.action}</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center"
          >
            <p className="text-gray-500">
              Not sure? Select <span className="text-white">'Not Sure Yet'</span> to take the 3-question assessment.
            </p>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-10 text-center"
          >
            <Button
              onClick={() => navigate('/navigate-toolkit')}
              variant="ghost"
              className="text-gray-500 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Navigation
            </Button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
