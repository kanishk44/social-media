import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export class UsersController {
  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const followerId = req.user!.userId;

      await usersService.followUser(followerId, id);

      res.status(200).json({
        success: true,
        data: { message: 'Successfully followed user' },
      });
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const followerId = req.user!.userId;

      await usersService.unfollowUser(followerId, id);

      res.status(200).json({
        success: true,
        data: { message: 'Successfully unfollowed user' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await usersService.getFollowers(id, offset, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await usersService.getFollowing(id, offset, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();

