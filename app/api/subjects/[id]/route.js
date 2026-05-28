import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, present, absent, target } = body;

    if (!name) {
      return NextResponse.json({ error: 'Subject Name is required' }, { status: 400 });
    }

    // Verify ownership of the subject
    const subject = await prisma.subject.findFirst({
      where: { id, userId: user.id }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Check duplicate name on OTHER subjects owned by this user
    const existing = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Another subject with this name already exists' }, { status: 400 });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: name.trim(),
        present: parseInt(present) || 0,
        absent: parseInt(absent) || 0,
        target: parseInt(target) || 75
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subject: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const subject = await prisma.subject.findFirst({
      where: { id, userId: user.id }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const deleted = await prisma.subject.delete({
      where: { id }
    });

    return NextResponse.json({ message: `Deleted subject ${deleted.name}`, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subject: ' + error.message }, { status: 500 });
  }
}
