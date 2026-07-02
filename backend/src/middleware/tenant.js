export function tenantMiddleware(req, res, next) {
  req.tenantId = req.user?.company_id || req.user?.tenantId;
  next();
}
