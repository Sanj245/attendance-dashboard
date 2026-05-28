import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 1. Fetch the log details with ownership check
    const log = await prisma.attendanceLog.findFirst({
      where: { id, userId: user.id },
      include: { subject: true }
    });

    if (!log) {
      return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    }

    const { subjectId, status } = log;

    // 2. Perform atomic rollback transactions
    await prisma.$transaction([
      prisma.subject.update({
        where: { id: subjectId },
        data: {
          present: status === 'attended' && log.subject.present > 0 ? { decrement: 1 } : undefined,
          absent: status === 'missed' && log.subject.absent > 0 ? { decrement: 1 } : undefined
        }
      }),
      prisma.attendanceLog.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ message: 'Log reverted successfully', id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revert log: ' + error.message }, { status: 500 });
  }
}
