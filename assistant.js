const resumeInput = document.querySelector("#resumeText");
const jobInput = document.querySelector("#jobText");
const analyzeBtn = document.querySelector("#analyzeBtn");
const clearBtn = document.querySelector("#clearBtn");
const loadSampleBtn = document.querySelector("#loadSampleBtn");
const copyReportBtn = document.querySelector("#copyReportBtn");
const generateDraftBtn = document.querySelector("#generateDraftBtn");
const copyDraftBtn = document.querySelector("#copyDraftBtn");
const scoreValue = document.querySelector("#scoreValue");
const scoreRing = document.querySelector("#scoreRing");
const scoreSummary = document.querySelector("#scoreSummary");
const hitsList = document.querySelector("#hitsList");
const gapsList = document.querySelector("#gapsList");
const suggestionsList = document.querySelector("#suggestionsList");
const approvalCount = document.querySelector("#approvalCount");
const draftOutput = document.querySelector("#draftOutput");

const knownTerms = [
  "ai",
  "aws",
  "api",
  "data pipeline",
  "database",
  "docker",
  "git",
  "hibernate",
  "java",
  "javascript",
  "jpa",
  "junit",
  "langchain",
  "langgraph",
  "llm",
  "maven",
  "openai",
  "oracle",
  "postgresql",
  "prompt design",
  "python",
  "react",
  "rest api",
  "spring",
  "spring boot",
  "sql",
  "streamlit",
  "testing",
  "workflow automation"
];

const displayNames = {
  ai: "AI",
  api: "API",
  aws: "AWS",
  hibernate: "Hibernate",
  java: "Java",
  javascript: "JavaScript",
  jpa: "JPA",
  junit: "JUnit",
  langchain: "LangChain",
  langgraph: "LangGraph",
  llm: "LLM",
  maven: "Maven",
  openai: "OpenAI",
  postgresql: "PostgreSQL",
  python: "Python",
  react: "React",
  sql: "SQL"
};

const sampleResume = `Java Software Developer with experience building Spring/SQL backend services, data-driven applications, and OpenAI API integrations.

Skills: Java, Python, SQL, JavaScript, Spring Boot, REST APIs, Hibernate JPA, OpenAI API, prompt design, React, JUnit, Git, Maven, AWS.

Projects:
- SpendSense: Built a personal budget management application with AI-assisted financial insights using Java, Spring Boot, SQL, React, and OpenAI API.
- SUPERFUNdProject: Built a Python data pipeline, PostgreSQL tables, and Streamlit dashboards for financial holdings analysis.`;

const sampleJob = `We are hiring an AI Application Developer to build LLM-powered workflow tools. The role requires Java or Python, REST API design, Spring Boot, SQL databases, OpenAI API integration, prompt design, testing, and React dashboards. Experience with LangChain or LangGraph, AWS, and data pipelines is a plus.`;

