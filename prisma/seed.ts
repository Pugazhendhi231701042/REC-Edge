import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Truncating all existing database tables...');

  // Deleting records in dependent order to respect foreign key constraints
  await prisma.syllabusSDGMapping.deleteMany();
  await prisma.cOPOJustification.deleteMany();
  await prisma.cOPOMapping.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.textbook.deleteMany();
  await prisma.courseOutcome.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.syllabusUnit.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.syllabusSubmission.deleteMany();
  await prisma.departmentCurriculumBundle.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.extensionRequest.deleteMany();
  await prisma.academicStage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pOConfiguration.deleteMany();
  await prisma.pSOConfiguration.deleteMany();
  await prisma.programOutcomeStatement.deleteMany();
  await prisma.programSpecificOutcomeStatement.deleteMany();
  await prisma.programEducationalObjectiveStatement.deleteMany();
  
  // Unlink department references before deleting users and departments
  await prisma.user.updateMany({ data: { departmentId: null } });
  await prisma.department.updateMany({ data: { hodId: null } });

  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.subjectCategory.deleteMany();
  await prisma.subjectType.deleteMany();
  await prisma.regulation.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.sDGGoal.deleteMany();
  await prisma.creditConfig.deleteMany();

  console.log('All tables truncated successfully.');
  console.log('Seeding minimal 4-user database (1 MasterAdmin, 1 SuperAdmin/Dean, 1 HoD, 1 Faculty)...');

  const defaultPasswordHash = await bcrypt.hash('Changeme@123', 10);

  // 1. Seed 17 UN Sustainable Development Goals (SDGs)
  const sdgList = [
    { number: 1, name: 'No Poverty' },
    { number: 2, name: 'Zero Hunger' },
    { number: 3, name: 'Good Health and Well-being' },
    { number: 4, name: 'Quality Education' },
    { number: 5, name: 'Gender Equality' },
    { number: 6, name: 'Clean Water and Sanitation' },
    { number: 7, name: 'Affordable and Clean Energy' },
    { number: 8, name: 'Decent Work and Economic Growth' },
    { number: 9, name: 'Industry, Innovation and Infrastructure' },
    { number: 10, name: 'Reduced Inequality' },
    { number: 11, name: 'Sustainable Cities and Communities' },
    { number: 12, name: 'Responsible Consumption and Production' },
    { number: 13, name: 'Climate Action' },
    { number: 14, name: 'Life Below Water' },
    { number: 15, name: 'Life on Land' },
    { number: 16, name: 'Peace, Justice and Strong Institutions' },
    { number: 17, name: 'Partnerships for the Goals' },
  ];

  for (const sdg of sdgList) {
    await prisma.sDGGoal.create({
      data: { sdgNumber: sdg.number, name: sdg.name, active: true },
    });
  }

  // 2. Academic Year
  const ay2026 = await prisma.academicYear.create({
    data: {
      year: '2026–2027',
      active: true,
    },
  });

  // 3. Regulations
  const reg26 = await prisma.regulation.create({
    data: {
      code: '26',
      name: 'Regulation 26',
      displayName: 'Regulation 26 (2026)',
      active: true,
    },
  });

  await prisma.regulation.create({
    data: {
      code: '23',
      name: 'Regulation 23',
      displayName: 'Regulation 23 (2023)',
      active: false,
    },
  });

  // 4. Subject Types
  const subjectTypesData = [
    { name: 'Theory', code: 1, templateType: 'THEORY' },
    { name: 'Lab', code: 2, templateType: 'LAB' },
    { name: 'Lab-Oriented Theory', code: 3, templateType: 'LAB_ORIENTED_THEORY' },
    { name: 'Project', code: 4, templateType: 'LAB_ORIENTED_THEORY' },
    { name: 'Project-Oriented Theory', code: 5, templateType: 'LAB_ORIENTED_THEORY' },
  ];

  const subjectTypesMap: Record<string, string> = {};
  for (const st of subjectTypesData) {
    const created = await prisma.subjectType.create({
      data: {
        id: `st-${st.code}`,
        name: st.name,
        code: st.code,
        templateType: st.templateType,
        active: true,
      },
    });
    subjectTypesMap[st.name] = created.id;
  }

  // 5. Subject Categories
  const categoriesData = [
    { code: 'PC', name: 'Professional Core', description: 'Core discipline subjects' },
    { code: 'PE', name: 'Professional Elective', description: 'Specialized elective subjects' },
    { code: 'OE', name: 'Open Elective', description: 'Interdisciplinary elective subjects' },
    { code: 'HS', name: 'Humanities & Social Sciences', description: 'Humanities and management' },
    { code: 'BS', name: 'Basic Sciences', description: 'Mathematics, Physics, Chemistry' },
    { code: 'ES', name: 'Engineering Sciences', description: 'General engineering foundation' },
    { code: 'EEC', name: 'Employability Enhancement', description: 'Projects, internships, seminars' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.subjectCategory.create({
      data: { code: cat.code, name: cat.name, description: cat.description, active: true },
    });
    categoriesMap[cat.code] = created.id;
  }

  // 6. Seed the 4 Core System Users:
  // User 1: MasterAdmin
  const masterAdmin = await prisma.user.create({
    data: {
      email: '231701042@rajalakshmi.edu.in',
      userCode: 'ADM01',
      password: defaultPasswordHash,
      name: 'System MasterAdmin',
      role: 'MASTERADMIN',
      active: true,
    },
  });

  // User 2: SuperAdmin (Dean)
  const dean = await prisma.user.create({
    data: {
      email: 'dean@rajalakshmi.edu.in',
      userCode: 'DEAN01',
      password: defaultPasswordHash,
      name: 'Dr. Dean Academic Affairs',
      role: 'SUPERADMIN',
      active: true,
    },
  });

  // User 3: Admin / HoD CSE
  const hodUser = await prisma.user.create({
    data: {
      email: 'hod.cse@rajalakshmi.edu.in',
      userCode: 'CS101',
      password: defaultPasswordHash,
      name: 'Dr. HoD CSE',
      role: 'HOD',
      active: true,
    },
  });

  // User 4: Faculty CSE
  const facultyUser = await prisma.user.create({
    data: {
      email: 'alan.turing@rajalakshmi.edu.in',
      userCode: 'CSF01',
      password: defaultPasswordHash,
      name: 'Dr. Alan Turing',
      role: 'FACULTY',
      active: true,
    },
  });

  // 7. Seed 1 Primary Department: Computer Science and Engineering
  const cseDept = await prisma.department.create({
    data: {
      programmeType: 'UG',
      programmeName: 'Computer Science and Engineering',
      shortName: 'CSE',
      departmentCode: '101',
      semesters: 8,
      hodId: hodUser.id,
      active: true,
    },
  });

  // Link HoD and Faculty users to the CSE department
  await prisma.user.update({
    where: { id: hodUser.id },
    data: { departmentId: cseDept.id },
  });

  await prisma.user.update({
    where: { id: facultyUser.id },
    data: { departmentId: cseDept.id },
  });

  // Default PO (12) and PSO (3) configuration for Regulation 26
  await prisma.pOConfiguration.create({
    data: { departmentId: cseDept.id, regulationId: reg26.id, poCount: 12 },
  });

  await prisma.pSOConfiguration.create({
    data: { departmentId: cseDept.id, regulationId: reg26.id, psoCount: 3 },
  });

  // 8. Academic Stages (4 Official Stages)
  // Stage 1: Curriculum and Syllabus Creation
  await prisma.academicStage.create({
    data: {
      id: 'stage-1-creation',
      order: 1,
      name: 'Curriculum and Syllabus Creation',
      description: 'HoD defines POs, PSOs, PEOs, creates subject structures, and assigns faculties.',
      status: 'ACTIVE',
      startDate: new Date('2026-08-15T00:00:00Z'),
      deadline: new Date('2026-09-30T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-08-15T09:00:00Z'),
    },
  });

  // Stage 2: Curriculum and Syllabus Formation
  await prisma.academicStage.create({
    data: {
      id: 'stage-2-formation',
      order: 2,
      name: 'Curriculum and Syllabus Formation',
      description: 'Faculties prepare syllabi, HoD reviews & approves, and Dean approves merged Department Curriculum Bundle.',
      status: 'INACTIVE',
      startDate: new Date('2026-09-01T00:00:00Z'),
      deadline: new Date('2026-10-15T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-09-01T09:00:00Z'),
    },
  });

  // Stage 3: Departmental Advisory Committee (DAC) Meeting
  await prisma.academicStage.create({
    data: {
      id: 'stage-3-dac-meeting',
      order: 3,
      name: 'Departmental Advisory Committee (DAC) Meeting',
      description: 'Department Academic Advisory Committee review, feedback, and recommendation meeting.',
      status: 'INACTIVE',
      startDate: new Date('2026-10-16T00:00:00Z'),
      deadline: new Date('2026-10-31T23:59:59Z'),
    },
  });

  // Stage 4: Board of Studies (BoS) Meeting
  await prisma.academicStage.create({
    data: {
      id: 'stage-4-bos-meeting',
      order: 4,
      name: 'Board of Studies (BoS) Meeting',
      description: 'Board of Studies formal presentation and final institutional approval of curriculum & syllabus.',
      status: 'INACTIVE',
      startDate: new Date('2026-11-01T00:00:00Z'),
      deadline: new Date('2026-11-15T23:59:59Z'),
    },
  });

  console.log('Successfully truncated all tables and seeded minimal 4-user database!');
  console.log('MasterAdmin: 231701042@rajalakshmi.edu.in (ADM01)');
  console.log('SuperAdmin:  dean@rajalakshmi.edu.in (DEAN01)');
  console.log('HoD Admin:   hod.cse@rajalakshmi.edu.in (CS101)');
  console.log('Faculty:     alan.turing@rajalakshmi.edu.in (CSF01)');
}

main()
  .catch((e) => {
    console.error('Error during database truncation and seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
