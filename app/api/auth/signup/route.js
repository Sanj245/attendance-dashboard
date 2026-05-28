import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation checks
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const trimmedUser = username.trim();
    if (trimmedUser.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { username: trimmedUser }
    });

    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Hash password and create user
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: trimmedUser,
        password: passwordHash
      }
    });

    // Create session JWT token
    const token = signToken(user);

    // Serialize HTTP-only secure cookie
    const cookie = serialize('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    const response = NextResponse.json({
      message: 'Signup successful!',
      user: { id: user.id, username: user.username }
    }, { status: 201 });

    response.headers.append('Set-Cookie', cookie);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Signup failed: ' + error.message }, { status: 500 });
  }
}
