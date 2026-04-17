# Product Specification: Model Context Protocol (MCP) Integration
**Project:** KKN UIN SAIZU Administrative Portal
**Document Type:** Technical Specification & System Information
**Status:** `Active / Implementation Phase 1 Complete`
**Version:** 1.0.0

---

## 1. Overview
The Model Context Protocol (MCP) integration in the KKN UIN SAIZU portal is designed to provide Large Language Models (LLMs) and AI Agents with secure, real-time access to the application's data layer, business logic, and system resources. This enables features like automated reporting, intelligent data analysis, and autonomous system health monitoring.

---

## 2. Architecture
The system employs a dual-layer MCP architecture:

### 2.1 Internal Application Server (Laravel Native)
Managed by the `laravel/mcp` package, this server exposes high-level business tools directly from the Laravel application.
- **Protocol:** SSE (Server-Sent Events) / Web-based MCP.
- **Endpoint:** `POST /mcp`
- **Controller:** `App\Mcp\Servers\AppServer`

### 2.2 External Infrastructure Servers (IDE/Desktop Level)
Facilitates direct low-level access for development and advanced administrative tasks using standard MCP protocols.
- **PostgreSQL Server:** Direct read-access to the `kkn` database.
- **Filesystem Server:** Direct access to the project root for codebase analysis.

---

## 3. Internal Server Specification

### 3.1 Security & Authorization
To prevent unauthorized data exposure, the internal MCP endpoint is secured via:
- **Middleware:** `auth`, `verified`.
- **RBAC (Role-Based Access Control):** Restricted to users with `admin` or `superadmin` roles.
- **Gate Enforcement:** Uses `manage-settings` and `view-reports` gates to validate context.

### 3.2 Registered Tools
Tools represent executable functions that AI agents can call.

#### `GetStudentStats`
- **Description:** Fetches real-time registration statistics for a specific KKN period.
- **Input Parameters:**
  - `periodId` (integer): The unique identifier of the KKN period.
- **Output Schema:**
  - `total_registrants`: Total number of students applied.
  - `approved`: Count of verified participants.
  - `pending`: Count of applications awaiting review.
  - `faculty_distribution`: Array of objects containing `faculty` name and student `count`.

### 3.3 Registered Resources
Resources represent static or dynamic data paths that agents can read.

#### `kkn://active-period`
- **Description:** Provides the complete metadata of the currently active KKN period.
- **Logic:** Resolves to the record in the `periode` table where `is_active = true`.

---

## 4. AI Configuration Management

### 4.1 Key Security
Sensitive credentials (like the Google Gemini API Key) are managed through the `SystemSettingController`:
- **Encryption:** Keys are encrypted at rest using Laravel's `AES-256-CBC` encryption.
- **Masking:** UI components mask keys, showing only the last 4 characters to prevent shoulder-surfing.
- **Validation:** Includes a `testAiConnection` endpoint to verify keys against the Google Generative AI API before saving.

### 4.2 Module Control
- **Global Toggle:** An `ai_enabled` setting allows administrators to instantly enable or disable all AI-assisted features (Diagnostics, Plagiarism checks, MCP access) globally.

---

## 5. External Integration Guide
For developers using Claude Desktop or Cursor, the following configuration is used to connect to the external MCP layer:

### 5.1 Database Integration (PostgreSQL)
```json
"kkn-database": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://[user]:[pass]@127.0.0.1:5433/kkn"
  ]
}
```

### 5.2 Filesystem Integration
```json
"kkn-filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/path/to/kknuinsaizu"
  ]
}
```

---

## 6. Future Roadmap
- **Intelligent Monitor Tab:** A unified dashboard combining MCP status, AI health logs, and API configuration.
- **Autonomous Healing Logs:** Integration of MCP events into the system's "Self-Healing" log subsystem.
- **Expanded Toolset:** Adding tools for `AssignDpl`, `GenerateCertificateBatch`, and `AuditPlagiarism`.

---

## 7. Technical Compliance
- **PHP Version:** 8.3+ (Laravel 13)
- **Database:** PostgreSQL 16
- **Package Dependency:** `laravel/mcp:^0.6.5`
- **Frontend Framework:** React 18 / Inertia.js 2.0
