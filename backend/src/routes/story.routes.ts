import { Router } from 'express';
import upload from '../middlewares/multer';
import { createStory, getStories, viewStory } from '../controllers/story.controllers';
import { authMiddlewares } from '../middlewares/auth.middlewares';
import { uploadLimiter } from '../middlewares/rateLimiter';

const storyRouter = Router();

storyRouter.use(authMiddlewares);
storyRouter.post('/', uploadLimiter, upload.single('file'), createStory);
storyRouter.get('/', getStories);
storyRouter.post('/:storyId/view', viewStory);

export default storyRouter;
