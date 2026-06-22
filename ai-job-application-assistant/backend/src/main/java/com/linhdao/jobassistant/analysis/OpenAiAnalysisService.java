package com.linhdao.jobassistant.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenAiAnalysisService implements AnalysisService {
  private static final URI RESPONSES_URL = URI.create("https://api.openai.com/v1/responses");

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;
  private final String apiKey;
  private final String model;

  public OpenAiAnalysisService(
      ObjectMapper objectMapper,
      @Value("${openai.api-key:}") String configuredApiKey,
      @Value("${openai.model:gpt-4.1-mini}") String model
  ) {
    this.httpClient = HttpClient.newHttpClient();
    this.objectMapper = objectMapper;
    this.apiKey = configuredApiKey.isBlank() ? System.getenv().getOrDefault("OPENAI_API_KEY", "") : configuredApiKey;
    this.model = System.getenv().getOrDefault("OPENAI_MODEL", model);
  }

  public boolean isConfigured() {
    return apiKey != null && !apiKey.isBlank();
  }

  @Override
  public AnalysisResponse analyze(AnalysisRequest request) {
    if (!isConfigured()) {
      throw new IllegalStateException("OPENAI_API_KEY is not configured.");
    }

    try {
      String responseBody = sendAnalysisRequest(request);
      String outputText = extractOutputText(responseBody);
      AnalysisResponse response = objectMapper.readValue(outputText, AnalysisResponse.class);
      return new AnalysisResponse(
          response.score(),
          response.hits(),
          response.gaps(),
          response.suggestions(),
          response.drafts(),
          "openai",
          "Using OpenAI semantic analysis."
      );
    } catch (IOException exception) {
      throw new IllegalStateException("OpenAI analysis response could not be parsed.", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("OpenAI analysis request was interrupted.", exception);
    }
  }

  private String sendAnalysisRequest(AnalysisRequest request) throws IOException, InterruptedException {
    String body = objectMapper.writeValueAsString(new ResponsesRequest(
        model,
        buildPrompt(request),
        new TextConfig(
            new ResponseFormat(
                "json_schema",
                "job_application_analysis",
                buildSchema(),
                true
            )
        )
    ));

    HttpRequest httpRequest = HttpRequest.newBuilder(RESPONSES_URL)
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

    HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("OpenAI request failed with status " + response.statusCode());
    }

    return response.body();
  }

  private String buildPrompt(AnalysisRequest request) {
    return """
        You are an AI job application assistant.

        Analyze the resume against the job posting. Return only valid JSON matching the schema.

        Rules:
        - Be truthful. Do not invent experience.
        - Treat related concepts as partial matches when exact wording differs.
        - Hits require clear evidence in the resume.
        - Gaps are important job requirements with little or no resume evidence.
        - Suggestions should be practical resume improvements.
        - Drafts should be resume-ready text the user can copy.

        Resume:
        %s

        Job Posting:
        %s
        """.formatted(request.resumeText(), request.jobText());
  }

  private String extractOutputText(String responseBody) throws IOException {
    JsonNode root = objectMapper.readTree(responseBody);
    JsonNode output = root.path("output");

    for (JsonNode item : output) {
      JsonNode content = item.path("content");
      for (JsonNode contentItem : content) {
        JsonNode text = contentItem.path("text");
        if (!text.isMissingNode() && !text.asText().isBlank()) {
          return text.asText();
        }
      }
    }

    JsonNode outputText = root.path("output_text");
    if (!outputText.isMissingNode() && !outputText.asText().isBlank()) {
      return outputText.asText();
    }

    throw new IllegalStateException("OpenAI response did not include output text.");
  }

  private JsonNode buildSchema() {
    return objectMapper.valueToTree(new AnalysisSchema(
        "object",
        new AnalysisSchemaProperties(
            new NumberSchema("integer", 0, 100),
            new StringArraySchema("array", new StringSchema("string")),
            new StringArraySchema("array", new StringSchema("string")),
            new SuggestionArraySchema("array", new SuggestionItemSchema(
                "object",
                new SuggestionProperties(new StringSchema("string"), new StringSchema("string")),
                List.of("type", "text"),
                false
            )),
            new DraftArraySchema("array", new DraftItemSchema(
                "object",
                new DraftProperties(new StringSchema("string"), new StringSchema("string")),
                List.of("type", "text"),
                false
            ))
        ),
        List.of("score", "hits", "gaps", "suggestions", "drafts"),
        false
    ));
  }

  private record ResponsesRequest(String model, String input, TextConfig text) {}

  private record TextConfig(ResponseFormat format) {}

  private record ResponseFormat(String type, String name, JsonNode schema, boolean strict) {}

  private record AnalysisSchema(
      String type,
      AnalysisSchemaProperties properties,
      List<String> required,
      boolean additionalProperties
  ) {}

  private record AnalysisSchemaProperties(
      NumberSchema score,
      StringArraySchema hits,
      StringArraySchema gaps,
      SuggestionArraySchema suggestions,
      DraftArraySchema drafts
  ) {}

  private record NumberSchema(String type, int minimum, int maximum) {}

  private record StringSchema(String type) {}

  private record StringArraySchema(String type, StringSchema items) {}

  private record SuggestionArraySchema(String type, SuggestionItemSchema items) {}

  private record DraftArraySchema(String type, DraftItemSchema items) {}

  private record SuggestionItemSchema(
      String type,
      SuggestionProperties properties,
      List<String> required,
      boolean additionalProperties
  ) {}

  private record DraftItemSchema(
      String type,
      DraftProperties properties,
      List<String> required,
      boolean additionalProperties
  ) {}

  private record SuggestionProperties(StringSchema type, StringSchema text) {}

  private record DraftProperties(StringSchema type, StringSchema text) {}
}
