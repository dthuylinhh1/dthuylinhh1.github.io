# Project Idea: AI Job Application Assistant

## Goal

Build a small AI-powered tool that helps tailor a resume for a specific job posting.

## Why It Fits

This project maps well to AI Software Engineer roles because it can demonstrate:

- LLM application development
- Multi-step workflow/orchestration
- Prompt design
- Structured output
- REST API integration
- Resume/job-posting analysis
- Potential LangChain or LangGraph usage

## MVP Workflow

1. User pastes a resume and job posting.
2. AI extracts key job requirements.
3. AI extracts resume strengths.
4. AI compares hits, partial matches, and gaps.
5. AI suggests tailored resume changes.
6. User approves or rejects suggestions.

## Possible Stack

- React frontend
- Spring Boot backend
- OpenAI API
- SQL database
- LangChain/LangGraph for the workflow once the basics are clear

## Resume Bullet Later

Built a LangGraph-based AI workflow that analyzes job postings, compares them against resume content, identifies skill gaps, and generates tailored application suggestions using the OpenAI API.

## Next Step

Start with a tiny version: paste resume text and job posting text into a form, call the backend, and return a structured hits/misses/suggestions response.
