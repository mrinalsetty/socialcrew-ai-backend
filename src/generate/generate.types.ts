export type SocialPlatform =
  | 'LINKEDIN'
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'X'
  | 'INSTAGRAM'
  | 'THREADS';

export interface GenerateRequest {
  topic: string;
  platform: SocialPlatform;
  brandName?: string;
  audience?: string;
  tone?: string;
  ctaStyle?: string;
}
