/**
 * Dropbox token auto-refresh helper.
 * Uses refresh tokens to get fresh access tokens automatically.
 */
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

async function refreshToken(refreshToken, appKey, appSecret) {
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${appKey}&client_secret=${appSecret}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function getAppDropbox() {
  const token = await refreshToken(
    process.env.DROPBOX_REFRESH_TOKEN,
    process.env.DROPBOX_APP_KEY,
    process.env.DROPBOX_APP_SECRET,
  );
  return new Dropbox({ accessToken: token });
}

async function getFullDropbox() {
  const token = await refreshToken(
    process.env.FULL_DROPBOX_REFRESH_TOKEN,
    process.env.FULL_DROPBOX_APP_KEY,
    process.env.FULL_DROPBOX_APP_SECRET,
  );
  return new Dropbox({
    accessToken: token,
    pathRoot: JSON.stringify({ '.tag': 'root', root: '2635132419' }),
  });
}

module.exports = { refreshToken, getAppDropbox, getFullDropbox };
