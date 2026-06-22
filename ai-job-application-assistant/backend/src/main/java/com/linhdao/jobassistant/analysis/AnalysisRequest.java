package com.linhdao.jobassistant.analysis;

import jakarta.validation.constraints.NotBlank;

public record AnalysisRequest(
    @NotBlank String resumeText,
    @NotBlank String jobText
) {}

