import { signInSchema, signUpSchema } from "@/schemas/auth.schemas";
import { PrismaClient } from "@prisma/client";
import { customHasher } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { cookies } from "next/headers";
import { sessionManager } from "./session.repository";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: z.infer<typeof signUpSchema>) {
    const { username, email, password } = data;

    const existingUser = await this.db.user.findUnique({ where: { email } });

    if (existingUser)
      throw new AppError({ code: "CONFLICT", message: "Email already in use" });

    try {
      const salt = customHasher.generateSalt();
      const hash = await customHasher.hashPassword(password, salt);

      const user = await this.db.user.create({
        data: {
          username,
          email,
          password: hash,
          salt,
          preferences: { create: {} },
        },
      });

      const verificationToken = crypto.randomBytes(32).toString("hex");

      await this.db.emailVerificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await sessionManager.createUserSession(user.id, await cookies());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create a user",
      });
    }
  }

  async signIn(data: z.infer<typeof signInSchema>) {
    const { email, password } = data;

    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, salt: true },
    });

    if (!user) {
      throw new AppError({
        code: "BAD_REQUEST",
        message: "Wrong credentials",
      });
    }

    const { password: hashedPassword, salt } = user;

    const isValid = await customHasher.verifyPassword(
      password,
      salt,
      hashedPassword
    );

    if (!isValid)
      throw new AppError({
        code: "BAD_REQUEST",
        message: "Wrong credentials",
      });

    await sessionManager.createUserSession(user.id, await cookies());
  }
}

export const authManager = new AuthRepository(prisma);
