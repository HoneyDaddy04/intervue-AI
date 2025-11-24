import React, { useState } from 'react';
import { JobConfig, InterviewerConfig } from '../types';
import { Briefcase, User, FileText, ArrowRight, Upload, Link as LinkIcon, Layers, Globe, Users, CheckCircle2 } from 'lucide-react';

interface SetupScreenProps {
  onStart: (config: JobConfig) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  // Job Details (Optional)
  const [role, setRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  
  // Context State
  const [activeTab, setActiveTab] = useState<'general' | 'resume' | 'job_post'>('general');
  const [resumeText, setResumeText] = useState('');
  const [jobPostText, setJobPostText] = useState('');
  const [jobPostLink, setJobPostLink] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Interviewer Configuration
  const [interviewerNationality, setInterviewerNationality] = useState<InterviewerConfig['nationality']>('American');
  const [interviewMode, setInterviewMode] = useState<InterviewerConfig['mode']>('single');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: JobConfig = {
      role: role || undefined,
      yearsExperience: yearsExperience > 0 ? yearsExperience : undefined,
      resumeText: resumeText || undefined,
      jobPostText: jobPostText || undefined,
      jobPostLink: jobPostLink || undefined,
      additionalContext: additionalContext || undefined,
      interviewerConfig: {
        name: 'Interviewer', // Will be dynamic in InterviewScreen
        nationality: interviewerNationality,
        mode: interviewMode,
        voice: 'Kore' // Default, could map to nationality if needed
      }
    };
    onStart(config);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      if (activeTab === 'resume') setResumeText(text);
      if (activeTab === 'job_post') setJobPostText(text);
    }
  };

  const isReady = role || resumeText || jobPostText || additionalContext;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-50 text-slate-900">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel: Brand & Info */}
        <div className="md:w-1/3 bg-slate-100 p-8 border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-6 shadow-lg shadow-indigo-200">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Intervue AI</h1>
            <p className="text-slate-500 leading-relaxed">
              Master your interview skills with our hyper-realistic AI simulation. Upload your CV, paste a job description, or just practice specific topics.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span>Global Accents Support</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Panel Interview Mode</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Real-time Feedback</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Configuration */}
        <div className="flex-1 p-8 md:p-10 bg-white">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Role & Experience (Optional) */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Candidate Profile (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative group">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Target Role (e.g. PM)"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-slate-400 text-sm font-medium group-focus-within:text-indigo-500 transition-colors">Exp: {yearsExperience}y</div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value))}
                    className="w-full h-full absolute opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-20 flex items-center">
                     <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(yearsExperience / 20) * 100}%` }}></div>
                     </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Context Tabs */}
            <section>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Interview Context</h2>
                 <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Auto-saved across tabs</span>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-1 border border-slate-200 flex gap-1 mb-4">
                {(['general', 'resume', 'job_post'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab 
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'general' && <Layers className="w-4 h-4" />}
                    {tab === 'resume' && <FileText className="w-4 h-4" />}
                    {tab === 'job_post' && <Briefcase className="w-4 h-4" />}
                    <span className="capitalize">{tab.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                {activeTab === 'general' && (
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 h-40 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter specific topics, focus areas, or paste general context here..."
                  />
                )}
                
                {activeTab === 'resume' && (
                  <div className="relative">
                     <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 h-40 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Paste your resume text here..."
                    />
                    <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer text-xs font-medium transition-colors border border-slate-200 flex items-center gap-2">
                        <Upload className="w-3 h-3" /> Upload File
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}

                {activeTab === 'job_post' && (
                  <div className="space-y-3">
                     <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="url" 
                            value={jobPostLink}
                            onChange={(e) => setJobPostLink(e.target.value)}
                            placeholder="Paste Job Link (Optional)"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>
                     <div className="relative">
                        <textarea
                            value={jobPostText}
                            onChange={(e) => setJobPostText(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            placeholder="Or paste the Job Description text here..."
                        />
                        <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer text-xs font-medium transition-colors border border-slate-200 flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Upload File
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                     </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Interviewer Settings */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Simulation Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Interviewer Accent</label>
                    <select 
                        value={interviewerNationality}
                        onChange={(e) => setInterviewerNationality(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                        <option value="American">🇺🇸 American</option>
                        <option value="British">🇬🇧 British</option>
                        <option value="Indian">🇮🇳 Indian</option>
                        <option value="Nigerian">🇳🇬 Nigerian</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Panel Mode</label>
                    <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setInterviewMode('single')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${interviewMode === 'single' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            1-on-1
                        </button>
                        <button
                            type="button"
                            onClick={() => setInterviewMode('panel')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${interviewMode === 'panel' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            Panel
                        </button>
                    </div>
                 </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={!isReady}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform ${
                  isReady 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01] shadow-xl shadow-indigo-200' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Begin Interview
              <ArrowRight className="w-5 h-5" />
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;