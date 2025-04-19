import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map((err: ValidationError) => ({
        field: typeof err === 'object' && 'path' in err ? err.path : 
               typeof err === 'object' && 'param' in err ? err.param : 'unknown',
        message: err.msg
      }))
    });
  }
  
  next();
}; 