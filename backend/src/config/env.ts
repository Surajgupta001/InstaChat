import { z } from "zod";

const envSchema = z.object({
    MONGODB_URI: z.string().url({ message: "MONGODB_URI must be a valid MongoDB connection string" }),
    CLERK_SECRET_KEY: z.string().min(1, { message: "CLERK_SECRET_KEY is required" }),
    CLOUDINARY_CLOUD_NAME: z.string().min(1, { message: "CLOUDINARY_CLOUD_NAME is required" }),
    CLOUDINARY_API_KEY: z.string().min(1, { message: "CLOUDINARY_API_KEY is required" }),
    CLOUDINARY_API_KEY_SECRET: z.string().min(1, { message: "CLOUDINARY_API_KEY_SECRET is required" }),
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function validateEnv(): Env {
    if (_env) return _env;

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.issues
            .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");

        console.error("\n❌ Invalid environment variables:\n" + formatted + "\n");
        process.exit(1);
    }

    _env = result.data;
    console.log("✅ Environment variables validated successfully");
    return _env;
}

export function getEnv(): Env {
    if (!_env) {
        throw new Error("Environment not initialized. Call validateEnv() first.");
    }
    return _env;
}
