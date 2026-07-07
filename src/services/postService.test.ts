import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postService } from '@/services/postService';

// Mock the repository
vi.mock('@/repositories/postRepository', () => ({
  postRepository: {
    getPosts: vi.fn(),
    addPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  }
}));

import { postRepository } from '@/repositories/postRepository';

describe('postService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPosts', () => {
    it('should return posts from repository', async () => {
      const mockPosts = [
        { id: '1', userId: 'user-1', image: 'https://example.com/1.jpg', caption: 'Post 1' },
        { id: '2', userId: 'user-1', image: 'https://example.com/2.jpg', caption: 'Post 2' },
      ];
      
      (postRepository.getPosts as any).mockResolvedValue({ posts: mockPosts });

      const result = await postService.loadPosts('user-1');
      
      expect(result.posts).toEqual(mockPosts);
      expect(postRepository.getPosts).toHaveBeenCalledWith('user-1', 10, 0);
    });

    it('should handle empty posts', async () => {
      (postRepository.getPosts as any).mockResolvedValue({ posts: [] });

      const result = await postService.loadPosts('user-1');
      
      expect(result.posts).toEqual([]);
    });
  });

  describe('savePost', () => {
    it('should add new post when no id', async () => {
      const postData = {
        userId: 'user-1',
        image: 'https://example.com/image.jpg',
        caption: 'New post',
        date: new Date().toISOString(),
        type: 'feed',
        status: 'rascunho',
        cta: 'Agende!',
        hashtags: ['#tattoo'],
        title: 'Title'
      };

      (postRepository.addPost as any).mockResolvedValue({ id: 'new-id' });

      const result = await postService.savePost('user-1', postData);
      
      expect(result).toBe('new-id');
      expect(postRepository.addPost).toHaveBeenCalled();
    });

    it('should update existing post when id provided', async () => {
      const postData = {
        id: 'existing-id',
        userId: 'user-1',
        image: 'https://example.com/image.jpg',
        caption: 'Updated post',
        date: new Date().toISOString(),
        type: 'feed',
        status: 'pronto',
        cta: 'Agende!',
        hashtags: ['#tattoo'],
        title: 'Title'
      };

      (postRepository.updatePost as any).mockResolvedValue(undefined);

      const result = await postService.savePost('user-1', postData);
      
      expect(result).toBe('existing-id');
      expect(postRepository.updatePost).toHaveBeenCalledWith('existing-id', expect.any(Object));
    });
  });

  describe('getAvailableSlots', () => {
    it('should return empty array', async () => {
      const result = await postService.getAvailableSlots('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('deletePost', () => {
    it('should call repository deletePost', async () => {
      (postRepository.deletePost as any).mockResolvedValue(undefined);

      await postService.deletePost('post-123');
      
      expect(postRepository.deletePost).toHaveBeenCalledWith('post-123');
    });
  });
});