import { Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authHandler';

const toggleReactionSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().uuid(),
  type: z.enum(['like', 'dislike']),
});

export const toggleReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = toggleReactionSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify target exists
    if (validated.targetType === 'post') {
      const post = await prisma.post.findUnique({ where: { id: validated.targetId } });
      if (!post) return sendError(res, 404, 'Post not found');
    } else {
      const comment = await prisma.comment.findUnique({ where: { id: validated.targetId } });
      if (!comment) return sendError(res, 404, 'Comment not found');
    }

    // Check if reaction exists
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: validated.targetType,
          targetId: validated.targetId,
        }
      }
    });

    if (existing) {
      if (existing.type === validated.type) {
        // Same type -> remove reaction
        await prisma.reaction.delete({ where: { id: existing.id } });
        return sendSuccess(res, { action: 'removed' }, 'Reaction removed');
      } else {
        // Different type -> switch reaction
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type: validated.type },
        });
        return sendSuccess(res, { action: 'switched', reaction: updated }, 'Reaction switched');
      }
    } else {
      // No existing reaction -> create new
      const newReaction = await prisma.reaction.create({
        data: {
          userId,
          targetType: validated.targetType,
          targetId: validated.targetId,
          type: validated.type,
        }
      });
      return sendSuccess(res, { action: 'added', reaction: newReaction }, 'Reaction added', 201);
    }

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', err.errors);
    }
    next(err);
  }
};
