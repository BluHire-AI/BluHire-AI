import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser } from '../models/User';

export const generateTokens = (user: IUser) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as any,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION as any,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

export const generateResetToken = (user: IUser) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'reset',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '1h',
  });
};

export const verifyResetToken = (token: string) => {
  const decoded: any = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (decoded.type !== 'reset') {
    throw new Error('Invalid token type');
  }
  return decoded;
};
