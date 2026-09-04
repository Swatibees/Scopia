"use strict";

const STORAGE_KEY = "scopia-project-v1";

const STAGES = [
  { id: 1, name: "Question & scope", short: "Define the review", description: "Turn the research idea into a bounded PCC question and a review that can be completed transparently." },
  { id: 2, name: "Protocol", short: "Pre-specify methods", description: "Record eligibility, information sources, screening, charting and synthesis methods before formal screening begins." },
  { id: 3, name: "Search & import", short: "Build the evidence pool", description: "Document every database search and import bibliographic records without losing their provenance." },
  { id: 4, name: "Screening", short: "Apply the rules", description: "Make and verify title/abstract and full-text decisions against the frozen protocol." },
  { id: 5, name: "Data charting", short: "Structure each study", description: "Extract comparable study, measurement, clinical and outcome information from included sources." },
  { id: 6, name: "Appraisal", short: "Judge the evidence", description: "Record design-appropriate quality judgements without turning unlike studies into one misleading score." },
  { id: 7, name: "Synthesis", short: "Map patterns and gaps", description: "Combine descriptive counts with a careful narrative account of measures, associations and missing evidence." },
  { id: 8, name: "Report & export", short: "Create the research record", description: "Check reporting completeness and export the paper materials, audit trail and verified agent-training examples." }
];

const PRISMA_ITEMS = [
  "Identify the report as a scoping review in the title.",
  "Provide a structured summary.",
  "Explain the rationale in the context of existing evidence.",
  "State the review questions and objectives.",
  "State whether a protocol exists and where it can be accessed.",
  "Specify source-of-evidence eligibility criteria and rationale.",
  "Describe all information sources and the final search date.",
  "Present a reproducible electronic search strategy.",
  "Describe the source-selection process.",
  "Describe the data-charting process.",
  "List and define all data items sought.",
  "Describe any critical appraisal methods and their use.",
  "Describe how charted data were handled and summarised.",
  "Report numbers screened, assessed and included, with exclusion reasons.",
  "Present characteristics of included sources.",
  "Present critical-appraisal results, if undertaken.",
  "Present charting results related to the review questions.",
  "Summarise the evidence, limitations and interpretation.",
  "Discuss limitations of the scoping-review process.",
  "Describe conclusions, implications and next steps."
];

const DEFAULT_TITLE = "Identifying and Monitoring Psychological and Cognitive Difficulties in Youth-Onset Type 2 Diabetes: A Scoping Review";
const DEFAULT_QUESTION = "How have psychological and cognitive difficulties been assessed and monitored in young people with youth-onset type 2 diabetes, and how are these difficulties associated with diabetes-related, physical and functional outcomes?";

function createDefaultState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    meta: { researcher: "", institution: "", projectTitle: DEFAULT_TITLE, createdAt: now, updatedAt: now },
    currentStage: 1,
    completedStages: [],
    protocol: {
      version: 0,
      frozenAt: "",
      title: DEFAULT_TITLE,
      rationale: "",
      aim: "To map how psychological and cognitive functioning has been assessed and monitored in young people with youth-onset type 2 diabetes, examine associations with diabetes-related and physical-health variables, and identify evidence gaps relevant to future longitudinal research.",
      primaryQuestion: DEFAULT_QUESTION,
      population: "People diagnosed with type 2 diabetes during childhood or adolescence.",
      concept: "Psychological and cognitive assessment, monitoring and associated outcomes.",
      context: "Healthcare, community, home and educational settings in any country.",
      ageDefinition: "T2D diagnosed by age 18; follow-up into early adulthood may be included when youth-onset findings remain identifiable.",
      inclusion: "Primary quantitative or mixed-methods studies; confirmed youth-onset T2D; at least one measurable psychological, cognitive, educational or everyday-functioning outcome; T2D results reported separately.",
      exclusion: "Type 1 diabetes without separate T2D results; prediabetes or insulin resistance without confirmed T2D; adult-onset T2D; biomedical-only outcomes; reviews, protocols, editorials and conference abstracts; purely qualitative studies already covered by recent syntheses.",
      studyDesigns: "Cross-sectional, longitudinal, cohort, case-control and intervention studies; relevant mixed-methods studies with extractable quantitative outcomes.",
      languages: "English",
      dateLimits: "Database inception to the final search date.",
      sources: "MEDLINE/PubMed; PsycINFO; Embase; CINAHL; Scopus or Web of Science; backward and forward citation searching.",
      screeningPlan: "Single-reviewer title/abstract and full-text screening using pre-specified criteria; delayed second pass; every full-text exclusion assigned one reason; difficult decisions recorded in the audit log.",
      chartingPlan: "Use a piloted form to extract study characteristics, participant details, T2D definition, outcomes, instruments, respondents, assessment timing, clinical variables, main findings and limitations.",
      appraisalPlan: "Use design-appropriate appraisal criteria. Record domain-level judgements and notes; do not calculate a single score across unlike designs.",
      synthesisPlan: "Summarise study counts, designs, populations, domains, instruments and monitoring intervals descriptively; map associations and evidence gaps narratively; do not infer causality from observational evidence.",
      registrationPlatform: "OSF — Generalized Systematic Review template",
      registrationUrl: "",
      deviations: ""
    },
    searches: [],
    studies: [],
    synthesis: {
      studyLandscape: "",
      mentalHealthFindings: "",
      cognitiveFindings: "",
      longitudinalFindings: "",
      diabetesAssociations: "",
      evidenceGaps: "",
      appImplications: "",
      limitations: ""
    },
    prisma: PRISMA_ITEMS.map(() => false),
    audit: [{ at: now, action: "Project created", detail: "Initial workspace created." }],
    ui: { screeningLevel: "title_abstract", screeningFilter: "unscreened", screeningIndex: 0, chartStudyId: "", appraisalStudyId: "" }
  };
}

let state = loadState();
let toastTimer = null;
let confirmCallback = null;

const setupScreen = document.getElementById("setup-screen");
const app = document.getElementById("app");
const stageContent = document.getElementById("stage-content");
const studyFileInput = document.getElementById("study-file-input");
const backupFileInput = document.getElementById("backup-file-input");

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindGlobalEvents();
  if (state && state.meta && state.meta.researcher) {
    openWorkspace();
  } else {
    state = state || createDefaultState();
    setupScreen.hidden = false;
  }
}

function bindGlobalEvents() {
  document.getElementById("setup-form").addEventListener("submit", event => {
    event.preventDefault();
    state = createDefaultState();
    state.meta.researcher = document.getElementById("setup-researcher").value.trim();
    state.meta.institution = document.getElementById("setup-institution").value.trim();
    state.meta.projectTitle = document.getElementById("setup-project").value.trim();
    state.protocol.title = state.meta.projectTitle;
    saveState();
    openWorkspace();
  });

  document.getElementById("load-from-setup").addEventListener("click", () => backupFileInput.click());
  document.getElementById("load-button").addEventListener("click", () => backupFileInput.click());
  document.getElementById("backup-button").addEventListener("click", exportBackup);
  document.getElementById("export-button").addEventListener("click", () => document.getElementById("export-dialog").showModal());
  document.getElementById("project-settings-button").addEventListener("click", openSettings);
  document.getElementById("complete-stage-button").addEventListener("click", toggleCurrentStageComplete);

  document.getElementById("mobile-menu-button").addEventListener("click", toggleMobileNav);
  backupFileInput.addEventListener("change", importBackup);
  studyFileInput.addEventListener("change", importStudyFile);

  document.getElementById("settings-form").addEventListener("submit", event => {
    event.preventDefault();
    state.meta.researcher = document.getElementById("settings-researcher").value.trim();
    state.meta.institution = document.getElementById("settings-institution").value.trim();
    state.meta.projectTitle = document.getElementById("settings-title").value.trim();
    state.protocol.title = state.meta.projectTitle;
    addAudit("Project details updated", state.meta.projectTitle);
    saveState();
    document.getElementById("settings-dialog").close();
    renderApp();
  });

  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
  });

  document.querySelectorAll("[data-export]").forEach(button => {
    button.addEventListener("click", () => handleExport(button.dataset.export));
  });

  document.getElementById("confirm-yes").addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  });

  stageContent.addEventListener("input", handleStageInput);
  stageContent.addEventListener("change", handleStageChange);
  stageContent.addEventListener("click", handleStageClick);
}

