import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authHandler';

const createCommunitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().min(1),
});

const WEIGHT = 2; // For ranking

export const getCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const response = communities.map((c: any) => ({
      ...c,
      postCount: c._count.posts,
      _count: undefined,
    }));

    return sendSuccess(res, response);
  } catch (err) {
    next(err);
  }
};

export const createCommunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createCommunitySchema.parse(req.body);
    
    const slug = validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await prisma.community.findUnique({ where: { slug } });
    if (existing) {
      return sendError(res, 400, 'A community with a similar name already exists');
    }

    const community = await prisma.community.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        icon: validated.icon,
        createdById: req.user!.userId,
      }
    });

    return sendSuccess(res, community, 'Community created successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', (err as any).issues);
    }
    next(err);
  }
};

export const getCommunityPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const community = await prisma.community.findUnique({ where: { slug } });
    if (!community) {
      return sendError(res, 404, 'Community not found');
    }

    const skip = (page - 1) * limit;

    const [total, posts] = await Promise.all([
      prisma.post.count({ where: { communityId: community.id } }),
      prisma.post.findMany({
        where: { communityId: community.id },
        include: {
          author: { select: { name: true, email: true } },
          _count: { select: { comments: true } },
          reactions: true,
        },
      })
    ]);

    const rankedPosts = posts.map((post: any) => {
      let likes = 0;
      let dislikes = 0;
      
      (post.reactions as any)?.forEach((reaction: any) => {
        if (reaction.type === 'like') likes++;
        if (reaction.type === 'dislike') dislikes++;
      });

      const score = (likes - dislikes) + (post._count.comments * WEIGHT);

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

    rankedPosts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const paginatedPosts = rankedPosts.slice(skip, skip + limit);

    return sendSuccess(res, {
      community,
      items: paginatedPosts,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
};
