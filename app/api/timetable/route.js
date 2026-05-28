import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { userId: user.id },
      include: {
        subject: true
      }
    });
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timetable: ' + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subjectName, day, time } = body;

    if (!subjectName || !day || !time) {
      return NextResponse.json({ error: 'Missing slot parameters' }, { status: 400 });
    }

    // Find the subject owned by THIS user
    const subject = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: subjectName
      }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject could not be found' }, { status: 404 });
    }

    const newSlot = await prisma.timetableSlot.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        day,
        time
      },
      include: {
        subject: true
      }
    });

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add timetable slot: ' + error.message }, { status: 500 });
  }
}