function openWorkspace() {
  setupScreen.hidden = true;
  app.hidden = false;
  renderApp();
}

function renderApp() {
  renderNavigation();
  renderStage();
  document.getElementById("sidebar-researcher").textContent = state.meta.researcher || "Independent researcher";
  const progress = Math.round((state.completedStages.length / STAGES.length) * 100);
  document.getElementById("progress-value").textContent = `${progress}%`;
  document.getElementById("progress-bar").style.width = `${progress}%`;
}

function renderNavigation() {
  const markup = STAGES.map(stage => `
    <button class="stage-link ${state.currentStage === stage.id ? "active" : ""} ${state.completedStages.includes(stage.id) ? "done" : ""}" type="button" data-stage="${stage.id}">
      <span class="stage-number">${state.completedStages.includes(stage.id) ? "✓" : stage.id}</span>
      <span><strong>${escapeHTML(stage.name)}</strong><small>${escapeHTML(stage.short)}</small></span>
    </button>`).join("");
  document.getElementById("stage-nav").innerHTML = markup;
  document.getElementById("mobile-nav").innerHTML = markup;
  document.querySelectorAll("[data-stage]").forEach(button => {
    button.addEventListener("click", () => {
      state.currentStage = Number(button.dataset.stage);
      state.ui.screeningIndex = 0;
      saveState();
      renderApp();
      closeMobileNav();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderStage() {
  const stage = STAGES.find(item => item.id === state.currentStage);
  document.getElementById("stage-eyebrow").textContent = `Stage ${stage.id} of ${STAGES.length}`;
  document.getElementById("stage-title").textContent = stage.name;
  document.getElementById("stage-description").textContent = stage.description;
  document.getElementById("mobile-stage-name").textContent = `${stage.id}. ${stage.name}`;
  const completeButton = document.getElementById("complete-stage-button");
  completeButton.textContent = state.completedStages.includes(stage.id) ? "Mark as in progress" : "Mark stage complete";

  const renderers = [null, renderQuestionStage, renderProtocolStage, renderSearchStage, renderScreeningStage, renderChartingStage, renderAppraisalStage, renderSynthesisStage, renderReportStage];
  stageContent.innerHTML = renderers[stage.id]();
}

function renderQuestionStage() {
  const p = state.protocol;
  const readiness = [
    ["A clearly defined population", p.population.trim().length > 20],
    ["A specific concept covering mental health and cognition", p.concept.trim().length > 20],
    ["A stated context", p.context.trim().length > 10],
    ["A primary question that can guide inclusion decisions", p.primaryQuestion.trim().length > 40]
  ];
  return `
    <div class="callout"><p><strong>Method:</strong> JBI scoping-review methodology uses Population–Concept–Context (PCC). At this stage, define what belongs inside the review before deciding which individual studies you want.</p></div>
    <section class="section">
      <div class="section-heading"><div><h3>Purpose of the review</h3><p>Keep the evidence question separate from the later app-development question.</p></div></div>
      <div class="form-grid">
        ${boundTextarea("Working title", "protocol.title", p.title, "field-wide")}
        ${boundTextarea("Rationale and evidence gap", "protocol.rationale", p.rationale, "field-wide", "What do existing reviews cover, and what remains unanswered?")}
        ${boundTextarea("Review aim", "protocol.aim", p.aim, "field-wide")}
        ${boundTextarea("Primary review question", "protocol.primaryQuestion", p.primaryQuestion, "field-wide")}
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>PCC framework</h3><p>These definitions determine the search and screening rules.</p></div></div>
      <div class="form-grid">
        ${boundTextarea("Population", "protocol.population", p.population)}
        ${boundTextarea("Concept", "protocol.concept", p.concept)}
        ${boundTextarea("Context", "protocol.context", p.context)}
        ${boundTextarea("Working age definition", "protocol.ageDefinition", p.ageDefinition)}
      </div>
    </section>
    <section class="section split-layout">
      <div class="panel">
        <h3>Scope readiness</h3>
        <ul class="readiness-list">${readiness.map(([label, ready]) => `<li class="readiness-item ${ready ? "ready" : ""}"><span class="status-mark">${ready ? "✓" : "○"}</span><span>${escapeHTML(label)}</span></li>`).join("")}</ul>
      </div>
      <div class="panel">
        <h3>Boundary for this paper</h3>
        <p class="panel-note">The review maps outcomes, measures, monitoring and associations. It does not diagnose young people, select an app threshold or train a clinical prediction model.</p>
      </div>
    </section>`;
}

function renderProtocolStage() {
  const p = state.protocol;
  return `
    <div class="callout ${p.frozenAt ? "" : "callout-warning"}"><p><strong>${p.frozenAt ? `Protocol version ${p.version} frozen` : "Protocol not yet frozen"}:</strong> ${p.frozenAt ? `Frozen ${formatDateTime(p.frozenAt)}. Later changes must be recorded as deviations.` : "Pilot these rules, revise them, and freeze a dated version before formal screening."}</p></div>
    <section class="section">
      <div class="section-heading"><div><h3>Eligibility</h3><p>Write operational rules that another reviewer could apply.</p></div></div>
      <div class="form-grid">
        ${boundTextarea("Inclusion criteria", "protocol.inclusion", p.inclusion, "field-wide")}
        ${boundTextarea("Exclusion criteria", "protocol.exclusion", p.exclusion, "field-wide")}
        ${boundTextarea("Eligible study designs", "protocol.studyDesigns", p.studyDesigns)}
        ${boundInput("Language limits", "protocol.languages", p.languages)}
        ${boundInput("Date limits", "protocol.dateLimits", p.dateLimits)}
        ${boundTextarea("Information sources", "protocol.sources", p.sources)}
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>Planned methods</h3><p>Record the process before seeing the final results.</p></div></div>
      <div class="form-grid">
        ${boundTextarea("Screening plan", "protocol.screeningPlan", p.screeningPlan, "field-wide")}
        ${boundTextarea("Data-charting plan", "protocol.chartingPlan", p.chartingPlan, "field-wide")}
        ${boundTextarea("Appraisal plan", "protocol.appraisalPlan", p.appraisalPlan, "field-wide")}
        ${boundTextarea("Synthesis plan", "protocol.synthesisPlan", p.synthesisPlan, "field-wide")}
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>Registration and deviations</h3><p>OSF provides a time-stamped record of the planned methods.</p></div></div>
      <div class="form-grid">
        ${boundInput("Registration platform", "protocol.registrationPlatform", p.registrationPlatform)}
        ${boundInput("Registration URL", "protocol.registrationUrl", p.registrationUrl, "url", "Paste after registration")}
        ${boundTextarea("Protocol deviations", "protocol.deviations", p.deviations, "field-wide", "Record what changed, when, why, and whether results had been seen.")}
      </div>
      <div class="inline-actions top-gap">
        <button class="button button-primary" type="button" data-action="freeze-protocol">${p.frozenAt ? "Freeze a new version" : "Freeze protocol version 1"}</button>
        <button class="button button-outline" type="button" data-action="export-protocol">Export protocol</button>
      </div>
    </section>`;
}

function renderSearchStage() {
  const rows = state.searches.length ? state.searches.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.database)}</strong><br><span class="faint">${escapeHTML(item.platform || "")}</span></td>
      <td>${escapeHTML(item.date || "—")}</td>
      <td>${escapeHTML(String(item.results || 0))}</td>
      <td>${escapeHTML(item.query)}</td>
      <td><button class="button button-outline button-small" type="button" data-action="delete-search" data-id="${item.id}">Remove</button></td>
    </tr>`).join("") : `<tr><td colspan="5">No searches logged yet.</td></tr>`;

  return `
    <div class="callout"><p><strong>Reproducibility rule:</strong> preserve the exact search string, database/platform, date and number returned. Do not overwrite an old search when you update it.</p></div>
    <section class="section panel">
      <div class="section-heading"><div><h3>Add a database search</h3><p>Each rerun becomes a separate dated entry.</p></div></div>
      <form id="search-form" class="form-grid">
        <label class="field"><span>Database</span><input id="search-database" required placeholder="e.g. MEDLINE"></label>
        <label class="field"><span>Platform</span><input id="search-platform" placeholder="e.g. Ovid"></label>
        <label class="field"><span>Search date</span><input id="search-date" type="date" required></label>
        <label class="field"><span>Results returned</span><input id="search-results" type="number" min="0" required></label>
        <label class="field field-wide"><span>Exact search string</span><textarea id="search-query" required placeholder="Paste the complete database-specific query"></textarea></label>
        <label class="field field-wide"><span>Notes</span><textarea id="search-notes" placeholder="Limits, filters, alerts or corrections"></textarea></label>
        <div><button class="button button-primary" type="submit">Add search entry</button></div>
      </form>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>Search log</h3><p>${state.searches.length} ${plural(state.searches.length, "entry", "entries")}</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Source</th><th>Date</th><th>Results</th><th>Search string</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>
    <section class="section split-layout">
      <div class="panel">
        <h3>Import study records</h3>
        <p class="panel-note">Import a database export in RIS or CSV format. CSV headers can include title, abstract, authors, year, DOI, database and source.</p>
        <button class="button button-primary" type="button" data-action="choose-study-file">Choose RIS or CSV</button>
        <p class="text-small muted top-gap">${state.studies.length} unique ${plural(state.studies.length, "record", "records")} currently in the evidence pool.</p>
      </div>
      <div class="panel">
        <h3>Add one record manually</h3>
        <form id="manual-study-form" class="inline-form">
          <input id="manual-title" required placeholder="Article title">
          <textarea id="manual-abstract" placeholder="Abstract"></textarea>
          <div class="form-grid">
            <input id="manual-year" placeholder="Year">
            <input id="manual-doi" placeholder="DOI">
          </div>
          <button class="button button-outline" type="submit">Add record</button>
        </form>
      </div>
    </section>`;
}

function renderScreeningStage() {
  const level = state.ui.screeningLevel;
  const filter = state.ui.screeningFilter;
  const eligibleForLevel = level === "title_abstract" ? state.studies : state.studies.filter(study => study.taDecision === "include");
  const decisionKey = level === "title_abstract" ? "taDecision" : "fullDecision";
  const filtered = eligibleForLevel.filter(study => filter === "all" || (filter === "unscreened" ? !study[decisionKey] : study[decisionKey] === filter));
  if (state.ui.screeningIndex >= filtered.length) state.ui.screeningIndex = Math.max(0, filtered.length - 1);
  const current = filtered[state.ui.screeningIndex];
  const stats = screeningStats(level);

  let card = `<div class="empty-state"><h3>${state.studies.length ? "No records match this view" : "Import records before screening"}</h3><p>${state.studies.length ? "Change the filter or screening level to continue." : "Use Stage 3 to import RIS/CSV records or add studies manually."}</p></div>`;
  if (current) {
    const decision = current[decisionKey] || "";
    const reasonKey = level === "title_abstract" ? "taReason" : "fullReason";
    const notesKey = level === "title_abstract" ? "taNotes" : "fullNotes";
    const verifiedKey = level === "title_abstract" ? "taVerified" : "fullVerified";
    card = `
      <article class="screening-card" data-study-id="${current.id}">
        <div class="screening-meta">
          <span>Record ${state.ui.screeningIndex + 1} of ${filtered.length}</span>
          <span>${escapeHTML(current.year || "Year unknown")}</span>
          <span>${escapeHTML(current.database || current.source || "Source unknown")}</span>
          ${current.doi ? `<span>${escapeHTML(current.doi)}</span>` : ""}
        </div>
        <h3>${escapeHTML(current.title || "Untitled record")}</h3>
        <p class="abstract">${escapeHTML(current.abstract || "No abstract was imported. Locate the abstract or move to full-text review if appropriate.")}</p>
        ${level === "full_text" ? `<label class="field top-gap"><span>Full-text URL or location</span><input data-study-field="fullTextUrl" value="${escapeAttribute(current.fullTextUrl || "")}" placeholder="DOI link, library link or file note"></label>` : ""}
        <div class="decision-row" role="group" aria-label="Screening decision">
          ${decisionButton("include", "Include", decision)}
          ${decisionButton("exclude", "Exclude", decision)}
          ${decisionButton("maybe", "Uncertain", decision)}
        </div>
        <div class="form-grid">
          <label class="field"><span>Decision reason</span><input data-study-field="${reasonKey}" value="${escapeAttribute(current[reasonKey] || "")}" placeholder="Required for exclusions; useful for uncertain cases"></label>
          <label class="field"><span>Screening notes</span><textarea data-study-field="${notesKey}" placeholder="Evidence used for this decision">${escapeHTML(current[notesKey] || "")}</textarea></label>
          <label class="checklist-item field-wide"><input type="checkbox" data-study-check="${verifiedKey}" ${current[verifiedKey] ? "checked" : ""}><span>I completed a delayed recheck of this decision.</span></label>
        </div>
        <div class="screen-nav">
          <button class="button button-outline" type="button" data-action="previous-screen">Previous</button>
          <button class="button button-primary" type="button" data-action="next-screen">Next record</button>
        </div>
      </article>`;
  }

  return `
    <div class="metric-grid">
      <div class="metric"><strong>${stats.total}</strong><span>Eligible for this stage</span></div>
      <div class="metric green"><strong>${stats.include}</strong><span>Included</span></div>
      <div class="metric red"><strong>${stats.exclude}</strong><span>Excluded</span></div>
      <div class="metric yellow"><strong>${stats.unscreened}</strong><span>Not decided</span></div>
    </div>
    <div class="filter-row">
      <label>Screening level<select id="screening-level"><option value="title_abstract" ${level === "title_abstract" ? "selected" : ""}>Title and abstract</option><option value="full_text" ${level === "full_text" ? "selected" : ""}>Full text</option></select></label>
      <label>Show<select id="screening-filter"><option value="unscreened" ${filter === "unscreened" ? "selected" : ""}>Unscreened</option><option value="all" ${filter === "all" ? "selected" : ""}>All</option><option value="include" ${filter === "include" ? "selected" : ""}>Included</option><option value="exclude" ${filter === "exclude" ? "selected" : ""}>Excluded</option><option value="maybe" ${filter === "maybe" ? "selected" : ""}>Uncertain</option></select></label>
    </div>
    ${level === "full_text" ? `<div class="callout"><p><strong>Full-text rule:</strong> assign one explicit reason to every excluded source. Keep the reason factual and aligned with the registered criteria.</p></div>` : ""}
    ${card}`;
}

function renderChartingStage() {
  const included = includedStudies();
  if (!included.length) return `<div class="empty-state"><h3>No full-text inclusions yet</h3><p>Studies appear here after they receive an “Include” decision at full-text screening.</p><button class="button button-outline" type="button" data-action="go-screening">Go to screening</button></div>`;
  if (!included.some(study => study.id === state.ui.chartStudyId)) state.ui.chartStudyId = included[0].id;
  const study = included.find(item => item.id === state.ui.chartStudyId);
  const c = study.charting || emptyCharting();
  const completed = included.filter(item => chartingCompleteness(item.charting) >= 5).length;
  return `
    <div class="metric-grid">
      <div class="metric"><strong>${included.length}</strong><span>Included studies</span></div>
      <div class="metric accent"><strong>${completed}</strong><span>Substantially charted</span></div>
      <div class="metric"><strong>${Math.round(chartingCompleteness(c) / 10 * 100)}%</strong><span>Current form complete</span></div>
      <div class="metric"><strong>${uniqueMeasures().length}</strong><span>Measures identified</span></div>
    </div>
    <section class="section">
      <div class="filter-row"><label>Study<select id="chart-study-select">${included.map(item => `<option value="${item.id}" ${item.id === study.id ? "selected" : ""}>${escapeHTML(shorten(item.title, 78))}</option>`).join("")}</select></label></div>
      <div class="callout"><p><strong>Chart facts, not interpretations:</strong> record what the paper reports. Put your later cross-study interpretation in Stage 7.</p></div>
      <div class="form-grid" data-chart-study="${study.id}">
        ${studyTextarea("Citation / study label", "citation", c.citation || `${study.authors || ""} ${study.year || ""}`)}
        ${studyInput("Country and setting", "country", c.country)}
        ${studyInput("Study design", "design", c.design)}
        ${studyInput("Sample size", "sampleSize", c.sampleSize)}
        ${studyTextarea("Participant ages and characteristics", "participants", c.participants)}
        ${studyTextarea("Youth-onset T2D definition", "t2dDefinition", c.t2dDefinition)}
        ${studyTextarea("Psychological domains", "psychDomains", c.psychDomains, "Comma-separated domains")}
        ${studyTextarea("Cognitive / functional domains", "cogDomains", c.cogDomains, "Comma-separated domains")}
        ${studyTextarea("Measures and respondents", "measures", c.measures, "Name, version, reporter, cut-off and recall period where available")}
        ${studyTextarea("Assessment timing / follow-up", "followUp", c.followUp)}
        ${studyTextarea("Diabetes and physical variables", "clinicalVariables", c.clinicalVariables)}
        ${studyTextarea("Main findings and effect estimates", "findings", c.findings, "Preserve direction, uncertainty and adjusted/unadjusted status")}
        ${studyTextarea("Authors’ limitations", "limitations", c.limitations)}
        ${studyTextarea("Your extraction notes", "notes", c.notes)}
      </div>
    </section>`;
}

function renderAppraisalStage() {
  const included = includedStudies();
  if (!included.length) return `<div class="empty-state"><h3>No studies available for appraisal</h3><p>Complete full-text screening before applying a design-appropriate appraisal tool.</p></div>`;
  if (!included.some(study => study.id === state.ui.appraisalStudyId)) state.ui.appraisalStudyId = included[0].id;
  const study = included.find(item => item.id === state.ui.appraisalStudyId);
  const a = study.appraisal || emptyAppraisal();
  return `
    <div class="callout callout-warning"><p><strong>Do not use this as a substitute for the official checklist:</strong> enter the selected JBI, CASP or other design-appropriate tool, then record transparent domain judgements. Avoid one combined quality score across different designs.</p></div>
    <div class="filter-row"><label>Study<select id="appraisal-study-select">${included.map(item => `<option value="${item.id}" ${item.id === study.id ? "selected" : ""}>${escapeHTML(shorten(item.title, 78))}</option>`).join("")}</select></label></div>
    <section class="panel" data-appraisal-study="${study.id}">
      <div class="form-grid">
        ${appraisalInput("Appraisal tool and version", "tool", a.tool, "e.g. JBI analytical cross-sectional checklist")}
        ${appraisalSelect("Overall status", "status", a.status, ["Not started", "In progress", "Complete"])}
        ${appraisalSelect("Sampling and eligibility", "sampling", a.sampling)}
        ${appraisalSelect("Outcome measurement", "measurement", a.measurement)}
        ${appraisalSelect("Confounding and comparability", "confounding", a.confounding)}
        ${appraisalSelect("Analysis and reporting", "analysis", a.analysis)}
        ${appraisalSelect("Follow-up / missing data", "missingData", a.missingData)}
        ${appraisalTextarea("Appraisal notes and supporting page numbers", "notes", a.notes, "field-wide")}
      </div>
    </section>`;
}

function renderSynthesisStage() {
  const s = state.synthesis;
  const included = includedStudies();
  const designs = countValues(included.map(study => study.charting && study.charting.design));
  const domains = countDomains(included);
  return `
    <div class="metric-grid">
      <div class="metric"><strong>${included.length}</strong><span>Included studies</span></div>
      <div class="metric accent"><strong>${uniqueMeasures().length}</strong><span>Distinct measures</span></div>
      <div class="metric"><strong>${Object.keys(designs).length}</strong><span>Study designs</span></div>
      <div class="metric"><strong>${domains.length}</strong><span>Outcome domains</span></div>
    </div>
    <section class="section split-layout">
      <div class="panel"><h3>Mapped outcome domains</h3><div class="tag-list">${domains.length ? domains.map(([name, count]) => `<span class="tag">${escapeHTML(name)} · ${count}</span>`).join("") : `<span class="muted">Chart psychological and cognitive domains to populate this map.</span>`}</div></div>
      <div class="panel"><h3>Design landscape</h3><div class="tag-list">${Object.keys(designs).length ? Object.entries(designs).map(([name, count]) => `<span class="tag">${escapeHTML(name)} · ${count}</span>`).join("") : `<span class="muted">Chart study designs to populate this view.</span>`}</div></div>
    </section>
    <div class="callout"><p><strong>Synthesis rule:</strong> group findings by question and evidence type. Preserve uncertainty, distinguish association from causation, and identify when several publications reuse the same cohort.</p></div>
    <section class="section form-grid">
      ${boundTextarea("Study landscape", "synthesis.studyLandscape", s.studyLandscape, "field-wide", "Countries, designs, cohorts, sample sizes and representation")}
      ${boundTextarea("Mental-health findings", "synthesis.mentalHealthFindings", s.mentalHealthFindings, "field-wide")}
      ${boundTextarea("Cognitive and functional findings", "synthesis.cognitiveFindings", s.cognitiveFindings, "field-wide")}
      ${boundTextarea("Longitudinal evidence", "synthesis.longitudinalFindings", s.longitudinalFindings, "field-wide")}
      ${boundTextarea("Associations with diabetes and physical health", "synthesis.diabetesAssociations", s.diabetesAssociations, "field-wide")}
      ${boundTextarea("Evidence gaps", "synthesis.evidenceGaps", s.evidenceGaps, "field-wide")}
      ${boundTextarea("Implications for a future dataset and app", "synthesis.appImplications", s.appImplications, "field-wide")}
      ${boundTextarea("Limitations of this review", "synthesis.limitations", s.limitations, "field-wide")}
    </section>`;
}

function renderReportStage() {
  const ta = screeningStats("title_abstract");
  const ft = screeningStats("full_text");
  const verifiedTraining = state.studies.filter(study => study.taDecision && study.taVerified).length;
  const checked = state.prisma.filter(Boolean).length;
  return `
    <div class="metric-grid">
      <div class="metric"><strong>${state.studies.length}</strong><span>Records imported</span></div>
      <div class="metric"><strong>${ta.include}</strong><span>Moved to full text</span></div>
      <div class="metric green"><strong>${ft.include}</strong><span>Studies included</span></div>
      <div class="metric accent"><strong>${verifiedTraining}</strong><span>Verified AI examples</span></div>
    </div>
    <section class="section split-layout">
      <div class="panel">
        <h3>PRISMA flow counts</h3>
        <div class="record-list">
          ${flowRow("Records identified", state.studies.length)}
          ${flowRow("Title/abstract exclusions", ta.exclude)}
          ${flowRow("Reports sought for full text", ta.include)}
          ${flowRow("Full-text exclusions", ft.exclude)}
          ${flowRow("Sources included", ft.include)}
        </div>
      </div>
      <div class="panel">
        <h3>Agent dataset readiness</h3>
        <p class="panel-note">Only delayed-rechecked title/abstract decisions are exported as human-verified training examples.</p>
        <div class="tag-list"><span class="tag green">${verifiedTraining} verified</span><span class="tag yellow">${ta.total - verifiedTraining} awaiting verification</span></div>
        <button class="button button-outline top-gap" type="button" data-action="export-agent">Export JSONL</button>
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>PRISMA-ScR reporting check</h3><p>${checked} of ${PRISMA_ITEMS.length} items marked complete</p></div></div>
      <ul class="checklist">${PRISMA_ITEMS.map((item, index) => `<li class="checklist-item"><input type="checkbox" data-prisma="${index}" ${state.prisma[index] ? "checked" : ""}><span>${index + 1}. ${escapeHTML(item)}</span></li>`).join("")}</ul>
    </section>
    <section class="section">
      <div class="section-heading"><div><h3>Research exports</h3><p>Create portable files at any point; incomplete fields remain visible.</p></div></div>
      <div class="export-grid">
        ${exportButton("protocol", "Protocol", "Markdown")}
        ${exportButton("searches", "Search log", "CSV")}
        ${exportButton("screening", "Screening decisions", "CSV")}
        ${exportButton("charting", "Data charting", "CSV")}
        ${exportButton("agent", "Agent training set", "JSONL")}
        ${exportButton("audit", "Decision audit trail", "CSV")}
        ${exportButton("report", "Review report", "Markdown")}
      </div>
    </section>
    <section class="danger-zone">
      <button class="button button-outline" type="button" data-action="clear-project">Clear this browser project</button>
    </section>`;
}

function handleStageInput(event) {
  const bind = event.target.dataset.bind;
  if (bind) {
    setDeep(state, bind, event.target.value);
    saveState();
    return;
  }
  const studyField = event.target.dataset.studyField;
  if (studyField) {
    const card = event.target.closest("[data-study-id]");
    const study = findStudy(card.dataset.studyId);
    study[studyField] = event.target.value;
    saveState();
    return;
  }
  const chartField = event.target.dataset.chartField;
  if (chartField) {
    const container = event.target.closest("[data-chart-study]");
    const study = findStudy(container.dataset.chartStudy);
    study.charting = study.charting || emptyCharting();
    study.charting[chartField] = event.target.value;
    saveState();
    return;
  }
  const appraisalField = event.target.dataset.appraisalField;
  if (appraisalField) {
    const container = event.target.closest("[data-appraisal-study]");
    const study = findStudy(container.dataset.appraisalStudy);
    study.appraisal = study.appraisal || emptyAppraisal();
    study.appraisal[appraisalField] = event.target.value;
    saveState();
  }
}

function handleStageChange(event) {
  if (event.target.id === "screening-level") {
    state.ui.screeningLevel = event.target.value;
    state.ui.screeningIndex = 0;
    saveState();
    renderStage();
  } else if (event.target.id === "screening-filter") {
    state.ui.screeningFilter = event.target.value;
    state.ui.screeningIndex = 0;
    saveState();
    renderStage();
  } else if (event.target.id === "chart-study-select") {
    state.ui.chartStudyId = event.target.value;
    saveState();
    renderStage();
  } else if (event.target.id === "appraisal-study-select") {
    state.ui.appraisalStudyId = event.target.value;
    saveState();
    renderStage();
  } else if (event.target.dataset.studyCheck) {
    const card = event.target.closest("[data-study-id]");
    const study = findStudy(card.dataset.studyId);
    study[event.target.dataset.studyCheck] = event.target.checked;
    addAudit("Screening verification updated", `${shorten(study.title, 70)} — ${event.target.checked ? "verified" : "verification removed"}`);
    saveState();
  } else if (event.target.dataset.prisma !== undefined) {
    state.prisma[Number(event.target.dataset.prisma)] = event.target.checked;
    saveState();
    renderStage();
  } else {
    handleStageInput(event);
  }
}

function handleStageClick(event) {
  const button = event.target.closest("[data-action], [data-decision], [data-export]");
  if (!button) return;
  const action = button.dataset.action;
  if (button.dataset.export) return handleExport(button.dataset.export);
  if (button.dataset.decision) return setScreeningDecision(button.dataset.decision, button.closest("[data-study-id]").dataset.studyId);

  const actions = {
    "freeze-protocol": freezeProtocol,
    "export-protocol": () => handleExport("protocol"),
    "delete-search": () => deleteSearch(button.dataset.id),
    "choose-study-file": () => studyFileInput.click(),
    "previous-screen": () => moveScreen(-1),
    "next-screen": () => moveScreen(1),
    "go-screening": () => { state.currentStage = 4; saveState(); renderApp(); },
    "export-agent": () => handleExport("agent"),
    "clear-project": clearProject
  };
  if (actions[action]) actions[action]();

  if (event.target.closest("#search-form") && event.target.type === "submit") event.preventDefault();
}

stageContent.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "search-form") addSearchEntry();
  if (event.target.id === "manual-study-form") addManualStudy();
});

function toggleCurrentStageComplete() {
  const id = state.currentStage;
  if (state.completedStages.includes(id)) {
    state.completedStages = state.completedStages.filter(item => item !== id);
    addAudit("Stage reopened", STAGES[id - 1].name);
  } else {
    state.completedStages.push(id);
    addAudit("Stage marked complete", STAGES[id - 1].name);
  }
  saveState();
  renderApp();
}

function freezeProtocol() {
  state.protocol.version += 1;
  state.protocol.frozenAt = new Date().toISOString();
  addAudit("Protocol frozen", `Version ${state.protocol.version}`);
  saveState();
  renderStage();
  showToast(`Protocol version ${state.protocol.version} frozen.`);
}

function addSearchEntry() {
  const entry = {
    id: uid("search"),
    database: valueOf("search-database"),
    platform: valueOf("search-platform"),
    date: valueOf("search-date"),
    results: Number(valueOf("search-results")) || 0,
    query: valueOf("search-query"),
    notes: valueOf("search-notes"),
    createdAt: new Date().toISOString()
  };
  if (!entry.database || !entry.date || !entry.query) return showToast("Add the database, date and exact search string.");
  state.searches.push(entry);
  addAudit("Search logged", `${entry.database}: ${entry.results} results`);
  saveState();
  renderStage();
  showToast("Search entry added.");
}

function deleteSearch(id) {
  const item = state.searches.find(entry => entry.id === id);
  showConfirm("Remove search entry?", `This removes the ${item ? item.database : "selected"} entry from the search log.`, () => {
    state.searches = state.searches.filter(entry => entry.id !== id);
    addAudit("Search entry removed", item ? item.database : id);
    saveState();
    renderStage();
  });
}

function addManualStudy() {
  const study = normaliseStudy({
    title: valueOf("manual-title"),
    abstract: valueOf("manual-abstract"),
    year: valueOf("manual-year"),
    doi: valueOf("manual-doi"),
    database: "Manual entry"
  });
  if (!study.title) return showToast("Add an article title.");
  const added = mergeStudies([study]);
  saveState();
  renderStage();
  showToast(added ? "Study record added." : "That record already exists.");
}

async function importStudyFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const lower = file.name.toLowerCase();
    const records = lower.endsWith(".ris") || /(^|\n)TY  - /m.test(text) ? parseRIS(text) : parseCSVRecords(text);
    const before = state.studies.length;
    mergeStudies(records);
    const added = state.studies.length - before;
    addAudit("Study records imported", `${file.name}: ${added} new of ${records.length} parsed`);
    saveState();
    renderStage();
    showToast(`${added} new ${plural(added, "record", "records")} imported; ${records.length - added} ${plural(records.length - added, "duplicate", "duplicates")} skipped.`);
  } catch (error) {
    showToast("The file could not be imported. Check that it is a valid RIS or CSV export.");
  } finally {
    event.target.value = "";
  }
}

function parseRIS(text) {
  const records = [];
  let current = {};
  let currentTag = "";
  const multi = { AU: [], KW: [] };
  const pushCurrent = () => {
    if (!Object.keys(current).length) return;
    const authors = current.AU || [];
    records.push(normaliseStudy({
      title: current.TI || current.T1 || current.CT || "",
      abstract: current.AB || current.N2 || "",
      authors: Array.isArray(authors) ? authors.join("; ") : authors,
      year: String(current.PY || current.Y1 || "").slice(0, 4),
      doi: current.DO || "",
      source: current.JO || current.JF || current.T2 || "",
      database: current.DB || "RIS import",
      externalId: current.ID || current.AN || ""
    }));
    current = {};
    currentTag = "";
  };
  text.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([A-Z0-9]{2})  - (.*)$/);
    if (match) {
      const [, tag, raw] = match;
      const value = raw.trim();
      if (tag === "ER") return pushCurrent();
      currentTag = tag;
      if (multi[tag]) {
        if (!current[tag]) current[tag] = [];
        current[tag].push(value);
      } else if (current[tag]) {
        current[tag] += ` ${value}`;
      } else {
        current[tag] = value;
      }
    } else if (line.trim() && currentTag && !Array.isArray(current[currentTag])) {
      current[currentTag] = `${current[currentTag] || ""} ${line.trim()}`.trim();
    }
  });
  pushCurrent();
  return records.filter(record => record.title);
}

function parseCSVRecords(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(header => normaliseHeader(header));
  return rows.slice(1).filter(row => row.some(Boolean)).map(row => {
    const data = {};
    headers.forEach((header, index) => { data[header] = row[index] || ""; });
    return normaliseStudy({
      title: data.title || data.articletitle || data.documenttitle,
      abstract: data.abstract || data.abstractnote || data.description,
      authors: data.authors || data.author,
      year: data.year || data.publicationyear || data.date,
      doi: data.doi,
      source: data.source || data.journal || data.publicationtitle,
      database: data.database || "CSV import",
      externalId: data.id || data.accessionnumber
    });
  }).filter(record => record.title);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function normaliseHeader(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

function normaliseStudy(raw) {
  return {
    id: uid("study"),
    title: cleanText(raw.title), abstract: cleanText(raw.abstract), authors: cleanText(raw.authors),
    year: String(raw.year || "").match(/\d{4}/)?.[0] || "", doi: cleanDOI(raw.doi),
    source: cleanText(raw.source), database: cleanText(raw.database), externalId: cleanText(raw.externalId),
    fullTextUrl: "", taDecision: "", taReason: "", taNotes: "", taVerified: false, taUpdated: "",
    fullDecision: "", fullReason: "", fullNotes: "", fullVerified: false, fullUpdated: "",
    charting: emptyCharting(), appraisal: emptyAppraisal(), importedAt: new Date().toISOString()
  };
}

function mergeStudies(records) {
  let added = 0;
  records.forEach(record => {
    const duplicate = state.studies.some(existing => {
      if (record.doi && existing.doi) return cleanDOI(record.doi) === cleanDOI(existing.doi);
      return normaliseTitle(record.title) === normaliseTitle(existing.title);
    });
    if (!duplicate && record.title) { state.studies.push(record); added += 1; }
  });
  return added;
}

function setScreeningDecision(decision, studyId) {
  const study = findStudy(studyId);
  const level = state.ui.screeningLevel;
  const key = level === "title_abstract" ? "taDecision" : "fullDecision";
  const verifiedKey = level === "title_abstract" ? "taVerified" : "fullVerified";
  const updatedKey = level === "title_abstract" ? "taUpdated" : "fullUpdated";
  study[key] = decision;
  study[verifiedKey] = false;
  study[updatedKey] = new Date().toISOString();
  addAudit("Screening decision", `${level}: ${decision} — ${shorten(study.title, 90)}`);
  saveState();
  renderStage();
}

function moveScreen(direction) {
  const level = state.ui.screeningLevel;
  const filter = state.ui.screeningFilter;
  const key = level === "title_abstract" ? "taDecision" : "fullDecision";
  const base = level === "title_abstract" ? state.studies : state.studies.filter(study => study.taDecision === "include");
  const filtered = base.filter(study => filter === "all" || (filter === "unscreened" ? !study[key] : study[key] === filter));
  if (!filtered.length) return;
  state.ui.screeningIndex = Math.max(0, Math.min(filtered.length - 1, state.ui.screeningIndex + direction));
  saveState();
  renderStage();
}

function screeningStats(level) {
  const key = level === "title_abstract" ? "taDecision" : "fullDecision";
  const studies = level === "title_abstract" ? state.studies : state.studies.filter(study => study.taDecision === "include");
  return {
    total: studies.length,
    include: studies.filter(study => study[key] === "include").length,
    exclude: studies.filter(study => study[key] === "exclude").length,
    maybe: studies.filter(study => study[key] === "maybe").length,
    unscreened: studies.filter(study => !study[key]).length
  };
}

function includedStudies() { return state.studies.filter(study => study.fullDecision === "include"); }

function emptyCharting() {
  return { citation: "", country: "", design: "", sampleSize: "", participants: "", t2dDefinition: "", psychDomains: "", cogDomains: "", measures: "", followUp: "", clinicalVariables: "", findings: "", limitations: "", notes: "" };
}

function emptyAppraisal() {
  return { tool: "", status: "Not started", sampling: "Not assessed", measurement: "Not assessed", confounding: "Not assessed", analysis: "Not assessed", missingData: "Not assessed", notes: "" };
}

function chartingCompleteness(charting) {
  if (!charting) return 0;
  const keys = ["country", "design", "sampleSize", "participants", "t2dDefinition", "psychDomains", "cogDomains", "measures", "followUp", "findings"];
  return keys.filter(key => String(charting[key] || "").trim()).length;
}

function uniqueMeasures() {
  const measures = [];
  includedStudies().forEach(study => splitTerms(study.charting && study.charting.measures).forEach(term => measures.push(term)));
  return [...new Set(measures.map(term => term.toLowerCase()))];
}

function countDomains(studies) {
  const terms = [];
  studies.forEach(study => {
    splitTerms(study.charting && study.charting.psychDomains).forEach(term => terms.push(term));
    splitTerms(study.charting && study.charting.cogDomains).forEach(term => terms.push(term));
  });
  const counts = countValues(terms);
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function countValues(values) {
  return values.filter(Boolean).reduce((acc, value) => {
    const key = cleanText(value);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function splitTerms(value) {
  return String(value || "").split(/[;,\n]/).map(item => item.trim()).filter(Boolean);
}

function handleExport(type) {
  const handlers = {
    protocol: () => downloadText(`${slugify(state.meta.projectTitle)}-protocol.md`, buildProtocolMarkdown(), "text/markdown"),
    searches: () => downloadText(`${slugify(state.meta.projectTitle)}-search-log.csv`, buildSearchCSV(), "text/csv"),
    screening: () => downloadText(`${slugify(state.meta.projectTitle)}-screening.csv`, buildScreeningCSV(), "text/csv"),
    charting: () => downloadText(`${slugify(state.meta.projectTitle)}-data-charting.csv`, buildChartingCSV(), "text/csv"),
    agent: exportAgentDataset,
    audit: () => downloadText(`${slugify(state.meta.projectTitle)}-decision-audit.csv`, buildAuditCSV(), "text/csv"),
    report: () => downloadText(`${slugify(state.meta.projectTitle)}-review-report.md`, buildReportMarkdown(), "text/markdown")
  };
  if (handlers[type]) handlers[type]();
}

function buildProtocolMarkdown() {
  const p = state.protocol;
  return `# ${p.title || state.meta.projectTitle}\n\n` +
    `**Researcher:** ${state.meta.researcher}\n\n**Institution:** ${state.meta.institution || "Independent researcher"}\n\n` +
    `**Protocol version:** ${p.version || "Draft"}\n\n**Frozen:** ${p.frozenAt ? formatDateTime(p.frozenAt) : "Not frozen"}\n\n` +
    `## Rationale and evidence gap\n\n${p.rationale || "Not yet completed."}\n\n` +
    `## Aim\n\n${p.aim}\n\n## Primary review question\n\n${p.primaryQuestion}\n\n` +
    `## Population–Concept–Context\n\n- **Population:** ${p.population}\n- **Concept:** ${p.concept}\n- **Context:** ${p.context}\n- **Age definition:** ${p.ageDefinition}\n\n` +
    `## Eligibility criteria\n\n### Include\n\n${p.inclusion}\n\n### Exclude\n\n${p.exclusion}\n\n` +
    `- **Study designs:** ${p.studyDesigns}\n- **Languages:** ${p.languages}\n- **Date limits:** ${p.dateLimits}\n\n` +
    `## Information sources\n\n${p.sources}\n\n## Screening plan\n\n${p.screeningPlan}\n\n` +
    `## Data-charting plan\n\n${p.chartingPlan}\n\n## Critical-appraisal plan\n\n${p.appraisalPlan}\n\n` +
    `## Synthesis plan\n\n${p.synthesisPlan}\n\n## Registration\n\n- **Platform:** ${p.registrationPlatform}\n- **URL:** ${p.registrationUrl || "Not yet registered"}\n\n` +
    `## Protocol deviations\n\n${p.deviations || "None recorded."}\n`;
}

function buildSearchCSV() {
  return toCSV(["database", "platform", "date", "results", "exact_search_string", "notes"], state.searches.map(item => [item.database, item.platform, item.date, item.results, item.query, item.notes]));
}

function buildScreeningCSV() {
  const headers = ["id", "title", "abstract", "authors", "year", "doi", "source", "database", "title_abstract_decision", "title_abstract_reason", "title_abstract_notes", "title_abstract_verified", "full_text_decision", "full_text_reason", "full_text_notes", "full_text_verified", "full_text_location"];
  const rows = state.studies.map(study => [study.id, study.title, study.abstract, study.authors, study.year, study.doi, study.source, study.database, study.taDecision, study.taReason, study.taNotes, study.taVerified, study.fullDecision, study.fullReason, study.fullNotes, study.fullVerified, study.fullTextUrl]);
  return toCSV(headers, rows);
}

function buildChartingCSV() {
  const keys = Object.keys(emptyCharting());
  const headers = ["id", "title", "doi", ...keys];
  const rows = includedStudies().map(study => [study.id, study.title, study.doi, ...keys.map(key => (study.charting || {})[key] || "")]);
  return toCSV(headers, rows);
}

function buildAuditCSV() {
  return toCSV(["timestamp", "action", "detail"], state.audit.map(item => [item.at, item.action, item.detail]));
}

function exportAgentDataset() {
  const verified = state.studies.filter(study => study.taDecision && study.taVerified);
  if (!verified.length) return showToast("No verified title/abstract decisions are ready for agent export.");
  const p = state.protocol;
  const lines = verified.map(study => JSON.stringify({
    schema_version: "scopia-screening-v1",
    task: "title_abstract_screening",
    example_id: study.id,
    input: {
      title: study.title,
      abstract: study.abstract,
      review_scope: { population: p.population, concept: p.concept, context: p.context, inclusion_criteria: p.inclusion, exclusion_criteria: p.exclusion }
    },
    target: { decision: study.taDecision, reason: study.taReason || "", notes: study.taNotes || "" },
    provenance: { human_verified: true, protocol_version: p.version, decision_updated_at: study.taUpdated || "", exported_at: new Date().toISOString() }
  })).join("\n");
  downloadText(`${slugify(state.meta.projectTitle)}-agent-screening.jsonl`, `${lines}\n`, "application/jsonl");
}

function buildReportMarkdown() {
  const ta = screeningStats("title_abstract");
  const ft = screeningStats("full_text");
  const s = state.synthesis;
  return `# ${state.meta.projectTitle}\n\n**Researcher:** ${state.meta.researcher}\n\n` +
    `## Review question\n\n${state.protocol.primaryQuestion}\n\n` +
    `## Methods summary\n\n${state.protocol.screeningPlan}\n\n${state.protocol.chartingPlan}\n\n${state.protocol.synthesisPlan}\n\n` +
    `## PRISMA flow counts\n\n- Records imported: ${state.studies.length}\n- Title/abstract included: ${ta.include}\n- Title/abstract excluded: ${ta.exclude}\n- Full-text included: ${ft.include}\n- Full-text excluded: ${ft.exclude}\n\n` +
    `## Study landscape\n\n${s.studyLandscape || "Not yet completed."}\n\n` +
    `## Mental-health findings\n\n${s.mentalHealthFindings || "Not yet completed."}\n\n` +
    `## Cognitive and functional findings\n\n${s.cognitiveFindings || "Not yet completed."}\n\n` +
    `## Longitudinal evidence\n\n${s.longitudinalFindings || "Not yet completed."}\n\n` +
    `## Diabetes and physical-health associations\n\n${s.diabetesAssociations || "Not yet completed."}\n\n` +
    `## Evidence gaps\n\n${s.evidenceGaps || "Not yet completed."}\n\n` +
    `## Implications for future data and app development\n\n${s.appImplications || "Not yet completed."}\n\n` +
    `## Review limitations\n\n${s.limitations || "Not yet completed."}\n\n` +
    `## Protocol deviations\n\n${state.protocol.deviations || "None recorded."}\n`;
}

function exportBackup() {
  downloadText(`${slugify(state.meta.projectTitle)}-scopia-backup.json`, JSON.stringify(state, null, 2), "application/json");
}

async function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const loaded = JSON.parse(await file.text());
    if (!loaded.meta || !loaded.protocol || !Array.isArray(loaded.studies)) throw new Error("Invalid Scopia backup");
    state = migrateState(loaded);
    saveState();
    openWorkspace();
    showToast("Scopia backup loaded.");
  } catch (error) {
    showToast("That file is not a valid Scopia backup.");
  } finally {
    event.target.value = "";
  }
}

function migrateState(loaded) {
  const base = createDefaultState();
  return {
    ...base,
    ...loaded,
    meta: { ...base.meta, ...(loaded.meta || {}) },
    protocol: { ...base.protocol, ...(loaded.protocol || {}) },
    synthesis: { ...base.synthesis, ...(loaded.synthesis || {}) },
    ui: { ...base.ui, ...(loaded.ui || {}) },
    prisma: Array.isArray(loaded.prisma) ? PRISMA_ITEMS.map((_, index) => Boolean(loaded.prisma[index])) : base.prisma,
    searches: Array.isArray(loaded.searches) ? loaded.searches : [],
    studies: Array.isArray(loaded.studies) ? loaded.studies.map(study => ({ ...normaliseStudy(study), ...study, charting: { ...emptyCharting(), ...(study.charting || {}) }, appraisal: { ...emptyAppraisal(), ...(study.appraisal || {}) } })) : [],
    audit: Array.isArray(loaded.audit) ? loaded.audit : base.audit
  };
}

function openSettings() {
  document.getElementById("settings-researcher").value = state.meta.researcher;
  document.getElementById("settings-institution").value = state.meta.institution;
  document.getElementById("settings-title").value = state.meta.projectTitle;
  document.getElementById("settings-dialog").showModal();
}

function clearProject() {
  showConfirm("Clear this browser project?", "Export a backup first if you may need this work. Clearing cannot be undone in this browser.", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    app.hidden = true;
    setupScreen.hidden = false;
    document.getElementById("setup-researcher").value = "";
    document.getElementById("setup-institution").value = "";
    document.getElementById("setup-project").value = DEFAULT_TITLE;
  });
}

