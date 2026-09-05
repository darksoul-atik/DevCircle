import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authHandler';

const createCommentSchema = z.object({
  body: z.string().min(1),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createCommentSchema.parse(req.body);
    const  = req.params.id as string;
    const userId = req.user!.userId;

    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    if (validated.parentCommentId) {
      const parent = await prisma.comment.findUnique({ where: { id: validated.parentCommentId } });
      if (!parent || parent.postId !== postId) {
        return sendError(res, 400, 'Invalid parent comment');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        body: validated.body,
        postId,
        authorId: userId,
        parentCommentId: validated.parentCommentId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        reactions: true,
      }
    });

    const commentWithCounts = {
      ...comment,
      likeCount: 0,
      dislikeCount: 0,
      replies: [],
    };

    return sendSuccess(res, commentWithCounts, 'Comment created', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', (err as any).errors);
    }
    next(err);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const  = req.params.id as string;

    const comments = await prisma.comment.findMany({
      where: { postId: postId as string },
      include: {
        author: { select: { id: true, name: true, email: true } },
        reactions: true,
      },
      orderBy: { createdAt: 'asc' }, // Older comments first
    });

    // Build the tree and calculate reaction counts
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    comments.forEach((comment: any) => {
      let likes = 0;
      let dislikes = 0;
      (comment.reactions as any)?.forEach(reaction => {
        if (reaction.type === 'like') likes++;
        if (reaction.type === 'dislike') dislikes++;
      });

      const formatted = {
        ...comment,
        likeCount: likes,
        dislikeCount: dislikes,
        replies: [],
      };
      
      commentMap.set(comment.id, formatted);
    });

    commentMap.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return sendSuccess(res, rootComments);
  } catch (err) {
    next(err);
  }
};
