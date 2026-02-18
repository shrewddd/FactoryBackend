import express from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import logger from 'logger';


export const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.sendStatus(401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    req.userId = decoded.userId;

    next()
  } catch (error) {
    logger.error(error)
    res.sendStatus(401);
  }
};

