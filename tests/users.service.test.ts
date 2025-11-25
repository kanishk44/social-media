import { UsersService } from '../src/modules/users/users.service';

// Mock dependencies
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '../src/config/database';

describe('UsersService', () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService();
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const user = {
        id: 'user123',
        handle: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await usersService.getUserById('user123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          id: true,
          handle: true,
          name: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(user);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usersService.getUserById('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('followUser', () => {
    it('should follow a user', async () => {
      const followerId = 'user123';
      const followingId = 'user456';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: followingId });
      (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follow.create as jest.Mock).mockResolvedValue({
        id: 'follow123',
        followerId,
        followingId,
        createdAt: new Date(),
      });

      await usersService.followUser(followerId, followingId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: followingId },
      });
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId,
          followingId,
        },
      });
    });

    it('should throw error when trying to follow yourself', async () => {
      const userId = 'user123';

      await expect(usersService.followUser(userId, userId)).rejects.toThrow(
        'Cannot follow yourself'
      );
    });

    it('should throw error if target user does not exist', async () => {
      const followerId = 'user123';
      const followingId = 'nonexistent';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usersService.followUser(followerId, followingId)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error if already following', async () => {
      const followerId = 'user123';
      const followingId = 'user456';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: followingId });
      (prisma.follow.findUnique as jest.Mock).mockResolvedValue({
        id: 'follow123',
        followerId,
        followingId,
        createdAt: new Date(),
      });

      await expect(usersService.followUser(followerId, followingId)).rejects.toThrow(
        'Already following this user'
      );
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      const followerId = 'user123';
      const followingId = 'user456';

      (prisma.follow.findUnique as jest.Mock).mockResolvedValue({
        id: 'follow123',
        followerId,
        followingId,
        createdAt: new Date(),
      });
      (prisma.follow.delete as jest.Mock).mockResolvedValue({});

      await usersService.unfollowUser(followerId, followingId);

      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      expect(prisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    });

    it('should throw error when trying to unfollow yourself', async () => {
      const userId = 'user123';

      await expect(usersService.unfollowUser(userId, userId)).rejects.toThrow(
        'Cannot unfollow yourself'
      );
    });

    it('should throw error if not following', async () => {
      const followerId = 'user123';
      const followingId = 'user456';

      (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usersService.unfollowUser(followerId, followingId)).rejects.toThrow(
        'Not following this user'
      );
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers', async () => {
      const userId = 'user123';
      const followers = [
        {
          follower: {
            id: 'user1',
            handle: 'follower1',
            name: 'Follower One',
            createdAt: new Date(),
          },
        },
        {
          follower: {
            id: 'user2',
            handle: 'follower2',
            name: 'Follower Two',
            createdAt: new Date(),
          },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.follow.findMany as jest.Mock).mockResolvedValue(followers);
      (prisma.follow.count as jest.Mock).mockResolvedValue(2);

      const result = await usersService.getFollowers(userId, 0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.data[0]).toEqual(followers[0].follower);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usersService.getFollowers('nonexistent', 0, 20)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following', async () => {
      const userId = 'user123';
      const following = [
        {
          following: {
            id: 'user1',
            handle: 'following1',
            name: 'Following One',
            createdAt: new Date(),
          },
        },
        {
          following: {
            id: 'user2',
            handle: 'following2',
            name: 'Following Two',
            createdAt: new Date(),
          },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.follow.findMany as jest.Mock).mockResolvedValue(following);
      (prisma.follow.count as jest.Mock).mockResolvedValue(2);

      const result = await usersService.getFollowing(userId, 0, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.data[0]).toEqual(following[0].following);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usersService.getFollowing('nonexistent', 0, 20)).rejects.toThrow(
        'User not found'
      );
    });
  });
});

