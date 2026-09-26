const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  app.use(
    ["/api", "/admin", "/django-static", "/assets", "/media"],
    createProxyMiddleware({ target: "http://nginx:80", changeOrigin: true }),
  );
};
