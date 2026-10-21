const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  // Compose provides the Nginx service hostname; host-run CRA uses its port 80.
  const target = process.env.API_PROXY_TARGET || "http://localhost:80";

  app.use(
    ["/api", "/admin", "/django-static", "/assets", "/media"],
    createProxyMiddleware({ target, changeOrigin: true }),
  );
};
