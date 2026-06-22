package com.linhdao.jobassistant.analysis;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AnalysisExceptionHandler {
  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiError> handleIllegalState(IllegalStateException exception) {
    String message = exception.getMessage();

    if (message != null && message.contains("status 429")) {
      return ResponseEntity
          .status(HttpStatus.TOO_MANY_REQUESTS)
          .body(new ApiError("OpenAI quota exceeded or billing is not active for this API key."));
    }

    return ResponseEntity
        .status(HttpStatus.BAD_GATEWAY)
        .body(new ApiError(message == null ? "Analysis failed." : message));
  }
}

