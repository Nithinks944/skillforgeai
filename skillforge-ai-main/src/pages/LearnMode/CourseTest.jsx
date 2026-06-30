import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AI adaptive test generator
const generateQuestion = (courseName, difficulty) => {
  const questions = {
    python: {
      easy: [
        { q: 'What is the correct way to print in Python?', options: ['print()', 'console.log()', 'echo', 'printf'], correct: 0 },
        { q: 'Which data type stores whole numbers?', options: ['float', 'int', 'string', 'bool'], correct: 1 }
      ],
      medium: [
        { q: 'How do you create a list in Python?', options: ['[]', '{}', '()', '<>'], correct: 0 },
        { q: 'What keyword defines a function?', options: ['func', 'def', 'function', 'define'], correct: 1 }
      ],
      hard: [
        { q: 'What is list comprehension?', options: ['A loop', 'A concise way to create lists', 'A function', 'An error'], correct: 1 },
        { q: 'What does *args do?', options: ['Multiplication', 'Variable arguments', 'Pointer', 'Comment'], correct: 1 }
      ]
    },
    html: {
      easy: [
        { q: 'What does HTML stand for?', options: ['Hypertext Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'], correct: 0 },
        { q: 'Which tag creates a paragraph?', options: ['<p>', '<para>', '<text>', '<pg>'], correct: 0 }
      ],
      medium: [
        { q: 'How do you create a link?', options: ['<a>', '<link>', '<href>', '<url>'], correct: 0 },
        { q: 'Which attribute specifies image source?', options: ['href', 'src', 'link', 'url'], correct: 1 }
      ],
      hard: [
        { q: 'What is semantic HTML?', options: ['Styled HTML', 'HTML with meaning', 'JavaScript in HTML', 'CSS framework'], correct: 1 },
        { q: 'Which tag defines navigation?', options: ['<navigation>', '<nav>', '<menu>', '<links>'], correct: 1 }
      ]
    },
    css: {
      easy: [
        { q: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'], correct: 0 },
        { q: 'How do you select an ID?', options: ['.id', '#id', 'id', '*id'], correct: 1 }
      ],
      medium: [
        { q: 'What is flexbox used for?', options: ['Colors', 'Layout', 'Fonts', 'Borders'], correct: 1 },
        { q: 'How do you center a div?', options: ['center: true', 'align: center', 'margin: auto', 'position: center'], correct: 2 }
      ],
      hard: [
        { q: 'What is specificity?', options: ['CSS speed', 'Rule priority', 'Color intensity', 'Font weight'], correct: 1 },
        { q: 'What does z-index control?', options: ['Width', 'Height', 'Stack order', 'Opacity'], correct: 2 }
      ]
    }
  };

  const courseQuestions = questions[courseName]?.[difficulty] || questions.python.easy;
  return courseQuestions[Math.floor(Math.random() * courseQuestions.length)];
};

const CourseTest = () => {
  const { courseName } = useParams();
  const navigate = useNavigate();
  
  const [stage, setStage] = useState('pre-test'); // pre-test, learning, final-test, results
  const [difficulty, setDifficulty] = useState('easy');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Learning resources - real video and documentation links
  const learningResources = {
    python: {
      videos: [
        {
          title: 'Python for Beginners - Full Course',
          url: 'https://www.youtube.com/watch?v=rfscVS0vtbw'
        },
        {
          title: 'Python Tutorial - Programming Tutorial',
          url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc'
        },
        {
          title: 'Learn Python - Full Course for Beginners',
          url: 'https://www.youtube.com/watch?v=eWRfhZUzrAc'
        }
      ],
      docs: [
        {
          title: 'Official Python Tutorial',
          url: 'https://docs.python.org/3/tutorial/'
        },
        {
          title: 'Python Documentation',
          url: 'https://docs.python.org/3/'
        }
      ]
    },
    html: {
      videos: [
        {
          title: 'HTML Full Course - Build a Website Tutorial',
          url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg'
        },
        {
          title: 'HTML Tutorial for Beginners',
          url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU'
        },
        {
          title: 'HTML Crash Course For Absolute Beginners',
          url: 'https://www.youtube.com/watch?v=UB1O30fR-EE'
        }
      ],
      docs: [
        {
          title: 'MDN HTML Documentation',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'
        },
        {
          title: 'HTML Element Reference',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'
        }
      ]
    },
    css: {
      videos: [
        {
          title: 'CSS Crash Course For Absolute Beginners',
          url: 'https://www.youtube.com/watch?v=yfoY53QXEnI'
        },
        {
          title: 'CSS Tutorial - Zero to Hero',
          url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc'
        },
        {
          title: 'Learn CSS in 20 Minutes',
          url: 'https://www.youtube.com/watch?v=1PnVor36_40'
        }
      ],
      docs: [
        {
          title: 'MDN CSS Documentation',
          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS'
        },
        {
          title: 'CSS Reference Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference'
        }
      ]
    }
  };

  useEffect(() => {
    if (stage === 'pre-test' || stage === 'final-test') {
      loadNewQuestion();
    }
  }, [stage, difficulty]);

  const loadNewQuestion = () => {
    const question = generateQuestion(courseName, difficulty);
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correct;
    setShowFeedback(true);
    setTotalQuestions(prev => prev + 1);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setWrongCount(0);
      
      // Increase difficulty on correct answer
      if (difficulty === 'easy') setDifficulty('medium');
      else if (difficulty === 'medium') setDifficulty('hard');
      
      setTimeout(() => {
        if (stage === 'pre-test' && totalQuestions >= 3) {
          setStage('learning');
        } else if (stage === 'final-test' && totalQuestions >= 8) {
          calculateResults();
        } else {
          loadNewQuestion();
        }
      }, 1500);
    } else {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);
      
      // Exit test if wrong twice at same level (pre-test only)
      if (stage === 'pre-test' && newWrongCount >= 2) {
        setTimeout(() => setStage('learning'), 1500);
      } else {
        setTimeout(() => loadNewQuestion(), 1500);
      }
    }
  };

  const calculateResults = async () => {
    const accuracy = Math.round((score / totalQuestions) * 100);
    
    try {
      // Store completion in Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        completedCourses: arrayUnion({
          courseName: courseName,
          accuracy: accuracy,
          completedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving course completion:', error);
    }

    setStage('results');
    setAnswers({ accuracy, score, totalQuestions });
  };

  const getProgressPercentage = () => {
    const max = stage === 'pre-test' ? 4 : 9;
    return Math.min(100, Math.round(((totalQuestions) / max) * 100));
  };

  if (stage === 'learning') {
    return (
      <div className="min-h-screen p-8 md:p-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold mb-3 capitalize font-display">{courseName} Learning Hub</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Review these curated visual tutorials and documentation guides to level up before taking the final test.
            </p>
          </motion.div>
          
          {/* Video Tutorials Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-6 border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📹</span>
              <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100">Video Tutorials</h2>
            </div>
            <div className="space-y-3.5">
              {learningResources[courseName]?.videos.map((video, index) => (
                <a
                  key={index}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-50/50 to-pink-50/30 dark:from-red-950/10 dark:to-pink-950/10 border border-red-200/60 dark:border-red-900/40 hover:shadow-md transition-all duration-350 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">▶️</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{video.title}</span>
                  </div>
                  <span className="text-xs font-bold px-4 py-2 bg-red-600 text-white rounded-xl shadow group-hover:bg-red-700 transition-colors whitespace-nowrap">
                    Watch Video
                  </span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Documentation Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card mb-8 border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📚</span>
              <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100">Official Guides</h2>
            </div>
            <div className="space-y-3.5">
              {learningResources[courseName]?.docs.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-200/60 dark:border-blue-900/40 hover:shadow-md transition-all duration-355 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">📖</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{doc.title}</span>
                  </div>
                  <span className="text-xs font-bold px-4 py-2 bg-blue-600 text-white rounded-xl shadow group-hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Read Docs
                  </span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 w-36 h-36 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 font-display">Ready for the final test?</h3>
              <p className="mb-6 opacity-90 text-sm leading-relaxed max-w-xl">
                The final test contains 9 adaptive questions. Scoring 85%+ accuracy will verify your competency and unlock applications for real job postings.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStage('final-test');
                  setScore(0);
                  setTotalQuestions(0);
                  setDifficulty('easy');
                }}
                className="bg-white text-primary-600 px-7 py-3.5 rounded-2xl font-bold text-sm shadow hover:bg-slate-50 transition-colors"
              >
                Start Final Test →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    const { accuracy } = answers;
    const passed = accuracy >= 85;

    return (
      <div className="min-h-screen p-8 flex items-center justify-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="card max-w-2xl w-full text-center border-slate-200/50 dark:border-slate-800/50 p-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-7xl mb-6 animate-bounce">{passed ? '🏆' : '📚'}</div>
          
          <h1 className="text-4xl font-extrabold mb-3 font-display">
            {passed ? 'Competency Verified!' : 'Practice Makes Perfect!'}
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
            {passed 
              ? `You scored high accuracy and unlocked the certificate of achievement for ${courseName}.`
              : `You achieved a score on the test. Review the recommended notes and tutorials to try again.`}
          </p>
          
          <div className="my-10 inline-flex flex-col items-center justify-center p-6 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800 rounded-3xl min-w-[200px]">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-300 font-display">
              {accuracy}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Accuracy Score
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ({score} of {totalQuestions} correct)
            </p>
          </div>

          {passed && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/55 rounded-2xl p-5 mb-8 text-sm"
            >
              <h3 className="font-bold text-green-700 dark:text-green-400 mb-1 flex items-center justify-center gap-1.5 font-display text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Certificate Awarded!
              </h3>
              <p className="text-green-600 dark:text-green-300 leading-relaxed text-xs">
                Recruiters searching for {courseName} skills will see your verified status badge. You can now submit applications on the JobList tab.
              </p>
            </motion.div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/courses')} className="btn-secondary px-6 py-3 text-xs">
              Back to Courses
            </button>
            {passed && (
              <button onClick={() => navigate('/jobs')} className="btn-primary px-6 py-3 text-xs shadow-md">
                Browse Job Openings
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Pre-test or Final Test UI
  return (
    <div className="p-8 md:p-12 flex items-center justify-center min-h-full relative z-10">
      <div className="card max-w-2xl w-full border-slate-200/50 dark:border-slate-800/50 shadow-xl p-8">
        {/* HEADER INDICATOR */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 capitalize">
              {stage === 'pre-test' ? 'Pre-Knowledge Test' : 'Final Certification Test'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{courseName} subject</p>
          </div>
          <span className="px-3.5 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-200/50 dark:border-primary-900/40 rounded-xl text-xs font-bold uppercase tracking-wider">
            {difficulty}
          </span>
        </div>

        {/* PULSING ANIMATED PROGRESS BAR */}
        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 mb-8 relative overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-primary-500 to-accent-400 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.q}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 leading-normal">{currentQuestion.q}</p>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    
                    let btnStyle = 'border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30';
                    if (showFeedback) {
                      if (index === currentQuestion.correct) {
                        btnStyle = 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400';
                      } else if (isSelected) {
                        btnStyle = 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-750 dark:text-red-400';
                      } else {
                        btnStyle = 'border-slate-200 dark:border-slate-850 opacity-40';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/25 text-primary-600 dark:text-primary-400 shadow-sm';
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={!showFeedback ? { scale: 1.008 } : {}}
                        whileTap={!showFeedback ? { scale: 0.99 } : {}}
                        onClick={() => !showFeedback && setSelectedAnswer(index)}
                        disabled={showFeedback}
                        className={`w-full p-4 text-left rounded-2xl border text-sm font-semibold transition-all duration-200 flex items-center justify-between ${btnStyle} ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span>{option}</span>
                        {showFeedback && index === currentQuestion.correct && (
                          <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        )}
                        {showFeedback && isSelected && index !== currentQuestion.correct && (
                          <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {showFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border font-bold text-sm text-center mb-5 flex items-center justify-center gap-2 ${
                    selectedAnswer === currentQuestion.correct
                      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400'
                      : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                  }`}
                >
                  <span>{selectedAnswer === currentQuestion.correct ? '🎉 Correct Answer!' : '❌ Incorrect Selection'}</span>
                </motion.div>
              )}

              {!showFeedback && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnswerSubmit}
                  disabled={selectedAnswer === null}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-xs font-bold tracking-wide mt-2"
                >
                  Submit Answer
                </motion.button>
              )}

              <div className="mt-6 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Question {totalQuestions + 1}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseTest;
