import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables a self-contained production build for the Docker image.
  output: "standalone",
};

export default nextConfig;
