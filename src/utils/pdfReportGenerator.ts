import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LiveRoom, GradeReportEntry, StudentParticipant } from '../types';
import { getActiveTeachingAssistant } from '../data/teachingAssistants';

export interface GeneratePdfOptions {
  room: LiveRoom;
  gradebookEntries: GradeReportEntry[];
  classAvgPercentage: number;
  classAvgTime: number;
  hardestQuestion?: { question: any; accuracy: number };
}

export function generateQuizPerformancePdf({
  room,
  gradebookEntries,
  classAvgPercentage,
  classAvgTime,
  hardestQuestion,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const activeTa = getActiveTeachingAssistant();
  const activeTaName = activeTa ? `${activeTa.name} (${activeTa.rollNo})` : 'Authorized Teaching Assistant';

  const participantsList = Object.values(room.participants) as StudentParticipant[];
  const sortedGrades = [...gradebookEntries].sort((a, b) => b.score - a.score);

  // Grade Counts
  const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  gradebookEntries.forEach((g) => {
    if (gradeCounts[g.letterGrade] !== undefined) {
      gradeCounts[g.letterGrade] += 1;
    }
  });

  // -------------------------------------------------------------
  // HEADER BANNER
  // -------------------------------------------------------------
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative accent line
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  // Title and metadata inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('UNIVERSITY ASSESSMENT PERFORMANCE REPORT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  const truncatedTitle = room.quizTitle.length > 50 ? room.quizTitle.substring(0, 48) + '...' : room.quizTitle;
  doc.text(truncatedTitle, 14, 23);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  const generationDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`SESSION PIN: ${room.pin}   |   GENERATED: ${generationDate}`, 14, 30);
  doc.text(`TEACHING ASSISTANT: ${activeTaName.toUpperCase()}   |   ROLE: TEACHER HOST (TA)`, 14, 36);

  // -------------------------------------------------------------
  // EXECUTIVE KPI METRICS (4 CARDS)
  // -------------------------------------------------------------
  const startY = 48;
  const cardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 22;

  const kpis = [
    {
      label: 'CLASS AVERAGE',
      val: `${classAvgPercentage.toFixed(1)}%`,
      sub: `${sortedGrades.filter((g) => g.percentage >= 70).length}/${sortedGrades.length} Passing`,
      color: [79, 70, 229], // Indigo
    },
    {
      label: 'TOTAL STUDENTS',
      val: `${sortedGrades.length}`,
      sub: '100% Submission Rate',
      color: [16, 185, 129], // Emerald
    },
    {
      label: 'AVG RESPONSE TIME',
      val: `${classAvgTime.toFixed(1)}s`,
      sub: `Per Question / Student`,
      color: [14, 165, 233], // Sky
    },
    {
      label: 'HARDEST QUESTION',
      val: hardestQuestion ? `${hardestQuestion.accuracy}% Acc` : 'N/A',
      sub: hardestQuestion?.question.topicTag || 'Question Diagnostic',
      color: [244, 63, 94], // Rose
    },
  ];

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (cardWidth + 3);
    // Background
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'F');

    // Border
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'S');

    // Top accent bar
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x + 1, startY + 0.5, cardWidth - 2, 1, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, startY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(kpi.val, x + 3.5, startY + 12);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const safeSub = kpi.sub.length > 22 ? kpi.sub.substring(0, 20) + '..' : kpi.sub;
    doc.text(safeSub, x + 3.5, startY + 17.5);
  });

  // -------------------------------------------------------------
  // GRADE DISTRIBUTION & PODIUM SUMMARY
  // -------------------------------------------------------------
  const summaryY = startY + cardHeight + 5;

  // Grade breakdown panel
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryY, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('PERFORMANCE DISTRIBUTION & TOP HONORS:', 18, summaryY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const total = sortedGrades.length || 1;
  const gradeSummaryText = `Grades: A: ${gradeCounts.A} (${((gradeCounts.A / total) * 100).toFixed(0)}%)  |  B: ${gradeCounts.B} (${((gradeCounts.B / total) * 100).toFixed(0)}%)  |  C: ${gradeCounts.C} (${((gradeCounts.C / total) * 100).toFixed(0)}%)  |  D: ${gradeCounts.D} (${((gradeCounts.D / total) * 100).toFixed(0)}%)  |  F: ${gradeCounts.F} (${((gradeCounts.F / total) * 100).toFixed(0)}%)`;
  doc.text(gradeSummaryText, 18, summaryY + 11.5);

  // Top 3 Podium Note on the right
  const top1 = sortedGrades[0];
  const top2 = sortedGrades[1];
  const top3 = sortedGrades[2];
  let podiumText = 'Podium: ';
  if (top1) podiumText += `1st: ${top1.studentName} (${top1.studentId}) ${top1.score}pts  `;
  if (top2) podiumText += `2nd: ${top2.studentName}  `;
  if (top3) podiumText += `3rd: ${top3.studentName}`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(doc.splitTextToSize(podiumText, 85)[0] || '', pageWidth - 100, summaryY + 5.5);

  // -------------------------------------------------------------
  // STUDENT ROSTER & DETAILED GRADEBOOK TABLE
  // -------------------------------------------------------------
  const tableData = sortedGrades.map((g, index) => {
    return [
      `#${index + 1}`,
      g.studentName,
      g.studentId,
      `${g.score} / ${g.totalPossible}`,
      `${g.correctCount}/${g.totalQuestions} (${g.percentage.toFixed(0)}%)`,
      g.letterGrade,
      `${g.averageResponseTimeSeconds.toFixed(1)}s`,
      g.status,
    ];
  });

  autoTable(doc, {
    startY: summaryY + 20,
    head: [['Rank', 'Student Name', 'University Roll No.', 'Score', 'Accuracy', 'Grade', 'Avg Time', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [51, 65, 85],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 32, fontStyle: 'bold' }, // University Roll No
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      // Color code Letter Grades
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'A') data.cell.styles.textColor = [16, 185, 129];
        else if (val === 'B') data.cell.styles.textColor = [59, 130, 246];
        else if (val === 'C') data.cell.styles.textColor = [245, 158, 11];
        else if (val === 'D') data.cell.styles.textColor = [249, 115, 22];
        else if (val === 'F') data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // -------------------------------------------------------------
  // QUESTION-BY-QUESTION DIAGNOSTIC TABLE
  // -------------------------------------------------------------
  let currentY = (doc as any).lastAutoTable?.finalY || 160;

  // Check if we have room on this page, else add page
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('QUESTION-BY-QUESTION ITEM ANALYSIS', 14, currentY);

  const questionTableData = room.quiz.questions.map((q, idx) => {
    const correctCount = participantsList.filter((p) => p.answers[q.id]?.isCorrect).length;
    const accuracy = participantsList.length > 0 ? Math.round((correctCount / participantsList.length) * 100) : 0;
    const status = accuracy >= 70 ? 'Mastered' : accuracy >= 50 ? 'Review Needed' : 'Critical Focus';
    const cleanText = q.text.length > 60 ? q.text.substring(0, 58) + '...' : q.text;

    return [
      `Q${idx + 1}`,
      cleanText,
      q.topicTag || 'General',
      `${correctCount} / ${participantsList.length}`,
      `${accuracy}%`,
      status,
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Question Text', 'Topic', 'Correct Responses', 'Class Accuracy', 'Diagnostic Status']],
    body: questionTableData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 23, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'Mastered') data.cell.styles.textColor = [16, 185, 129];
        else if (val === 'Review Needed') data.cell.styles.textColor = [245, 158, 11];
        else if (val === 'Critical Focus') data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // -------------------------------------------------------------
  // FOOTER WITH PAGE NUMBERS & SECURITY NOTICE ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.text(
      `University Live Assessment Engine  •  Verified by Teaching Assistant: ${activeTaName}`,
      14,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 26, pageHeight - 6);
  }

  // -------------------------------------------------------------
  // TRIGGER BROWSER DOWNLOAD
  // -------------------------------------------------------------
  const sanitizedTitle = room.quizTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const fileName = `${sanitizedTitle}_Assessment_Report_${room.pin}.pdf`;
  doc.save(fileName);
}
