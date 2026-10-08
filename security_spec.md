# Security Specification & Threat Model

## 1. Data Invariants
- Each student user profile `/users/{userId}` belongs to `request.auth.uid == userId`.
- All sub-collections (`semesters`, `courses`, `assignments`, `lectures`, `quizzes`, `chatMessages`) strictly belong to the parent user.
- Only administrators (including bootstrapped admin `muhammadirteza2024@gmail.com`) can update student roles or suspension flags.
- Suspended users are restricted from coursework modifications.
- Submissions enforce ID integrity and schema limits (e.g. title lengths, valid status enums).

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Write**: Creating a course with `auth == null` -> DENIED.
2. **Cross-Tenant Write**: User A creating an assignment in User B's `/users/{userB}/assignments` -> DENIED.
3. **Role Escalation**: Regular student trying to update their own `role: "admin"` -> DENIED.
4. **Self-Unsuspension**: Suspended student attempting to set `isSuspended: false` -> DENIED.
5. **ID Poisoning**: Injecting an assignment ID with malicious path traversal or >128 chars -> DENIED.
6. **Payload Bloat**: Submitting a lecture concept summary exceeding maximum length limits -> DENIED.
7. **Identity Spoofing**: Submitting a task with `userId` different from the authenticated token UID -> DENIED.
8. **Invalid Enum**: Creating an assignment with `priority: "ultra-high"` -> DENIED.
9. **Blanket Query Scraping**: Attempting to list all users' assignments without user scoping -> DENIED.
10. **Ghost Key Injection**: Adding hidden arbitrary fields like `isAdmin: true` into a course payload -> DENIED.
11. **Foreign Course Deletion**: Attempting to delete another student's quiz or semester -> DENIED.
12. **Tampered Admin Spoof**: Attempting to write to `/admins/{id}` as a non-admin -> DENIED.
