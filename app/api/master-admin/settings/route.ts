import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const [activeReg, academicYear, creditConfig, subjectTypes, subjectCategories] = await Promise.all([
    prisma.regulation.findFirst({ where: { active: true } }),
    prisma.academicYear.findFirst({ where: { active: true } }),
    prisma.creditConfig.findFirst(),
    prisma.subjectType.findMany({ orderBy: { code: 'asc' } }),
    prisma.subjectCategory.findMany({ orderBy: { code: 'asc' } }),
  ]);

  return NextResponse.json({
    settings: {
      activeRegulation: activeReg ? activeReg.displayName : 'Regulation 26',
      academicYear: academicYear ? academicYear.year : '2026–2027',
      creditWeights: {
        lWeight: creditConfig?.lWeight ?? 1.0,
        tWeight: creditConfig?.tWeight ?? 1.0,
        pWeight: creditConfig?.pWeight ?? 0.5,
      },
      subjectTypesCount: subjectTypes.length,
      categoriesCount: subjectCategories.length,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { settingKey, settingValue } = await req.json();

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_SYSTEM_SETTING',
    entity: 'SystemSetting',
    details: { key: settingKey, value: settingValue },
  });

  return NextResponse.json({ success: true });
}
