import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { JobConfig, TranscriptItem } from '../types';
import { createBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { Mic, MicOff, PhoneOff, MessageSquare, Signal, User, Users } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface InterviewScreenProps {
  jobConfig: JobConfig;
  onEnd: (transcript: TranscriptItem[]) => void;
}

// Avatars
const AVATAR_MAP: Record<string, string> = {
    'American': "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    'British': "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    'Indian': "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    'Nigerian': "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80",
    'Panel': "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80" // Meeting room
};

const InterviewScreen: React.FC<InterviewScreenProps> = ({ jobConfig, onEnd }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ac = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = ac;

        const inputAc = new AudioContextClass({ sampleRate: 16000 });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } });
        
        const source = inputAc.createMediaStreamSource(stream);
        const inputAnalyser = inputAc.createAnalyser();
        inputAnalyser.fftSize = 256;
        source.connect(inputAnalyser);
        inputAnalyserRef.current = inputAnalyser;

        const processor = inputAc.createScriptProcessor(4096, 1, 1);
        inputAnalyser.connect(processor);

        const muteNode = inputAc.createGain();
        muteNode.gain.value = 0;
        processor.connect(muteNode);
        muteNode.connect(inputAc.destination);

        const outputAnalyser = ac.createAnalyser();
        outputAnalyser.fftSize = 256;
        outputAnalyserRef.current = outputAnalyser;
        outputAnalyser.connect(ac.destination);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Build System Prompt
        let roleContext = jobConfig.role ? `Target Role: ${jobConfig.role}. ` : 'Target Role: Not specified (Infer from context). ';
        let expContext = jobConfig.yearsExperience ? `Candidate Experience: ${jobConfig.yearsExperience} years. ` : '';
        
        let contentContext = "";
        if (jobConfig.resumeText) contentContext += `RESUME TEXT: "${jobConfig.resumeText}"\n`;
        if (jobConfig.jobPostText) contentContext += `JOB POST TEXT: "${jobConfig.jobPostText}"\n`;
        if (jobConfig.additionalContext) contentContext += `USER NOTES: "${jobConfig.additionalContext}"\n`;

        let interviewerPersona = "";
        const nationality = jobConfig.interviewerConfig.nationality;
        
        if (jobConfig.interviewerConfig.mode === 'panel') {
            interviewerPersona = `You are conducting a PANEL INTERVIEW. You are simulating two people: 
            1. "Alex" (The Hiring Manager, ${nationality} accent) - Focused on culture fit and soft skills.
            2. "Sam" (The Technical Lead, neutral accent) - Focused on technical details and hard skills.
            
            You should switch between these personas naturally. You can announce who is speaking if needed (e.g. "Alex here, I wanted to ask...").
            Maintain the distinct tones. Alex is warmer, Sam is more direct.`;
        } else {
            interviewerPersona = `You are a professional interviewer with a ${nationality} accent/dialect. 
            Adopt the appropriate idioms and speech patterns for a ${nationality} professional English speaker.
            Be professional but conversational.`;
        }

        const sysInstruction = `
        ${interviewerPersona}
        
        ${roleContext}
        ${expContext}
        
        CONTEXT DATA:
        ${contentContext}
        
        INSTRUCTIONS:
        - Conduct a realistic job interview.
        - Start by briefly welcoming the candidate.
        - Ask ONE question at a time.
        - If the candidate's answer is too short, probe for details.
        - Keep your responses concise (under 40 words) to keep the flow dynamic, unless explaining a complex scenario.
        - Do not break character as an AI.
        `;

        // Map nationality to voice names (best effort with available voices)
        // Voices: Puck, Charon, Kore, Fenrir, Zephyr
        // We stick to one voice output, but prompt controls style.
        const voiceName = 'Kore'; 

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: sysInstruction,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              console.log("Session Connected");
              if (mounted) setIsConnected(true);
            },
            onmessage: async (message: LiveServerMessage) => {
              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && ac) {
                setIsAiSpeaking(true);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ac.currentTime);
                const audioBuffer = await decodeAudioData(base64ToUint8Array(audioData), ac, 24000);
                const source = ac.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAnalyser); 
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                source.onended = () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0 && mounted) setIsAiSpeaking(false);
                };
                audioSourcesRef.current.add(source);
              }

              if (message.serverContent?.outputTranscription?.text) currentOutputRef.current += message.serverContent.outputTranscription.text;
              if (message.serverContent?.inputTranscription?.text) currentInputRef.current += message.serverContent.inputTranscription.text;

              if (message.serverContent?.turnComplete) {
                if (currentInputRef.current.trim()) {
                    setTranscript(prev => [...prev, { role: 'user', text: currentInputRef.current, timestamp: Date.now() }]);
                    currentInputRef.current = '';
                }
                if (currentOutputRef.current.trim()) {
                    setTranscript(prev => [...prev, { role: 'model', text: currentOutputRef.current, timestamp: Date.now() }]);
                    currentOutputRef.current = '';
                }
              }

              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(src => src.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                if (mounted) setIsAiSpeaking(false);
              }
            },
            onclose: () => {
              console.log("Session Closed");
              if (mounted) setIsConnected(false);
            },
            onerror: (e) => {
              console.error("Session Error", e);
              if (mounted) setError("Connection error. Please check your microphone permissions.");
            }
          }
        });

        sessionRef.current = sessionPromise;

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData, 16000);
          sessionPromise.then((session: any) => session.sendRealtimeInput({ media: pcmBlob })).catch(console.error);
        };

      } catch (err) {
        console.error("Setup failed", err);
        if (mounted) setError("Failed to initialize. Please refresh and try again.");
      }
    };

    initSession();

    return () => {
      mounted = false;
      if (audioContextRef.current) audioContextRef.current.close();
      if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    };
  }, [jobConfig]);

  const toggleMute = () => setIsMuted(!isMuted);

  const endInterview = () => {
    const finalTranscript = [...transcript];
    if (currentInputRef.current) finalTranscript.push({ role: 'user', text: currentInputRef.current, timestamp: Date.now() });
    if (currentOutputRef.current) finalTranscript.push({ role: 'model', text: currentOutputRef.current, timestamp: Date.now() });
    onEnd(finalTranscript);
  };

  const currentSubtitle = transcript.length > 0 ? transcript[transcript.length - 1] : null;
  const avatarUrl = jobConfig.interviewerConfig.mode === 'panel' ? AVATAR_MAP['Panel'] : AVATAR_MAP[jobConfig.interviewerConfig.nationality] || AVATAR_MAP['American'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden text-slate-900 font-sans">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
             <div className="flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-full border border-slate-200">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">{isConnected ? 'Live Connection' : 'Connecting...'}</span>
            </div>
        </div>
        <div className="pointer-events-auto bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm">{jobConfig.role || 'General Interview'}</h2>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col relative bg-slate-100">
        
        {/* Interviewer Avatar Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-8">
             
             <div className={`relative w-full h-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${isAiSpeaking ? 'ring-4 ring-indigo-100' : ''}`}>
                <img 
                    src={avatarUrl} 
                    alt="Interviewer" 
                    className="w-full h-full object-cover"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Name Tag */}
                <div className="absolute bottom-6 left-6 md:left-10 flex items-center gap-3">
                    <div className="bg-white/95 backdrop-blur text-slate-900 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                        {jobConfig.interviewerConfig.mode === 'panel' ? <Users className="w-4 h-4 text-indigo-600" /> : <User className="w-4 h-4 text-indigo-600" />}
                        <span className="font-bold text-sm">
                            {jobConfig.interviewerConfig.mode === 'panel' ? 'Interview Panel' : `Interviewer (${jobConfig.interviewerConfig.nationality})`}
                        </span>
                        {isAiSpeaking && <Signal className="w-3 h-3 text-green-500 animate-pulse" />}
                    </div>
                </div>

                {/* Subtitles */}
                {currentSubtitle && (
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center px-6 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md px-8 py-4 rounded-2xl max-w-2xl text-center shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <p className={`text-lg md:text-xl font-medium leading-relaxed ${currentSubtitle.role === 'user' ? 'text-indigo-200 italic' : 'text-white'}`}>
                            {currentSubtitle.role === 'user' ? 'You: ' : ''}"{currentSubtitle.text}"
                            </p>
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* User Pip */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-36 md:w-56 aspect-video bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-white z-30 flex flex-col">
            <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
                 <User className="w-8 h-8 text-slate-500" />
                 <div className="absolute inset-0 opacity-60">
                    <AudioVisualizer isActive={!isMuted} analyser={inputAnalyserRef.current} color="#818cf8" />
                 </div>
            </div>
            <div className="bg-white px-3 py-1.5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">You</span>
                {isMuted ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-green-500" />}
            </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-l-4 border-red-500 text-slate-800 px-8 py-6 rounded-xl shadow-2xl z-50 max-w-md text-center">
            <p className="font-bold text-red-600 mb-2">Connection Error</p>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition">
                Retry Connection
            </button>
        </div>
      )}

      {/* Controls */}
      <div className="h-24 bg-white border-t border-slate-100 flex items-center justify-center gap-6 z-30 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isMuted ? 'bg-red-50 text-red-500 border-2 border-red-100' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:scale-105'}`}
        >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button 
            onClick={endInterview}
            className="px-8 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl shadow-red-200 flex items-center gap-3 transition-all hover:scale-105"
        >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
        </button>
      </div>
    </div>
  );
};

export default InterviewScreen;