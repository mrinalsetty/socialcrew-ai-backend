export type SocialPlatform =
  | 'LINKEDIN'
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'X'
  | 'INSTAGRAM'
  | 'THREADS';

export type TeamAgentId = 'strategy' | 'creator' | 'analyst';

export interface GenerateRequest {
  topic: string;
  platform: SocialPlatform;
  brandName?: string;
  audience?: string;
  tone?: string;
  ctaStyle?: string;
}

export interface TeamInfo {
  strategyName: string;
  creatorName: string;
  analystName: string;
}

export interface ConversationMessage {
  id: string;
  agentId: TeamAgentId | 'user';
  agentName: string;
  text: string;
  timestamp: string;
}

export interface StrategyOutput {
  agentName: string;
  intro: string;
  fullResponse: string;
  recommendedAngles: string[];
  audienceSegments: string[];
}

export interface GeneratedPost {
  id: number;
  title: string;
  description: string;
}

export interface CreatorOutput {
  agentName: string;
  intro: string;
  overview: string;
  posts: GeneratedPost[];
  commonHashtags: string[];
}

export interface AnalystOutput {
  agentName: string;
  intro: string;
  fullResponse: string;
  bestPost: number;
  comparison: string[];
  audienceFitNotes: string[];
}

export interface GenerateResponse {
  platform: SocialPlatform;
  team: TeamInfo;
  conversation: ConversationMessage[];
  strategy: StrategyOutput;
  creator: CreatorOutput;
  analyst: AnalystOutput;
}

export interface FollowUpRequest {
  topic: string;
  platform: SocialPlatform;
  team: TeamInfo;
  userMessage: string;
  targetAgents: TeamAgentId[];
  strategySummary: string;
  creatorSummary: string;
  analystSummary: string;
  postTitles: string[];
  bestPost: number;
}

export interface FollowUpResponse {
  messages: ConversationMessage[];
}