function showConfirm(title, message, callback) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  confirmCallback = callback;
  document.getElementById("confirm-dialog").showModal();
}

function saveState() {
  if (!state) return;
  state.meta.updatedAt = new Date().toISOString();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { showToast("Browser storage is full. Export a backup before continuing."); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateState(JSON.parse(raw)) : null;
  } catch (error) { return null; }
}

function addAudit(action, detail) {
  state.audit.push({ at: new Date().toISOString(), action, detail });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function toggleMobileNav() {
  const nav = document.getElementById("mobile-nav");
  const button = document.getElementById("mobile-menu-button");
  nav.hidden = !nav.hidden;
  button.setAttribute("aria-expanded", String(!nav.hidden));
}

function closeMobileNav() {
  document.getElementById("mobile-nav").hidden = true;
  document.getElementById("mobile-menu-button").setAttribute("aria-expanded", "false");
}

function boundInput(label, path, value, type = "text", placeholder = "") {
  return `<label class="field"><span>${escapeHTML(label)}</span><input type="${type}" data-bind="${path}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}"></label>`;
}

function boundTextarea(label, path, value, classes = "", placeholder = "") {
  return `<label class="field ${classes}"><span>${escapeHTML(label)}</span><textarea data-bind="${path}" placeholder="${escapeAttribute(placeholder)}">${escapeHTML(value)}</textarea></label>`;
}

function studyInput(label, field, value) {
  return `<label class="field"><span>${escapeHTML(label)}</span><input data-chart-field="${field}" value="${escapeAttribute(value)}"></label>`;
}

function studyTextarea(label, field, value, placeholder = "") {
  return `<label class="field"><span>${escapeHTML(label)}</span><textarea data-chart-field="${field}" placeholder="${escapeAttribute(placeholder)}">${escapeHTML(value)}</textarea></label>`;
}

function appraisalInput(label, field, value, placeholder = "") {
  return `<label class="field"><span>${escapeHTML(label)}</span><input data-appraisal-field="${field}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}"></label>`;
}

function appraisalTextarea(label, field, value, classes = "") {
  return `<label class="field ${classes}"><span>${escapeHTML(label)}</span><textarea data-appraisal-field="${field}">${escapeHTML(value)}</textarea></label>`;
}

function appraisalSelect(label, field, value, options = ["Not assessed", "Yes", "No", "Unclear", "Not applicable"]) {
  return `<label class="field"><span>${escapeHTML(label)}</span><select data-appraisal-field="${field}">${options.map(option => `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}</select></label>`;
}

function decisionButton(value, label, selected) {
  return `<button class="decision-button ${selected === value ? "selected" : ""}" type="button" data-decision="${value}">${label}</button>`;
}

function exportButton(type, label, format) {
  return `<button class="export-option" type="button" data-export="${type}"><strong>${escapeHTML(label)}</strong><span>${escapeHTML(format)}</span></button>`;
}

function flowRow(label, value) {
  return `<div class="record-row"><strong>${escapeHTML(label)}</strong><span></span><span>${value}</span><span></span></div>`;
}

function setDeep(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((current, key) => current[key], object);
  target[last] = value;
}

function findStudy(id) { return state.studies.find(study => study.id === id); }
function valueOf(id) { return document.getElementById(id)?.value.trim() || ""; }
function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function plural(number, singular, pluralForm) { return number === 1 ? singular : pluralForm; }
function cleanText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function cleanDOI(value) { return cleanText(value).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").toLowerCase(); }
function normaliseTitle(value) { return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function shorten(value, length) { const text = cleanText(value); return text.length > length ? `${text.slice(0, length - 1)}…` : text; }
function formatDateTime(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

function slugify(value) {
  return String(value || "scopia-review").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "scopia-review";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttribute(value) { return escapeHTML(value).replace(/`/g, "&#096;"); }

function toCSV(headers, rows) {
  const encode = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(encode).join(","), ...rows.map(row => row.map(encode).join(","))].join("\r\n") + "\r\n";
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  showToast(`${filename} exported.`);
}
