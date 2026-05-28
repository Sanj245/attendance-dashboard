import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      include: {
        slots: true,
        logs: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subjects: ' + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, present, absent, target } = body;

    if (!name) {
      return NextResponse.json({ error: 'Subject Name is required' }, { status: 400 });
    }

    // Check duplicate specifically for this user!
    const existing = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: name.trim()
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Subject with this name already exists' }, { status: 400 });
    }

    const newSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: name.trim(),
        present: parseInt(present) || 0,
        absent: parseInt(absent) || 0,
        target: parseInt(target) || 75
      }
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subject: ' + error.message }, { status: 500 });
  }
}
