import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authHandler';

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  communityId: z.string().uuid().optional().nullable(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

const WEIGHT = 2; // Ranking formula weight for comments

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createPostSchema.parse(req.body);
    const userId = req.user!.userId;

    let tagsArray: string[] = [];
    if (validated.tags) {
      if (Array.isArray(validated.tags)) {
        tagsArray = validated.tags.map(t => t.toLowerCase().replace(/^#/, ''));
      } else {
        tagsArray = validated.tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, ''));
      }
    }

    let communityId = validated.communityId;
    if (!communityId) {
      const general = await prisma.community.findUnique({ where: { slug: 'general' } });
      if (general) communityId = general.id;
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        body: validated.body,
        authorId: userId,
        communityId,
        tags: tagsArray,
        imageUrl,
      },
    });

    return sendSuccess(res, post, 'Post created successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', (err as any).errors);
    }
    next(err);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.q as string;

    const skip = (page - 1) * limit;

    const whereClause = search ? {
      title: {
        contains: search,
        mode: 'insensitive' as const,
      }
    } : {};

    const [total, posts] = await Promise.all([
      prisma.post.count({ where: whereClause }),
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true, title: true } },
          community: { select: { name: true, slug: true } },
          _count: {
            select: { comments: true }
          },
          reactions: true, // Need this to calculate score if we don't do raw query
        },
      })
    ]);

    // Calculate ranking score in memory since Prisma lacks deep aggregation sorting
    const rankedPosts = posts.map(post => {
      let likes = 0;
      let dislikes = 0;
      
      (post.reactions as any)?.forEach(reaction => {
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
        reactions: undefined, // remove raw reactions array from feed
        _count: undefined,
      };
    });

    // Sort by score DESC, tie-break by createdAt DESC
    rankedPosts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Manual Pagination after sorting (because score is computed)
    // For large datasets, a raw SQL query with aggregation is better, 
    // but this suffices for the scope.
    const paginatedPosts = rankedPosts.slice(skip, skip + limit);

    return sendSuccess(res, {
      items: paginatedPosts,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true, title: true } },
        community: { select: { name: true, slug: true } },
        reactions: true,
        favorites: true,
        _count: { select: { comments: true } }
      },
    });

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    let likes = 0;
    let dislikes = 0;
    (post.reactions as any)?.forEach(reaction => {
      if (reaction.type === 'like') likes++;
      if (reaction.type === 'dislike') dislikes++;
    });

    const responseData = {
      ...post,
      likeCount: likes,
      dislikeCount: dislikes,
      commentCount: post._count.comments,
      reactions: post.reactions as any, // return reactions so client knows own reaction state
      _count: undefined,
    };

    return sendSuccess(res, responseData);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = createPostSchema.partial().parse(req.body);
    const userId = req.user!.userId;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return sendError(res, 404, 'Post not found');
    }
    if (post.authorId !== userId) {
      return sendError(res, 403, 'Forbidden: You are not the author of this post');
    }

    let tagsArray = post.tags;
    if (validated.tags) {
      if (Array.isArray(validated.tags)) {
        tagsArray = validated.tags.map(t => t.toLowerCase().replace(/^#/, ''));
      } else {
        tagsArray = validated.tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, ''));
      }
    }

    let imageUrl = post.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: validated.title ?? post.title,
        body: validated.body ?? post.body,
        tags: tagsArray,
        imageUrl,
      }
    });

    return sendSuccess(res, updatedPost, 'Post updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', (err as any).errors);
    }
    next(err);
  }
};

export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return sendError(res, 404, 'Post not found');
    }
    if (post.authorId !== userId) {
      return sendError(res, 403, 'Forbidden: You are not the author of this post');
    }

    const commentIds = await prisma.comment.findMany({ where: { postId: id }, select: { id: true } });
    const cIds = commentIds.map(c => c.id);

    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { postId: id } }),
      prisma.reaction.deleteMany({ where: { targetType: 'post', targetId: id } }),
      prisma.reaction.deleteMany({ where: { targetType: 'comment', targetId: { in: cIds } } }),
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    return sendSuccess(res, null, 'Post deleted successfully');
  } catch (err) {
    next(err);
  }
};
