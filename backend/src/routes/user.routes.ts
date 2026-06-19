import { Router } from "express";
import { getProfile, getUsers, searchUsers, updateProfile } from "../controllers/user.controllers";
import upload from "../middlewares/multer";

const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.get('/search', searchUsers);
userRouter.get('/profile', getProfile);
userRouter.put('/profile', upload.single('avatar'), updateProfile);

export default userRouter;