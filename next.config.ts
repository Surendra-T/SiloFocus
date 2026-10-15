import type { NextConfig } from "next";
// @ts-expect-error - next-pwa does not export TypeScript types
import withPWAInit from "next-pwa";
// @ts-expect-error - next-pwa does not export TypeScript types
import defaultRuntimeCaching from "next-pwa/cache";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching: defaultRuntimeCaching,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "mongodb"],
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
};

export default withPWA(nextConfig);
