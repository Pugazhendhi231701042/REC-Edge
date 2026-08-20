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
  await prisma.subject.deleteMany();
  await prisma.extensionRequest.deleteMany();
  await prisma.academicStage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pOConfiguration.deleteMany();
  await prisma.pSOConfiguration.deleteMany();
  
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

  // 8. Academic Stages
  // Stage 1: Curriculum & Syllabus Formation (ACTIVE)
  await prisma.academicStage.create({
    data: {
      id: 'stage-curriculum-formation',
      name: 'Curriculum & Syllabus Formation',
      description: 'Centralized formation and approval of curriculum structure and detailed syllabus under Regulation 26.',
      status: 'ACTIVE',
      startDate: new Date('2026-08-15T00:00:00Z'),
      deadline: new Date('2026-09-30T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-08-15T09:00:00Z'),
    },
  });

  // Stage 2: DAC Meeting (INACTIVE / Not Scheduled)
  await prisma.academicStage.create({
    data: {
      id: 'stage-dac-meeting',
      name: 'DAC Meeting',
      description: 'Department Academic Advisory Committee review and recommendation meeting.',
      status: 'INACTIVE',
      deadline: null,
      venue: null,
    },
  });

  // Stage 3: BoS Meeting (INACTIVE / Not Scheduled)
  await prisma.academicStage.create({
    data: {
      id: 'stage-bos-meeting',
      name: 'BoS Meeting',
      description: 'Board of Studies formal approval of curriculum, course contents, and scheme of evaluation.',
      status: 'INACTIVE',
      deadline: null,
      venue: null,
    },
  });

  // 9. Sample Approved Subject assigned to Dr. Alan Turing
  const subj1 = await prisma.subject.create({
    data: {
      departmentId: cseDept.id,
      regulationId: reg26.id,
      academicYearId: ay2026.id,
      semester: 4,
      subjectTypeId: subjectTypesMap['Theory'],
      subjectCategoryId: categoriesMap['PC'],
      subjectName: 'Data Structures and Algorithms',
      subjectCode: 'CS26411',
      lecture: 3,
      tutorial: 0,
      practical: 0,
      credits: 3.0,
      status: 'ASSIGNED',
      assignedFacultyId: facultyUser.id,
      syllabusStatus: 'APPROVED',
      createdById: masterAdmin.id,
    },
  });

  const syllabus1 = await prisma.syllabusSubmission.create({
    data: {
      subjectId: subj1.id,
      facultyId: facultyUser.id,
      unitContactHours: 9,
      theoryContactHours: 45,
      totalContactHours: 45,
      approvedAt: new Date('2026-08-18T14:30:00Z'),
      approvedById: hodUser.id,
      objectives: {
        create: [
          { order: 1, description: 'To understand linear and non-linear data structures.' },
          { order: 2, description: 'To analyze algorithm complexity and performance.' },
          { order: 3, description: 'To implement graph and tree algorithms efficiently.' },
        ],
      },
      syllabusUnits: {
        create: [
          { unitNumber: 1, unitName: 'Linear Data Structures', content: 'Arrays - Linked Lists - Stacks - Queues and Applications' },
          { unitNumber: 2, unitName: 'Trees & Hierarchical Structures', content: 'Binary Trees - AVL Trees - B-Trees - Heaps' },
          { unitNumber: 3, unitName: 'Graphs & Algorithms', content: 'Representations - BFS - DFS - Shortest Path - MST' },
          { unitNumber: 4, unitName: 'Sorting & Searching', content: 'Bubble - Merge - Quick - Heap sort - Hashing techniques' },
          { unitNumber: 5, unitName: 'Algorithm Analysis & Complexity', content: 'Asymptotic notations - Divide & Conquer - Dynamic Programming' },
        ],
      },
      courseOutcomes: {
        create: [
          { coNumber: 1, description: 'Design and implement linear data structures for real-world scenarios.' },
          { coNumber: 2, description: 'Construct tree data structures and optimize search operations.' },
          { coNumber: 3, description: 'Apply graph traversal algorithms to solve connectivity problems.' },
          { coNumber: 4, description: 'Evaluate time and space complexity of sorting algorithms.' },
          { coNumber: 5, description: 'Select appropriate hashing and algorithmic techniques.' },
        ],
      },
      textbooks: {
        create: [
          { order: 1, title: 'Data Structures and Algorithm Analysis in C++', authors: 'Mark Allen Weiss', edition: '4th Edition', publisher: 'Pearson', year: '2014' },
        ],
      },
      references: {
        create: [
          { order: 1, title: 'Introduction to Algorithms', authors: 'Cormen, Leiserson, Rivest, Stein', edition: '3rd Edition', publisher: 'MIT Press', year: '2009' },
        ],
      },
    },
  });

  // Seed sample SDG mappings
  const sampleSDGMappings = [
    { coNumber: 1, sdgNumber: 4, topic: 'Arrays' },
    { coNumber: 1, sdgNumber: 4, topic: 'Linked Lists' },
    { coNumber: 1, sdgNumber: 9, topic: 'Stacks' },
    { coNumber: 2, sdgNumber: 9, topic: 'Binary Trees' },
    { coNumber: 3, sdgNumber: 11, topic: 'Shortest Path' },
    { coNumber: 4, sdgNumber: 9, topic: 'Quick' },
    { coNumber: 5, sdgNumber: 9, topic: 'Dynamic Programming' },
  ];

  for (const m of sampleSDGMappings) {
    await prisma.syllabusSDGMapping.create({
      data: {
        syllabusId: syllabus1.id,
        coNumber: m.coNumber,
        sdgNumber: m.sdgNumber,
        topic: m.topic,
      },
    });
  }

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
