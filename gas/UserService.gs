
const UserService = {
  getProfile: function(userId) {
    const user = SheetRepository.findOne(APP.sheets.USERS, { user_id: userId });
    if (!user) throw { code: 'NOT_FOUND', message: 'User not found' };
    delete user.password_hash;
    return user;
  }
};
