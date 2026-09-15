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

  const sdgMap: Record<number, string> = {};
  for (const sdg of sdgList) {
    const created = await prisma.sDGGoal.create({
      data: { sdgNumber: sdg.number, name: sdg.name, active: true },
    });
    sdgMap[sdg.number] = created.id;
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
      customPrefixes: 'GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT',
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

  // 7. Seed the 4 Core System Users:
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

  // User 3: HoD CSE
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

  // 8. Seed 18 Engineering Departments
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

  let cseDept: any = null;

  for (const d of departmentsData) {
    const isCSE = d.code === 'CS';
    const dept = await prisma.department.create({
      data: {
        programmeType: 'UG',
        programmeName: d.programmeName,
        shortName: d.shortName,
        departmentCode: d.code,
        semesters: 8,
        hodId: isCSE ? hodUser.id : null,
        active: true,
      },
    });

    if (isCSE) {
      cseDept = dept;
    }

    // PO and PSO configuration for Regulation 26
    await prisma.pOConfiguration.create({
      data: {
        departmentId: dept.id,
        regulationId: reg26.id,
        poCount: 12,
        isLocked: isCSE,
        lockedAt: isCSE ? new Date('2026-08-20T09:00:00Z') : null,
      },
    });

    await prisma.pSOConfiguration.create({
      data: {
        departmentId: dept.id,
        regulationId: reg26.id,
        psoCount: 3,
        isLocked: isCSE,
        lockedAt: isCSE ? new Date('2026-08-20T09:00:00Z') : null,
      },
    });
  }

  // Link HoD and Faculty users to the CSE department
  await prisma.user.update({
    where: { id: hodUser.id },
    data: { departmentId: cseDept.id },
  });

  await prisma.user.update({
    where: { id: facultyUser.id },
    data: { departmentId: cseDept.id },
  });

  // Seed standard 12 NBA Program Outcomes (POs) for CSE
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

  for (const item of poStatementsList) {
    await prisma.programOutcomeStatement.create({
      data: {
        departmentId: cseDept.id,
        regulationId: reg26.id,
        poKey: item.poKey,
        statement: item.statement,
      },
    });
  }

  // Seed 3 Program Specific Outcomes (PSOs) for CSE
  const psoStatementsList = [
    { psoKey: 'PSO1', statement: 'Professional Software Systems: Analyze, design, implement, and verify scalable software architectures, algorithmic frameworks, and database solutions.' },
    { psoKey: 'PSO2', statement: 'Cloud, AI and Distributed Computing: Apply cutting-edge artificial intelligence, machine learning, cloud virtualization, and distributed systems to address real-world challenges.' },
    { psoKey: 'PSO3', statement: 'Secure Computing & Innovation: Formulate cyber security protocols, secure coding practices, and employ modern developer toolchains for innovative engineering products.' },
  ];

  for (const item of psoStatementsList) {
    await prisma.programSpecificOutcomeStatement.create({
      data: {
        departmentId: cseDept.id,
        regulationId: reg26.id,
        psoKey: item.psoKey,
        statement: item.statement,
      },
    });
  }

  // 9. Seed 26 Approved Demo Subjects in CSE:
  // - 7 Theory Subjects
  // - 6 Lab Subjects
  // - 7 Lab-Oriented Theory (LOT) Subjects
  // - 3 Project Subjects
  // - 3 Professional Elective Subjects
  const demoSubjects = [
    // ----------------------------------------------------
    // 1. 7 THEORY SUBJECTS (Category: PC, Type: Theory)
    // ----------------------------------------------------
    {
      name: 'Data Structures',
      code: 'CS26301',
      type: 'Theory',
      category: 'PC',
      sem: 3,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Linear and non-linear data structures, trees, graphs, hashing, and complexity analysis.',
    },
    {
      name: 'Object Oriented Programming Paradigms',
      code: 'CS26302',
      type: 'Theory',
      category: 'PC',
      sem: 3,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'OOP concepts, encapsulation, polymorphism, inheritance, generics, and modern design patterns.',
    },
    {
      name: 'Database Management Systems',
      code: 'CS26401',
      type: 'Theory',
      category: 'PC',
      sem: 4,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Relational data model, SQL, normalization, transaction processing, concurrency, and indexing.',
    },
    {
      name: 'Operating Systems',
      code: 'CS26402',
      type: 'Theory',
      category: 'PC',
      sem: 4,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Process management, thread scheduling, synchronization, memory management, virtual memory, and file systems.',
    },
    {
      name: 'Computer Networks',
      code: 'CS26501',
      type: 'Theory',
      category: 'PC',
      sem: 5,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'OSI and TCP/IP protocol architectures, routing algorithms, transport protocols, and socket programming.',
    },
    {
      name: 'Theory of Computation',
      code: 'CS26502',
      type: 'Theory',
      category: 'PC',
      sem: 5,
      l: 3, t: 1, p: 0, c: 4.0,
      desc: 'Automata theory, regular expressions, context-free grammars, Turing machines, decidability, and complexity classes.',
    },
    {
      name: 'Compiler Design',
      code: 'CS26601',
      type: 'Theory',
      category: 'PC',
      sem: 6,
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Lexical analysis, syntax analysis, syntax-directed translation, intermediate code generation, and optimization.',
    },

    // ----------------------------------------------------
    // 2. 6 LAB SUBJECTS (Category: PC, Type: Lab)
    // ----------------------------------------------------
    {
      name: 'Data Structures and Algorithms Laboratory',
      code: 'CS26311',
      type: 'Lab',
      category: 'PC',
      sem: 3,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'Implementation of stacks, queues, linked lists, binary trees, heaps, graph traversal, and sorting algorithms.',
    },
    {
      name: 'Object Oriented Programming Laboratory',
      code: 'CS26312',
      type: 'Lab',
      category: 'PC',
      sem: 3,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'Hands-on practice on class hierarchy, interfaces, exception handling, multithreading, and GUI programming.',
    },
    {
      name: 'Database Management Systems Laboratory',
      code: 'CS26411',
      type: 'Lab',
      category: 'PC',
      sem: 4,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'DDL/DML queries, nested queries, joins, triggers, procedures, views, and full-stack database application development.',
    },
    {
      name: 'Operating Systems Laboratory',
      code: 'CS26412',
      type: 'Lab',
      category: 'PC',
      sem: 4,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'UNIX/Linux system calls, process creation, CPU scheduling simulation, semaphores, and page replacement algorithms.',
    },
    {
      name: 'Computer Networks Laboratory',
      code: 'CS26511',
      type: 'Lab',
      category: 'PC',
      sem: 5,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'Network packet analysis using Wireshark, socket programming (TCP/UDP), NS2/NS3 network simulation, and routing protocols.',
    },
    {
      name: 'Compiler Design and System Software Laboratory',
      code: 'CS26611',
      type: 'Lab',
      category: 'PC',
      sem: 6,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'Implementation of lexical analyzer using LEX, syntax analyzer using YACC, DAG generation, and three-address code generator.',
    },

    // ----------------------------------------------------
    // 3. 7 LAB-ORIENTED THEORY (LOT) SUBJECTS (Category: PC, Type: Lab-Oriented Theory)
    // ----------------------------------------------------
    {
      name: 'Design and Analysis of Algorithms',
      code: 'CS26421',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 4,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Divide-and-conquer, greedy algorithms, dynamic programming, backtracking, branch-and-bound with integrated laboratory implementation.',
    },
    {
      name: 'Web Application Development',
      code: 'CS26521',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 5,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Full-stack web architecture, React, Node.js, Express, RESTful APIs, responsive design, and practical end-to-end web deployment.',
    },
    {
      name: 'Microprocessors and Interfacing',
      code: 'CS26522',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 5,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: '8086 architecture, assembly language programming, peripheral interfacing chips, timers, and hardware lab experiments.',
    },
    {
      name: 'Artificial Intelligence and Machine Learning',
      code: 'CS26621',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 6,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Search algorithms, supervised and unsupervised learning, neural networks, deep learning models with Python Scikit-Learn/PyTorch experiments.',
    },
    {
      name: 'Cloud Computing and Virtualization',
      code: 'CS26622',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 6,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Hypervisors, containers, Kubernetes, AWS/Azure cloud deployment models, microservices, and serverless architectures.',
    },
    {
      name: 'Mobile Application Development',
      code: 'CS26721',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 7,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Cross-platform mobile apps with Flutter/React Native, UI components, background services, SQLite storage, and mobile sensor APIs.',
    },
    {
      name: 'Internet of Things and Embedded Systems',
      code: 'CS26722',
      type: 'Lab-Oriented Theory',
      category: 'PC',
      sem: 7,
      l: 3, t: 0, p: 2, c: 4.0,
      desc: 'Sensors, actuators, Raspberry Pi, ESP32, MQTT/CoAP protocols, edge computing, and real-time IoT cloud telemetry dashboards.',
    },

    // ----------------------------------------------------
    // 4. 3 PROJECT SUBJECTS (Category: EEC, Type: Project)
    // ----------------------------------------------------
    {
      name: 'Mini Project / Socially Relevant Project',
      code: 'CS26531',
      type: 'Project',
      category: 'EEC',
      sem: 5,
      l: 0, t: 0, p: 4, c: 2.0,
      desc: 'Problem identification, requirement analysis, prototype formulation, and field testing for societal or community challenges.',
    },
    {
      name: 'Design Project / Phase I',
      code: 'CS26731',
      type: 'Project',
      category: 'EEC',
      sem: 7,
      l: 0, t: 0, p: 6, c: 3.0,
      desc: 'Comprehensive engineering literature review, feasibility study, architectural design, component selection, and initial milestone demo.',
    },
    {
      name: 'Capstone Project Work / Phase II',
      code: 'CS26831',
      type: 'Project',
      category: 'EEC',
      sem: 8,
      l: 0, t: 0, p: 12, c: 6.0,
      desc: 'Full-scale system implementation, hardware/software integration, rigorous testing, benchmarking, research publication, and thesis defense.',
    },

    // ----------------------------------------------------
    // 5. 3 PROFESSIONAL ELECTIVE SUBJECTS (Category: PE, Type: Theory, with vertical)
    // ----------------------------------------------------
    {
      name: 'Distributed Systems and Blockchain',
      code: 'CS26E01',
      type: 'Theory',
      category: 'PE',
      sem: 6,
      vertical: 'Vertical A - Systems and Networks',
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Distributed consensus, Paxos, Raft, peer-to-peer architectures, smart contracts, Ethereum, and decentralized finance protocols.',
    },
    {
      name: 'Natural Language Processing',
      code: 'CS26E02',
      type: 'Theory',
      category: 'PE',
      sem: 7,
      vertical: 'Vertical B - Data Science & AI',
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Text tokenization, morphological analysis, POS tagging, word embeddings, transformer models, LLMs, and sentiment analysis.',
    },
    {
      name: 'Information Security and Cryptography',
      code: 'CS26E03',
      type: 'Theory',
      category: 'PE',
      sem: 7,
      vertical: 'Vertical C - Cybersecurity',
      l: 3, t: 0, p: 0, c: 3.0,
      desc: 'Symmetric and asymmetric ciphers, DES, AES, RSA, digital signatures, hash functions, zero-knowledge proofs, and vulnerability assessment.',
    },
  ];

  console.log(`Seeding ${demoSubjects.length} approved CSE subjects with complete syllabus data...`);

  for (const subjData of demoSubjects) {
    const subjectTypeId = subjectTypesMap[subjData.type] || subjectTypesMap['Theory'];
    const subjectCategoryId = categoriesMap[subjData.category] || categoriesMap['PC'];

    const subject = await prisma.subject.create({
      data: {
        departmentId: cseDept.id,
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
      },
    });

    const isLabOnly = subjData.type === 'Lab';
    const isProject = subjData.type === 'Project';
    const isLot = subjData.type === 'Lab-Oriented Theory';

    const unitHours = 9;
    const theoryContactHours = isLabOnly || isProject ? 0 : 5 * unitHours;
    const labContactHours = isLabOnly ? subjData.p * 15 : isLot ? 30 : 0;
    const totalContactHours = (subjData.l + subjData.t + subjData.p) * 15;

    // Create approved SyllabusSubmission
    const submission = await prisma.syllabusSubmission.create({
      data: {
        subjectId: subject.id,
        facultyId: facultyUser.id,
        version: 1,
        unitContactHours: isLabOnly || isProject ? null : unitHours,
        theoryContactHours,
        labContactHours,
        totalContactHours,
        approvedById: dean.id,
        approvedAt: new Date('2026-08-28T14:30:00Z'),
      },
    });

    // 5 Objectives
    for (let i = 1; i <= 5; i++) {
      await prisma.objective.create({
        data: {
          syllabusId: submission.id,
          order: i,
          description: `Understand and apply foundational principles and engineering methodologies of ${subjData.name} (Objective ${i}).`,
        },
      });
    }

    // Units (for Theory, LOT, Elective)
    if (!isLabOnly && !isProject) {
      const unitNames = [
        'Introduction and Foundational Concepts',
        'Architectural Core and Methodological Frameworks',
        'Advanced Design Paradigms and Protocols',
        'System Integration and Performance Optimization',
        'Emerging Trends, Standards, and Industrial Applications',
      ];
      for (let u = 1; u <= 5; u++) {
        await prisma.syllabusUnit.create({
          data: {
            syllabusId: submission.id,
            unitNumber: u,
            unitName: unitNames[u - 1],
            content: `In-depth study of Unit ${u} concepts for ${subjData.name}: mathematical modeling, state-of-the-art algorithms, comparative case studies, and engineering implementations.`,
          },
        });
      }
    }

    // Experiments (for Lab & LOT)
    if (isLabOnly || isLot) {
      const expCount = isLabOnly ? 10 : 6;
      for (let e = 1; e <= expCount; e++) {
        await prisma.experiment.create({
          data: {
            syllabusId: submission.id,
            experimentNumber: e,
            title: `Laboratory Experiment ${e}: Practical implementation and benchmarking of ${subjData.name} module ${e}.`,
          },
        });
      }
    }

    // 5 Course Outcomes (CO1 to CO5)
    const bloomLevels = ['K2', 'K3', 'K3', 'K4', 'K5'];
    for (let c = 1; c <= 5; c++) {
      await prisma.courseOutcome.create({
        data: {
          syllabusId: submission.id,
          coNumber: c,
          cognitiveLevel: bloomLevels[c - 1],
          description: `Formulate, evaluate, and demonstrate comprehensive competency in ${subjData.name} to solve engineering challenges (CO${c}).`,
        },
      });
    }

    // Textbooks
    await prisma.textbook.create({
      data: {
        syllabusId: submission.id,
        order: 1,
        title: `Core Principles and Practices of ${subjData.name}`,
        authors: 'Thomas H. Cormen, Charles E. Leiserson',
        edition: '4th Edition',
        publisher: 'MIT Press / McGraw-Hill',
        year: '2022',
      },
    });

    await prisma.textbook.create({
      data: {
        syllabusId: submission.id,
        order: 2,
        title: `Modern Engineering Foundations of ${subjData.name}`,
        authors: 'Andrew S. Tanenbaum, David J. Wetherall',
        edition: '6th Edition',
        publisher: 'Pearson Education',
        year: '2023',
      },
    });

    // References
    await prisma.reference.create({
      data: {
        syllabusId: submission.id,
        order: 1,
        title: `IEEE Standard Framework and Benchmarks for ${subjData.name}`,
        authors: 'IEEE Computer Society Technical Committee',
        publisher: 'IEEE Press',
        year: '2024',
      },
    });

    await prisma.reference.create({
      data: {
        syllabusId: submission.id,
        order: 2,
        title: `ACM Computing Curricula & Advanced Practice in ${subjData.name}`,
        authors: 'ACM Curriculum Guidelines Task Group',
        publisher: 'ACM Digital Library',
        year: '2024',
      },
    });

    // CO-PO Mappings & Justifications (CO1-CO5 to PO1, PO2, PO3, PO5, PO12)
    const poTargets = ['PO1', 'PO2', 'PO3', 'PO5', 'PO12'];
    for (let coNum = 1; coNum <= 5; coNum++) {
      for (const poKey of poTargets) {
        await prisma.cOPOMapping.create({
          data: {
            syllabusId: submission.id,
            coNumber: coNum,
            poKey,
            correlation: 3, // Strong correlation
          },
        });

        await prisma.cOPOJustification.create({
          data: {
            syllabusId: submission.id,
            coNumber: coNum,
            poKey,
            justification: `Substantial correlation: Rigorous analytical concepts in CO${coNum} directly reinforce ${poKey} principles through systematic design exercises.`,
          },
        });
      }
    }

    // SDG Mapping (Quality Education SDG 4, Industry & Innovation SDG 9)
    await prisma.syllabusSDGMapping.create({
      data: {
        syllabusId: submission.id,
        coNumber: 1,
        sdgNumber: 4,
        topic: `${subjData.name} Core Principles & Quality Education Modules`,
      },
    });

    await prisma.syllabusSDGMapping.create({
      data: {
        syllabusId: submission.id,
        coNumber: 3,
        sdgNumber: 9,
        topic: `${subjData.name} Applied Engineering & Industry 4.0 Infrastructure`,
      },
    });
  }

  // 10. Seed Approved Department Curriculum Bundle for CSE
  await prisma.departmentCurriculumBundle.create({
    data: {
      departmentId: cseDept.id,
      regulationId: reg26.id,
      academicYearId: ay2026.id,
      status: 'APPROVED',
      submittedById: hodUser.id,
      submittedAt: new Date('2026-08-25T10:00:00Z'),
      approvedById: dean.id,
      approvedAt: new Date('2026-08-29T16:00:00Z'),
    },
  });

  // 11. Academic Stages (4 Official Stages)
  // Stage 1 is COMPLETED, Stage 2 is ACTIVE with startDate in the past so Step 2 Programme Planning is unlocked
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

  console.log('Successfully seeded 18 engineering departments, 26 demo subjects with approved syllabi, and 4 academic stages!');
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
