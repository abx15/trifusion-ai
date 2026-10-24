# ADR-011: Phase 8 Audit Log Integrity Approach

## Status
Accepted

## Date
2026-10-24

## Context
Audit logs are critical for security investigations, compliance, and accountability. They must be tamper-evident - any unauthorized modification or deletion should be detectable.

Requirements:
- Detect if an attacker modifies or deletes audit log entries
- Detect if database-level tampering occurs
- Append-only design (no update/delete operations on AuditLog)
- Provide integrity verification endpoint
- Minimal performance overhead

## Decision
Implement **hash chaining** for audit log integrity:

### Hash Chain Design
1. Each `AuditLog` record gets a `chainHash` column (SHA-256)
2. The chain hash is computed as:
   ```
   chainHash = SHA256(previousChainHash || auditAction || actorId || targetId || workspaceId || timestamp || normalizedMetadata)
   ```
3. The first log entry uses a known seed value as `previousChainHash`
4. The chain is immutable: once written, `chainHash` never changes

### Verification
- A verification endpoint `/platform/audit/integrity` walks the chain
- Computes expected hash for each entry based on previous entry
- Reports first position where chain is broken
- Returns integrity status and any detected tampering

### Additional Safeguards
- Database-level: AuditLog table has NO UPDATE or DELETE permissions for application user
- Application-level: AuditLogService only provides `create` operations
- Backup-level: Regular immutable backups of audit log table
- Alerting: Any integrity check failure triggers security alert

### Implementation Notes
- Hash computed in application layer before insert
- `chainHash` column indexed for efficient verification
- Verification runs as scheduled job (e.g., daily) and on-demand via endpoint
- Chain break indicates tampering or corruption - requires security investigation

## Consequences
- **Positive**: Tamper-evident audit trail, detect unauthorized modifications
- **Positive**: Compliance-friendly (detectable integrity violations)
- **Negative**: Additional computation per audit log insert (minimal SHA-256 overhead)
- **Negative**: Chain verification requires full table scan (mitigated by scheduled checks)
- **Positive**: Simple implementation, no external dependencies
