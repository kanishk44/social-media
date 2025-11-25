import { prisma } from '../../config/database';
import { HttpError } from '../../middleware/error-handler';
import { UserPublicDTO, PaginatedResponse } from '../../models/types';

export class UsersService {
  async getUserById(id: string): Promise<UserPublicDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        handle: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new HttpError(400, 'Cannot follow yourself', 'INVALID_FOLLOW');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new HttpError(409, 'Already following this user', 'ALREADY_FOLLOWING');
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new HttpError(400, 'Cannot unfollow yourself', 'INVALID_UNFOLLOW');
    }

    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new HttpError(404, 'Not following this user', 'NOT_FOLLOWING');
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(
    userId: string,
    offset: number,
    limit: number
  ): Promise<PaginatedResponse<UserPublicDTO>> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get followers
    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        select: {
          follower: {
            select: {
              id: true,
              handle: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      data: followers.map((f) => f.follower),
      pagination: {
        offset,
        limit,
        total,
      },
    };
  }

  async getFollowing(
    userId: string,
    offset: number,
    limit: number
  ): Promise<PaginatedResponse<UserPublicDTO>> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get following
    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        select: {
          following: {
            select: {
              id: true,
              handle: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      data: following.map((f) => f.following),
      pagination: {
        offset,
        limit,
        total,
      },
    };
  }
}

export const usersService = new UsersService();

