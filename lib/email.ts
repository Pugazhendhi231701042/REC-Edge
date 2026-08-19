// Institutional Email Notification Service

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  // Production system email logs (Simulated transport layer with actual database emails)
  console.log(`\n========== [INSTITUTIONAL EMAIL NOTIFICATION] ==========`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body Snippet: ${html.replace(/<[^>]*>?/gm, '').slice(0, 200)}...`);
  console.log(`========================================================\n`);
  return true;
}

export function buildStageInitiatedEmail(stageName: string, deadline: string, regulation: string, academicYear: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E9D5FF; borderRadius: 8px;">
      <h2 style="color: #6A1B9A;">Rajalakshmi Engineering College</h2>
      <p style="color: #6A7282; font-size: 14px;">Regulation 26 — Curriculum & Syllabus Management System</p>
      <hr style="border: 0; border-top: 1px solid #E9D5FF;" />
      <h3>Academic Stage Initiated: ${stageName}</h3>
      <p>Dear HoD,</p>
      <p>The Dean of Academic Affairs has officially initiated the academic stage: <strong>${stageName}</strong> for <strong>${regulation} (${academicYear})</strong>.</p>
      <p><strong>Stage Deadline:</strong> ${deadline}</p>
      <p>Please log in to your department dashboard to build the semester curriculum, generate subject codes, calculate credits, and assign faculty members.</p>
      <a href="http://localhost:3000/login" style="background-color: #6A1B9A; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Access System Dashboard</a>
    </div>
  `;
}

export function buildSubjectAssignmentEmail(subjectName: string, subjectCode: string, category: string, ltpc: string, deadline: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E9D5FF; borderRadius: 8px;">
      <h2 style="color: #6A1B9A;">Rajalakshmi Engineering College</h2>
      <p style="color: #6A7282; font-size: 14px;">Regulation 26 — Curriculum & Syllabus Management System</p>
      <hr style="border: 0; border-top: 1px solid #E9D5FF;" />
      <h3>Syllabus Preparation Task Assigned</h3>
      <p>Dear Faculty,</p>
      <p>You have been assigned the syllabus preparation task for the following course:</p>
      <ul>
        <li><strong>Subject Name:</strong> ${subjectName}</li>
        <li><strong>Subject Code:</strong> ${subjectCode}</li>
        <li><strong>Category:</strong> ${category}</li>
        <li><strong>L-T-P-C:</strong> ${ltpc}</li>
        <li><strong>Deadline:</strong> ${deadline}</li>
      </ul>
      <p>Please complete the objectives, syllabus units/experiments, 5 Course Outcomes, textbooks, references, 12 PO + 3 PSO mapping matrix, and justifications before the deadline.</p>
      <a href="http://localhost:3000/login" style="background-color: #6A1B9A; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Open Assigned Subject</a>
    </div>
  `;
}

export function buildCorrectionRequestEmail(subjectName: string, subjectCode: string, reason: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E9D5FF; borderRadius: 8px;">
      <h2 style="color: #6A1B9A;">Rajalakshmi Engineering College</h2>
      <p style="color: #6A7282; font-size: 14px;">Regulation 26 — Curriculum & Syllabus Management System</p>
      <hr style="border: 0; border-top: 1px solid #E9D5FF;" />
      <h3 style="color: #B45309;">Syllabus Returned for Correction</h3>
      <p>Dear Faculty,</p>
      <p>Your submitted syllabus for <strong>${subjectCode} - ${subjectName}</strong> has been returned by the Head of Department for correction.</p>
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 15px 0;">
        <strong>Correction Reason:</strong>
        <p style="margin: 5px 0 0 0;">${reason}</p>
      </div>
      <p>Please revise the indicated sections and resubmit.</p>
      <a href="http://localhost:3000/login" style="background-color: #6A1B9A; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">Revise Syllabus</a>
    </div>
  `;
}
