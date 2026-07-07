import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postSchema } from '@/validators/post.schema';

describe('postSchema', () => {
  it('should validate a valid post', () => {
    const validPost = {
      userId: 'user-123',
      image: 'https://example.com/image.jpg',
      caption: 'Test caption',
      date: new Date().toISOString(),
      type: 'feed',
      status: 'rascunho',
      cta: 'Agende agora!',
      hashtags: ['#tattoo', '#art'],
      title: 'Tattoo Design'
    };

    const result = postSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('should reject invalid image URL', () => {
    const invalidPost = {
      userId: 'user-123',
      image: 'not-a-url',
      caption: 'Test caption',
      date: new Date().toISOString(),
      type: 'feed',
      status: 'rascunho',
      cta: 'Agende agora!',
      hashtags: ['#tattoo', '#art'],
      title: 'Tattoo Design'
    };

    const result = postSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('image');
    }
  });

  it('should reject empty userId', () => {
    const invalidPost = {
      userId: '',
      image: 'https://example.com/image.jpg',
      caption: 'Test caption',
      date: new Date().toISOString(),
      type: 'feed',
      status: 'rascunho',
      cta: 'Agende agora!',
      hashtags: ['#tattoo', '#art'],
      title: 'Tattoo Design'
    };

    const result = postSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('userId');
    }
  });

  it('should reject invalid status', () => {
    const invalidPost = {
      userId: 'user-123',
      image: 'https://example.com/image.jpg',
      caption: 'Test caption',
      date: new Date().toISOString(),
      type: 'feed',
      status: 'invalid-status',
      cta: 'Agende agora!',
      hashtags: ['#tattoo', '#art'],
      title: 'Tattoo Design'
    };

    const result = postSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('status');
    }
  });

  it('should accept date as Date object', () => {
    const validPost = {
      userId: 'user-123',
      image: 'https://example.com/image.jpg',
      caption: 'Test caption',
      date: new Date(),
      type: 'feed',
      status: 'rascunho',
      cta: 'Agende agora!',
      hashtags: ['#tattoo', '#art'],
      title: 'Tattoo Design'
    };

    const result = postSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });
});