/**
 * Useme Team - Skill Mapping & Proficiency Seed Generator (3-6 skills per member)
 */
(function(exports) {
  const { rInt, pick, pickMultiple, SKILL_CATEGORIES } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const DETAILED_SKILLS_BY_CAT = {
    dev: [
      'TypeScript & Node.js', 'PostgreSQL Optimization', 'Distributed Microservices',
      'React & Modern CSS', 'Redis Caching & PubSub', 'REST & GraphQL APIs',
      'Docker & Kubernetes', 'Payment Gateway Integration', 'Security & OWASP Hardening'
    ],
    data: [
      'SQL & Dimensional Modeling', 'Python Data Analytics', 'Tableau & Metabase BI',
      'Fraud Risk Anomaly Detection', 'Telemetry ETL Pipelines', 'Customer Churn Modeling',
      'Clickstream Telemetry Analysis', 'A/B Testing Statistical Rigor'
    ],
    finance: [
      'Statutory GST Reconciliation', 'Merchant Escrow Accounting', 'Direct Selling Payout Auditing',
      'Corporate Tax Compliance', 'Chargeback & Dispute Arbitration', 'Financial Forecasting & P&L',
      'Bank Webhook Reconciliation', 'Tally ERP Accounting'
    ],
    design: [
      'Figma Design Systems', 'WCAG 2.1 AA Accessibility', 'Packaging Box & Print Dielines',
      'Mobile UX Interaction Design', 'Vector Illustration & Iconography', 'Motion Graphics & Lottie',
      'Typography & Brand Guidelines', 'Marketing Collateral Prototyping'
    ],
    marketing: [
      'Performance Social Advertising', 'Direct Selling Affiliate Networks', 'Growth Funnel Optimization',
      'Influencer Campaign ROI', 'SEO & Content Syndication', 'WhatsApp Business Broadcasts',
      'Retention & Push Telemetry', 'Merchant Referral Loops'
    ],
    support: [
      'High-Severity Incident Management', 'Merchant KYC Verification', 'Dispute Ticket Resolution',
      'Hardware Soundbox Diagnostics', 'Customer Escalation De-escalation', 'Zendesk Workflow Automation',
      'Multi-lingual Phone Support', 'SLA Adherence Tracking'
    ]
  };

  const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  function generateSkills(members) {
    const proficiencies = [];
    const catIds = SKILL_CATEGORIES.map(c => c.id);

    members.forEach(m => {
      const primaryCat = m.skillCategory || 'dev';
      // Pick 3 to 6 categories (always includes primaryCat)
      const otherCats = catIds.filter(c => c !== primaryCat);
      const chosenCount = rInt(3, 5);
      const chosenCats = [primaryCat, ...pickMultiple(otherCats, chosenCount - 1)];

      const memberSkillTags = [];

      chosenCats.forEach((catId, idx) => {
        const isPrimary = (catId === primaryCat);
        const level = isPrimary ? (m.proficiency || pick(['Advanced', 'Expert'])) : pick(LEVELS);
        const skillList = DETAILED_SKILLS_BY_CAT[catId] || [];
        const pickedSkills = pickMultiple(skillList, isPrimary ? 2 : 1);
        memberSkillTags.push(...pickedSkills);

        proficiencies.push({
          id: `sp-${m.id}-${catId}`,
          memberId: m.id,
          categoryId: catId,
          level,
          lastUpdated: `2026-0${rInt(4, 8)}-${String(rInt(1, 28)).padStart(2, '0')}T10:00:00.000Z`,
          updatedBy: isPrimary && m.verified ? 'm1' : m.id
        });
      });

      m.skills = [...new Set(memberSkillTags)].slice(0, 6);
    });

    return {
      skillCategories: SKILL_CATEGORIES,
      skillProficiencies: proficiencies
    };
  }

  exports.SeedSkills = { generateSkills };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
