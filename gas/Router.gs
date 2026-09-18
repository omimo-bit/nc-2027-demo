
function route_(method, e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  const body = method === 'POST' ? parseBody_(e) : {};
  const params = (e && e.parameter) || {};

  switch (action) {
    case 'health': return ok_({version:APP.version,demoMode:APP.demoMode});
    case 'login':
      if(method!=='POST') return fail_('INVALID_REQUEST','POST required');
      return ok_(AuthService.login(body),'Login successful');

    case 'getTodayPJP': { const s=AuthService.requireSession(params.token); const d=params.date||Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd'); return ok_(PJPService.getToday(s.user_id,d)); }
    case 'getStoreDetail': AuthService.requireSession(params.token); return ok_(MasterService.getStore(params.store_id));
    case 'getProducts': AuthService.requireSession(params.token); return ok_(MasterService.getProducts());
    case 'checkIn': { const s=AuthService.requireSession(body.token); return ok_(VisitService.checkIn(s,body),'Check-in successful'); }
    case 'getVisitTasks': AuthService.requireSession(params.token); return ok_(TaskService.getVisitTasks(params.visit_id));
    case 'getVisitSummary': AuthService.requireSession(params.token); return ok_(VisitService.summary(params.visit_id));
    case 'submitStock': { const s=AuthService.requireSession(body.token); return ok_(SubmissionService.submitStock(s,body),'Stock Taking saved'); }
    case 'submitOfftake': { const s=AuthService.requireSession(body.token); return ok_(SubmissionService.submitOfftake(s,body),'Offtake saved'); }
    case 'submitStoreEvidence': { const s=AuthService.requireSession(body.token); return ok_(SubmissionService.submitStoreEvidence(s,body),'Store evidence saved'); }
    case 'completeVisit': { const s=AuthService.requireSession(body.token); return ok_(VisitService.complete(s,body.visit_id),'Visit completed'); }

    case 'getControlCenter': AuthService.requireSession(params.token); return ok_(ControlCenterService.list(params));
    case 'getSubmission': AuthService.requireSession(params.token); return ok_(ControlCenterService.detail(params.submission_id));
    case 'approveSubmission': { const s=AuthService.requireSession(body.token); return ok_(ControlCenterService.approve(s,body.submission_id),'Submission validated'); }
    case 'requestCorrection': { const s=AuthService.requireSession(body.token); return ok_(CorrectionService.create(s,body),'Correction requested'); }
    case 'getCorrections': { const s=AuthService.requireSession(params.token); return ok_(CorrectionService.listForUser(s.user_id)); }
    case 'resolveCorrection': { const s=AuthService.requireSession(body.token); return ok_(CorrectionService.resolve(s,body),'Correction resubmitted'); }

    case 'getDataQuality': AuthService.requireSession(params.token); return ok_(DataQualityService.summary(params));
    case 'getDashboardSummary': AuthService.requireSession(params.token); return ok_(DashboardService.overview(params));
    case 'getRegionalPerformance': AuthService.requireSession(params.token); return ok_(DashboardService.regionalPerformance(params));
    case 'getNCPerformance': AuthService.requireSession(params.token); return ok_(DashboardService.ncPerformance(params.user_id));
    case 'getStorePerformance': AuthService.requireSession(params.token); return ok_(DashboardService.storePerformance(params.store_id));

    case 'seedDemo': { const s=AuthService.requireSession(body.token); return ok_(DemoService.seed(s),'Demo seeded'); }
    case 'resetDemo': { const s=AuthService.requireSession(body.token); return ok_(DemoService.reset(s),'Demo reset'); }

    default: return fail_('NOT_FOUND','Unknown action');
  }
}
