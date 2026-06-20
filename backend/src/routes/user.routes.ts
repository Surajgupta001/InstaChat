import { Router } from "express";
import { getProfile, getUsers, searchUsers, updateProfile } from "../controllers/user.controllers";
import upload from "../middlewares/multer";
import { authMiddlewares } from "../middlewares/auth.middlewares";

const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.get('/search', searchUsers);
userRouter.get('/profile', authMiddlewares, getProfile);
userRouter.put('/profile', upload.single('avatar'), authMiddlewares, updateProfile);

export default userRouter;