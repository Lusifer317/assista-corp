const ROLES = Object.freeze(['admin', 'editor', 'sales']);

const PERMISSIONS = Object.freeze({
  VIEW_LEADS: 'leads:read',
  UPDATE_LEADS: 'leads:update',
  ADD_LEAD_NOTES: 'leads:notes',
  VIEW_ANALYTICS: 'analytics:read',
  VIEW_AUDIT: 'audit:read',
  EDIT_CMS: 'cms:write',
  EDIT_SERVICES: 'services:write',
  EDIT_INDUSTRIES: 'industries:write',
  EDIT_SEO: 'seo:write',
  VIEW_SETTINGS: 'settings:read',
  EDIT_SETTINGS: 'settings:write'
});

const ROLE_PERMISSIONS = Object.freeze({
  admin: new Set(Object.values(PERMISSIONS)),
  editor: new Set([
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.ADD_LEAD_NOTES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_AUDIT,
    PERMISSIONS.EDIT_CMS,
    PERMISSIONS.EDIT_SERVICES,
    PERMISSIONS.EDIT_INDUSTRIES,
    PERMISSIONS.EDIT_SEO
  ]),
  sales: new Set([
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.ADD_LEAD_NOTES,
    PERMISSIONS.VIEW_ANALYTICS
  ])
});

function hasRole(role) {
  return ROLES.includes(role);
}

function can(role, permission) {
  return hasRole(role) && ROLE_PERMISSIONS[role].has(permission);
}

function requirePermission(user, permission) {
  return Boolean(user && can(user.role, permission));
}

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasRole, can, requirePermission };