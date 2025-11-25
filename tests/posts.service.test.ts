import { PostsService } from '../src/modules/posts/posts.service';

// Mock dependencies
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/config/database';

describe('PostsService', () => {
  let postsService: PostsService;

  beforeEach(() => {
    postsService = new PostsService();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post without media', async () => {
      const authorId = 'user123';
      const postData = { text: 'Hello world!' };
      const createdPost = {
        id: 'post123',
        authorId,
        text: postData.text,
        mediaUrl: null,
        createdAt: new Date(),
        author: {
          id: authorId,
          handle: 'testuser',
          name: 'Test User',
          createdAt: new Date(),
        },
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(createdPost);

      const result = await postsService.createPost(authorId, postData);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          authorId,
          text: postData.text,
          mediaUrl: null,
        },
        include: {
          author: {
            select: {
              id: true,
              handle: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });
      expect(result.id).toBe(createdPost.id);
      expect(result.text).toBe(postData.text);
      expect(result.mediaUrl).toBeNull();
    });

    it('should create a post with media', async () => {
      const authorId = 'user123';
      const postData = {
        text: 'Check out this image!',
        mediaUrl: 'https://example.com/image.jpg',
      };
      const createdPost = {
        id: 'post123',
        authorId,
        text: postData.text,
        mediaUrl: postData.mediaUrl,
        createdAt: new Date(),
        author: {
          id: authorId,
          handle: 'testuser',
          name: 'Test User',
          createdAt: new Date(),
        },
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(createdPost);

      const result = await postsService.createPost(authorId, postData);

      expect(result.mediaUrl).toBe(postData.mediaUrl);
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      const post = {
        id: 'post123',
        authorId: 'user123',
        text: 'Hello world!',
        mediaUrl: null,
        createdAt: new Date(),
        author: {
          id: 'user123',
          handle: 'testuser',
          name: 'Test User',
          createdAt: new Date(),
        },
      };

      (prisma.post.findUnique as jest.Mock).mockResolvedValue(post);

      const result = await postsService.getPostById('post123');

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post123' },
        include: {
          author: {
            select: {
              id: true,
              handle: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });
      expect(result.id).toBe(post.id);
      expect(result.text).toBe(post.text);
    });

    it('should throw error if post not found', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(postsService.getPostById('nonexistent')).rejects.toThrow('Post not found');
    });
  });

  describe('getUserPosts', () => {
    it('should return paginated user posts', async () => {
      const userId = 'user123';
      const posts = [
        {
          id: 'post1',
          authorId: userId,
          text: 'First post',
          mediaUrl: null,
          createdAt: new Date(),
          author: {
            id: userId,
            handle: 'testuser',
            name: 'Test User',
            createdAt: new Date(),
          },
        },
        {
          id: 'post2',
          authorId: userId,
          text: 'Second post',
          mediaUrl: null,
          createdAt: new Date(),
          author: {
            id: userId,
            handle: 'testuser',
            name: 'Test User',
            createdAt: new Date(),
          },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(2);

      const result = await postsService.getUserPosts(userId, 0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.data[0].id).toBe(posts[0].id);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(postsService.getUserPosts('nonexistent', 0, 20)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getFeed', () => {
    it('should return feed with posts from user and following', async () => {
      const userId = 'user123';
      const following = [
        { followingId: 'user456' },
        { followingId: 'user789' },
      ];
      const posts = [
        {
          id: 'post1',
          authorId: userId,
          text: 'My post',
          mediaUrl: null,
          createdAt: new Date(),
          author: {
            id: userId,
            handle: 'testuser',
            name: 'Test User',
            createdAt: new Date(),
          },
        },
        {
          id: 'post2',
          authorId: 'user456',
          text: 'Following post',
          mediaUrl: null,
          createdAt: new Date(),
          author: {
            id: 'user456',
            handle: 'followeduser',
            name: 'Followed User',
            createdAt: new Date(),
          },
        },
      ];

      (prisma.follow.findMany as jest.Mock).mockResolvedValue(following);
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(2);

      const result = await postsService.getFeed(userId, 0, 20);

      expect(prisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        select: { followingId: true },
      });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: {
              in: [userId, 'user456', 'user789'],
            },
          },
        })
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should return only user posts when not following anyone', async () => {
      const userId = 'user123';
      const posts = [
        {
          id: 'post1',
          authorId: userId,
          text: 'My post',
          mediaUrl: null,
          createdAt: new Date(),
          author: {
            id: userId,
            handle: 'testuser',
            name: 'Test User',
            createdAt: new Date(),
          },
        },
      ];

      (prisma.follow.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      const result = await postsService.getFeed(userId, 0, 20);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: {
              in: [userId],
            },
          },
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });
});

