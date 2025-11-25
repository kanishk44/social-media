import { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error-handler';
import { randomUUID } from 'crypto';

export class PostsController {
  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, mediaUrl } = req.body as {
        text: string;
        mediaUrl?: string;
      };
      const authorId = req.user!.userId;

      const post = await postsService.createPost(authorId, { text, mediaUrl });

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const post = await postsService.getPostById(id);

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await postsService.getUserPosts(id, offset, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await postsService.getFeed(userId, offset, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        throw new HttpError(501, 'Media upload not configured', 'UPLOAD_NOT_CONFIGURED');
      }

      const ext = req.query.ext as string;
      const userId = req.user!.userId;

      // Generate unique filename
      const filename = `${userId}/${randomUUID()}.${ext}`;

      // Create signed upload URL
      const { data, error } = await supabase!.storage
        .from(env.SUPABASE_BUCKET)
        .createSignedUploadUrl(filename);

      if (error) {
        throw new HttpError(500, 'Failed to generate upload URL', 'UPLOAD_URL_ERROR', error);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase!.storage.from(env.SUPABASE_BUCKET).getPublicUrl(filename);

      res.status(200).json({
        success: true,
        data: {
          uploadUrl: data.signedUrl,
          mediaUrl: publicUrl,
          filename,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const postsController = new PostsController();

