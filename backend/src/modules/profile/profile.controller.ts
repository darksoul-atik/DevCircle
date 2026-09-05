import { Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authHandler';

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

const skillSchema = z.object({
  name: z.string().min(1),
});

const expSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        experiences: { orderBy: { from: 'desc' } }
      },
    });

    if (!user) return sendError(res, 404, 'User not found');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return sendSuccess(res, safeUser);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = profileUpdateSchema.parse(req.body);
    const userId = req.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: validated,
      include: { skills: true, experiences: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return sendSuccess(res, safeUser, 'Profile updated');
  } catch (err: any) {
    if (err instanceof z.ZodError) return sendError(res, 400, 'Validation Error', (err as any).errors);
    next(err);
  }
};

export const addSkill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = skillSchema.parse(req.body);
    const userId = req.user!.userId;

    const skill = await prisma.skill.create({
      data: { name: validated.name, userId },
    });

    return sendSuccess(res, skill, 'Skill added', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) return sendError(res, 400, 'Validation Error', (err as any).errors);
    next(err);
  }
};

export const deleteSkill = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill || skill.userId !== userId) return sendError(res, 404, 'Skill not found');

    await prisma.skill.delete({ where: { id } });
    return sendSuccess(res, null, 'Skill deleted');
  } catch (err) {
    next(err);
  }
};

export const addExperience = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = expSchema.parse(req.body);
    const userId = req.user!.userId;

    const exp = await prisma.experience.create({
      data: {
        title: validated.title,
        company: validated.company,
        description: validated.description,
        from: new Date(validated.startDate),
        to: validated.endDate ? new Date(validated.endDate) : null,
        userId,
      },
    });

    return sendSuccess(res, exp, 'Experience added', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) return sendError(res, 400, 'Validation Error', (err as any).errors);
    next(err);
  }
};

export const deleteExperience = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const exp = await prisma.experience.findUnique({ where: { id } });
    if (!exp || exp.userId !== userId) return sendError(res, 404, 'Experience not found');

    await prisma.experience.delete({ where: { id } });
    return sendSuccess(res, null, 'Experience deleted');
  } catch (err) {
    next(err);
  }
};

export const updateExperience = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const validated = expSchema.partial().parse(req.body);

    const exp = await prisma.experience.findUnique({ where: { id } });
    if (!exp || exp.userId !== userId) return sendError(res, 404, 'Experience not found');

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        title: validated.title ?? exp.title,
        company: validated.company ?? exp.company,
        description: validated.description ?? exp.description,
        from: validated.startDate ? new Date(validated.startDate) : exp.from,
        to: validated.endDate !== undefined ? (validated.endDate ? new Date(validated.endDate) : null) : exp.to,
      },
    });

    return sendSuccess(res, updated, 'Experience updated');
  } catch (err: any) {
    if (err instanceof z.ZodError) return sendError(res, 400, 'Validation Error', (err as any).errors);
    next(err);
  }
};
