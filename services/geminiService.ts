import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FeedbackData, JobConfig, TranscriptItem } from "../types";

export const generateFeedbackReport = async (transcript: TranscriptItem[], jobConfig: JobConfig): Promise<FeedbackData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transcriptText = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
  
  // Construct context string based on available fields
  let specificContext = "";
  if (jobConfig.resumeText) specificContext += `Candidate Resume: ${jobConfig.resumeText.substring(0, 2000)}...\n`;
  if (jobConfig.jobPostText) specificContext += `Job Description: ${jobConfig.jobPostText.substring(0, 2000)}...\n`;
  if (jobConfig.additionalContext) specificContext += `Additional Context: ${jobConfig.additionalContext}\n`;

  const roleInfo = jobConfig.role ? `for a ${jobConfig.role} position` : "for a professional role";
  const expInfo = jobConfig.yearsExperience ? `with ${jobConfig.yearsExperience} years of experience` : "";

  const prompt = `
    Analyze the following interview transcript ${roleInfo} ${expInfo}.
    
    CONTEXT PROVIDED:
    ${specificContext}
    
    TRANSCRIPT:
    ${transcriptText}
    
    TASK:
    Provide a detailed feedback report in JSON format.
    1. Score (0-100): Based on clarity, relevance, technical accuracy (if applicable), and communication style.
    2. Summary: 2-3 sentences summarizing the candidate's performance.
    3. Strengths: 3-5 key strengths observed.
    4. Weaknesses: 3-5 areas where the candidate struggled.
    5. Improvements: 3-5 actionable tips for the next interview.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      summary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["score", "summary", "strengths", "weaknesses", "improvements"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FeedbackData;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Feedback generation failed", error);
    return {
      score: 0,
      summary: "We couldn't generate the full report due to an error. Please try again later.",
      strengths: ["Participation"],
      weaknesses: ["System Error"],
      improvements: ["Please check your connection and retry."]
    };
  }
};