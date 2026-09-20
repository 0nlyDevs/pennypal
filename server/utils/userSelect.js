export const publicUserSelect = {
  user_id: true,
  email: true,
  username: true,
  firstname: true,
  lastname: true,
  created_at: true,
  token_version: true,
  email_verified_at: true,
  totp_enabled: true,
};

export const toPublicUser = (user) => ({
  user_id: user.user_id,
  email: user.email,
  username: user.username,
  firstname: user.firstname,
  lastname: user.lastname,
  created_at: user.created_at,
  token_version: user.token_version,
  email_verified_at: user.email_verified_at,
  totp_enabled: user.totp_enabled,
});