/**
 * Metropolitan Institute of Technology — Department of Computer Engineering
 * Official OJT Practicum 360-Degree Evaluation Rubrics & Instruments
 */

export const EVALUATION_INSTRUMENTS = [
  {
    id: 'supervisor_to_student',
    code: 'INST-02',
    name: 'Trainee & School Performance Evaluation',
    shortTitle: 'Supervisor → Trainee & School',
    evaluatorRole: 'supervisor',
    targetRole: 'student',
    evaluatorTypeDb: 'employer',
    description: 'Immediate HTE Supervisor evaluation of student technical competency and university curriculum readiness',
    sections: [
      {
        title: 'Part I: Trainee Performance Evaluation',
        items: [
          'The trainee\'s performance manifests enough theoretical knowledge gain on pre-requisite subjects',
          'The Trainee\'s performance manifests practical/hands-on experience as catalyst to the efficiency in OJT',
          'The trainee shows high degree of humility and respect to all stakeholders in the company',
          'The trainee is hone enough to basic industry procedures and decorum',
          'The trainee regularly and promptly attends to the schedules set by the company',
          'The trainee easily adapt to the company\'s culture and shows adherence to policies and practices',
          'The trainee easily and accurately grasps the technicalities of trainings and consequently delivers',
          'The trainee exercise efficient monitoring of trainee and collaboration with the company counterpart',
          'The trainee manifests good background in teamwork',
          'The trainee exercise resourcefulness and creativity in handling workloads in the training',
        ],
      },
      {
        title: 'Part II: School Curriculum & Institutional Linkage',
        items: [
          'The school curriculum contains subjects that are pre requisites to the company\'s line of work',
          'The subjects are accurately positions to prepare the trainee for OJT',
          'The school assigns coordinators advisers who are easy and prompt to collaborate with in relations to the OJT matters',
          'The school has effective system of deploying the students for OJT',
          'The school has no pending complaint or derogatory record or image relative to sending students for OJT',
          'The school promptly provides documents that are necessary in processing the application of trainees for OJT',
          'The school provides the company with well-defined evaluation system to which trainee\'s performance shall be rated',
          'The school exercise efficient monitoring of trainee and collaboration with the company counterpart',
          'The school implements enough duration of OJT',
          'The school’s internship program invites lasting collaboration and linkage with the company',
        ],
      },
    ],
    commentsLabel: 'General Comments & Trainee Strengths',
    signatories: [
      { role: 'Immediate HTE Supervisor', label: 'Evaluator’s Signature over Full Name' },
      { role: 'Faculty Practicum Adviser', label: 'Noted by: Internship Adviser' },
    ],
  },

  {
    id: 'student_to_supervisor',
    code: 'INST-01',
    name: 'Evaluation Instrument for Training Supervisor',
    shortTitle: 'Student → Supervisor Mentorship',
    evaluatorRole: 'student',
    targetRole: 'supervisor',
    evaluatorTypeDb: 'employer',
    description: 'Student intern assessment of immediate supervisor mentoring, coaching, work ethics, and task assistance',
    sections: [
      {
        title: 'I. Mentoring / Coaching',
        items: [
          'Orients the students on the company goals, objectives, and policies',
          'Discusses the duties, responsibilities, and specific task related to internship training program outcomes',
          'Provides clear instructions, tips and advice on job-related task',
          'Encourages student-intern’s initiative, creativity and innovativeness in the workplace when necessary',
          'Gives student-intern the opportunity to raise issues and /or concerns to be address',
          'Reports to the concerned internship adviser the status of the student-intern’s training exposure',
        ],
      },
      {
        title: 'II. Interpersonal Skills',
        items: [
          'Builds and environment of trust and encouragement that allows student-interns to foster their ideas and to cooperate',
          'Encourages the trainee to interact with colleagues',
          'Builds healthy working relationship with the student-intern to facilitate accomplishment of goals',
          'Encourages collaborations and communication in the work station',
        ],
      },
      {
        title: 'III. Work Ethics',
        items: [
          'Promotes professional and positive workplace behavior in terms of punctuality and productivity',
          'Ensures that all interactions are conducted with respect towards every individual',
          'Accept responsibility and accountability for decision and actions taken',
          'Uses appropriate oral and written communication in the workplace',
          'Respects inclusivity and diversity in the workplace',
        ],
      },
      {
        title: 'IV. Support and Assistance on Specific Task',
        items: [
          'Provides the necessary resources to do the job successfully',
          'Sets clear expectations and standard measures for deliverable',
          'Allows the student-intern to participate in the work that directly correlates to their field of specialization',
          'Assist the student-intern in the technical and actual aspects of the training',
          'Assigns a regular schedule for consultation',
          'Maintains objectivity in evaluating and assessing student-intern',
          'Provides opportunities for learning and professionalism growth',
        ],
      },
      {
        title: 'V. Feedback Mechanism',
        items: [
          'Conducts weekly routine feedback on performance and expectations',
          'Gives constructive and regular descriptive feedback on student-interns’ progress',
          'Communicates to the internship adviser any concern, query, or issue regarding the internship',
          'Provides written evaluation for student-interns’ performance to further improve competitiveness',
          'Gives credit and recognitions for job-well done',
        ],
      },
    ],
    commentsLabel: 'Student-Intern Feedback / Comment/s',
    signatories: [
      { role: 'Student-Intern Evaluator', label: 'Signature over Printed Name of Student' },
      { role: 'Faculty Practicum Adviser', label: 'Verified by: Practicum Adviser' },
    ],
  },

  {
    id: 'adviser_to_hte',
    code: 'INST-03',
    name: 'Evaluation Instrument for Host Training Establishment (HTE)',
    shortTitle: 'Adviser → HTE Quality Audit',
    evaluatorRole: 'adviser',
    targetRole: 'employer',
    evaluatorTypeDb: 'adviser',
    description: 'Faculty Practicum Adviser institutional compliance audit evaluating company safety, training plan, and university MOA adherence',
    sections: [
      {
        title: 'Institutional Performance Indicators',
        items: [
          'Provides comprehensive Internship Plan to student-interns (company profile, objectives, job description, competencies, journal/DTR, and focal person)',
          'Orients student-interns on the standard rules and regulations, policies, potential projects, and respective work assignments in the HTE',
          'Commits to let student-interns undergo an Internship Program consistent with the requirements of the University',
          'Ensures that student-interns are rendering the training hours within the regular working hours',
          'Provides free relevant instruction, exposure, and training to the student-intern, consistent with its policies and regulations',
          'Treats the student-interns in a professional manner, ensuring no exposure to harassment, unethical tasks, or unreasonable risks',
          'Observes safety measures for the student-interns and ensures quality of training',
          'Issues Certificate of Completion to the student-interns not later than two weeks after the completion of internship',
          'Attends appreciation dialogue/exit conference/culminating activity conducted by the College department',
        ],
      },
    ],
    hasQualitativeBreakdown: true,
    commentsLabel: 'Institutional Audit Findings',
    signatories: [
      { role: 'Internship Adviser', label: 'Submitted by: Signature over Full Name of Internship Adviser' },
      { role: 'OJT Coordinator', label: 'Noted by: Signature over Full Name of OJT Coordinator' },
    ],
  },

  {
    id: 'student_to_adviser',
    code: 'INST-04',
    name: 'Student Evaluation of Faculty OJT Adviser',
    shortTitle: 'Student → Faculty Supervision',
    evaluatorRole: 'student',
    targetRole: 'adviser',
    evaluatorTypeDb: 'adviser',
    description: 'Student assessment of faculty adviser regular consultations, academic guidance, and monitoring',
    sections: [
      {
        title: 'Faculty Advisory & Practicum Supervision Criteria',
        items: [
          'Provide and give overview of the work to be done by trainee',
          'Orients the students on the company project objectives',
          'Orient the students in the objectives of the On-the-Job training',
          'Conducts regular consultation meeting with the students',
          'Coordinate with the concerned adviser to report the status of the training exposure of the students',
          'Share to the trainee his/her knowledge and experience or lessons learned from the company',
          'Provide important values and good human relations',
          'Encourage students to raise issues/problems related to the course and provide immediate action',
          'Maintains objectivity in evaluating and assessing the students',
          'Provide some important tips/advise to the students',
          'Provide feedback on the conduct of the On-the-Job training',
          'Always available to learners/students for consultation',
          'Interact professionally and promote positive workplace climate',
          'Monitor the students/learner’s development and creativity in achieving task',
          'Make sure the assignment; reports due dates and submission instructions are clear',
          'Provide assistance in terms of technical and actual aspects of the training',
          'Assist the trainee in the development his/her professional growth',
          'Encourages the trainee to interact and stimulates learning avenues',
          'Evaluates the leaning activities based in the checklist provided by the college department',
          'Provide necessary resources needed by the trainee',
        ],
      },
    ],
    commentsLabel: 'Student Recommendations & Feedback for Faculty Adviser',
    signatories: [
      { role: 'Student Evaluator', label: 'Student Signature over Full Name' },
      { role: 'Department Chair / Coordinator', label: 'Noted by: OJT Coordinator' },
    ],
  },
];

export const getInterpretation = (score) => {
  const num = Number(score) || 0;
  if (num >= 4.51) return { label: 'Full Compliant / Outstanding', desc: '91% - 100% Exemplary Standard', badge: 'rating-pill-outstanding' };
  if (num >= 3.51) return { label: 'Compliant / Very Satisfactory', desc: '66% - 90% Satisfies Requirements', badge: 'rating-pill-good' };
  if (num >= 2.51) return { label: 'Somewhat Compliant / Satisfactory', desc: '41% - 65% Needs Minor Refinement', badge: 'rating-pill-satisfactory' };
  if (num >= 1.51) return { label: 'Not Compliant / Fair', desc: '11% - 40% Remediation Required', badge: 'rating-pill-poor' };
  return { label: 'Fully Not Compliant / Poor', desc: '0% - 10% Unsatisfactory', badge: 'rating-pill-poor' };
};
