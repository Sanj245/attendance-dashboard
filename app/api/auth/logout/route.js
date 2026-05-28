import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  try {
    // Drop session cookie by setting its maxAge to 0
    const cookie = serialize('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    const response = NextResponse.json({ message: 'Logout successful!' });
    response.headers.append('Set-Cookie', cookie);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed: ' + error.message }, { status: 500 });
  }
}
