import { Request, Response } from 'express';
import { getPosts } from '../posts.controller';
import { prismaMock } from '../../../__mocks__/prisma';

describe('Posts Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      query: { page: '1', limit: '10' }
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('getPosts', () => {
    it('should correctly rank posts based on reactions and comments', async () => {
      // Mock data
      const mockPosts = [
        {
          id: '1',
          title: 'Post 1',
          body: 'Body 1',
          authorId: 'user1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          author: { name: 'User 1', email: 'user1@test.com' },
          _count: { comments: 2 }, // Weight is 2 -> score = 4
          reactions: [
            { type: 'like' },
            { type: 'like' }
          ] // likes = 2 -> total score = 4 + 2 = 6
        },
        {
          id: '2',
          title: 'Post 2',
          body: 'Body 2',
          authorId: 'user2',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          author: { name: 'User 2', email: 'user2@test.com' },
          _count: { comments: 5 }, // score = 10
          reactions: [
            { type: 'dislike' }
          ] // dislikes = 1 -> total score = 10 - 1 = 9
        }
      ];

      prismaMock.post.count.mockResolvedValue(2);
      prismaMock.post.findMany.mockResolvedValue(mockPosts as any);

      await getPosts(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.post.findMany).toHaveBeenCalled();
      
      const responseData = statusMock.mock.calls[0] ? jsonMock.mock.calls[0][0] : jsonMock.mock.calls[0][0];
      
      expect(responseData.success).toBe(true);
      
      // Post 2 should be first because it has a score of 9, Post 1 has a score of 6
      expect(responseData.data.items[0].id).toBe('2');
      expect(responseData.data.items[1].id).toBe('1');
      
      expect(responseData.data.items[0].score).toBe(9);
      expect(responseData.data.items[1].score).toBe(6);
    });
  });
});
