import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middleware/authHandler';

export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.body;
    const userId = req.user!.userId;

    if (!postId) {
      return sendError(res, 400, 'postId is required');
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return sendSuccess(res, { favorited: false }, 'Removed from favorites');
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          postId,
        }
      });
      return sendSuccess(res, { favorited: true }, 'Added to favorites', 201);
    }
  } catch (err) {
    next(err);
  }
};

export const getFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true, title: true } },
            community: { select: { name: true, slug: true } },
            _count: { select: { comments: true } },
            reactions: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const rankedPosts = favorites.map((fav: any) => {
      const post = fav.post;
      let likes = 0;
      let dislikes = 0;
      
      (post.reactions as any)?.forEach((reaction: any) => {
        if (reaction.type === 'like') likes++;
        if (reaction.type === 'dislike') dislikes++;
      });

      const score = (likes - dislikes) + (post._count.comments * 2);

      return {
        ...post,
        likeCount: likes,
        dislikeCount: dislikes,
        commentCount: post._count.comments,
        score,
        reactions: undefined,
        _count: undefined,
      };
    });

    return sendSuccess(res, rankedPosts);
  } catch (err) {
    next(err);
  }
};
