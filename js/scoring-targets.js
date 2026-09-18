/**
 * Useme Team - Configurable Scoring Targets Resolver
 * Resolution Order: Member Override -> Target Group -> Fallback Default (40)
 */
(function() {
  const DEFAULT_FALLBACK_TARGET = 40;

  function resolveTarget(memberId, category = 'engagement') {
    if (!memberId || memberId === 'all') return DEFAULT_FALLBACK_TARGET;
    const ds = window.DataStore;
    if (!ds) return DEFAULT_FALLBACK_TARGET;

    // 1. Member override
    if (ds.getMemberTargetOverride) {
      const override = ds.getMemberTargetOverride(memberId, category);
      if (override !== null && override !== undefined && !isNaN(Number(override)) && Number(override) > 0) {
        return Number(override);
      }
    }

    // 2. Target Group
    if (ds.getTargetGroups) {
      const groups = ds.getTargetGroups() || [];
      const match = groups.find(g => Array.isArray(g.memberIds) && g.memberIds.includes(memberId));
      if (match && !isNaN(Number(match.targetPoints)) && Number(match.targetPoints) > 0) {
        return Number(match.targetPoints);
      }
    }

    // 3. Fallback default
    return DEFAULT_FALLBACK_TARGET;
  }

  function getTargetResolutionDetails(memberId, category = 'engagement') {
    const ds = window.DataStore;
    if (!memberId || !ds) {
      return { target: DEFAULT_FALLBACK_TARGET, source: 'fallback', label: 'Default (40 pts)' };
    }

    // Check override
    if (ds.getMemberTargetOverride) {
      const override = ds.getMemberTargetOverride(memberId, category);
      if (override !== null && override !== undefined && !isNaN(Number(override)) && Number(override) > 0) {
        return { target: Number(override), source: 'override', label: `Personal Override (${override} pts)` };
      }
    }

    // Check group
    if (ds.getTargetGroups) {
      const groups = ds.getTargetGroups() || [];
      const match = groups.find(g => Array.isArray(g.memberIds) && g.memberIds.includes(memberId));
      if (match && !isNaN(Number(match.targetPoints)) && Number(match.targetPoints) > 0) {
        return { target: Number(match.targetPoints), source: 'group', groupName: match.name, label: `${match.name} (${match.targetPoints} pts)` };
      }
    }

    return { target: DEFAULT_FALLBACK_TARGET, source: 'fallback', label: 'Default (40 pts)' };
  }

  window.SCORING_TARGETS = {
    DEFAULT_FALLBACK_TARGET,
    resolveTarget,
    getTargetResolutionDetails
  };
})();
