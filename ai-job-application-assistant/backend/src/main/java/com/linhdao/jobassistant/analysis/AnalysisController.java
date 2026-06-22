package com.linhdao.jobassistant.analysis;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalysisController {
  private final AnalysisService analysisService;

  public AnalysisController(AnalysisService analysisService) {
    this.analysisService = analysisService;
  }

  @PostMapping("/analyze")
  public AnalysisResponse analyze(@Valid @RequestBody AnalysisRequest request) {
    return analysisService.analyze(request);
  }
}

