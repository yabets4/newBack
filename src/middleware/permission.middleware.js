export default function permission(requiredRoles) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!required.length || roles.includes('super_admin') || roles.some(r => required.includes(r))) {
      return next();
    }
    return forbidden(res, 'Insufficient permissions');
  };
}
