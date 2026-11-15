import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError } from './workspace.mjs';

export function createOwnerAuth(projectRoot) {
  const file = path.join(projectRoot, '.local/admin-auth.json');
  const sessions = new Map();
  const attempts = new Map();
  const duration = 8 * 60 * 60 * 1000;
  const configured = () => fs.existsSync(file);
  const tokenOf = cookie => (cookie ?? '').split(';').map(x => x.trim()).find(x => x.startsWith('teawiki_session='))?.slice('teawiki_session='.length);
  const authenticated = cookie => {
    const token = tokenOf(cookie), expires = sessions.get(token);
    if (!expires || expires < Date.now()) { sessions.delete(token); return false; }
    return true;
  };
  function passwordValue(value) {
    if (typeof value !== 'string' || value.length < 10 || value.length > 128) throw new AppError('管理密碼請使用 10～128 個字元');
    return value;
  }
  function issue() {
    for (const [token, expires] of sessions) if (expires < Date.now()) sessions.delete(token);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + duration);
    return `teawiki_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${duration / 1000}`;
  }
  function setup(password) {
    if (configured()) throw new AppError('管理者密碼已設定，請登入', 409);
    const salt = crypto.randomBytes(24).toString('hex');
    const key = crypto.scryptSync(passwordValue(password), salt, 64).toString('hex');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    try { fs.writeFileSync(file, JSON.stringify({ version: 1, algorithm: 'scrypt', salt, key }, null, 2), { flag: 'wx', mode: 0o600 }); }
    catch (error) { if (error.code === 'EEXIST') throw new AppError('管理者已設定，請登入', 409); throw error; }
    return issue();
  }
  function login(password, address = 'local') {
    if (!configured()) throw new AppError('請先設定管理密碼', 409);
    const bucket = attempts.get(address);
    if (bucket && bucket.until > Date.now() && bucket.count >= 5) throw new AppError('登入嘗試過多，請在 15 分鐘後再試', 429);
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    const validInput = typeof password === 'string' && password.length <= 128;
    const candidate = crypto.scryptSync(validInput ? password : '', stored.salt, 64);
    const expected = Buffer.from(stored.key, 'hex');
    if (!validInput || expected.length !== candidate.length || !crypto.timingSafeEqual(expected, candidate)) {
      const next = !bucket || bucket.until < Date.now() ? { count: 0, until: Date.now() + 15 * 60 * 1000 } : bucket;
      next.count++; attempts.set(address, next);
      throw new AppError('密碼不正確', 401);
    }
    attempts.delete(address);
    return issue();
  }
  function logout(cookie) { sessions.delete(tokenOf(cookie)); return 'teawiki_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'; }
  return { configured, authenticated, setup, login, logout };
}
