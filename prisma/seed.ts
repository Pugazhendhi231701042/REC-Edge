import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Regulation 26 database with MasterAdmin, Dean, Departments, and User Codes...');

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
    await prisma.sDGGoal.upsert({
      where: { sdgNumber: sdg.number },
      update: { name: sdg.name },
      create: { sdgNumber: sdg.number, name: sdg.name, active: true },
    });
  }

  // 2. Academic Years
  const ay2026 = await prisma.academicYear.upsert({
    where: { year: '2026–2027' },
    update: {},
    create: {
      year: '2026–2027',
      active: true,
    },
  });

  // 3. Regulations
  const reg26 = await prisma.regulation.upsert({
    where: { code: '26' },
    update: { active: true },
    create: {
      code: '26',
      name: 'Regulation 26',
      displayName: 'Regulation 26 (2026)',
      active: true,
    },
  });

  await prisma.regulation.upsert({
    where: { code: '23' },
    update: {},
    create: {
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
    const created = await prisma.subjectType.upsert({
      where: { id: `st-${st.code}` },
      update: { name: st.name, code: st.code, templateType: st.templateType },
      create: {
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
    { code: 'PE', name: 'Professional Elective', description: 'Elective discipline subjects' },
    { code: 'MC', name: 'Mandatory Course', description: 'Non-credit mandatory courses' },
    { code: 'OE', name: 'Open Elective', description: 'Interdisciplinary courses' },
    { code: 'EEC', name: 'Employability Enhancement Courses', description: 'Skill and project courses' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.subjectCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description },
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        active: true,
      },
    });
    categoriesMap[cat.code] = created.id;
  }

  // 6. Users: MasterAdmin & SuperAdmin (Dean) — Unmapped to any specific department (departmentId = null)
  const masterAdmin = await prisma.user.upsert({
    where: { email: '231701042@rajalakshmi.edu.in' },
    update: { password: defaultPasswordHash, userCode: 'ADM01', departmentId: null, role: 'MASTERADMIN', name: 'System MasterAdmin' },
    create: {
      userCode: 'ADM01',
      email: '231701042@rajalakshmi.edu.in',
      password: defaultPasswordHash,
      name: 'System MasterAdmin',
      role: 'MASTERADMIN',
      departmentId: null,
      active: true,
    },
  });

  const dean = await prisma.user.upsert({
    where: { email: 'dean@rajalakshmi.edu.in' },
    update: { password: defaultPasswordHash, userCode: 'DEAN01', departmentId: null },
    create: {
      userCode: 'DEAN01',
      email: 'dean@rajalakshmi.edu.in',
      password: defaultPasswordHash,
      name: 'Dr. Dean Academic Affairs',
      role: 'SUPERADMIN',
      departmentId: null,
      active: true,
    },
  });

  // 7. Departments & HoDs & Faculty
  const depts = [
    {
      type: 'B.E.',
      name: 'Computer Science and Engineering',
      short: 'CSE',
      code: 'CS',
      semesters: 8,
      hodEmail: 'hod.cse@rajalakshmi.edu.in',
      hodName: 'Dr. HoD CSE',
      hodCode: 'CS101',
      faculty: [
        { email: 'faculty1.cse@rajalakshmi.edu.in', name: 'Prof. Alan Turing', code: 'CS102' },
        { email: 'faculty2.cse@rajalakshmi.edu.in', name: 'Prof. Grace Hopper', code: 'CS103' },
        { email: 'faculty3.cse@rajalakshmi.edu.in', name: 'Prof. Donald Knuth', code: 'CS104' },
      ],
    },
    {
      type: 'B.E.',
      name: 'Computer Science and Design',
      short: 'CSD',
      code: 'CD',
      semesters: 8,
      hodEmail: 'hod.csd@rajalakshmi.edu.in',
      hodName: 'Dr. HoD CSD',
      hodCode: 'CD101',
      faculty: [
        { email: 'faculty1.csd@rajalakshmi.edu.in', name: 'Prof. Don Norman', code: 'CD102' },
        { email: 'faculty2.csd@rajalakshmi.edu.in', name: 'Prof. John Maeda', code: 'CD103' },
      ],
    },
    {
      type: 'B.Tech.',
      name: 'Computer Science and Business Systems',
      short: 'CSBS',
      code: 'CB',
      semesters: 8,
      hodEmail: 'hod.csbs@rajalakshmi.edu.in',
      hodName: 'Dr. HoD CSBS',
      hodCode: 'CB101',
      faculty: [
        { email: 'faculty1.csbs@rajalakshmi.edu.in', name: 'Prof. Michael Porter', code: 'CB102' },
      ],
    },
  ];

  const createdDepts: Record<string, any> = {};
  const facultyUsers: Record<string, any[]> = {};

  for (const d of depts) {
    const hodUser = await prisma.user.upsert({
      where: { email: d.hodEmail },
      update: { password: defaultPasswordHash, userCode: d.hodCode },
      create: {
        userCode: d.hodCode,
        email: d.hodEmail,
        password: defaultPasswordHash,
        name: d.hodName,
        role: 'HOD',
        active: true,
      },
    });

    const dept = await prisma.department.upsert({
      where: { departmentCode: d.code },
      update: {
        programmeType: d.type,
        programmeName: d.name,
        shortName: d.short,
        semesters: d.semesters,
        hodId: hodUser.id,
      },
      create: {
        programmeType: d.type,
        programmeName: d.name,
        shortName: d.short,
        departmentCode: d.code,
        semesters: d.semesters,
        hodId: hodUser.id,
        active: true,
      },
    });

    await prisma.user.update({
      where: { id: hodUser.id },
      data: { departmentId: dept.id },
    });

    createdDepts[d.short] = dept;
    facultyUsers[d.short] = [];

    for (const f of d.faculty) {
      const fac = await prisma.user.upsert({
        where: { email: f.email },
        update: { password: defaultPasswordHash, departmentId: dept.id, userCode: f.code },
        create: {
          userCode: f.code,
          email: f.email,
          password: defaultPasswordHash,
          name: f.name,
          role: 'FACULTY',
          departmentId: dept.id,
          active: true,
        },
      });
      facultyUsers[d.short].push(fac);
    }

    await prisma.pOConfiguration.upsert({
      where: { departmentId_regulationId: { departmentId: dept.id, regulationId: reg26.id } },
      update: { poCount: 12 },
      create: { departmentId: dept.id, regulationId: reg26.id, poCount: 12 },
    });

    await prisma.pSOConfiguration.upsert({
      where: { departmentId_regulationId: { departmentId: dept.id, regulationId: reg26.id } },
      update: { psoCount: 3 },
      create: { departmentId: dept.id, regulationId: reg26.id, psoCount: 3 },
    });
  }

  // 8. Academic Stage: Curriculum & Syllabus Formation
  await prisma.academicStage.upsert({
    where: { id: 'stage-curriculum-formation' },
    update: {
      status: 'ACTIVE',
      startDate: new Date('2026-08-15T00:00:00Z'),
      deadline: new Date('2026-09-30T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-08-15T09:00:00Z'),
    },
    create: {
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

  // 9. Sample Subject in CSE with SDG Mappings
  const cseDept = createdDepts['CSE'];
  const alanTuring = facultyUsers['CSE'][0];

  const subj1 = await prisma.subject.upsert({
    where: {
      departmentId_regulationId_semester_subjectTypeId_subjectCode: {
        departmentId: cseDept.id,
        regulationId: reg26.id,
        semester: 4,
        subjectTypeId: subjectTypesMap['Theory'],
        subjectCode: 'CS26411',
      },
    },
    update: {},
    create: {
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
      assignedFacultyId: alanTuring.id,
      syllabusStatus: 'APPROVED',
      createdById: masterAdmin.id,
    },
  });

  const syllabus1 = await prisma.syllabusSubmission.upsert({
    where: { subjectId: subj1.id },
    update: {},
    create: {
      subjectId: subj1.id,
      facultyId: alanTuring.id,
      unitContactHours: 9,
      theoryContactHours: 45,
      totalContactHours: 45,
      approvedAt: new Date('2026-08-18T14:30:00Z'),
      approvedById: cseDept.hodId,
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

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
