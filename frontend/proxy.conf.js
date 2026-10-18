// Dev-server proxy: forwards the app's /api calls to the NestJS backend, so the
// browser talks to a single origin and no CORS config is needed in development.
// The target differs by environment — localhost when running `ng serve` on the
// host, the compose service name inside Docker — so it is read from an env var.
module.exports = {
  '/api': {
    target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
};
