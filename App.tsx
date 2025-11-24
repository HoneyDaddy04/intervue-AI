import React, { useState } from 'react';
import { AppState, JobConfig, TranscriptItem } from './types';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const handleStartInterview = (config: JobConfig) => {
    setJobConfig(config);
    setAppState(AppState.INTERVIEW);
  };

  const handleEndInterview = (finalTranscript: TranscriptItem[]) => {
    setTranscript(finalTranscript);
    setAppState(AppState.FEEDBACK);
  };

  const handleRestart = () => {
    setJobConfig(null);
    setTranscript([]);
    setAppState(AppState.SETUP);
  };

  return (
    <div className="w-full h-full">
      {appState === AppState.SETUP && (
        <SetupScreen onStart={handleStartInterview} />
      )}
      
      {appState === AppState.INTERVIEW && jobConfig && (
        <InterviewScreen 
          jobConfig={jobConfig} 
          onEnd={handleEndInterview} 
        />
      )}

      {appState === AppState.FEEDBACK && jobConfig && (
        <FeedbackScreen 
          transcript={transcript} 
          jobConfig={jobConfig}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default App;
