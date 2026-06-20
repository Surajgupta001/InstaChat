import { Router } from 'express';
import upload from '../middlewares/multer';
import { createStory, getStories } from '../controllers/story.controllers';
import { authMiddlewares } from '../middlewares/auth.middlewares';

const storyRouter = Router();

storyRouter.use(authMiddlewares);
storyRouter.post('/', upload.single('file'), createStory);
storyRouter.get('/', getStories);

export default storyRouter;