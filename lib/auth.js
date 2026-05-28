import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-student-planner-key-2026';
const COOKIE_NAME = 'session_token';

// --- Password Hashing using PBKDF2 ---
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}.${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split('.');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// --- JWT Cookie Session Management ---
export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper to authenticate user from Next.js server Request
export async function getAuthUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const token = cookies[COOKIE_NAME];
    
    if (!token) return null;
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}
