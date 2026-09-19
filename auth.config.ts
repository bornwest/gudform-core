import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import bcrypt from "bcryptjs";

import { env } from "@/env.mjs";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const loginLimiter = rateLimit({ interval: 15 * 60_000 });

const providers: NextAuthConfig["providers"] = [];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: "GudForm <onboarding@resend.dev>",
    }),
  );
}

providers.push(
  Credentials({
    async authorize(credentials) {
      const validatedFields = loginSchema.safeParse(credentials);
      if (!validatedFields.success) return null;

      const { email, password } = validatedFields.data;

      const { success } = loginLimiter.check(5, `login:${email.toLowerCase()}`);
      if (!success) return null;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.password) return null;

      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (!passwordsMatch) return null;

      return user;
    },
  }),
);

export default {
  providers,
} satisfies NextAuthConfig;
