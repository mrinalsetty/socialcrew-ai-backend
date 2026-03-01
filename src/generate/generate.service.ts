import { Injectable } from '@nestjs/common';

@Injectable()
export class GenerateService {
  generateFromTopic(topic: string) {
    return {
      contentCreator: [
        {
          id: 1,
          title: 'Post Option 1',
          content: `Why ${topic} matters more than ever in 2026.`,
          hashtags: ['#AI', '#Startups', '#Growth'],
        },
        {
          id: 2,
          title: 'Post Option 2',
          content: `Most people underestimate how ${topic} changes execution speed.`,
          hashtags: ['#Tech', '#Founders', '#Productivity'],
        },
        {
          id: 3,
          title: 'Post Option 3',
          content: `If you learn ${topic} well, you build leverage that compounds.`,
          hashtags: ['#Innovation', '#Builders', '#AI'],
        },
      ],
      socialAnalyst: {
        bestPost: 1,
        reason: 'Post 1 has the clearest hook and strongest broad appeal.',
        suggestions: [
          'Add a sharper CTA.',
          'Make one version platform-specific for LinkedIn.',
        ],
      },
    };
  }
}
