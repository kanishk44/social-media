import { prisma } from '../../config/database';
import { HttpError } from '../../middleware/error-handler';
import { PostDTO, PaginatedResponse } from '../../models/types';

export class PostsService {
  async createPost(authorId: string, data: { text: string; mediaUrl?: string }): Promise<PostDTO> {
    const post = await prisma.post.create({
      data: {
        authorId,
        text: data.text,
        mediaUrl: data.mediaUrl || null,
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

    return this.toPostDTO(post);
  }

  async getPostById(id: string): Promise<PostDTO> {
    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      throw new HttpError(404, 'Post not found', 'POST_NOT_FOUND');
    }

    return this.toPostDTO(post);
  }

  async getUserPosts(
    userId: string,
    offset: number,
    limit: number
  ): Promise<PaginatedResponse<PostDTO>> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({
        where: { authorId: userId },
      }),
    ]);

    return {
      data: posts.map((post) => this.toPostDTO(post)),
      pagination: {
        offset,
        limit,
        total,
      },
    };
  }

  async getFeed(userId: string, offset: number, limit: number): Promise<PaginatedResponse<PostDTO>> {
    // Get user's following list
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const authorIds = [userId, ...followingIds];

    // Get posts from self and following
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: {
            in: authorIds,
          },
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({
        where: {
          authorId: {
            in: authorIds,
          },
        },
      }),
    ]);

    return {
      data: posts.map((post) => this.toPostDTO(post)),
      pagination: {
        offset,
        limit,
        total,
      },
    };
  }

  private toPostDTO(post: {
    id: string;
    text: string;
    mediaUrl: string | null;
    createdAt: Date;
    author: {
      id: string;
      handle: string;
      name: string;
      createdAt: Date;
    };
  }): PostDTO {
    return {
      id: post.id,
      text: post.text,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      author: post.author,
    };
  }
}

export const postsService = new PostsService();

