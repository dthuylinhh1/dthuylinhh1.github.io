package com.linhdao.jobassistant.analysis;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Primary
@Service
public class DelegatingAnalysisService implements AnalysisService {
  private final MockAnalysisService mockAnalysisService;
  private final OpenAiAnalysisService openAiAnalysisService;

  public DelegatingAnalysisService(
      MockAnalysisService mockAnalysisService,
      OpenAiAnalysisService openAiAnalysisService
  ) {
    this.mockAnalysisService = mockAnalysisService;
    this.openAiAnalysisService = openAiAnalysisService;
  }

  @Override
  public AnalysisResponse analyze(AnalysisRequest request) {
    if (openAiAnalysisService.isConfigured()) {
      try {
        return openAiAnalysisService.analyze(request);
      } catch (IllegalStateException exception) {
        AnalysisResponse fallback = mockAnalysisService.analyze(request);
        return new AnalysisResponse(
            fallback.score(),
            fallback.hits(),
            fallback.gaps(),
            fallback.suggestions(),
            fallback.drafts(),
            "fallback",
            "OpenAI was unavailable, so local keyword fallback analysis was used."
        );
      }
    }

    return mockAnalysisService.analyze(request);
  }
}
