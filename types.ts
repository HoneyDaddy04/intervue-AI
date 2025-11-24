export enum AppState {
  SETUP = 'SETUP',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK',
}

export interface InterviewerConfig {
  name: string;
  nationality: 'American' | 'British' | 'Indian' | 'Nigerian';
  mode: 'single' | 'panel'; // Single interviewer or HR + Technical panel
  voice: string; // Voice name for Gemini (e.g. 'Puck', 'Kore')
}

export interface JobConfig {
  role?: string;
  yearsExperience?: number;
  
  // Context Sources (can be mixed)
  resumeText?: string;
  jobPostText?: string;
  jobPostLink?: string; // For future scraping implementation
  additionalContext?: string;

  interviewerConfig: InterviewerConfig;
}

export interface TranscriptItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FeedbackData {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}