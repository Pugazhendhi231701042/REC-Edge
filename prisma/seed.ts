import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Truncating all existing database tables...');

  // Deleting records in dependent order to respect foreign key constraints
  await prisma.programmeSubjectPlan.deleteMany();
  await prisma.programmeCurriculumSubmission.deleteMany();
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

  // 6. Seed Default MasterAdmin Governance & Credit Configuration
  await prisma.creditConfig.create({
    data: {
      id: 'default-credit-config',
      calculationMethod: 'SUM',
      lWeight: 1.0,
      tWeight: 1.0,
      pWeight: 0.5,
      hoursPerCredit: 15,
      customPrefixes: 'GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT, AE, AT, BM, BT, CH, CV, CR, CD, FT, MT',
      minTotalCredits: 160.0,
      maxTotalCredits: 165.0,
      minSemCredits: 20.0,
      maxSemCredits: 24.0,
      maxLabPerSem: 2,
      maxLabTotal: 8,
      maxLabOrientedPerSem: 2,
      categoryComposition: JSON.stringify({ PC: 45, PE: 15, OE: 6, HS: 7, BS: 15, ES: 9, EEC: 3 }),
    },
  });

  // 7. Seed Core System Administrator Users:
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

  // 8. 18 Engineering Departments List
  const departmentsData = [
    { code: 'AE', shortName: 'AERO', programmeName: 'Aeronautical Engineering' },
    { code: 'AT', shortName: 'AUTO', programmeName: 'Automobile Engineering' },
    { code: 'BM', shortName: 'BME', programmeName: 'Biomedical Engineering' },
    { code: 'BT', shortName: 'BIO', programmeName: 'Biotechnology' },
    { code: 'CH', shortName: 'CHEM', programmeName: 'Chemical Engineering' },
    { code: 'CV', shortName: 'CIVIL', programmeName: 'Civil Engineering' },
    { code: 'CS', shortName: 'CSE', programmeName: 'Computer Science and Engineering' },
    { code: 'CR', shortName: 'CSC', programmeName: 'Computer Science and Engineering (Cyber Security)' },
    { code: 'CB', shortName: 'CSBS', programmeName: 'Computer Science and Business Systems' },
    { code: 'CD', shortName: 'CSD', programmeName: 'Computer Science and Design' },
    { code: 'EE', shortName: 'EEE', programmeName: 'Electrical and Electronics Engineering' },
    { code: 'EC', shortName: 'ECE', programmeName: 'Electronics and Communication Engineering' },
    { code: 'FT', shortName: 'FT', programmeName: 'Food Technology' },
    { code: 'IT', shortName: 'IT', programmeName: 'Information Technology' },
    { code: 'AI', shortName: 'AIDS', programmeName: 'Artificial Intelligence and Data Science' },
    { code: 'AD', shortName: 'AIML', programmeName: 'Artificial Intelligence and Machine Learning' },
    { code: 'ME', shortName: 'MECH', programmeName: 'Mechanical Engineering' },
    { code: 'MT', shortName: 'MCT', programmeName: 'Mechatronics Engineering' },
  ];

  // Standard NBA Program Outcomes (POs)
  const poStatementsList = [
    { poKey: 'PO1', statement: 'Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.' },
    { poKey: 'PO2', statement: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.' },
    { poKey: 'PO3', statement: 'Design/Development of Solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for public health and safety, and cultural, societal, and environmental considerations.' },
    { poKey: 'PO4', statement: 'Conduct Investigations of Complex Problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.' },
    { poKey: 'PO5', statement: 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.' },
    { poKey: 'PO6', statement: 'The Engineer and Society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.' },
    { poKey: 'PO7', statement: 'Environment and Sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.' },
    { poKey: 'PO8', statement: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.' },
    { poKey: 'PO9', statement: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
    { poKey: 'PO10', statement: 'Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.' },
    { poKey: 'PO11', statement: 'Project Management and Finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.' },
    { poKey: 'PO12', statement: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' },
  ];

  // Helper to build 25 subjects for a department
  const buildDepartmentSubjects = (d: typeof departmentsData[0]) => {
    // Custom domain topics based on department
    const isCSE = d.code === 'CS';
    const isECE = d.code === 'EC';
    const isMECH = d.code === 'ME';
    const isEEE = d.code === 'EE';
    const isCIVIL = d.code === 'CV';
    const isBIO = d.code === 'BT';
    const isAIDS = d.code === 'AI';

    // 25 Subjects Template per Department across 8 Semesters
    return [
      // Sem 1 (2 subjects)
      { sem: 1, name: `Matrices and Calculus for ${d.shortName}`, code: `${d.code}26101`, type: 'Theory', cat: 'BS', l: 3, t: 1, p: 0, c: 4.0 },
      { sem: 1, name: `Engineering Physics & Computing Laboratory`, code: `${d.code}26111`, type: 'Lab', cat: 'BS', l: 0, t: 0, p: 4, c: 2.0 },

      // Sem 2 (2 subjects)
      { sem: 2, name: `Differential Equations & Transform Techniques`, code: `${d.code}26201`, type: 'Theory', cat: 'BS', l: 3, t: 1, p: 0, c: 4.0 },
      { sem: 2, name: `Engineering Practice & Workshop Laboratory`, code: `${d.code}26211`, type: 'Lab', cat: 'ES', l: 0, t: 0, p: 4, c: 2.0 },

      // Sem 3 (4 subjects)
      {
        sem: 3,
        name: isCSE ? 'Data Structures' : isECE ? 'Electronic Circuits & Analysis' : isMECH ? 'Thermodynamics & Thermal Engineering' : isCIVIL ? 'Mechanics of Solids' : `Foundations of ${d.programmeName}`,
        code: `${d.code}26301`,
        type: 'Theory',
        cat: 'PC',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 3,
        name: isCSE ? 'Object Oriented Programming Paradigms' : isECE ? 'Digital Logic and Microprocessors' : isMECH ? 'Fluid Mechanics & Machinery' : `Core Principles of ${d.shortName} Modeling`,
        code: `${d.code}26302`,
        type: 'Theory',
        cat: 'PC',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 3,
        name: isCSE ? 'Data Structures and Algorithms Laboratory' : isECE ? 'Electronic Circuits Laboratory' : isMECH ? 'Thermal Engineering Laboratory' : `${d.shortName} Core Laboratory I`,
        code: `${d.code}26311`,
        type: 'Lab',
        cat: 'PC',
        l: 0, t: 0, p: 4, c: 2.0,
      },
      {
        sem: 3,
        name: isCSE ? 'Object Oriented Programming Laboratory' : isECE ? 'Digital System Design Laboratory' : `Programming & Numerical Simulation Laboratory`,
        code: `${d.code}26312`,
        type: 'Lab',
        cat: 'ES',
        l: 0, t: 0, p: 4, c: 2.0,
      },

      // Sem 4 (4 subjects)
      {
        sem: 4,
        name: isCSE ? 'Database Management Systems' : isECE ? 'Signals and Systems' : isMECH ? 'Manufacturing Processes' : `Advanced ${d.programmeName} Theory`,
        code: `${d.code}26401`,
        type: 'Theory',
        cat: 'PC',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 4,
        name: isCSE ? 'Operating Systems' : isECE ? 'Linear Integrated Circuits' : isMECH ? 'Kinematics of Machinery' : `Probability, Statistics and Stochastic Analytics`,
        code: `${d.code}26402`,
        type: 'Theory',
        cat: 'BS',
        l: 3, t: 1, p: 0, c: 4.0,
      },
      {
        sem: 4,
        name: isCSE ? 'Design and Analysis of Algorithms' : isECE ? 'Analog and Digital Communication' : isMECH ? 'Applied Machine Design' : `Applied ${d.shortName} Design and Analysis`,
        code: `${d.code}26421`,
        type: 'Lab-Oriented Theory',
        cat: 'PC',
        l: 3, t: 0, p: 2, c: 4.0,
      },
      {
        sem: 4,
        name: isCSE ? 'Database Management Systems Laboratory' : isECE ? 'Linear Integrated Circuits Laboratory' : isMECH ? 'Manufacturing Technology Laboratory' : `${d.shortName} Experimental Systems Laboratory`,
        code: `${d.code}26411`,
        type: 'Lab',
        cat: 'PC',
        l: 0, t: 0, p: 4, c: 2.0,
      },

      // Sem 5 (4 subjects)
      {
        sem: 5,
        name: isCSE ? 'Computer Networks' : isECE ? 'Digital Signal Processing' : isMECH ? 'Design of Machine Elements' : `Control Systems and Instrumentation`,
        code: `${d.code}26501`,
        type: 'Theory',
        cat: 'PC',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 5,
        name: isCSE ? 'Web Application Development' : isECE ? 'Embedded Systems and Microcontrollers' : isMECH ? 'CAD/CAM and Finite Element Analysis' : `Computational ${d.shortName} Software Engineering`,
        code: `${d.code}26521`,
        type: 'Lab-Oriented Theory',
        cat: 'PC',
        l: 3, t: 0, p: 2, c: 4.0,
      },
      {
        sem: 5,
        name: isCSE ? 'Computer Networks Laboratory' : isECE ? 'Digital Signal Processing Laboratory' : isMECH ? 'CAD/CAM Simulation Laboratory' : `Advanced ${d.shortName} Domain Laboratory`,
        code: `${d.code}26511`,
        type: 'Lab',
        cat: 'PC',
        l: 0, t: 0, p: 4, c: 2.0,
      },
      {
        sem: 5,
        name: `Mini Project / Societally Relevant Project`,
        code: `${d.code}26531`,
        type: 'Project',
        cat: 'EEC',
        l: 0, t: 0, p: 4, c: 2.0,
      },

      // Sem 6 (3 subjects)
      {
        sem: 6,
        name: isCSE ? 'Artificial Intelligence and Machine Learning' : isECE ? 'VLSI Design and Verification' : isMECH ? 'Heat and Mass Transfer' : `Artificial Intelligence & Automation in ${d.shortName}`,
        code: `${d.code}26621`,
        type: 'Lab-Oriented Theory',
        cat: 'PC',
        l: 3, t: 0, p: 2, c: 4.0,
      },
      {
        sem: 6,
        name: isCSE ? 'Distributed Systems and Blockchain' : isECE ? 'Wireless and Cellular Networks' : `${d.shortName} Professional Elective I`,
        code: `${d.code}26E01`,
        type: 'Theory',
        cat: 'PE',
        vertical: 'Vertical A - Advanced Domain Systems',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 6,
        name: `Open Elective I - Interdisciplinary Technology & Innovation`,
        code: `${d.code}26O01`,
        type: 'Theory',
        cat: 'OE',
        l: 3, t: 0, p: 0, c: 3.0,
      },

      // Sem 7 (3 subjects)
      {
        sem: 7,
        name: isCSE ? 'Cloud Computing and Virtualization' : isECE ? 'Microwave and Optical Communication' : isMECH ? 'Robotics and Industrial Automation' : `Smart Systems & IoT Integration in ${d.shortName}`,
        code: `${d.code}26721`,
        type: 'Lab-Oriented Theory',
        cat: 'PC',
        l: 3, t: 0, p: 2, c: 4.0,
      },
      {
        sem: 7,
        name: isCSE ? 'Natural Language Processing' : isECE ? 'Deep Learning for Computer Vision' : `${d.shortName} Professional Elective II`,
        code: `${d.code}26E02`,
        type: 'Theory',
        cat: 'PE',
        vertical: 'Vertical B - Specialized Technologies',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 7,
        name: `Design Project / Phase I`,
        code: `${d.code}26731`,
        type: 'Project',
        cat: 'EEC',
        l: 0, t: 0, p: 6, c: 3.0,
      },

      // Sem 8 (3 subjects)
      {
        sem: 8,
        name: isCSE ? 'Information Security and Cryptography' : isECE ? 'Satellite and Space Communication' : `${d.shortName} Professional Elective III`,
        code: `${d.code}26E03`,
        type: 'Theory',
        cat: 'PE',
        vertical: 'Vertical C - Future Emerging Paradigms',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 8,
        name: `Open Elective II - Sustainable Industrial Systems`,
        code: `${d.code}26O02`,
        type: 'Theory',
        cat: 'OE',
        l: 3, t: 0, p: 0, c: 3.0,
      },
      {
        sem: 8,
        name: `Capstone Project Work / Phase II`,
        code: `${d.code}26831`,
        type: 'Project',
        cat: 'EEC',
        l: 0, t: 0, p: 12, c: 6.0,
      },
    ];
  };

  console.log('Seeding 18 Departments, HoDs, Faculty, and 25 Approved Subjects per department...');

  for (const d of departmentsData) {
    const hodEmail = `hod.${d.shortName.toLowerCase()}@rajalakshmi.edu.in`;
    const facultyEmail = `faculty.${d.shortName.toLowerCase()}@rajalakshmi.edu.in`;

    // 1. Create HoD User
    const hodUser = await prisma.user.create({
      data: {
        email: hodEmail,
        userCode: `${d.code}101`,
        password: defaultPasswordHash,
        name: `Dr. HoD ${d.shortName}`,
        role: 'HOD',
        active: true,
      },
    });

    // 2. Create Faculty User
    const facultyUser = await prisma.user.create({
      data: {
        email: facultyEmail,
        userCode: `${d.code}F01`,
        password: defaultPasswordHash,
        name: `Prof. Faculty ${d.shortName}`,
        role: 'FACULTY',
        active: true,
      },
    });

    // 3. Create Department
    const dept = await prisma.department.create({
      data: {
        programmeType: 'UG',
        programmeName: d.programmeName,
        shortName: d.shortName,
        departmentCode: d.code,
        semesters: 8,
        hodId: hodUser.id,
        active: true,
      },
    });

    // 4. Link HoD and Faculty to Department
    await prisma.user.update({
      where: { id: hodUser.id },
      data: { departmentId: dept.id },
    });

    await prisma.user.update({
      where: { id: facultyUser.id },
      data: { departmentId: dept.id },
    });

    // 5. PO & PSO Configuration (Locked by default)
    await prisma.pOConfiguration.create({
      data: {
        departmentId: dept.id,
        regulationId: reg26.id,
        poCount: 12,
        isLocked: true,
        lockedAt: new Date('2026-08-20T09:00:00Z'),
      },
    });

    await prisma.pSOConfiguration.create({
      data: {
        departmentId: dept.id,
        regulationId: reg26.id,
        psoCount: 3,
        isLocked: true,
        lockedAt: new Date('2026-08-20T09:00:00Z'),
      },
    });

    // 6. PO Statements (12 NBA POs)
    for (const item of poStatementsList) {
      await prisma.programOutcomeStatement.create({
        data: {
          departmentId: dept.id,
          regulationId: reg26.id,
          poKey: item.poKey,
          statement: item.statement,
        },
      });
    }

    // 7. PSO Statements (3 tailored PSOs)
    const psoStatements = [
      { psoKey: 'PSO1', statement: `Professional Engineering: Analyze, design, and implement scalable technical solutions in ${d.programmeName}.` },
      { psoKey: 'PSO2', statement: `Modern Toolchains & Analysis: Apply state-of-the-art computational methods, simulation platforms, and emerging domain technologies.` },
      { psoKey: 'PSO3', statement: `Industrial Innovation & Research: Formulate sustainable engineering designs, ethical practices, and multidisciplinary projects.` },
    ];

    for (const item of psoStatements) {
      await prisma.programSpecificOutcomeStatement.create({
        data: {
          departmentId: dept.id,
          regulationId: reg26.id,
          psoKey: item.psoKey,
          statement: item.statement,
        },
      });
    }

    // 8. Approved Department Curriculum Bundle
    await prisma.departmentCurriculumBundle.create({
      data: {
        departmentId: dept.id,
        regulationId: reg26.id,
        academicYearId: ay2026.id,
        status: 'APPROVED',
        submittedById: hodUser.id,
        submittedAt: new Date('2026-08-25T10:00:00Z'),
        approvedById: dean.id,
        approvedAt: new Date('2026-08-29T16:00:00Z'),
      },
    });

    // 9. Seed 25 Approved Subjects with complete syllabi
    const subjectsToCreate = buildDepartmentSubjects(d);

    for (const subjData of subjectsToCreate) {
      const subjectTypeId = subjectTypesMap[subjData.type] || subjectTypesMap['Theory'];
      const subjectCategoryId = categoriesMap[subjData.cat] || categoriesMap['PC'];

      const isLabOnly = subjData.type === 'Lab';
      const isProject = subjData.type === 'Project';
      const isLot = subjData.type === 'Lab-Oriented Theory';

      const unitHours = 9;
      const theoryContactHours = isLabOnly || isProject ? 0 : 5 * unitHours;
      const labContactHours = isLabOnly ? subjData.p * 15 : isLot ? 30 : 0;
      const totalContactHours = (subjData.l + subjData.t + subjData.p) * 15;

      // Nested subject and syllabus submission creation for optimal speed
      await prisma.subject.create({
        data: {
          departmentId: dept.id,
          regulationId: reg26.id,
          academicYearId: ay2026.id,
          semester: subjData.sem,
          vertical: (subjData as any).vertical || null,
          subjectTypeId,
          subjectCategoryId,
          subjectName: subjData.name,
          subjectCode: subjData.code,
          lecture: subjData.l,
          tutorial: subjData.t,
          practical: subjData.p,
          credits: subjData.c,
          status: 'ASSIGNED',
          assignedFacultyId: facultyUser.id,
          assignedAt: new Date('2026-08-20T10:00:00Z'),
          createdById: hodUser.id,
          syllabusStatus: 'APPROVED',
          finalizedAt: new Date('2026-08-25T12:00:00Z'),
          submission: {
            create: {
              facultyId: facultyUser.id,
              version: 1,
              unitContactHours: isLabOnly || isProject ? null : unitHours,
              theoryContactHours,
              labContactHours,
              totalContactHours,
              approvedById: dean.id,
              approvedAt: new Date('2026-08-28T14:30:00Z'),
              objectives: {
                create: [1, 2, 3, 4, 5].map((i) => ({
                  order: i,
                  description: `Understand and apply foundational principles and engineering methodologies of ${subjData.name} (Objective ${i}).`,
                })),
              },
              ...(!isLabOnly && !isProject
                ? {
                    syllabusUnits: {
                      create: [
                        { unitNumber: 1, unitName: 'Foundational Principles and Concepts', content: `Fundamental theories, laws, and mathematical formulation of ${subjData.name}.` },
                        { unitNumber: 2, unitName: 'Core Modeling and Design Architectures', content: `Structural breakdown, analytical modeling, and process frameworks.` },
                        { unitNumber: 3, unitName: 'System Implementations and Algorithms', content: `Computational tools, algorithms, and practical engineering implementations.` },
                        { unitNumber: 4, unitName: 'Verification, Testing and Analysis', content: `Performance benchmarks, validation strategies, and case study evaluations.` },
                        { unitNumber: 5, unitName: 'Industrial Applications and Emerging Standards', content: `State-of-the-art developments, environmental impact, and industrial solutions.` },
                      ],
                    },
                  }
                : {}),
              ...(isLabOnly || isLot
                ? {
                    experiments: {
                      create: Array.from({ length: isLabOnly ? 8 : 4 }, (_, idx) => ({
                        experimentNumber: idx + 1,
                        title: `Practical Experiment ${idx + 1}: Hands-on verification and testing of ${subjData.name} module ${idx + 1}.`,
                      })),
                    },
                  }
                : {}),
              courseOutcomes: {
                create: [
                  { coNumber: 1, cognitiveLevel: 'K2', description: `Explain the fundamental concepts and theoretical frameworks of ${subjData.name}.` },
                  { coNumber: 2, cognitiveLevel: 'K3', description: `Apply appropriate techniques to solve complex problems in ${subjData.name}.` },
                  { coNumber: 3, cognitiveLevel: 'K3', description: `Analyze experimental data and design models relevant to ${subjData.name}.` },
                  { coNumber: 4, cognitiveLevel: 'K4', description: `Formulate, optimize and evaluate engineering solutions in ${subjData.name}.` },
                  { coNumber: 5, cognitiveLevel: 'K5', description: `Synthesize comprehensive projects complying with modern industrial standards.` },
                ],
              },
              textbooks: {
                create: [
                  { order: 1, title: `Principles of ${subjData.name}`, authors: 'J. L. Hennessy and D. A. Patterson', edition: '5th Edition', publisher: 'Pearson Education', year: '2022' },
                  { order: 2, title: `Modern Engineering Foundations of ${subjData.name}`, authors: 'R. S. Pressman and B. R. Maxim', edition: '8th Edition', publisher: 'McGraw-Hill', year: '2023' },
                ],
              },
              references: {
                create: [
                  { order: 1, title: `IEEE Standards and Benchmarks for ${subjData.name}`, authors: 'IEEE Technical Taskforce', publisher: 'IEEE Press', year: '2024' },
                  { order: 2, title: `National Academy Guidelines in ${subjData.name}`, authors: 'Engineering Education Council', publisher: 'Technical Publications', year: '2024' },
                ],
              },
              coPoMappings: {
                create: [
                  { coNumber: 1, poKey: 'PO1', correlation: 3 },
                  { coNumber: 2, poKey: 'PO2', correlation: 3 },
                  { coNumber: 3, poKey: 'PO3', correlation: 3 },
                  { coNumber: 4, poKey: 'PO5', correlation: 2 },
                  { coNumber: 5, poKey: 'PO12', correlation: 3 },
                ],
              },
              sdgMappings: {
                create: [
                  { coNumber: 1, sdgNumber: 4, topic: `${subjData.name} Foundational Curriculum & Quality Education` },
                  { coNumber: 3, sdgNumber: 9, topic: `${subjData.name} Industrial Innovation & Technological Infrastructure` },
                ],
              },
            },
          },
        },
      });
    }

    console.log(`✓ Seeded ${d.shortName} (${d.code}): HoD ${hodEmail}, Faculty ${facultyEmail}, 25 Approved Subjects.`);
  }

  // 10. Academic Stages (4 Official Stages)
  await prisma.academicStage.create({
    data: {
      id: 'stage-1-creation',
      order: 1,
      name: 'Curriculum and Syllabus Creation',
      description: 'HoD defines POs, PSOs, PEOs, creates subject structures, and assigns faculties.',
      status: 'COMPLETED',
      startDate: new Date('2026-08-15T00:00:00Z'),
      deadline: new Date('2026-08-31T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-08-15T09:00:00Z'),
    },
  });

  await prisma.academicStage.create({
    data: {
      id: 'stage-2-formation',
      order: 2,
      name: 'Curriculum and Syllabus Formation',
      description: 'Faculties prepare syllabi, HoD reviews & approves, and Dean approves merged Department Curriculum Bundle.',
      status: 'ACTIVE',
      startDate: new Date('2026-09-01T00:00:00Z'),
      deadline: new Date('2026-10-15T23:59:59Z'),
      initiatedById: dean.id,
      initiatedAt: new Date('2026-09-01T09:00:00Z'),
    },
  });

  await prisma.academicStage.create({
    data: {
      id: 'stage-3-dac-meeting',
      order: 3,
      name: 'Departmental Advisory Committee (DAC) Meeting',
      description: 'Department Academic Advisory Committee review, feedback, and recommendation meeting.',
      status: 'INACTIVE',
      startDate: new Date('2026-10-16T00:00:00Z'),
      deadline: new Date('2026-10-31T23:59:59Z'),
      venue: 'Main Boardroom / Conference Hall A',
    },
  });

  await prisma.academicStage.create({
    data: {
      id: 'stage-4-bos-meeting',
      order: 4,
      name: 'Board of Studies (BoS) Meeting',
      description: 'Board of Studies formal presentation and final institutional approval of curriculum & syllabus.',
      status: 'INACTIVE',
      startDate: new Date('2026-11-01T00:00:00Z'),
      deadline: new Date('2026-11-15T23:59:59Z'),
      venue: 'Council Chamber / Auditorium',
    },
  });

  console.log('\n================================================================');
  console.log('Successfully seeded complete institutional dataset!');
  console.log('18 Departments, 18 HoDs, 18 Faculty, 450 Approved Subjects, 4 Stages');
  console.log('MasterAdmin: 231701042@rajalakshmi.edu.in (ADM01)');
  console.log('SuperAdmin:  dean@rajalakshmi.edu.in (DEAN01)');
  console.log('HoD Sample:  hod.cse@rajalakshmi.edu.in (CS101)');
  console.log('Faculty:     faculty.cse@rajalakshmi.edu.in (CSF01)');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Error during database truncation and seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
