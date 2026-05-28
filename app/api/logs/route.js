import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.attendanceLog.findMany({
      where: { userId: user.id },
      include: {
        subject: true
      },
      orderBy: { timestamp: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs: ' + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subjectName, status } = body; // attended, missed, cancelled

    if (!subjectName || !status) {
      return NextResponse.json({ error: 'Missing log parameters' }, { status: 400 });
    }

    // Find the subject owned by this specific user
    const subject = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: subjectName
      }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found in directory' }, { status: 404 });
    }

    // Execute atomic SQL transaction for atomic increments!
    const [newLog, updatedSubject] = await prisma.$transaction([
      prisma.attendanceLog.create({
        data: {
          userId: user.id,
          subjectId: subject.id,
          status,
          timestamp: new Date()
        },
        include: {
          subject: true
        }
      }),
      prisma.subject.update({
        where: { id: subject.id },
        data: {
          present: status === 'attended' ? { increment: 1 } : undefined,
          absent: status === 'missed' ? { increment: 1 } : undefined
        }
      })
    ]);

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark attendance: ' + error.message }, { status: 500 });
  }
}
