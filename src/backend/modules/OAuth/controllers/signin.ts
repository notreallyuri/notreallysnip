import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "../generators";
import { createSession } from "@/backend/modules/session";
import { global_user } from "@/backend/types/user";
import { Providers } from "@/backend/prisma/generated";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function getUserData(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;
  const code = req.nextUrl.searchParams.get("code");
  const provider = z.nativeEnum(Providers).parse(rawProvider);

  if (typeof code !== "string") {
    const errorUrl = new URL("/auth", req.url);
    errorUrl.searchParams.set("tab", "signin");
    errorUrl.searchParams.set(
      "oauthError",
      "Failed to connect. Please try again.",
    );
    return NextResponse.redirect(errorUrl);
  }

  const oAuthClient = getOAuthClient(provider);

  try {
    const oAuthUser = await oAuthClient.fetchUser(code);
    const user = await AccountToUser(oAuthUser, provider);
    await createSession.execute({ user, remember: false });
    return NextResponse.redirect(new URL("/home", req.url));
  } catch (error) {
    const errorUrl = new URL("/auth", req.url);
    errorUrl.searchParams.set("tab", "signin");
    errorUrl.searchParams.set(
      "oauthError",
      "Failed to connect. Please try again.",
    );
    return NextResponse.redirect(errorUrl);
  }
}

export const AccountToUser = (
  { id, email, name }: global_user,
  provider: Providers,
) => {
  return prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        emailVerified: true,
      },
    });

    if (!user) {
      user = await tx.user.create({
        data: { email, username: name, preferences: { create: {} } },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          emailVerified: true,
        },
      });
    }

    await tx.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: id,
        },
      },
      update: {},
      create: {
        provider,
        providerAccountId: id,
        userId: user.id,
      },
    });

    return user;
  });
};
