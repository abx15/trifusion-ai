# TriFusion AI — Incident Response

> **Status:** Draft  
> **Last Updated:** 2026-10-25  
> **Purpose:** Severity levels, roles, communication, and post-incident review template.

## Severity Levels

| Severity | Definition | Response Time | Escalation |
|----------|-----------|---------------|------------|
| **SEV-1 (Critical)** | Complete service outage, data loss, security breach, tenant isolation failure | 15 minutes | On-call engineer → Engineering lead → CTO |
| **SEV-2 (High)** | Major feature broken, significant degradation, security vulnerability (non-critical) | 1 hour | On-call engineer → Engineering lead |
| **SEV-3 (Medium)** | Minor feature broken, partial degradation, performance issue | 4 hours | On-call engineer |
| **SEV-4 (Low)** | Cosmetic issue, low impact bug, documentation gap | 1 business day | Engineering team |

## Roles

| Role | Responsibilities |
|------|-----------------|
| **Incident Commander** | Overall incident coordination, decision making, stakeholder communication |
| **On-Call Engineer** | First response, investigation, mitigation, fix implementation |
| **Engineering Lead** | Technical oversight, resource allocation, go/no-go on fixes |
| **Security Lead** | Security incident assessment, customer notification, regulatory reporting |
| **Communications** | Customer status page updates, stakeholder emails, public statements |

## Communication

### Internal
- Slack channel: `#incidents`
- Incident bridge: video conference for SEV-1/SEV-2
- Incident doc: shared document for timeline and decisions

### External (Customers)
- Status page: status.trifusion.ai
- Email: support@trifusion.ai
- Customer notification: only for SEV-1 affecting customer data

### Regulatory
- Security breaches: report to security@trifusion.ai
- Data protection: GDPR/DPDP notification requirements (72 hours where applicable)

## Incident Lifecycle

### 1. Detection
- Monitoring alert (health check failure, error rate spike, etc.)
- Customer report
- Security scan result
- Internal discovery

### 2. Triage
- Assign severity level
- Declare incident in `#incidents`
- Assign Incident Commander and On-Call Engineer
- Start incident timeline document

### 3. Mitigation
- Contain the issue (rollback, disable feature, block traffic)
- Restore service if possible
- Preserve evidence for post-incident analysis

### 4. Resolution
- Implement permanent fix
- Deploy to production
- Verify fix with smoke tests
- Close incident

### 5. Post-Incident Review (PIR)
Required for all SEV-1 and SEV-2 incidents. Template below.

## Post-Incident Review Template

```
# Incident PIR: [INCIDENT-ID]

## Summary
- **Date:** [YYYY-MM-DD]
- **Severity:** [SEV-1/SEV-2/SEV-3/SEV-4]
- **Duration:** [start time] to [end time]
- **Incident Commander:** [name]
- **On-Call Engineer:** [name]

## Impact
- What was affected?
- How many customers impacted?
- Data loss or exposure?
- Downtime duration?

## Timeline
| Time | Action | Owner |
|------|--------|-------|
| [HH:MM] | Incident detected | [name] |
| [HH:MM] | Incident declared | [name] |
| [HH:MM] | Mitigation started | [name] |
| [HH:MM] | Service restored | [name] |
| [HH:MM] | Incident closed | [name] |

## Root Cause
[Detailed root cause analysis]

## Contributing Factors
[List of factors that contributed to the incident]

## What Went Well
[List of things that worked effectively]

## What Went Wrong
[List of things that could be improved]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action item] | [name] | [date] | [open/done] |

## Prevention
[How to prevent similar incidents in the future]

## Customer Communication
[If customer-facing, what was communicated and when]
```

## Security Incident Procedures

### Suspected Data Breach
1. Immediately revoke compromised credentials
2. Isolate affected systems
3. Preserve logs and evidence
4. Security Lead assesses scope and severity
5. Notify affected customers within 72 hours (GDPR/DPDP requirement)
6. File incident report

### Compromised Credentials
1. Revoke the credential immediately
2. Rotate in all environments (API keys, DB passwords, JWT secrets)
3. Review audit logs for unauthorized access
4. Check for data exfiltration patterns
5. Force password reset for affected users

### Tenant Isolation Failure
1. SEV-1 - immediate incident declaration
2. Revoke access for affected workloads
3. Preserve audit logs
4. Fix the isolation bug
5. Deploy fix
6. Notify affected customers
7. File security incident report

## Escalation Matrix

| Severity | First Response | Escalate To | Max Time Before Escalation |
|----------|---------------|-------------|---------------------------|
| SEV-1 | On-Call Engineer | Engineering Lead | 30 minutes |
| SEV-1 | Engineering Lead | CTO | 1 hour |
| SEV-2 | On-Call Engineer | Engineering Lead | 2 hours |
| SEV-3 | On-Call Engineer | — | — |
| SEV-4 | Engineering team | — | — |

## On-Call Schedule

Primary on-call rotates weekly. Secondary on-call is backup. See engineering team roster for current schedule.