import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
	transpilePackages: ["@agentmon/shared"],
};

export default withSentryConfig(nextConfig, {
	org: "agentmon",
	project: "agentmon-web",
	silent: !process.env.CI,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	authToken: process.env.SENTRY_AUTH_TOKEN,
});
