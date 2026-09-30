import { Router } from 'express';
import { configRouter } from './routes/configRoutes';
import { profileRouter } from './routes/profileRoutes';
import { oauthRouter } from './routes/oauthRoutes';
import { authRouterGroup } from './routes/authRoutes';
import { browserOAuthRouter } from './routes/browserOAuthRoutes';

export const authRouter = Router();

authRouter.use('/config', configRouter);
authRouter.use('/', profileRouter);
authRouter.use('/', authRouterGroup);
authRouter.use('/', browserOAuthRouter);
authRouter.use('/account/oauth', oauthRouter);
