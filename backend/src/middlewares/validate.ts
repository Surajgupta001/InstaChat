import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

type ValidationSource = "body" | "query" | "params";

export function validate(schema: z.ZodType, source: ValidationSource = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req[source];
        const result = schema.safeParse(data);

        if (!result.success) {
            const formatted = result.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join(", ");

            return res.status(400).json({
                success: false,
                message: formatted,
            });
        }

        // Replace with parsed (sanitized) data
        (req as any)[source] = result.data;
        next();
    };
}
