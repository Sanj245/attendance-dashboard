import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const trimmedUser = username.trim();

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { username: trimmedUser }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify hashed password
    const isCorrect = verifyPassword(password, user.password);
    if (!isCorrect) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Sign session JWT
    const token = signToken(user);

    // Serialize HTTP-only session cookie
    const cookie = serialize('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    const response = NextResponse.json({
      message: 'Login successful!',
      user: { id: user.id, username: user.username }
    });

    response.headers.append('Set-Cookie', cookie);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed: ' + error.message }, { status: 500 });
  }
}
