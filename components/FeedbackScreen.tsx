import React, { useEffect, useState } from 'react';
import { JobConfig, TranscriptItem, FeedbackData } from '../types';
import { generateFeedbackReport } from '../services/geminiService';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Trophy, Activity, ArrowLeft, Lock, Mail, ChevronRight } from 'lucide-react';

interface FeedbackScreenProps {
  transcript: TranscriptItem[];
  jobConfig: JobConfig;
  onRestart: () => void;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ transcript, jobConfig, onRestart }) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await generateFeedbackReport(transcript, jobConfig);
        setFeedback(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
        // Simulate API call to send email
        setIsUnlocked(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-8">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Conversation...</h2>
        <p className="text-slate-500 text-center max-w-md">
          Our AI is evaluating your answers, tone, and technical accuracy against industry standards.
        </p>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
             <button onClick={onRestart} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Setup
            </button>
            <div className="font-bold text-lg tracking-tight">Performance Report</div>
            <div className="w-20"></div> 
        </div>

        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
            
            {/* Hero Score Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <h1 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Interview Performance Score</h1>
                <div className="flex items-center justify-center gap-1 mb-6">
                    <span className="text-7xl font-black text-slate-900 tracking-tighter">{feedback.score}</span>
                    <span className="text-3xl text-slate-400 font-medium">/100</span>
                </div>
                
                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    {feedback.summary}
                </p>
            </div>

            {/* Content Container (Blurred if locked) */}
            <div className="relative">
                
                {/* Locked Overlay */}
                {!isUnlocked && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border border-white/50">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 text-center">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-slate-900">Unlock Full Analysis</h3>
                            <p className="text-slate-500 mb-6">
                                Get detailed feedback on your strengths, weaknesses, and actionable tips to improve.
                            </p>
                            <form onSubmit={handleUnlock} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    Send Me The Report <ChevronRight className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-xs text-slate-400 mt-4">
                                No spam. We only send your interview results.
                            </p>
                        </div>
                    </div>
                )}

                {/* Detailed Grid (Content) */}
                <div className={`space-y-6 transition-all duration-500 ${!isUnlocked ? 'filter blur-sm select-none opacity-50' : 'opacity-100'}`}>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Key Strengths</h3>
                            </div>
                            <ul className="space-y-4">
                                {feedback.strengths.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-slate-600">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Weaknesses</h3>
                            </div>
                            <ul className="space-y-4">
                                {feedback.weaknesses.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-slate-600">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Actionable Advice</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {feedback.improvements.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-700 text-sm leading-relaxed">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restart Area */}
             <div className="flex justify-center pt-12">
                <button 
                    onClick={onRestart}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-xl hover:scale-105"
                >
                    <RefreshCw className="w-5 h-5" />
                    Start New Interview
                </button>
            </div>

        </div>
    </div>
  );
};

export default FeedbackScreen;