let currentSuggestions = [];
let currentHits = [];
let currentGaps = [];
let currentDraft = "";

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(term) {
  const normalized = normalize(term);

  if (displayNames[normalized]) {
    return displayNames[normalized];
  }

  return term
    .split(" ")
    .map((word) => {
      const normalizedWord = normalize(word);
      return displayNames[normalizedWord] || word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getJobTerms(jobText) {
  const normalizedJob = normalize(jobText);
  const discovered = knownTerms.filter((term) => normalizedJob.includes(term));
  const phraseMatches = [...jobText.matchAll(/\b([A-Z][A-Za-z0-9+#.]+(?:\s+[A-Z][A-Za-z0-9+#.]+){0,2})\b/g)]
    .map((match) => normalize(match[1]))
    .filter((term) => term.length > 2 && !["we", "the"].includes(term));

  return [...new Set([...discovered, ...phraseMatches])].slice(0, 18);
}

function termAppears(text, term) {
  const normalizedText = ` ${normalize(text)} `;
  const normalizedTerm = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`[^a-z0-9+#]${normalizedTerm}s?[^a-z0-9+#]`);
  return pattern.test(normalizedText);
}

function renderList(target, items, emptyText) {
  target.classList.toggle("empty-list", items.length === 0);
  target.innerHTML = "";

  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = emptyText;
    target.appendChild(item);
    return;
  }

  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    target.appendChild(item);
  });
}

function buildSuggestions(hits, gaps) {
  const topHits = hits.slice(0, 5).map(titleCase);
  const topGaps = gaps.slice(0, 4).map(titleCase);
  const suggestions = [];

  if (topHits.length) {
    suggestions.push({
      type: "Summary",
      text: `Update the resume summary to lead with ${topHits.join(", ")} because those terms appear directly in the role.`
    });
  }

  if (topHits.includes("OpenAI") || topHits.includes("AI") || topHits.includes("LLM")) {
    suggestions.push({
      type: "Project Bullet",
      text: "Add a project bullet that quantifies how the OpenAI integration turns raw user data into generated recommendations or workflow decisions."
    });
  }

  if (topGaps.length) {
    suggestions.push({
      type: "Gap",
      text: `Prepare a short learning or project note for ${topGaps.join(", ")} so the application can address likely screening gaps.`
    });
  }

  suggestions.push({
    type: "Keyword Pass",
    text: "Mirror the job posting language in the skills section while keeping every claim truthful and backed by a project or work example."
  });

  return suggestions.map((suggestion) => ({ ...suggestion, approved: false }));
}

function getSelectedSuggestions() {
  return currentSuggestions.filter((suggestion) => suggestion.approved);
}

function buildDraftChanges() {
  const selectedSuggestions = getSelectedSuggestions();

  if (!selectedSuggestions.length) {
    return "";
  }

  const matchedSkills = currentHits.slice(0, 6).map(titleCase);
  const gapSkills = currentGaps.slice(0, 4).map(titleCase);
  const skillPhrase = matchedSkills.length ? matchedSkills.join(", ") : "the role's core technical requirements";
  const keywordLine = matchedSkills.length ? matchedSkills.join(" | ") : "Add truthful role keywords after analysis";
  const gapLine = gapSkills.length ? gapSkills.join(", ") : "No major gaps found in the extracted requirements";
  const draftSections = [];
  const selectedTypes = selectedSuggestions.map((suggestion) => suggestion.type);
  const addSection = (title, body) => {
    if (draftSections.length) {
      draftSections.push("");
    }

    draftSections.push(title, body);
  };

  if (selectedTypes.includes("Summary")) {
    addSection(
      "Resume Summary Draft",
      `Java Software Developer with experience in ${skillPhrase}, backend services, data-driven applications, and AI-assisted workflow tools.`
    );
  }

  if (selectedTypes.includes("Project Bullet")) {
    addSection(
      "Project Bullet Draft",
      "- Built an AI-assisted application workflow that connects structured data, backend APIs, and generated recommendations to help users make faster, clearer decisions."
    );
  }

  if (selectedTypes.includes("Keyword Pass")) {
    addSection("Skills Keyword Pass", keywordLine);
  }

  if (selectedTypes.includes("Gap")) {
    addSection("Gap / Interview Prep Notes", `Prepare a short explanation or learning plan for: ${gapLine}.`);
  }

  return [
    ...draftSections
  ].join("\n");
}

function renderDraft(text) {
  currentDraft = text;
  draftOutput.classList.toggle("empty-state", !text);
  draftOutput.textContent = text || "Approve a suggestion, then generate resume text.";
}

function renderSuggestions() {
  const approved = currentSuggestions.filter((suggestion) => suggestion.approved).length;
  approvalCount.textContent = `${approved} approved`;
  suggestionsList.innerHTML = "";
  suggestionsList.classList.toggle("empty-state", currentSuggestions.length === 0);

  if (!currentSuggestions.length) {
    suggestionsList.textContent = "Suggestions will appear after analysis.";
    return;
  }

  currentSuggestions.forEach((suggestion, index) => {
    const card = document.createElement("article");
    card.className = `suggestion-card${suggestion.approved ? " approved" : ""}`;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    const body = document.createElement("p");
    title.textContent = suggestion.type;
    body.textContent = suggestion.text;
    content.append(title, body);

    const actions = document.createElement("div");
    actions.className = "suggestion-actions";

    const approve = document.createElement("button");
    approve.type = "button";
    approve.className = "secondary-action";
    approve.textContent = suggestion.approved ? "Approved" : "Approve";
    approve.addEventListener("click", () => {
      currentSuggestions[index].approved = true;
      renderDraft("");
      scoreSummary.textContent = "Suggestion approved. Generate a fresh draft to apply it.";
      renderSuggestions();
    });

    const reject = document.createElement("button");
    reject.type = "button";
    reject.className = "icon-action";
    reject.setAttribute("aria-label", "Reject suggestion");
    reject.title = "Reject suggestion";
    reject.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
    reject.addEventListener("click", () => {
      currentSuggestions.splice(index, 1);
      renderDraft("");
      scoreSummary.textContent = "Suggestion removed. Generate a fresh draft when ready.";
      renderSuggestions();
    });

    actions.append(approve, reject);
    card.append(content, actions);
    suggestionsList.appendChild(card);
  });
}

function analyzeApplication() {
  const resumeText = resumeInput.value.trim();
  const jobText = jobInput.value.trim();

  if (!resumeText || !jobText) {
    scoreSummary.textContent = "Add both resume text and a job posting before running the analysis.";
    return;
  }

  const terms = getJobTerms(jobText);
  const hits = terms.filter((term) => termAppears(resumeText, term));
  const gaps = terms.filter((term) => !termAppears(resumeText, term));
  const score = terms.length ? Math.round((hits.length / terms.length) * 100) : 0;

  scoreValue.textContent = `${score}%`;
  scoreRing.style.setProperty("--score", `${score * 3.6}deg`);
  scoreSummary.textContent = `${hits.length} matched requirements and ${gaps.length} gaps found from ${terms.length} job signals.`;

  renderList(hitsList, hits.map(titleCase), "No direct matches found yet.");
  renderList(gapsList, gaps.map(titleCase), "No gaps found from the extracted terms.");

  currentSuggestions = buildSuggestions(hits, gaps);
  currentHits = hits;
  currentGaps = gaps;
  renderDraft("");
  renderSuggestions();
}

function selectElementText(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function writeClipboard(text, fallbackElement) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch (error) {
      // Fall through to the selection fallback below.
    }
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();

  if (copied) {
    return "copied";
  }

  if (fallbackElement) {
    selectElementText(fallbackElement);
    return "selected";
  }

  return "blocked";
}

function copyApprovedReport() {
  const approved = currentSuggestions.filter((suggestion) => suggestion.approved);
  const lines = approved.length ? approved : currentSuggestions;
  const text = lines.map((suggestion) => `- ${suggestion.type}: ${suggestion.text}`).join("\n");

  if (!text) {
    scoreSummary.textContent = "Run an analysis before copying a report.";
    return;
  }

  writeClipboard(text)
    .then((status) => {
      scoreSummary.textContent = status === "copied" ? "Report copied to clipboard." : "Copy was blocked by the browser.";
    })
    .catch(() => {
      scoreSummary.textContent = "Copy was blocked by the browser.";
    });
}

function generateDraftChanges() {
  if (!currentSuggestions.length) {
    scoreSummary.textContent = "Run an analysis before generating draft changes.";
    return;
  }

  if (!getSelectedSuggestions().length) {
    scoreSummary.textContent = "Approve at least one suggestion before generating a draft.";
    renderDraft("");
    return;
  }

  const draft = buildDraftChanges();

  if (!draft) {
    scoreSummary.textContent = "No approved suggestions are available for a draft.";
    return;
  }

  renderDraft(draft);
  const selectedCount = getSelectedSuggestions().length;
  scoreSummary.textContent = `Resume text generated from ${selectedCount} approved suggestion${selectedCount === 1 ? "" : "s"}.`;
}

function copyDraftChanges() {
  if (!currentDraft) {
    scoreSummary.textContent = "Generate draft changes before copying.";
    return;
  }

  writeClipboard(currentDraft, draftOutput)
    .then((status) => {
      if (status === "copied") {
        scoreSummary.textContent = "Draft changes copied to clipboard.";
      } else if (status === "selected") {
        scoreSummary.textContent = "Draft selected. Press Cmd+C or Ctrl+C to copy.";
      } else {
        scoreSummary.textContent = "Copy was blocked by the browser.";
      }
    })
    .catch(() => {
      scoreSummary.textContent = "Copy was blocked by the browser.";
    });
}

analyzeBtn.addEventListener("click", analyzeApplication);
copyReportBtn.addEventListener("click", copyApprovedReport);
generateDraftBtn.addEventListener("click", generateDraftChanges);
copyDraftBtn.addEventListener("click", copyDraftChanges);
loadSampleBtn.addEventListener("click", () => {
  resumeInput.value = sampleResume;
  jobInput.value = sampleJob;
  analyzeApplication();
});
clearBtn.addEventListener("click", () => {
  resumeInput.value = "";
  jobInput.value = "";
  scoreValue.textContent = "0%";
  scoreRing.style.setProperty("--score", "0deg");
  scoreSummary.textContent = "Run an analysis to see how the resume maps to the role.";
  currentSuggestions = [];
  currentHits = [];
  currentGaps = [];
  renderDraft("");
  renderList(hitsList, [], "Matched requirements will appear here.");
  renderList(gapsList, [], "Missing or weak requirements will appear here.");
  renderSuggestions();
});
