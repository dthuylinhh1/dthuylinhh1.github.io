import { Check, Clipboard, FileText, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const sampleResume = `Java Software Developer with experience building Spring Boot backend services, SQL applications, data pipelines, and OpenAI API integrations.

Skills: Java, Python, SQL, JavaScript, Spring Boot, REST APIs, Hibernate JPA, OpenAI API, React, JUnit, Git, Maven, AWS.

Projects:
- SpendSense: Built a personal budget app with AI-assisted financial insights.
- SUPERFUNdProject: Built a Python data pipeline and Streamlit dashboards for financial holdings analysis.`;

const sampleJob = `We are hiring an AI Application Developer to build LLM-powered workflow tools. The role requires Java or Python, REST API design, Spring Boot, SQL databases, OpenAI API integration, prompt design, testing, and React dashboards. Experience with LangChain or LangGraph is a plus.`;

function App() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [approvedTypes, setApprovedTypes] = useState([]);
  const [draftText, setDraftText] = useState("");
  const [status, setStatus] = useState("Paste a resume and job posting to begin.");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!resumeText.trim() || !jobText.trim()) {
      setStatus("Add both resume text and a job posting first.");
      return;
    }

    setLoading(true);
    setStatus("Analyzing resume fit...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobText })
      });

      if (!response.ok) {
        let message = "Analysis failed.";

        try {
          const errorBody = await response.json();
          message = errorBody.message || message;
        } catch (parseError) {
          message = response.status === 429 ? "OpenAI quota exceeded or billing is not active." : message;
        }

        throw new Error(message);
      }

      const data = await response.json();
      setAnalysis(data);
      setApprovedTypes([]);
      setDraftText("");
      setStatus(data.notice || `Analysis complete: ${data.score}% match.`);
    } catch (error) {
      setStatus(error.message === "Failed to fetch" ? "Backend is not running yet. Start Spring Boot, then try again." : error.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyDrafts() {
    if (!draftText) {
      setStatus("Generate draft text before copying.");
      return;
    }

    await navigator.clipboard.writeText(draftText);
    setStatus("Draft text copied.");
  }

  function approveSuggestion(type) {
    setApprovedTypes((current) => (current.includes(type) ? current : [...current, type]));
    setDraftText("");
    setStatus(`${type} approved. Generate a fresh draft when ready.`);
  }

  function rejectSuggestion(type) {
    setApprovedTypes((current) => current.filter((item) => item !== type));
    setDraftText("");
    setStatus(`${type} removed from approved suggestions.`);
  }

  function generateDraft() {
    if (!analysis) {
      setStatus("Run an analysis before generating draft text.");
      return;
    }

    if (!approvedTypes.length) {
      setStatus("Approve at least one suggestion before generating draft text.");
      return;
    }

    const matchedSkills = analysis.hits?.slice(0, 6).join(", ") || "the role's core requirements";
    const gapSkills = analysis.gaps?.slice(0, 4).join(", ") || "No major gaps found";
    const sections = [];
    const addSection = (title, body) => sections.push(`${title}\n${body}`);

    if (approvedTypes.includes("Summary")) {
      addSection(
        "Resume Summary Draft",
        `Java Software Developer with experience in ${matchedSkills}, backend services, data-driven applications, and AI-assisted workflow tools.`
      );
    }

    if (approvedTypes.includes("Project Bullet")) {
      const backendDraft = analysis.drafts?.find((draft) => draft.type === "Project Bullet")?.text;
      addSection(
        "Project Bullet Draft",
        backendDraft || "- Built an AI-assisted application workflow that connects structured data, backend APIs, and generated recommendations to help users make faster decisions."
      );
    }

    if (approvedTypes.includes("Gap")) {
      addSection("Gap / Interview Prep Notes", `Prepare a truthful explanation or learning plan for: ${gapSkills}.`);
    }

    if (approvedTypes.includes("Keyword Pass")) {
      const alignedKeywords = analysis.hits?.join(" | ") || "No direct keyword matches found yet.";
      const gapKeywords = analysis.gaps?.join(" | ") || "No major keyword gaps found.";
      addSection(
        "Skills Keyword Pass",
        `Already aligned: ${alignedKeywords}\nConsider adding only if true: ${gapKeywords}`
      );
    }

    setDraftText(sections.join("\n\n"));
    setStatus(`Resume text generated from ${approvedTypes.length} approved suggestion${approvedTypes.length === 1 ? "" : "s"}.`);
  }

  function loadSample() {
    setResumeText(sampleResume);
    setJobText(sampleJob);
    setAnalysis(null);
    setApprovedTypes([]);
    setDraftText("");
    setStatus("Sample loaded. Run the analysis.");
  }

  function clearAll() {
    setResumeText("");
    setJobText("");
    setAnalysis(null);
    setApprovedTypes([]);
    setDraftText("");
    setStatus("Cleared.");
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="intro">
          <h1>AI Job Application Assistant</h1>
          <p>{status}</p>
        </div>

        <div className="input-panel">
          <label htmlFor="resumeText">Resume</label>
          <textarea id="resumeText" value={resumeText} onChange={(event) => setResumeText(event.target.value)} />

          <label htmlFor="jobText">Job Posting</label>
          <textarea id="jobText" value={jobText} onChange={(event) => setJobText(event.target.value)} />

          <div className="actions">
            <button className="primary" onClick={analyze} disabled={loading}>
              <Sparkles size={16} />
              {loading ? "Analyzing" : "Analyze"}
            </button>
            <button onClick={loadSample}>
              <FileText size={16} />
              Sample
            </button>
            <button className="icon" onClick={clearAll} aria-label="Clear">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="results-panel">
          <div className="score-card">
            <span>{analysis ? `${analysis.score}%` : "0%"}</span>
            <div>
              <h2>Match Score</h2>
              <p>{analysis ? analysis.notice || "Based on matched job signals." : "Run an analysis to calculate match."}</p>
            </div>
          </div>

          <section>
            <h2>Hits</h2>
            <ul>{(analysis?.hits || ["Matched requirements will appear here."]).map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <h2>Gaps</h2>
            <ul>{(analysis?.gaps || ["Gaps will appear here."]).map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <div className="section-title-row">
              <h2>Tailored Suggestions</h2>
              <span className="pill">{approvedTypes.length} approved</span>
            </div>
            <div className="suggestion-list">
              {analysis?.suggestions?.length
                ? analysis.suggestions.map((suggestion) => {
                    const approved = approvedTypes.includes(suggestion.type);

                    return (
                      <article className={`suggestion-card ${approved ? "approved" : ""}`} key={suggestion.type}>
                        <div>
                          <h3>{suggestion.type}</h3>
                          <p>{suggestion.text}</p>
                        </div>
                        <div className="suggestion-actions">
                          <button onClick={() => approveSuggestion(suggestion.type)}>
                            <Check size={16} />
                            {approved ? "Approved" : "Approve"}
                          </button>
                          <button className="icon" onClick={() => rejectSuggestion(suggestion.type)} aria-label={`Reject ${suggestion.type}`}>
                            <X size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })
                : <p className="empty-copy">Suggestions will appear here after analysis.</p>}
            </div>
          </section>

          <section>
            <div className="section-title-row">
              <h2>Use This In Your Resume</h2>
              <button className="icon" onClick={copyDrafts} aria-label="Copy draft text">
                <Clipboard size={16} />
              </button>
            </div>
            <div className="draft-box">{draftText || "Approve suggestions, then generate resume text."}</div>
            <div className="actions draft-actions">
              <button className="primary" onClick={generateDraft}>
                <Pencil size={16} />
                Generate Draft
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
