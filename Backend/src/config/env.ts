import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  MONGODB_URI: z.string().url(),
  FRONTEND_URL: z.string().url(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(values: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(values);
}
