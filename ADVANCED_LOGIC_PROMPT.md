# Strategic Vision: KKN V2 System Optimization Prompt

## Context & Objective
The current KKN V2 system is an evolution of the legacy **Kampelmas** system. While it has a modern tech stack (Laravel + React/Inertia), it needs to adopt the comprehensive logic of the legacy system while fixing its "confusion points." The objective is to create a **frictionless experience** for LPPM Admin, DPL (Dosen), and Students.

---

## ── Phase 1: High-Order Grading Logic ──
**Problem:** Legacy system has fragmented input (DPL, Desa, LPPM) which makes it hard to see the "Big Picture" until the very end.

**Actionable Instructions:**
1. **Unified Scoring Interface:** Implement a "Master Grading Spreadsheet" UI for Admin. This should allow toggling between DPL components, Village components, and Admin components in one real-time editable table (Hot-key enabled).
2. **Formula Transparency:** Add a "Calculation Breakdown" tooltip for every final grade. When hovered, show: `(Score A * Weight A) + (Score B * Weight B) = Final Score`.
3. **Anti-Delusion Validator (Logic):** Prevent "Finalization" of grades if:
   - Mandatory DPL components are 0.
   - Final Report (`LaporanAkhir`) is not `status: approved`.
   - Logbook participation is below a configurable minimum (e.g., 80% coverage).
4. **Excel Import Intelligence:** The legacy Excel import is error-prone. Replace it with a **Preview & Mapping UI** (like CSV mapping). Show errors *before* committing to DB (e.g., "Student NIM X not found in Group Y").

---

## ── Phase 2: Logbook & Activity Intelligence ──
**Problem:** Dosen are confused by the sheer number of logs. Admin lacks an aggregate view of "Active vs. Passive" students.

**Actionable Instructions:**
1. **Logbook Heatmap:** Add a visual heatmap or progress bar in the DPL Dashboard showing student activity frequency over the KKN period.
2. **Batch Approval:** Dosen should be able to "Approve All Pending" for a specific group with one confirmation, *after* viewing the aggregate summaries.
3. **Smart Flagging:** Automatically flag students who haven't posted a logbook in >3 days as "At Risk" in the Admin/DPL dashboard.

---

## ── Phase 3: Administrative Efficiency ──
**Problem:** Master data (Faculties, Prodis, Years) management feels like a chore.

**Actionable Instructions:**
1. **Bulk Period Migration:** Implement a tool to "Copy Period Structure" from a previous year to a new one (copying groups, locations, and weights) to save setup time.
2. **Dynamic Certificate Templates:** Instead of static PDFs, use a simple HTML-to-PDF engine where Admin can edit the "Body Text" and "Signatories" via the Settings panel.
3. **Audit Trail UI:** Enhance the Audit Log to show "Visual Diffs" (e.g., "Admin changed Score X from 80 to 95").

---

## ── Technical Excellence (Clean Code) ──
1. **Domain Driven Services:** Move all business rules from `Controllers` to `Services` (e.g., `EvaluationService`, `RegistrationService`).
2. **Database Transactions:** Every mass update (Finalize, Import) MUST be wrapped in a transaction with rollback on failure.
3. **Real-time Feedback:** Use Laravel Reverb or simple polling to show a progress bar for "Mass Finalization" or "Bulk Certificate Generation" (don't let the user guess if it's finished).

---

## ── DESIGN AESTHETICS (premium) ──
- **Transparency & Glassmorphism:** Use dark-themed backgrounds with subtle blurs for table headers.
- **Micro-animations:** Add subtle entry animations for table rows and stat cards.
- **Empty States:** Never show a blank white screen. Always provide an "Illustration + Call to Action" (e.g., "No grades for this period. Start by selecting a period above.").

---
*This prompt serves as the technical mandate for the next phase of KKN V2 development.*
