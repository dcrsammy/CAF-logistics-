import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// `npm run build` runs the OpenNext Cloudflare build, which in turn runs the plain Next.js build.
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build",
};
