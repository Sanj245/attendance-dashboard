import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const defaultSubjects = [
  { name: "Data Structures", present: 22, absent: 4, target: 75 },
  { name: "Operating Systems", present: 18, absent: 6, target: 80 },
  { name: "Database Systems", present: 25, absent: 2, target: 75 },
  { name: "Machine Learning", present: 12, absent: 8, target: 75 }
];

const defaultTimetable = [
  { subject: "Data Structures", day: "Monday", time: "09:00 AM - 10:00 AM" },
  { subject: "Operating Systems", day: "Monday", time: "11:15 AM - 12:15 PM" },
  { subject: "Database Systems", day: "Tuesday", time: "10:00 AM - 11:00 AM" },
  { subject: "Machine Learning", day: "Tuesday", time: "01:30 PM - 02:30 PM" },
  { subject: "Data Structures", day: "Wednesday", time: "09:00 AM - 10:00 AM" },
  { subject: "Operating Systems", day: "Wednesday", time: "11:15 AM - 12:15 PM" },
  { subject: "Database Systems", day: "Thursday", time: "10:00 AM - 11:00 AM" },
  { subject: "Machine Learning", day: "Thursday", time: "01:30 PM - 02:30 PM" },
  { subject: "Data Structures", day: "Friday", time: "09:00 AM - 10:00 AM" },
  { subject: "Database Systems", day: "Friday", time: "11:15 AM - 12:15 PM" }
];

const defaultLogs = [
  { subject: "Data Structures", status: "attended", offsetDays: 3 },
  { subject: "Operating Systems", status: "attended", offsetDays: 3 },
  { subject: "Database Systems", status: "attended", offsetDays: 2 },
  { subject: "Machine Learning", status: "missed", offsetDays: 2 },
  { subject: "Data Structures", status: "attended", offsetDays: 1 }
];

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body; // "wipe" or "seed"

    // 1. Wipe everything owned by THIS user
    await prisma.attendanceLog.deleteMany({ where: { userId: user.id } });
    await prisma.timetableSlot.deleteMany({ where: { userId: user.id } });
    await prisma.subject.deleteMany({ where: { userId: user.id } });

    if (action === 'wipe') {
      return NextResponse.json({ message: 'Database wiped successfully!' });
    }

    // 2. Seed mock records for this user
    const createdSubjects = {};
    for (const sub of defaultSubjects) {
      const dbSub = await prisma.subject.create({
        data: {
          ...sub,
          userId: user.id
        }
      });
      createdSubjects[sub.name] = dbSub;
    }

    // Create Timetable slots
    for (const slot of defaultTimetable) {
      const sub = createdSubjects[slot.subject];
      if (sub) {
        await prisma.timetableSlot.create({
          data: {
            userId: user.id,
            subjectId: sub.id,
            day: slot.day,
            time: slot.time
          }
        });
      }
    }

    // Create logs
    for (const log of defaultLogs) {
      const sub = createdSubjects[log.subject];
      if (sub) {
        const timestamp = new Date(Date.now() - log.offsetDays * 24 * 3600000);
        await prisma.attendanceLog.create({
          data: {
            userId: user.id,
            subjectId: sub.id,
            status: log.status,
            timestamp
          }
        });
      }
    }

    return NextResponse.json({ message: 'Database successfully seeded with default planner details!' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset/seed database: ' + error.message }, { status: 500 });
  }
}
