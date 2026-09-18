
const AuthService = {
  login: function(payload) {
    if (!payload.username || !payload.password) {
      throw { code: 'INVALID_REQUEST', message: 'Username and password are required' };
    }

    const user = SheetRepository.findOne(APP.sheets.USERS, {
      username: payload.username
    });

    if (!user || String(user.status) !== 'ACTIVE') {
      throw { code: 'AUTH_INVALID', message: 'Invalid credentials' };
    }

    const hashed = sha256_(String(payload.password));
    if (String(user.password_hash) !== hashed) {
      throw { code: 'AUTH_INVALID', message: 'Invalid credentials' };
    }

    const token = Utilities.getUuid();
    const session = {
      user_id: user.user_id,
      role_code: user.role_code,
      full_name: user.full_name,
      region_id: user.region_id || '',
      area_id: user.area_id || ''
    };

    CacheService.getScriptCache().put('SESSION:' + token, JSON.stringify(session), 21600);

    const role = SheetRepository.findOne(APP.sheets.ROLES, { role_code: user.role_code });

    return {
      token: token,
      user: session,
      redirect: role ? role.dashboard_route : '/'
    };
  },

  requireSession: function(token) {
    if (!token) throw { code: 'AUTH_INVALID', message: 'Missing session token' };
    const raw = CacheService.getScriptCache().get('SESSION:' + token);
    if (!raw) throw { code: 'AUTH_INVALID', message: 'Session expired' };
    return JSON.parse(raw);
  }
};
