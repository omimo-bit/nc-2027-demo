/**
 * Auth.gs
 * Demo-only login. This is intentionally lightweight (PRD Demo §2 maps
 * Supabase Auth/RLS -> "Lightweight demo login/role"). Do NOT reuse this
 * approach for production — production uses Supabase Auth + RLS + RBAC.
 */

function login(payload) {
  var username = payload && payload.username;
  var password = payload && payload.password;
  if (!username || !password) return fail_('VALIDATION_ERROR', 'Username and password are required.');

  var user = findAllWhere_(SHEETS.USERS, function (u) { return u.username === username; })[0];
  if (!user) return fail_('AUTH_FAILED', 'User not found.');
  if (user.status !== 'ACTIVE') return fail_('AUTH_FAILED', 'User is not active.');
  if (user.password_hash !== demoHash_(password)) return fail_('AUTH_FAILED', 'Invalid credentials.');

  var role = findById_(SHEETS.ROLES, 'role_code', user.role_code);
  writeAudit_(user.user_id, 'LOGIN', 'users', user.user_id, null, null, 'DEMO_APP');

  return ok_({
    user_id: user.user_id,
    full_name: user.full_name,
    role_code: user.role_code,
    dashboard_route: role ? role.dashboard_route : '/',
    permissions: role ? {
      can_field_input: role.can_field_input,
      can_validate: role.can_validate,
      can_analyze: role.can_analyze,
      can_view_executive: role.can_view_executive
    } : {}
  }, 'Login successful');
}
