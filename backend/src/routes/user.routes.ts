import { Router } from "express";
import { getProfile, getUsers, searchUsers, updateProfile } from "../controllers/user.controllers";
import upload from "../middlewares/multer";
import { authMiddlewares } from "../middlewares/auth.middlewares";

const userRouter = Router();

userRouter.use(authMiddlewares);

userRouter.get('/', getUsers);
userRouter.get('/search', searchUsers);
userRouter.get('/profile', getProfile);
userRouter.put('/profile', upload.single('avatar'), updateProfile);

export default userRouter;