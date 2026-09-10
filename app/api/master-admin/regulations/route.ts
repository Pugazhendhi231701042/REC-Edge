import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const regulations = await prisma.regulation.findMany({
    orderBy: { code: 'desc' },
  });

  const subjectTypes = await prisma.subjectType.findMany({
    orderBy: { code: 'asc' },
  });

  const subjectCategories = await prisma.subjectCategory.findMany({
    orderBy: { code: 'asc' },
  });

  return NextResponse.json({ regulations, subjectTypes, subjectCategories });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const body = await req.json();
  const { action, code, name, displayName, regId, subjectTypeId, typeCode, typeName, catId, catCode, catName, catDescription } = body;

  if (action === 'CREATE_SUBJECT_CATEGORY') {
    if (!catCode || !catName) {
      return NextResponse.json({ error: 'Category Code and Name are required.' }, { status: 400 });
    }

    const cleanCode = catCode.trim().toUpperCase();
    if (cleanCode.length > 2) {
      return NextResponse.json({ error: 'Subject Category Code must be maximum 2 characters (e.g. PC, PE, OE, MC).' }, { status: 400 });
    }

    const createdCat = await prisma.subjectCategory.create({
      data: {
        code: cleanCode,
        name: catName.trim(),
        description: catDescription ? catDescription.trim() : null,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'CREATE_SUBJECT_CATEGORY',
      entity: 'SubjectCategory',
      entityId: createdCat.id,
    });

    return NextResponse.json({ success: true, subjectCategory: createdCat });
  }

  if (action === 'EDIT_SUBJECT_CATEGORY') {
    if (!catId || !catCode || !catName) {
      return NextResponse.json({ error: 'Category ID, Code, and Name are required.' }, { status: 400 });
    }

    const cleanCode = catCode.trim().toUpperCase();
    if (cleanCode.length > 2) {
      return NextResponse.json({ error: 'Subject Category Code must be maximum 2 characters (e.g. PC, PE, OE, MC).' }, { status: 400 });
    }

    const updatedCat = await prisma.subjectCategory.update({
      where: { id: catId },
      data: {
        code: cleanCode,
        name: catName.trim(),
        description: catDescription ? catDescription.trim() : null,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_SUBJECT_CATEGORY',
      entity: 'SubjectCategory',
      entityId: catId,
    });

    return NextResponse.json({ success: true, subjectCategory: updatedCat });
  }

  if (action === 'EDIT_REGULATION') {
    if (!regId || !code || !name) {
      return NextResponse.json({ error: 'Regulation ID, Code, and Name are required.' }, { status: 400 });
    }

    const updatedReg = await prisma.regulation.update({
      where: { id: regId },
      data: {
        code: code.trim(),
        name: name.trim(),
        displayName: displayName ? displayName.trim() : name.trim(),
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_REGULATION',
      entity: 'Regulation',
      entityId: regId,
      details: { code: updatedReg.code, name: updatedReg.name },
    });

    return NextResponse.json({ success: true, regulation: updatedReg });
  }

  if (action === 'DELETE_SUBJECT_CATEGORY') {
    if (!catId) return NextResponse.json({ error: 'Category ID required.' }, { status: 400 });

    const subjectCount = await prisma.subject.count({ where: { subjectCategoryId: catId } });
    if (subjectCount > 0) {
      return NextResponse.json({ error: `Cannot delete category because ${subjectCount} subject(s) are assigned to it.` }, { status: 400 });
    }

    await prisma.subjectCategory.delete({ where: { id: catId } });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'DELETE_SUBJECT_CATEGORY',
      entity: 'SubjectCategory',
      entityId: catId,
    });

    return NextResponse.json({ success: true, message: 'Subject category deleted successfully.' });
  }

  if (action === 'EDIT_SUBJECT_TYPE') {
    if (!subjectTypeId || !typeCode || !typeName) {
      return NextResponse.json({ error: 'Subject Type ID, Code, and Name are required.' }, { status: 400 });
    }

    const updatedType = await prisma.subjectType.update({
      where: { id: subjectTypeId },
      data: {
        code: Number(typeCode),
        name: typeName.trim(),
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_SUBJECT_TYPE_CODE',
      entity: 'SubjectType',
      entityId: subjectTypeId,
      details: { code: updatedType.code, name: updatedType.name },
    });

    return NextResponse.json({ success: true, subjectType: updatedType });
  }

  if (action === 'SET_ACTIVE') {
    if (!regId) return NextResponse.json({ error: 'Regulation ID required.' }, { status: 400 });

    await prisma.regulation.updateMany({ data: { active: false } });
    const updated = await prisma.regulation.update({
      where: { id: regId },
      data: { active: true },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'ACTIVATE_REGULATION',
      entity: 'Regulation',
      entityId: regId,
    });

    return NextResponse.json({ success: true, regulation: updated });
  }

  if (!code || !name) {
    return NextResponse.json({ error: 'Regulation code and name are required.' }, { status: 400 });
  }

  const created = await prisma.regulation.create({
    data: {
      code,
      name,
      displayName: displayName || name,
      active: false,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'CREATE_REGULATION',
    entity: 'Regulation',
    entityId: created.id,
  });

  return NextResponse.json({ success: true, regulation: created });
}

export async function DELETE(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Regulation ID is required.' }, { status: 400 });
  }

  const regulation = await prisma.regulation.findUnique({
    where: { id },
  });

  if (!regulation) {
    return NextResponse.json({ error: 'Regulation not found.' }, { status: 404 });
  }

  if (regulation.active) {
    return NextResponse.json({ error: 'Cannot delete the active regulation. Please set another regulation as active first.' }, { status: 400 });
  }

  const subjectCount = await prisma.subject.count({
    where: { regulationId: id },
  });

  if (subjectCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete regulation '${regulation.displayName}' because ${subjectCount} subject(s) are associated with it.` },
      { status: 400 }
    );
  }

  await prisma.pOConfiguration.deleteMany({ where: { regulationId: id } });
  await prisma.pSOConfiguration.deleteMany({ where: { regulationId: id } });
  await prisma.programOutcomeStatement.deleteMany({ where: { regulationId: id } });
  await prisma.programSpecificOutcomeStatement.deleteMany({ where: { regulationId: id } });
  await prisma.programEducationalObjectiveStatement.deleteMany({ where: { regulationId: id } });

  await prisma.regulation.delete({ where: { id } });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'DELETE_REGULATION',
    entity: 'Regulation',
    entityId: id,
    details: { code: regulation.code, displayName: regulation.displayName },
  });

  return NextResponse.json({ success: true, message: `Regulation '${regulation.displayName}' deleted successfully.` });
}
