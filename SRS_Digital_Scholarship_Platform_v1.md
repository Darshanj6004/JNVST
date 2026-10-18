# Software Requirements Specification (SRS)

## Digital Scholarship & Competitive Examination Practice Platform

**Version:** 1.0 (MVP — Jawahar Navodaya Vidyalaya Selection Test)

---

| Field | Detail |
|---|---|
| **Document ID** | SRS-DSCEP-2026-001 |
| **Version** | 1.0 |
| **Date** | 29 August 2026 |
| **Status** | Draft — Awaiting Client Approval |
| **Client** | Z.P.P. School, Kasare, Tal. Sangamner, Dist. Ahilyanagar, Maharashtra |
| **Prepared By** | Computer Engineering Project Team |
| **Document Type** | Software Requirements Specification |

---

## Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | — | Project Team | Initial requirement notes from client meeting |
| 1.0 | 29 Aug 2026 | Project Team | Formal SRS based on finalized requirement discussion |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Functional Requirements](#4-functional-requirements)
5. [JNVST Examination Pattern](#5-jnvst-examination-pattern)
6. [Subject & Topic Structure](#6-subject--topic-structure)
7. [User Stories](#7-user-stories)
8. [Use Cases](#8-use-cases)
9. [UI Navigation Flow](#9-ui-navigation-flow)
10. [Data Dictionary](#10-data-dictionary)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Assumptions & Dependencies](#12-assumptions--dependencies)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Scope & Boundaries](#14-scope--boundaries)
15. [Appendix A — Role-Permission Matrix](#appendix-a--role-permission-matrix)
16. [Appendix B — Low-Fidelity Wireframe Descriptions](#appendix-b--low-fidelity-wireframe-descriptions)
17. [Appendix C — Glossary](#appendix-c--glossary)
18. [Appendix D — Product Roadmap](#appendix-d--product-roadmap)
19. [Sign-Off](#sign-off)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for **Version 1.0** of the *Digital Scholarship & Competitive Examination Practice Platform*. It serves as the binding agreement between the client (Z.P.P. School, Kasare) and the development team, defining **what** the system must do and the constraints under which it must operate.

No database design, API specification, or coding shall begin until this SRS is approved by the client.

### 1.2 Scope

The platform is a **responsive web application** that enables structured preparation for government scholarship examinations. Version 1.0 supports only the **Jawahar Navodaya Vidyalaya Selection Test (JNVST)** for **4th Standard** students.

> [!IMPORTANT]
> The system architecture must be **examination-agnostic** at its core. JNVST is the first configured examination module. Future examinations (Maharashtra Scholarship, NMMS, etc.) must be addable as new configuration/data modules **without rebuilding** the system.

### 1.3 Intended Audience

| Audience | Purpose |
|---|---|
| Client (School Administration) | Review and approve requirements |
| Development Team | Design, build, and test the system |
| QA / Testing Team | Derive test cases from requirements |
| Project Guide / Evaluator | Evaluate project scope and completeness |

### 1.4 Definitions & Acronyms

| Term | Definition |
|---|---|
| JNVST | Jawahar Navodaya Vidyalaya Selection Test |
| NMMS | National Means-cum-Merit Scholarship |
| MVP | Minimum Viable Product |
| SRS | Software Requirements Specification |
| MCQ | Multiple Choice Question |
| Practice Mode | Untimed, self-paced learning with immediate feedback |
| Mock Test | Timed, exam-pattern simulation with single-attempt restriction |

### 1.5 References

| # | Reference |
|---|---|
| 1 | JNVST Official Notification & Exam Pattern (Government of India) |
| 2 | Client Requirement Discussion Summary (Phase 1) |
| 3 | IEEE 830-1998 — Recommended Practice for SRS |

---

## 2. Overall Description

### 2.1 Product Vision

> *"A single digital platform capable of supporting multiple scholarship and competitive examinations conducted by government authorities, starting with JNVST."*

**Long-Term Vision:** A scalable scholarship preparation ecosystem supporting JNVST, Maharashtra Scholarship, NMMS, and other government competitive examinations.

**Version 1.0 Vision:** Provide 4th Standard students of Z.P.P. School, Kasare with structured, digital practice and mock-examination capabilities for the JNVST entrance examination, while reducing manual workload for teachers.

### 2.2 Product Perspective

The platform replaces the current manual workflow:

| Current (Manual) | Proposed (Digital) |
|---|---|
| Printed books & paper tests | Online practice & mock tests |
| Teacher manually creates question papers | Digital question bank with reusable questions |
| Manual answer-sheet evaluation | Automatic evaluation on submission |
| Manual identification of weak students | Automated topic-wise performance analytics |
| Paper-based progress tracking | Digital dashboards with progress charts |

The system is **self-contained** — it does not integrate with any external system in Version 1.0.

### 2.3 Target Users (Version 1.0)

| User Group | Count | Description |
|---|---|---|
| Teachers | 1–3 | Act as platform administrators |
| Students | 30–40 | 4th Standard students preparing for JNVST |

> [!NOTE]
> The school currently has one class (no multiple divisions) for the target standard. The system should still support scalability for future multi-class scenarios.

### 2.4 Operating Environment

| Parameter | Specification |
|---|---|
| Platform | Responsive Web Application |
| Supported Browsers | Google Chrome, Microsoft Edge (latest stable versions) |
| Device Support | Desktop, Tablet, Mobile (responsive design) |
| Connectivity | Requires internet connection |
| Concurrent Users | 30–40 (initial capacity) |

### 2.5 Design Constraints

| Constraint | Rationale |
|---|---|
| Examination-agnostic data model | Future exams must be addable without schema redesign |
| Teacher-controlled accounts only | Students cannot self-register (school policy) |
| JNVST pattern compliance | Mock tests must exactly mirror official pattern |
| No negative marking | As per JNVST rules |
| Single-attempt mock tests | Simulates real exam conditions |

---

## 3. User Roles & Permissions

### 3.1 Role: Teacher (Administrator)

The Teacher is the sole administrator of the platform. There is no separate "Admin" role in Version 1.0.

**Responsibilities:**

| Area | Capabilities |
|---|---|
| **Student Management** | Create student accounts, generate usernames, set default passwords, manage student records (edit/deactivate) |
| **Question Management** | Add questions manually (one-by-one), import questions in bulk (via Excel/CSV), edit existing questions, tag questions with subject/topic/difficulty |
| **Practice Management** | Create practice sets (subject, topic, difficulty configuration) |
| **Mock Test Management** | Create mock examinations following official pattern, schedule tests with date/time, reopen completed tests for specific students |
| **Analytics & Reports** | View student-wise performance, view class-level performance, identify weak students by topic, view improvement trends |

### 3.2 Role: Student

Students are consumers of learning content only. They have no administrative capabilities.

**Capabilities:**

| Area | Capabilities |
|---|---|
| **Authentication** | Login using teacher-provided credentials |
| **Practice Mode** | Select subject → topic → difficulty, attempt unlimited questions, view immediate results and correct answers |
| **Mock Tests** | Attempt scheduled mock tests (single attempt), experience timed examination (120 minutes), view results after submission |
| **Progress Tracking** | View personal score history, see topic-wise strengths/weaknesses, track improvement over time |

**Restrictions:**

| Action | Allowed? |
|---|---|
| Self-registration | ❌ No |
| Change password | ❌ No |
| Create tests | ❌ No |
| Edit profile | ❌ No |
| Access other students' data | ❌ No |

### 3.3 Authentication Rules

| Rule | Specification |
|---|---|
| Self-registration | Not available |
| Student account creation | Teacher only |
| Username format | Generated by Teacher (e.g., `student_firstname_rollno`) |
| Default password | Set by Teacher at account creation |
| Password change by student | Not allowed |
| Teacher login | Username and password |
| Session management | Auto-logout after inactivity period (configurable) |

---

## 4. Functional Requirements

### 4.1 Authentication Module

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-001 | The system shall provide a login page accepting username and password. | Must |
| FR-AUTH-002 | The system shall authenticate users against stored credentials and redirect to role-appropriate dashboards. | Must |
| FR-AUTH-003 | The system shall display an appropriate error message for invalid credentials. | Must |
| FR-AUTH-004 | The system shall maintain user sessions with configurable timeout. | Must |
| FR-AUTH-005 | The system shall provide a logout function accessible from all pages. | Must |
| FR-AUTH-006 | The system shall not provide any self-registration mechanism for students. | Must |

---

### 4.2 Student Management Module (Teacher)

| ID | Requirement | Priority |
|---|---|---|
| FR-SM-001 | The system shall allow teachers to create new student accounts with username, full name, and default password. | Must |
| FR-SM-002 | The system shall allow teachers to generate unique usernames for students. | Must |
| FR-SM-003 | The system shall allow teachers to set a default password for each student account. | Must |
| FR-SM-004 | The system shall display a list of all registered students with their details. | Must |
| FR-SM-005 | The system shall allow teachers to edit student details (name, username). | Must |
| FR-SM-006 | The system shall allow teachers to deactivate (soft-delete) student accounts. | Must |
| FR-SM-007 | The system shall allow teachers to reset a student's password to a new default. | Must |
| FR-SM-008 | The system shall prevent duplicate usernames. | Must |

---

### 4.3 Question Bank Module (Teacher)

| ID | Requirement | Priority |
|---|---|---|
| FR-QB-001 | The system shall allow teachers to add a question manually with: subject, topic, difficulty level, question text, four options (A/B/C/D), correct answer, marks, and optional explanation. | Must |
| FR-QB-002 | The system shall allow teachers to import questions in bulk using an Excel (.xlsx) or CSV file. | Must |
| FR-QB-003 | The system shall validate bulk-imported data and report errors (missing fields, invalid values) before saving. | Must |
| FR-QB-004 | The system shall allow teachers to edit existing questions. | Must |
| FR-QB-005 | The system shall allow teachers to delete questions that are not part of any active/completed test. | Should |
| FR-QB-006 | The system shall allow teachers to filter and search questions by subject, topic, and difficulty. | Must |
| FR-QB-007 | The system shall support image-based questions (e.g., pattern recognition, visual reasoning diagrams). | Must |
| FR-QB-008 | The system shall tag every question with exactly one subject, one topic, one difficulty level, and a marks value. | Must |
| FR-QB-009 | Questions shall be reusable across multiple practice sets and mock tests. | Must |
| FR-QB-010 | The system shall provide an Excel template for bulk import with predefined columns and validation rules. | Should |

---

### 4.4 Practice Mode Module

| ID | Requirement | Priority |
|---|---|---|
| FR-PM-001 | The system shall allow students to enter Practice Mode from the dashboard. | Must |
| FR-PM-002 | The system shall allow students to select a subject for practice. | Must |
| FR-PM-003 | The system shall allow students to select a topic within the chosen subject. | Must |
| FR-PM-004 | The system shall allow students to select a difficulty level: Easy, Medium, Hard, or Combined. | Must |
| FR-PM-005 | When "Combined" is selected, the system shall generate a practice set containing a balanced mix of Easy, Medium, and Hard questions. | Must |
| FR-PM-006 | The system shall allow unlimited practice attempts (no attempt limit). | Must |
| FR-PM-007 | Practice mode shall be untimed (no countdown timer). | Must |
| FR-PM-008 | The system shall evaluate answers immediately upon submission. | Must |
| FR-PM-009 | The system shall display the correct answer for each question after submission. | Must |
| FR-PM-010 | The system shall display the explanation (if available) for each question after submission. | Should |
| FR-PM-011 | The system shall record practice results and update the student's progress automatically. | Must |
| FR-PM-012 | The system shall present questions in a randomized order within a practice session. | Should |

---

### 4.5 Mock Test Module

| ID | Requirement | Priority |
|---|---|---|
| FR-MT-001 | The system shall allow teachers to create mock tests following the official JNVST pattern (80 questions, 100 marks, 120 minutes). | Must |
| FR-MT-002 | The system shall allow teachers to schedule mock tests with a specific date and time window. | Must |
| FR-MT-003 | The system shall enforce a single-attempt policy for each student per mock test. | Must |
| FR-MT-004 | The system shall display a countdown timer (120 minutes) during the mock test. | Must |
| FR-MT-005 | The system shall auto-submit the test when the timer reaches zero. | Must |
| FR-MT-006 | The system shall allow students to manually submit before the timer expires. | Must |
| FR-MT-007 | The system shall not apply negative marking. | Must |
| FR-MT-008 | The system shall evaluate the mock test automatically upon submission. | Must |
| FR-MT-009 | The system shall display the result (score, correct/incorrect breakdown by section) after submission. | Must |
| FR-MT-010 | The system shall allow teachers to reopen a completed mock test for a specific student (granting an additional attempt). | Must |
| FR-MT-011 | The system shall allow students to navigate between questions during the test (go back/forward). | Must |
| FR-MT-012 | The system shall allow students to mark questions for review during the test. | Should |
| FR-MT-013 | The system shall display a question palette showing answered, unanswered, and marked-for-review questions. | Should |
| FR-MT-014 | The system shall prevent students from accessing a mock test before the scheduled start time. | Must |
| FR-MT-015 | The system shall present a confirmation dialog before final submission. | Must |
| FR-MT-016 | The system shall preserve student answers in case of browser refresh or temporary disconnection (within the test window). | Should |

---

### 4.6 Performance Analytics Module

| ID | Requirement | Priority |
|---|---|---|
| FR-PA-001 | The system shall provide a **Student Dashboard** showing: total score, percentage, correct/wrong answers, previous attempt history, strong/average/weak topics. | Must |
| FR-PA-002 | The system shall provide a **Teacher Dashboard** showing: student-wise performance summary, class-level performance overview, topic-wise accuracy analysis, list of weak students, improvement trend over time. | Must |
| FR-PA-003 | The system shall categorize topics as Strong, Average, or Weak based on accuracy thresholds (configurable). | Must |
| FR-PA-004 | The system shall display progress charts (visual) for students over time. | Must |
| FR-PA-005 | The system shall allow teachers to filter reports by subject, topic, student, date range, and test type (practice/mock). | Should |
| FR-PA-006 | The system shall highlight students with declining performance trends. | Should |

---

### 4.7 Dashboard Module

#### 4.7.1 Student Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-SD-001 | The student dashboard shall display a welcome message with the student's name. | Must |
| FR-SD-002 | The student dashboard shall show a summary of recent practice/mock test scores. | Must |
| FR-SD-003 | The student dashboard shall provide quick-access buttons to Practice Mode and Mock Tests. | Must |
| FR-SD-004 | The student dashboard shall display upcoming scheduled mock tests. | Must |
| FR-SD-005 | The student dashboard shall show topic-wise strength/weakness indicators. | Must |

#### 4.7.2 Teacher Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-TD-001 | The teacher dashboard shall display an overview of class performance. | Must |
| FR-TD-002 | The teacher dashboard shall show the number of registered students. | Must |
| FR-TD-003 | The teacher dashboard shall provide quick-access to Student Management, Question Bank, Test Creation, and Reports. | Must |
| FR-TD-004 | The teacher dashboard shall highlight upcoming and active mock tests. | Must |
| FR-TD-005 | The teacher dashboard shall display alerts for students with consistently weak performance. | Should |

---

## 5. JNVST Examination Pattern

### 5.1 Official Pattern (Strict Compliance Required)

| Section | Number of Questions | Marks | Duration |
|---|---|---|---|
| Mental Ability Test | 40 | 50 | 60 minutes |
| Arithmetic Test | 20 | 25 | 30 minutes |
| Language Test | 20 | 25 | 30 minutes |
| **Total** | **80** | **100** | **120 minutes** |

### 5.2 Examination Rules

| Rule | Value |
|---|---|
| Total Questions | 80 |
| Total Marks | 100 |
| Total Duration | 120 minutes (2 hours) |
| Question Type | Multiple Choice (4 options) |
| Negative Marking | No |
| Timer | Mandatory (auto-submit on expiry) |
| Attempts | 1 per student per test (unless reopened by teacher) |

### 5.3 Marks Distribution Logic

| Section | Questions | Marks per Question | Total Marks |
|---|---|---|---|
| Mental Ability | 40 | 1.25 | 50 |
| Arithmetic | 20 | 1.25 | 25 |
| Language | 20 | 1.25 | 25 |

---

## 6. Subject & Topic Structure

### 6.1 Version 1.0 — JNVST Subjects

#### 6.1.1 Mental Ability Test

| Topic | Description |
|---|---|
| Analogy | Identifying relationships between pairs |
| Classification | Odd-one-out identification |
| Series | Number/letter/figure series completion |
| Pattern Recognition | Identifying visual patterns |
| Visual Reasoning | Spatial and figure-based reasoning |
| Coding-Decoding | Letter/number substitution patterns |
| Mirror & Water Images | Reflection-based questions |
| Embedded Figures | Identifying figures within complex shapes |

#### 6.1.2 Arithmetic Test

| Topic | Description |
|---|---|
| Number System | Place value, comparison, ordering |
| Addition | Single and multi-digit addition |
| Subtraction | Single and multi-digit subtraction |
| Multiplication | Tables, multi-digit multiplication |
| Division | Simple and long division |
| Fractions | Comparison, operations on fractions |
| Geometry | Basic shapes, perimeter, area |
| Measurement | Length, weight, capacity, time |
| Data Interpretation | Reading simple tables and charts |

#### 6.1.3 Language Test

| Topic | Description |
|---|---|
| (To be provided) | Detailed syllabus will be supplied by the school |

### 6.2 Difficulty Levels

| Level | Code | Description |
|---|---|---|
| Easy | L1 | Foundational questions testing basic understanding |
| Medium | L2 | Intermediate questions requiring application |
| Hard | L3 | Advanced questions requiring analysis and reasoning |
| Combined | ALL | A mixed set drawn proportionally from L1, L2, and L3 |

---

## 7. User Stories

### 7.1 Authentication

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-001 | As a **teacher**, I want to log in with my username and password so that I can access the teacher dashboard. | Valid credentials → teacher dashboard. Invalid credentials → error message. |
| US-002 | As a **student**, I want to log in with the credentials given by my teacher so that I can access my learning dashboard. | Valid credentials → student dashboard. Invalid credentials → error message. |
| US-003 | As a **user**, I want to log out from the platform so that my session is secure. | Logout → redirect to login page. Session invalidated. |

### 7.2 Student Management

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-010 | As a **teacher**, I want to create a student account with a username and default password so that the student can log in. | Account created. Username is unique. Default password set. |
| US-011 | As a **teacher**, I want to view a list of all students so that I can manage their accounts. | All students listed with name, username, and status. |
| US-012 | As a **teacher**, I want to edit a student's name and username so that I can correct errors. | Changes saved. New username remains unique. |
| US-013 | As a **teacher**, I want to reset a student's password so that they can regain access. | Password reset to new value. Student can log in with new password. |
| US-014 | As a **teacher**, I want to deactivate a student account so that former students cannot access the platform. | Account deactivated. Student cannot log in. Data preserved. |

### 7.3 Question Bank

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-020 | As a **teacher**, I want to add a question with subject, topic, difficulty, four options, correct answer, and marks so that it joins the question bank. | Question saved with all required fields. Appears in question bank listing. |
| US-021 | As a **teacher**, I want to import questions from an Excel file so that I can add many questions quickly. | File parsed. Valid questions saved. Invalid rows reported with error details. |
| US-022 | As a **teacher**, I want to edit an existing question so that I can correct mistakes. | Changes saved. Updated question reflected in future tests. |
| US-023 | As a **teacher**, I want to filter questions by subject, topic, and difficulty so that I can find specific questions. | Filters applied. Matching questions displayed. |
| US-024 | As a **teacher**, I want to download a template Excel file for bulk import so that I know the required format. | Template downloaded with column headers and sample data. |

### 7.4 Practice Mode

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-030 | As a **student**, I want to select a subject, topic, and difficulty level so that I can practice specific areas. | Questions matching selection criteria displayed. |
| US-031 | As a **student**, I want to select "Combined" difficulty so that I get a mix of easy, medium, and hard questions. | Practice set contains questions from all three levels. |
| US-032 | As a **student**, I want to submit my practice answers and see immediate results so that I can learn from mistakes. | Score displayed. Correct answers shown. Explanations shown (if available). |
| US-033 | As a **student**, I want to practice as many times as I want so that I can improve. | No attempt limit enforced. Each attempt recorded. |
| US-034 | As a **student**, I want my practice results to update my progress chart so that I can see improvement. | Progress data updated after each practice submission. |

### 7.5 Mock Tests

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-040 | As a **teacher**, I want to create a mock test following the JNVST pattern (80 questions, 100 marks, 120 min) so that students experience the real exam format. | Test created with enforced JNVST pattern. Questions distributed across sections. |
| US-041 | As a **teacher**, I want to schedule a mock test for a specific date and time so that students can attempt it at the right time. | Test available only within scheduled window. |
| US-042 | As a **teacher**, I want to reopen a completed mock test for a specific student so that they can reattempt it. | Student's attempt count reset. Student can reattempt. Previous result preserved. |
| US-043 | As a **student**, I want to see a countdown timer during my mock test so that I manage my time effectively. | Timer displayed. Counts down from 120 minutes. |
| US-044 | As a **student**, I want the system to auto-submit my test when time expires so that my answers are not lost. | Test auto-submitted at 0:00. All answered questions evaluated. |
| US-045 | As a **student**, I want to navigate between questions during the test so that I can revisit earlier questions. | Previous/Next navigation available. Answers preserved on navigation. |
| US-046 | As a **student**, I want to see my mock test result (score, section-wise breakdown) after submission so that I know my performance. | Result page shows total score, section scores, correct/incorrect count. |

### 7.6 Performance Analytics

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-050 | As a **student**, I want to see my overall score, percentage, and topic-wise strength/weakness on my dashboard so that I know where to focus. | Dashboard shows score summary and topic categorization (strong/average/weak). |
| US-051 | As a **student**, I want to see my progress over time in a chart so that I can track improvement. | Visual chart showing score trend across attempts. |
| US-052 | As a **teacher**, I want to see a class-level performance overview so that I understand overall preparedness. | Dashboard shows class average, score distribution, and participation rate. |
| US-053 | As a **teacher**, I want to see student-wise performance so that I can identify who needs extra help. | Table of students with scores, accuracy, and trend indicators. |
| US-054 | As a **teacher**, I want to see topic-wise accuracy across the class so that I know which topics need more teaching. | Bar/chart showing accuracy per topic. Weak topics highlighted. |
| US-055 | As a **teacher**, I want to see a list of weak students so that I can provide targeted support. | Students below threshold listed with their weak topics. |

---

## 8. Use Cases

### 8.2 Detailed Use Cases

#### UC-01: Teacher Login

| Field | Detail |
|---|---|
| **Use Case ID** | UC-01 |
| **Name** | Teacher Login |
| **Actor** | Teacher |
| **Precondition** | Teacher has valid credentials |
| **Main Flow** | 1. Teacher opens login page. 2. Enters username and password. 3. System validates credentials. 4. System redirects to Teacher Dashboard. |
| **Alternate Flow** | 3a. Invalid credentials → error message displayed, login page retained. |
| **Postcondition** | Teacher is authenticated and on the dashboard. |

#### UC-02: Create Student Account

| Field | Detail |
|---|---|
| **Use Case ID** | UC-02 |
| **Name** | Create Student Account |
| **Actor** | Teacher |
| **Precondition** | Teacher is logged in |
| **Main Flow** | 1. Teacher navigates to Student Management. 2. Clicks "Add Student." 3. Enters student name, username, and default password. 4. System validates uniqueness of username. 5. System creates account and confirms. |
| **Alternate Flow** | 4a. Duplicate username → error message, prompt to change. |
| **Postcondition** | New student account exists. Student can log in. |

#### UC-03: Add Question (Manual)

| Field | Detail |
|---|---|
| **Use Case ID** | UC-03 |
| **Name** | Add Question Manually |
| **Actor** | Teacher |
| **Precondition** | Teacher is logged in |
| **Main Flow** | 1. Teacher navigates to Question Bank. 2. Clicks "Add Question." 3. Selects subject, topic, difficulty. 4. Enters question text, four options, correct answer, marks, optional explanation. 5. Clicks Save. 6. System validates and stores. |
| **Alternate Flow** | 6a. Missing required field → validation error shown. |
| **Postcondition** | Question stored in question bank, available for tests. |

#### UC-04: Bulk Import Questions

| Field | Detail |
|---|---|
| **Use Case ID** | UC-04 |
| **Name** | Bulk Import Questions |
| **Actor** | Teacher |
| **Precondition** | Teacher is logged in. Excel/CSV file is prepared per template. |
| **Main Flow** | 1. Teacher navigates to Question Bank → Import. 2. Uploads Excel/CSV file. 3. System parses and validates all rows. 4. System displays preview with valid/invalid row counts. 5. Teacher confirms import. 6. Valid questions saved. |
| **Alternate Flow** | 3a. File format invalid → error message. 4a. Some rows invalid → invalid rows shown with error details; teacher can fix and re-upload or import valid rows only. |
| **Postcondition** | Valid questions added to question bank. |

#### UC-05: Attempt Practice

| Field | Detail |
|---|---|
| **Use Case ID** | UC-05 |
| **Name** | Attempt Practice |
| **Actor** | Student |
| **Precondition** | Student is logged in. Questions exist for selected criteria. |
| **Main Flow** | 1. Student selects Practice Mode. 2. Selects subject. 3. Selects topic. 4. Selects difficulty (Easy/Medium/Hard/Combined). 5. System fetches matching questions. 6. Student answers questions. 7. Student submits. 8. System evaluates and shows results with correct answers. 9. Progress updated. |
| **Alternate Flow** | 5a. No questions found → message displayed, student returns to selection. |
| **Postcondition** | Practice results recorded. Progress updated. |

#### UC-06: Attempt Mock Test

| Field | Detail |
|---|---|
| **Use Case ID** | UC-06 |
| **Name** | Attempt Mock Test |
| **Actor** | Student |
| **Precondition** | Student is logged in. Mock test is scheduled and currently active. Student has not already attempted. |
| **Main Flow** | 1. Student sees available mock test. 2. Clicks "Start Test." 3. System loads 80 questions; timer starts (120 min). 4. Student answers questions, navigating freely. 5. Student clicks Submit (or timer expires). 6. Confirmation dialog shown. 7. System auto-evaluates. 8. Result displayed. |
| **Alternate Flow** | 5a. Timer expires → auto-submit. 2a. Already attempted → "Already completed" message. 2b. Not in time window → "Test not available" message. |
| **Postcondition** | Test submitted. Result recorded. Attempt marked as complete. |

#### UC-07: Reopen Mock Test

| Field | Detail |
|---|---|
| **Use Case ID** | UC-07 |
| **Name** | Reopen Mock Test for Student |
| **Actor** | Teacher |
| **Precondition** | Teacher is logged in. Student has completed the mock test. |
| **Main Flow** | 1. Teacher navigates to mock test details. 2. Selects a student who has completed the test. 3. Clicks "Reopen." 4. System grants the student an additional attempt. |
| **Postcondition** | Student can reattempt the test. Previous attempt data preserved. |

#### UC-08: View Reports

| Field | Detail |
|---|---|
| **Use Case ID** | UC-08 |
| **Name** | View Performance Reports |
| **Actor** | Teacher |
| **Precondition** | Teacher is logged in. Students have attempted tests. |
| **Main Flow** | 1. Teacher navigates to Reports. 2. Selects report type (student-wise / class / topic-wise). 3. Applies optional filters (subject, topic, date range). 4. System displays report with charts and tables. |
| **Postcondition** | Report displayed. No data modified. |

---

## 10. Data Dictionary

### 10.1 Core Entities

#### Examination

| Field | Type | Description |
|---|---|---|
| examination_id | PK | Unique identifier |
| name | String | e.g., "JNVST", "Maharashtra Scholarship" |
| description | Text | Exam description |
| total_questions | Integer | Total questions in exam |
| total_marks | Integer/Decimal | Total marks |
| duration_minutes | Integer | Exam duration |
| has_negative_marking | Boolean | Whether negative marking applies |
| negative_marking_value | Decimal | Marks deducted per wrong answer (0 if none) |
| is_active | Boolean | Whether this exam is currently active |
| created_at | Timestamp | Record creation time |

#### Examination Section

| Field | Type | Description |
|---|---|---|
| section_id | PK | Unique identifier |
| examination_id | FK → Examination | Parent examination |
| name | String | e.g., "Mental Ability Test" |
| question_count | Integer | Number of questions in this section |
| total_marks | Decimal | Marks for this section |
| duration_minutes | Integer | Time allocated for this section |
| display_order | Integer | Order of section in exam |

#### Subject

| Field | Type | Description |
|---|---|---|
| subject_id | PK | Unique identifier |
| examination_id | FK → Examination | Parent examination |
| name | String | e.g., "Mental Ability", "Arithmetic" |
| description | Text | Subject description |
| display_order | Integer | Display order |

#### Topic

| Field | Type | Description |
|---|---|---|
| topic_id | PK | Unique identifier |
| subject_id | FK → Subject | Parent subject |
| name | String | e.g., "Analogy", "Number System" |
| description | Text | Topic description |
| display_order | Integer | Display order |

#### User

| Field | Type | Description |
|---|---|---|
| user_id | PK | Unique identifier |
| username | String (unique) | Login identifier |
| password_hash | String | Hashed password |
| full_name | String | Display name |
| role | Enum | "teacher" or "student" |
| is_active | Boolean | Account status |
| created_by | FK → User (nullable) | Teacher who created (for students) |
| created_at | Timestamp | Account creation time |
| updated_at | Timestamp | Last update time |

#### Question

| Field | Type | Description |
|---|---|---|
| question_id | PK | Unique identifier |
| examination_id | FK → Examination | Parent examination |
| subject_id | FK → Subject | Associated subject |
| topic_id | FK → Topic | Associated topic |
| section_id | FK → Section | Associated exam section |
| difficulty | Enum | "easy", "medium", "hard" |
| question_text | Text (rich) | Question body (supports images) |
| option_a | Text | Option A |
| option_b | Text | Option B |
| option_c | Text | Option C |
| option_d | Text | Option D |
| correct_answer | Enum (A/B/C/D) | Correct option |
| marks | Decimal | Marks for this question |
| explanation | Text (nullable) | Optional explanation |
| created_by | FK → User | Creator (teacher) |
| created_at | Timestamp | Creation time |
| updated_at | Timestamp | Last update time |

#### Test

| Field | Type | Description |
|---|---|---|
| test_id | PK | Unique identifier |
| examination_id | FK → Examination | Associated examination |
| title | String | Test display name |
| type | Enum | "practice" or "mock" |
| total_questions | Integer | Number of questions |
| total_marks | Decimal | Total marks |
| duration_minutes | Integer (nullable) | Duration (null for practice) |
| scheduled_start | Timestamp (nullable) | Start time for mock |
| scheduled_end | Timestamp (nullable) | End time for mock |
| is_active | Boolean | Whether test is currently active |
| created_by | FK → User | Teacher who created |
| created_at | Timestamp | Creation time |

#### Test Question

| Field | Type | Description |
|---|---|---|
| test_question_id | PK | Unique identifier |
| test_id | FK → Test | Parent test |
| question_id | FK → Question | Associated question |
| sequence_order | Integer | Display order |

#### Test Attempt

| Field | Type | Description |
|---|---|---|
| attempt_id | PK | Unique identifier |
| test_id | FK → Test | Associated test |
| student_id | FK → User | Student who attempted |
| started_at | Timestamp | When student started |
| submitted_at | Timestamp | When submitted |
| is_auto_submitted | Boolean | Whether auto-submitted by timer |
| total_score | Decimal | Total marks obtained |
| total_correct | Integer | Number of correct answers |
| total_wrong | Integer | Number of wrong answers |
| total_unanswered | Integer | Number of unanswered |

#### Attempt Answer

| Field | Type | Description |
|---|---|---|
| answer_id | PK | Unique identifier |
| attempt_id | FK → Test Attempt | Parent attempt |
| question_id | FK → Question | Associated question |
| selected_option | Enum (A/B/C/D, nullable) | Student's answer |
| is_correct | Boolean | Whether answer is correct |
| marks_obtained | Decimal | Marks awarded |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-001 | Pages shall load within **3 seconds** on a standard broadband connection. |
| NFR-PERF-002 | The system shall support **40 concurrent users** without degradation. |
| NFR-PERF-003 | Mock test timer shall remain accurate (< 1 second drift over 120 minutes). |
| NFR-PERF-004 | Question evaluation shall complete within **2 seconds** of submission. |

### 11.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-001 | Passwords shall be stored as salted cryptographic hashes (never plaintext). |
| NFR-SEC-002 | Sessions shall expire after a configurable inactivity period (default: 30 minutes). |
| NFR-SEC-003 | Students shall only access their own data. Cross-student data access is prohibited. |
| NFR-SEC-004 | All teacher-only functions shall be protected by role-based access control. |
| NFR-SEC-005 | Mock test questions shall not be accessible in the browser source before test start. |

### 11.3 Usability

| ID | Requirement |
|---|---|
| NFR-USE-001 | The UI shall be responsive and functional on screens from 360px (mobile) to 1920px (desktop). |
| NFR-USE-002 | The UI shall use clear, age-appropriate language for 4th standard students. |
| NFR-USE-003 | Navigation shall require no more than **3 clicks** to reach any primary function. |
| NFR-USE-004 | The system shall display appropriate feedback for all user actions (success, error, loading). |

### 11.4 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-001 | The system shall preserve mock test answers in the event of a browser refresh. |
| NFR-REL-002 | The system shall auto-submit mock tests if the client loses connection and reconnects after timer expiry. |
| NFR-REL-003 | Data backups shall be supported (manual or automated, based on deployment). |

### 11.5 Scalability

| ID | Requirement |
|---|---|
| NFR-SCA-001 | The data model shall support multiple examinations without schema changes. |
| NFR-SCA-002 | The system shall support addition of new subjects, topics, and sections via data configuration. |
| NFR-SCA-003 | The system shall support growth to 200+ students without architectural changes. |

### 11.6 Compatibility

| ID | Requirement |
|---|---|
| NFR-COM-001 | The system shall function on the latest stable versions of Google Chrome and Microsoft Edge. |
| NFR-COM-002 | The system shall provide a responsive experience on desktop, tablet, and mobile devices. |

---

## 12. Assumptions & Dependencies

### 12.1 Assumptions

| # | Assumption |
|---|---|
| A1 | The school has internet connectivity sufficient for 30–40 concurrent users. |
| A2 | Students have access to devices (school computers, tablets, or personal devices). |
| A3 | Teachers will be trained on platform usage before deployment. |
| A4 | The JNVST exam pattern is stable and will not change during Version 1.0 development. |
| A5 | The detailed Language section syllabus will be provided by the school before development of that module. |
| A6 | The school will provide or approve the initial question bank content. |

### 12.2 Dependencies

| # | Dependency |
|---|---|
| D1 | Language section topic list — pending from client. |
| D2 | Sample question papers from client — needed for question bank seeding and validation. |
| D3 | Client approval of this SRS before design/development begins. |

---

## 13. Acceptance Criteria

### 13.1 Module-Level Acceptance

| Module | Acceptance Criteria |
|---|---|
| **Authentication** | Teacher and student can log in/out. Invalid credentials rejected. Sessions managed correctly. |
| **Student Management** | Teacher can create, edit, deactivate students and reset passwords. Duplicate usernames rejected. |
| **Question Bank** | Manual and bulk question entry works. All fields validated. Questions are searchable/filterable. |
| **Practice Mode** | Student can select subject/topic/difficulty and practice with unlimited attempts. Immediate evaluation with correct answers shown. Progress updated. |
| **Mock Test** | Test follows JNVST pattern exactly (80 Qs, 100 marks, 120 min). Timer works. Auto-submit on expiry. Single attempt enforced. Teacher can reopen. |
| **Analytics** | Student sees personal progress and topic-wise strength. Teacher sees class and student-level reports. Weak students identifiable. |
| **Responsiveness** | Application functional on Chrome and Edge, across desktop and mobile screen sizes. |

### 13.2 Overall System Acceptance

| Criteria | Description |
|---|---|
| All "Must" requirements implemented | Every requirement marked "Must" is functional. |
| JNVST pattern compliance | Mock test strictly follows official pattern. |
| 40-user load test | System performs within NFR limits under 40 concurrent users. |
| Data integrity | No data loss during mock test submission (including auto-submit). |
| Security audit | Passwords hashed. Role-based access enforced. No cross-student data leakage. |

---

## 14. Scope & Boundaries

### 14.1 In Scope (Version 1.0)

| Feature | Status |
|---|---|
| JNVST Examination Support | ✅ In Scope |
| Teacher Login & Dashboard | ✅ In Scope |
| Student Login & Dashboard | ✅ In Scope |
| Student Account Management (by Teacher) | ✅ In Scope |
| Question Bank (Manual + Bulk Import) | ✅ In Scope |
| Practice Mode (Subject/Topic/Difficulty) | ✅ In Scope |
| Mock Tests (Official Pattern, Timer, Auto-Submit) | ✅ In Scope |
| Automatic Evaluation | ✅ In Scope |
| Performance Analytics & Reports | ✅ In Scope |
| Responsive Web Application | ✅ In Scope |

### 14.2 Out of Scope (Version 1.0)

| Feature | Status | Notes |
|---|---|---|
| Parent Portal | ❌ Out of Scope | Future consideration |
| Online Payments | ❌ Out of Scope | Not required |
| Mobile Android/iOS App | ❌ Out of Scope | Responsive web is sufficient |
| AI Question Generation | ❌ Out of Scope | Future consideration |
| Leaderboard / Gamification | ❌ Out of Scope | Not requested |
| Video Lectures | ❌ Out of Scope | Not requested |
| Multi-school Support | ❌ Out of Scope | Future consideration |
| Student Self-Registration | ❌ Out of Scope | By design — teacher-controlled |
| Maharashtra Scholarship Exam | ❌ Out of Scope | Planned for Version 2.0 |
| NMMS Exam | ❌ Out of Scope | Planned for Version 3.0 |
| Printing / PDF Export of Reports | ❌ Out of Scope | Future consideration |

---

## Appendix A — Role-Permission Matrix

| Feature / Action | Teacher | Student |
|---|---|---|
| Login | ✅ | ✅ |
| Logout | ✅ | ✅ |
| View own Dashboard | ✅ | ✅ |
| Create Student Account | ✅ | ❌ |
| Edit Student Account | ✅ | ❌ |
| Deactivate Student Account | ✅ | ❌ |
| Reset Student Password | ✅ | ❌ |
| Add Question (Manual) | ✅ | ❌ |
| Import Questions (Bulk) | ✅ | ❌ |
| Edit Question | ✅ | ❌ |
| Delete Question | ✅ | ❌ |
| Create Practice Set | ✅ | ❌ |
| Create Mock Test | ✅ | ❌ |
| Schedule Mock Test | ✅ | ❌ |
| Reopen Mock Test | ✅ | ❌ |
| Attempt Practice | ❌ | ✅ |
| Attempt Mock Test | ❌ | ✅ |
| View Own Results | ❌ | ✅ |
| View Own Progress | ❌ | ✅ |
| View Student-wise Reports | ✅ | ❌ |
| View Class Reports | ✅ | ❌ |
| View Topic-wise Analysis | ✅ | ❌ |
| Identify Weak Students | ✅ | ❌ |
| Change Own Password | ✅ | ❌ |
| Self-Register | ❌ | ❌ |

---

## Appendix C — Glossary

| Term | Definition |
|---|---|
| **JNVST** | Jawahar Navodaya Vidyalaya Selection Test — a national entrance examination for admission to Jawahar Navodaya Vidyalaya schools. |
| **NMMS** | National Means-cum-Merit Scholarship — a scholarship for Class 8 students. |
| **MCQ** | Multiple Choice Question — a question format with four options and one correct answer. |
| **Practice Mode** | An untimed, self-paced learning mode where students can attempt questions with immediate feedback and unlimited retries. |
| **Mock Test** | A timed, single-attempt examination simulation following the official JNVST pattern. |
| **Question Bank** | A centralized repository of all questions, tagged by subject, topic, and difficulty, reusable across tests. |
| **Combined Difficulty** | A practice mode selection that generates a set containing Easy, Medium, and Hard questions mixed together. |
| **Auto-Submit** | Automatic test submission triggered when the mock test timer expires. |
| **Reopen** | A teacher action that grants a student an additional attempt on a completed mock test. |
| **Soft Delete / Deactivate** | Marking a record as inactive without permanently removing data from the system. |
| **MVP** | Minimum Viable Product — the first release with essential features only. |

---

## Sign-Off

This document requires approval from both the client and the development team before the design and development phase begins.

| Role | Name | Signature | Date |
|---|---|---|---|
| **Client Representative** | Z.P.P. School, Kasare | ___________________ | ________ |
| **Project Lead** | | ___________________ | ________ |
| **Project Guide** | | ___________________ | ________ |
| **Development Team Lead** | | ___________________ | ________ |

---

> [!IMPORTANT]
> **No database design, API specification, or coding shall begin until this SRS is approved by the client.**

---

*Document ID: SRS-DSCEP-2026-001 | Version: 1.0 | Status: Draft — Awaiting Client Approval*