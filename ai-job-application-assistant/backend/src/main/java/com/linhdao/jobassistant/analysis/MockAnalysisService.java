package com.linhdao.jobassistant.analysis;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class MockAnalysisService implements AnalysisService {
  private static final List<Signal> SIGNALS = List.of(
      new Signal("Java", List.of("java")),
      new Signal("Python", List.of("python")),
      new Signal("SQL", List.of("sql", "database", "databases")),
      new Signal("Spring", List.of("spring", "spring boot", "spring mvc")),
      new Signal("REST APIs", List.of("rest api", "rest apis", "api design", "apis")),
      new Signal("OpenAI API", List.of("openai", "openai api")),
      new Signal("React", List.of("react", "dashboard", "dashboards")),
      new Signal("Testing", List.of("testing", "tests", "unit testing", "junit")),
      new Signal("LangChain", List.of("langchain")),
      new Signal("LangGraph", List.of("langgraph")),
      new Signal("AWS", List.of("aws", "cloud")),
      new Signal("Data Pipelines", List.of("data pipeline", "data pipelines")),
      new Signal("LLM Applications", List.of("llm", "llms", "ai application", "ai applications")),
      new Signal("Workflow Automation", List.of("workflow", "workflows", "automation", "agentic"))
  );

  public AnalysisResponse analyze(AnalysisRequest request) {
    List<Signal> jobSignals = SIGNALS.stream()
        .filter(signal -> signal.appearsIn(request.jobText()))
        .toList();

    List<String> hits = jobSignals.stream()
        .filter(signal -> signal.appearsIn(request.resumeText()))
        .map(Signal::label)
        .toList();

    List<String> gaps = jobSignals.stream()
        .filter(signal -> !signal.appearsIn(request.resumeText()))
        .map(Signal::label)
        .toList();

    int score = jobSignals.isEmpty() ? 0 : Math.round((hits.size() * 100f) / jobSignals.size());

    List<Suggestion> suggestions = List.of(
        new Suggestion("Summary", "Lead the summary with the strongest matching role keywords."),
        new Suggestion("Project Bullet", "Add one project bullet that explains the AI workflow and its user impact."),
        new Suggestion("Gap", "Prepare a truthful note for the highest-priority missing skills."),
        new Suggestion("Keyword Pass", "Mirror the job posting language in the skills section while keeping every claim truthful.")
    );

    List<Draft> drafts = List.of(
        new Draft("Project Bullet", "- Built an AI-assisted application workflow that connects structured data, backend APIs, and generated recommendations to help users make faster decisions.")
    );

    return new AnalysisResponse(
        score,
        hits,
        gaps,
        suggestions,
        drafts,
        "mock",
        "Using local keyword fallback analysis."
    );
  }

  private static String normalize(String text) {
    return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9+#.]+", " ").trim();
  }

  private record Signal(String label, List<String> aliases) {
    boolean appearsIn(String text) {
      String normalizedText = " " + normalize(text) + " ";
      return aliases.stream()
          .map(MockAnalysisService::normalize)
          .anyMatch(alias -> normalizedText.contains(" " + alias + " "));
    }
  }
}
