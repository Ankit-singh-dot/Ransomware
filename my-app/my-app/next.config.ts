import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark dockerode and its dependencies as server-external
  // (they use native Node.js modules incompatible with Turbopack bundling)
  serverExternalPackages: ["dockerode", "docker-modem", "ssh2"],
};

export default nextConfig;
