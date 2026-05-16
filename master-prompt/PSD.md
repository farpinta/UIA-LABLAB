# Project Specification Document (PSD)
## Project Name: BobInsight (Interactive Function Flow Mapper)
## Hackathon Event: IBM Bob Hackathon 2026

---

### 1. Executive Summary & Problem Statement
In modern software development, onboarding developers onto legacy codebases or large repositories is a notoriously slow and error-prone process. Traditional developer tools generate static directory trees that only show folder structures, failing to reveal how the actual business logic flows between files. This architectural blindness leads to logical bugs and unexpected regression errors when modifications are made.

**BobInsight** solves this enterprise pain point by acting as an "X-Ray" tool for source code. By leveraging the **IBM Bob API** and its unique ability to comprehend Full Repository Context, BobInsight automatically extracts function-level dependencies and renders them into an **Interactive Function Flow Map**. Developers can visually track how a function in one file invokes logic across the entire codebase within seconds, bypassing days of manual code review.

---

### 2. Project Scope & Functional Requirements
To maximize delivery speed and impact during the hackathon, the project focuses strictly on a comprehensive visualization tool (dropping code refactoring layers) targeting a specific "Happy Path" scenario.

* **Target Ingestion:** Users provide a GitHub Repository URL via a clean dashboard interface.
* **Static Pre-Processing:** The backend clones the repository and extracts the basic directory structure.
* **AI Call-Graph Extraction:** The IBM Bob API analyzes the full repository to map function declarations and remote cross-file function invocations.
* **Interactive Data Visualization:** The frontend renders a dynamic Node-Edge graph where users can expand files to view internal functions and follow logical data paths[cite: 2].
* **Interactive Inspection Panel:** Clicking a function triggers an "Interview Sidebar" that explains the function's logic, complexity, and security status without opening an IDE[cite: 2].

---

### 3. System Architecture & Tech Stack
The platform is engineered using a robust 3-Tier Architecture to enable parallel, non-blocking development across the 5-man engineering team[cite: 2].