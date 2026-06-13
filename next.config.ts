import type { NextConfig } from "next";

// `/` is handled by app/page.tsx, which routes by session
// (admin -> /admin, employee -> /dashboard, signed-out -> /login).
const nextConfig: NextConfig = {};

export default nextConfig;
