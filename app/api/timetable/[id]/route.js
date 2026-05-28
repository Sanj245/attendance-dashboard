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

    // Verify ownership
    const slot = await prisma.timetableSlot.findFirst({
      where: { id, userId: user.id }
    });

    if (!slot) {
      return NextResponse.json({ error: 'Timetable slot not found' }, { status: 404 });
    }

    const deleted = await prisma.timetableSlot.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Deleted timetable slot', id: deleted.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete timetable slot: ' + error.message }, { status: 500 });
  }
}
