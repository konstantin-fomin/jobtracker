const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  /** @type {import('next').NextConfig} */
  const config = {}

  // Opt-in local-only workaround for the Windows dev/build cache collision:
  // when enabled, the production build writes to `.next-build` so it doesn't
  // clobber a running `next dev` on `.next`. Production (Vercel) must NOT set
  // this flag — Next/Vercel expect the default `.next` output directory.
  if (process.env.NEXT_LOCAL_DIST_DIR === '1') {
    config.distDir = phase === PHASE_DEVELOPMENT_SERVER ? '.next' : '.next-build'
  }

  return config
}

module.exports = nextConfig
