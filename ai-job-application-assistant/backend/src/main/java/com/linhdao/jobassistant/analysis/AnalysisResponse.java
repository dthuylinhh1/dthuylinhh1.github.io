package com.linhdao.jobassistant.analysis;

import java.util.List;

public record AnalysisResponse(
    int score,
    List<String> hits,
    List<String> gaps,
    List<Suggestion> suggestions,
    List<Draft> drafts,
    String mode,
    String notice
) {}
