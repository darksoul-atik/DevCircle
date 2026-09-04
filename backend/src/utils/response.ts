import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message?: string, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message })
  });
};

export const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors
  });
};
