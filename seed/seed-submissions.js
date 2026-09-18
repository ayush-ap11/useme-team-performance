/**
 * Useme Team - Submissions Seed Generator (650 records covering Pending, Approved, and Needs Rework)
 */
(function(exports) {
  const { rInt, pick, pickMultiple, REF_DATE, addDays, formatISO } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const PROOF_FILES = [
    'reconciliation_report_v2.xlsx', 'payment_gateway_latency_audit.pdf', 'distributor_kyc_verification_bundle.zip',
    'qr_soundbox_firmware_test_suite.log', 'mobile_drawer_wcag_a11y_report.pdf', 'tds_filing_signed_acknowledgement.pdf',
    'fraud_velocity_simulation_benchmarks.csv', 'payout_batch_disbursement_receipts.zip', 'merchant_onboarding_ocr_accuracy.pdf',
    'webrtc_stream_dual_audio_mixer_logs.txt', 'e_way_bill_gstn_crosscheck_ledger.xlsx', 'design_token_hsl_contrast_audit.html'
  ];

  const PROOF_URLS = [
    'https://drive.google.com/file/d/1uX9pKm-useme-report/view',
    'https://github.com/useme/core-payments/pull/482',
    'https://www.figma.com/file/useme-design-system-refresh-v2',
    'https://datastudio.google.com/reporting/useme-telemetry-kpi',
    'https://meet.google.com/recordings/weekly-merchant-review-q3'
  ];

  const REWORK_REASONS = [
    'Please verify GST tax component against July ledger before final sign-off.',
    'Color contrast on dark mode toggle falls slightly below 4.5:1 WCAG ratio; adjust border token.',
    'Test coverage on Redis sliding-window boundary condition is missing 2 unit test cases.',
    'Dieline bleeds on outer packaging carton require 3mm extra safety margin for offset printing.',
    'Soundbox audio wav asset is 48kHz; please re-encode to 16kHz mono for embedded memory limits.'
  ];

  function generateSubmissions(tasks, members) {
    const submissions = [];
    const memberMap = new Map(members.map(m => [m.id, m]));

    // Eligible tasks: completed (Approved), awaitingFeedback / testing (Pending), reworkNeeded (Needs Rework)
    const eligibleTasks = tasks.filter(t => ['completed', 'awaitingFeedback', 'testing', 'reworkNeeded'].includes(t.status)).slice(0, 650);

    // Ensure we reach ~650 submissions
    eligibleTasks.forEach((task, idx) => {
      const primaryAssignee = task.assignedTo[0] || 'm5';
      const mObj = memberMap.get(primaryAssignee) || members[0];

      // Assign rich proof assets if missing
      if (!task.assets || task.assets.length === 0) {
        task.assets = [
          pick(PROOF_FILES),
          pick(PROOF_URLS)
        ];
      }

      let subStatus = 'pending';
      if (task.status === 'completed') subStatus = 'approved';
      else if (task.status === 'reworkNeeded') subStatus = 'needsRework';

      // Timestamps internally consistent with task due dates
      const dueDaysOffset = Math.floor((new Date(task.dueDate).getTime() - REF_DATE.getTime()) / 86400000);
      const subDaysOffset = dueDaysOffset - rInt(2, 6);
      const subDate = addDays(REF_DATE, subDaysOffset);
      const revDate = addDays(subDate, rInt(1, 3));

      let reworkNote = null;
      if (subStatus === 'needsRework') {
        reworkNote = pick(REWORK_REASONS);
        task.reworkNotes = reworkNote;
      }

      submissions.push({
        id: `sub-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        memberId: primaryAssignee,
        memberName: mObj.name,
        memberAvatar: mObj.avatar,
        department: mObj.department,
        status: subStatus,
        submittedAt: formatISO(subDate),
        reviewedAt: subStatus !== 'pending' ? formatISO(revDate) : null,
        qualityScore: task.qualityScore || (subStatus === 'approved' ? 9.2 : (subStatus === 'needsRework' ? 6.0 : null)),
        proofAssets: task.assets.map(a => typeof a === 'string' ? a : (a.name || 'Proof Document')),
        reworkNotes: reworkNote,
        linkedProject: task.linkedProject || 'Operations'
      });
    });

    return submissions;
  }

  exports.SeedSubmissions = { generateSubmissions };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
