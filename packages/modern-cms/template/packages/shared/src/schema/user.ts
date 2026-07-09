import { z } from "zod";

export const UserRoleSchema = z.enum(["ADMIN", "EDITOR", "AUTHOR"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema.default("EDITOR"),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
