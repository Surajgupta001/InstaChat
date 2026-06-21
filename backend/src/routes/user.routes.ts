import { Router } from "express";
import { getProfile, getUsers, searchUsers, updateProfile } from "../controllers/user.controllers";
import upload from "../middlewares/multer";
import { authMiddlewares } from "../middlewares/auth.middlewares";
import { validate } from "../middlewares/validate";
import { searchUsersSchema, updateProfileSchema } from "../validations/user.schema";
import { uploadLimiter } from "../middlewares/rateLimiter";

const userRouter = Router();

userRouter.use(authMiddlewares);

userRouter.get('/', getUsers);
userRouter.get('/search', validate(searchUsersSchema, 'query'), searchUsers);
userRouter.get('/profile', getProfile);
userRouter.put('/profile', uploadLimiter, upload.single('avatar'), validate(updateProfileSchema), updateProfile);

export default userRouter;
