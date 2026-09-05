import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';

const WEIGHT = 2; // Ranking formula weight for comments

export const multiFieldSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string | undefined;
    const type = req.query.type as string | undefined; // "posts", "users", "communities"

    if (!q) {
      return sendSuccess(res, { posts: [], users: [], communities: [] });
    }

    const postsPromise = (!type || type === 'posts') ? prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } }
        ]
      },
      include: {
        author: { select: { name: true, email: true, avatar: true, title: true } },
        _count: { select: { comments: true } },
        reactions: true,
      },
      take: 20
    }) : Promise.resolve([]);

    const usersPromise = (!type || type === 'users') ? prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
      },
      take: 20
    }) : Promise.resolve([]);

    const communitiesPromise = (!type || type === 'communities') ? prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20
    }) : Promise.resolve([]);

    const [posts, users, communities] = await Promise.all([postsPromise, usersPromise, communitiesPromise]);

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

    return sendSuccess(res, {
      posts: rankedPosts,
      users,
      communities,
    });
  } catch (err) {
    next(err);
  }
};
