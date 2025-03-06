import type { NextConfig } from "next";

const nextConfig:NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STABILITY_API_KEY: process.env.STABILITY_API_KEY,
  },
};

export default nextConfig;
