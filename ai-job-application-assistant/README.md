# AI Job Application Assistant

A portfolio-ready AI application that helps tailor a resume to a job posting.

This folder is the start of the real project version. The current GitHub Pages demo in the root of this repo is a static prototype. This version is structured for a React frontend, a Spring Boot backend, and a later OpenAI API integration.

## MVP Workflow

1. User pastes resume text.
2. User pastes a job posting.
3. Backend extracts job requirements and resume strengths.
4. Backend returns matches, gaps, suggestions, and draft resume text.
5. User reviews and copies tailored changes.

## Project Structure

```text
ai-job-application-assistant/
  frontend/   React UI for the assistant workflow
  backend/    Spring Boot API for analysis and future OpenAI calls
```

## Run Locally

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:8080`.

## API Contract

`POST /api/analyze`

Request:

```json
{
  "resumeText": "Java Software Developer...",
  "jobText": "We are hiring an AI Application Developer..."
}
```

Response:

```json
{
  "score": 72,
  "hits": ["Java", "Spring Boot", "OpenAI"],
  "gaps": ["LangChain", "LangGraph"],
  "suggestions": [
    {
      "type": "Project Bullet",
      "text": "Add a project bullet that quantifies the OpenAI workflow."
    }
  ],
  "drafts": [
    {
      "type": "Project Bullet",
      "text": "- Built an AI-assisted application workflow..."
    }
  ]
}
```

## Next Implementation Step

Replace the mock `AnalysisService` with an OpenAI-backed service that returns structured JSON. Keep the frontend and API contract the same so the UI does not need a rewrite.

## OpenAI Mode

The backend uses the mock analyzer when no API key is present. To turn on OpenAI analysis, run the backend with:

```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_MODEL="gpt-4.1-mini"
mvn spring-boot:run
```

Do not commit API keys. `OPENAI_MODEL` is optional; it defaults to `gpt-4.1-mini`.

Backend behavior:

1. `DelegatingAnalysisService` checks whether `OPENAI_API_KEY` exists.
2. If yes, it uses `OpenAiAnalysisService`.
3. If the OpenAI request fails, it falls back to `MockAnalysisService`.
4. If no key exists, it uses `MockAnalysisService`.
