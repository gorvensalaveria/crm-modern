# CODEX Phase 10I: EC2 Backend Deployment Prerequisite Readiness Plan

## 1. Phase Objective

Phase 10I defines the prerequisites, architectural decisions, risks, and approval sequence required before the existing EC2 backend can safely deploy an immutable backend image from Amazon ECR through the current Docker Compose-based design.

This phase is planning and documentation only. It does not install software, inspect or modify IAM, access EC2, authenticate to ECR, pull an image, change containers, place files, or deploy production.

## 2. Verified Context

Verified production runtime facts:

* EC2 operating-system family is Ubuntu.
* Docker Compose project is `app`.
* Compose service is `api`.
* Current container is `app-api-1`.
* Restart policy is `unless-stopped`.
* Docker network is `app_default`.
* Published backend port is `4000`.
* Production Compose file path is `/opt/crm-modern/app/docker-compose.prod.yml`.
* Runtime env file path is `/opt/crm-modern/env/production.env`.
* Local health URL uses loopback port `4000`.
* Public health previously returned HTTP `200`.
* Local health previously returned HTTP `200`.
* Approved AWS region and backend ECR repository name exist as non-secret project configuration.

Verified local deployment artifacts:

```text
docker-compose.prod.yml
scripts/deploy-backend-ecr.sh
```

The production Compose service uses an explicitly supplied `BACKEND_IMAGE`, preserves service `api`, keeps restart policy `unless-stopped`, publishes port `4000`, injects the runtime env file, and keeps only non-secret static environment values in the Compose YAML.

The deployment script:

* accepts an immutable `sha-*` tag and rejects `latest`,
* requires AWS CLI, Docker, Docker Compose, and curl,
* targets Compose project `app` and service `api`,
* performs local health before public health,
* supports rollback to the previous image,
* does not run Prisma or migrations,
* does not print env values,
* does not run `docker compose config`,
* has never been executed.

Previous EC2 discovery reported that AWS CLI was unavailable and Docker commands required `sudo`.

## 3. Readiness Decision Principles

Future prerequisite work should follow these principles:

* preserve the existing Compose-managed runtime,
* use immutable image tags only,
* use EC2 instance-profile credentials rather than long-lived AWS access keys,
* grant only permissions required by the selected deployment design,
* make Docker privilege elevation explicit and auditable,
* keep repository-managed deployment files separate from host-managed secrets,
* validate prerequisites before any ECR authentication or image pull,
* keep local health, public health, and rollback as separate verification layers,
* require Architect approval before every operational phase,
* keep all operational work user-executed and limited to its approved scope.

## 4. AWS CLI Readiness

### 4.1 Why the Current Script Requires AWS CLI

AWS CLI availability is required by the current deployment-script design because the script uses it to:

* resolve ECR repository metadata,
* request ECR authorization credentials for Docker,
* select the approved region for AWS operations.

This is a requirement of the current script design, not a general statement that every possible ECR deployment design must use AWS CLI.

### 4.2 Information Required Before Installation Planning

A later approved discovery or installation-planning phase must establish:

* CPU architecture,
* installed operating-system release,
* whether an older AWS CLI package or binary already exists outside the current command path,
* desired AWS CLI major version,
* approved installation source,
* update and removal strategy,
* execution identity that will run the deployment script,
* whether that identity can resolve instance-profile credentials safely.

Phase 10I does not perform those checks or approve an installation command.

### 4.3 Installation-Source and Version Considerations

Options to review later include:

* the official AWS CLI v2 distribution,
* an operating-system package where its version and maintenance lifecycle are acceptable,
* an already managed host-image or configuration-management source in a future mature model.

The selected source should be reviewable, architecture-compatible, support a predictable update lifecycle, and avoid unverified third-party packages. AWS CLI v2 is the preferred evaluation baseline unless a later phase documents a reason to use another supported version.

### 4.4 Safe Future Validation

A later user-executed phase may validate installation by checking command availability and version without printing AWS identity or infrastructure metadata. Instance-profile credential resolution may be checked through a sanitized non-ECR AWS request. Approved read-only ECR repository or image metadata checks may be considered with all raw output suppressed. Authorization-token retrieval is excluded from non-deploying discovery and preflight.

AWS CLI installation method, version, source, and execution are not approved in Phase 10I.

## 5. EC2 IAM Role Readiness

### 5.1 Basic ECR Pull Permissions

The ECR permissions previously identified for the pull path are:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:BatchGetImage
ecr:GetDownloadUrlForLayer
ecr:DescribeImages
```

Their conceptual roles are:

* authorization-token access for Docker registry authentication,
* manifest and layer discovery for image pulling,
* layer download access,
* optional image metadata checks before deployment.

The final minimum set must be verified against the exact chosen preflight and deployment behavior. Phase 10I does not assume the current IAM policy contents.

`ecr:GetAuthorizationToken` remains conceptually required by the final deployment path, but it must not be operationally tested during Phase 10J discovery or Phase 10N non-deploying preflight. Token retrieval belongs only to a separately approved ECR-access validation phase or the controlled first-deployment phase.

### 5.2 `ecr:DescribeRepositories` Design Dependency

`ecr:DescribeRepositories` is not inherently required for a basic ECR image pull.

It is required by the current deployment script because the script invokes `aws ecr describe-repositories` to obtain repository metadata and derive the registry value.

Retaining this dependency has two advantages:

* it preserves the currently reviewed script shape,
* it avoids placing registry metadata directly in the script.

It also has costs:

* the EC2 role needs an additional read permission that Docker pull itself does not require,
* deployment depends on another AWS API call,
* a missing permission can fail deployment before ECR authentication.

### 5.3 Registry-Resolution Alternatives

A later architecture phase should compare:

* retaining repository discovery and confirming the minimum conceptual permission,
* supplying the approved registry host or image-reference base through controlled non-secret deployment configuration,
* deriving required registry information internally through another reviewed mechanism that does not print account or registry metadata.

Supplying controlled registry configuration can remove the `DescribeRepositories` dependency, but placement, ownership, redaction, and drift must then be managed. Deriving it through another AWS call may merely replace one permission or dependency with another.

### 5.4 Least-Privilege Direction

For the first controlled deployment, retaining the current command may be justified if the existing role already permits it or a later approved IAM proposal establishes a narrowly scoped need. If it is absent, the project should compare the least-privilege addition against a script revision before changing IAM.

For a mature design, removing unnecessary discovery calls is preferable when approved non-secret registry configuration can be managed reliably and without log exposure.

No IAM policy JSON, inspection, modification, or authorization belongs in Phase 10I.

## 6. EC2 Instance-Profile Credential Behavior

AWS CLI on EC2 normally follows its credential-provider chain. When no higher-priority user-local or environment credential source is selected, it can obtain temporary credentials from the instance profile attached to the instance.

Important distinctions:

* instance-profile credentials are temporary host-provided credentials,
* user-local AWS credential files belong to a specific home-directory context,
* environment credentials belong to the invoking process environment,
* running through `sudo` commonly changes the user, home directory, and preserved environment,
* changing to root does not inherently prevent access to instance-profile credentials,
* access can still be affected by host metadata settings, network controls, proxy configuration, credential-provider precedence, or execution environment.

Therefore, neither of these assumptions is safe without verification:

```text
sudo always breaks instance-profile credentials
sudo always preserves working AWS credential behavior
```

The selected deployment identity must be tested later using suppressed-output checks under that exact execution model. The checks should establish only whether usable AWS credentials resolve and required ECR calls succeed. They must not print raw identity, account IDs, role ARNs, credentials, or metadata.

The deployment design must not depend on stored long-lived AWS access keys or user-local credential files.

## 7. Docker Privilege Execution Models

Previous discovery showed that Docker required `sudo`. Docker daemon access is effectively root-equivalent, whether granted through sudo, the Docker group, or a privileged service.

| Option | Security and Root Equivalence | Instance-Profile Compatibility | Script Complexity | Ownership Implications | Manual SSM Suitability | Future Automation | Auditability and Safety |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Run the complete deployment script with sudo | Entire reviewed script runs with root privileges; any writable script or Compose file becomes a critical risk | Root can normally use instance-profile credentials, but this must be verified under the exact host model | Lowest change to current script because all Docker and Compose calls already run directly | Script and Compose file should be controlled against unprivileged modification; env-file access is straightforward but highly sensitive | Strong candidate for a first controlled run when files and inputs are verified | Acceptable as an interim model; broad privilege is less ideal for frequent automation | Clear single privilege boundary, but a large root execution surface |
| Keep script non-root and sudo only Docker/Compose calls | Docker commands remain root-equivalent; AWS and health checks run as session user | Separates AWS credential behavior from Docker privilege; session-user AWS readiness must be verified | Requires script revision and consistent sudo handling, including rollback paths | Script can remain application-user controlled, but Docker-affecting inputs still require strong protection | Possible, but more moving parts for the first run | Reasonable transitional model if narrowly controlled sudo is later designed | More granular, but mixed identities complicate logs and failure analysis |
| Add deployment user to Docker group | Persistent root-equivalent Docker access without a visible sudo boundary | AWS CLI remains under the user context | Simple command invocation | User and any process under that account gain powerful daemon access | Convenient but not recommended merely for convenience | Sometimes used, but weakens privilege separation | Less explicit privilege events and broader ongoing exposure |
| Root-owned or service-managed deployment mechanism | Privilege is concentrated in a controlled runner with a narrow interface | Runner credential behavior must be verified; instance profile remains the intended source | Highest initial design effort | Root-owned script/config and tightly controlled inputs are appropriate | Too much setup for an immediate one-time manual deployment unless already present | Preferred mature direction for repeatable automation | Best potential auditability when invocation, inputs, logs, and rollback are constrained |

No Docker-group, sudoers, service, ownership, or permission change is authorized here.

## 8. Docker Execution Recommendations

### 8.1 First Controlled Manual Deployment

For the first controlled manual deployment, the recommended architecture is:

```text
Run the complete, reviewed deployment script under one explicitly elevated execution context initiated through an approved manual SSM workflow.
```

This recommendation is conditional on later phases confirming:

* the script and Compose file on EC2 exactly match the reviewed versions,
* privileged users control their modification,
* the runtime env file remains protected,
* AWS CLI and instance-profile credentials work under the elevated identity,
* Docker Compose project and service identity are preserved,
* non-deploying preflight checks pass,
* rollback inputs and health baselines are ready,
* production execution receives explicit approval.

This model minimizes first-run script changes and avoids permanent Docker-group membership. It also means the entire script is privileged, so file integrity and review are mandatory.

### 8.2 Future Mature Automation

For mature automation, the recommended direction is:

```text
A root-owned or otherwise tightly controlled deployment runner with a narrow immutable-tag input, explicit approval, sanitized logs, and tested rollback.
```

The mature model may be invoked through controlled SSM automation or another reviewed deployment mechanism. It should avoid broad interactive privilege, prevent untrusted file modification, use instance-profile credentials, expose no secrets, and produce auditable status without raw infrastructure metadata.

Designing or creating that runner is outside Phase 10I.

## 9. Deployment File Placement and Ownership Planning

The reviewed local files are not yet confirmed as placed on EC2 in their updated form.

Planning targets:

* the production Compose file remains under `/opt/crm-modern/app`,
* the deployment script is placed in a controlled location under the same application tree,
* the runtime env file remains under `/opt/crm-modern/env` and outside repository-managed content,
* Compose project `app` and service `api` remain unchanged.

Ownership and access considerations:

* the identity that runs deployment must read the Compose file,
* the deployment script must be readable and executable by the selected identity,
* unprivileged processes must not be able to alter a script that will run as root,
* the runtime env file must be readable only by identities that require it,
* repository synchronization must never overwrite or add the runtime env file,
* no future validation should print file contents or secret values.

The first-deployment recommendation favors privileged control of the script and Compose file if the entire script will run elevated. An application-user-owned script is reasonable only if it cannot be substituted or modified before privileged execution and the trust boundary is explicitly accepted.

Before replacing an existing Compose file, a later placement phase should plan a protected backup or rollback copy, verify the intended target without printing secrets, and define how the previous file is restored. This is planning context, not authorization for a copy, backup, ownership, or permission command.

## 10. Docker Compose Runtime Readiness

Before deployment authorization, a future approved phase must verify:

* Docker is available under the selected execution identity,
* Docker Compose v2 is available under that identity,
* project name `app` still identifies the production project,
* service name `api` still identifies the backend service,
* the approved Compose file is present and readable,
* the runtime env file exists and is readable without exposing contents,
* port `4000` remains compatible with the current Nginx path,
* the current container and both health baselines remain healthy,
* `BACKEND_IMAGE` can be injected under the chosen execution model,
* the production service has no local-build dependency,
* the previous image reference can be captured for rollback,
* rollback can restore the service through the same Compose project and service,
* no unrelated service will be recreated or restarted.

Compose interpolation is a particular risk. `env_file` supplies runtime container variables, while `BACKEND_IMAGE` is resolved by Compose before the container starts. Validation must not use `docker compose config` because rendered output may expose environment-derived values.

## 11. Non-Deploying Preflight Validation Design

The future preflight phase must be genuinely non-deploying. The current script has no reviewed dry-run mode, so the plan must not describe it as supporting one.

### 11.1 Safe Local Repository Validation

Safe local validation may include:

* read-only review of the Compose and script files,
* Bash syntax validation,
* executable-mode inspection,
* whitespace and repository-status checks,
* confirmation that no secrets or env files are tracked.

It must not execute the deployment script or render Compose configuration with secret-bearing inputs.

### 11.2 Safe EC2 Prerequisite Discovery

A separately approved user-executed discovery phase may establish sanitized pass/fail results for:

* host operating-system and architecture context,
* command availability,
* direct versus non-interactive sudo Docker access,
* Compose v2 availability,
* selected existing container metadata,
* local SSM Agent indication,
* exact approved file existence and access,
* instance-profile credential resolution through a sanitized non-ECR AWS check with raw output suppressed,
* approved read-only ECR repository and selected image metadata access with raw output suppressed,
* local and public health baselines.

These checks must not infer specific error causes from suppressed failures.

### 11.3 Checks That Change Local or Remote State

The following are not part of a strictly non-deploying preflight:

* ECR authorization-token retrieval, including `aws ecr get-login-password`, because it obtains registry credential material,
* Docker registry login, because it can change local Docker credential-helper or authentication state,
* image pull, because it changes the host image cache and consumes network/storage resources,
* Compose service update, because it can recreate or restart production containers,
* deployment-script execution, because the current script performs authentication, pull, and service update,
* migration execution, because it changes production data or schema.

### 11.4 Deferral Boundary

ECR authorization-token retrieval, `aws ecr get-login-password`, Docker registry login, and image pull must be deferred to the controlled first-deployment phase unless ChatGPT Architect separately approves a narrowly scoped ECR-access validation phase that explicitly accepts credential-material retrieval and any local state changes.

Phase 10J and Phase 10N may verify instance-profile credential resolution through a sanitized non-ECR AWS check. They may also consider approved read-only ECR repository or image metadata checks with all raw output suppressed. They must not request an ECR authorization token. Authorization-token access, Docker authentication, and core image-pull behavior remain operationally unvalidated until the separately approved ECR-access validation phase or Phase 10O.

## 12. Rollback Readiness

Rollback support exists in the reviewed script, but operational readiness is not yet proven because the script has never run.

Before first deployment, planning must confirm:

* the current container exposes a usable previous image reference,
* the previous image remains locally available or otherwise recoverable,
* Compose accepts the previous reference through `BACKEND_IMAGE`,
* rollback operates on project `app` and service `api` only,
* local health is checked before public health after restoration,
* failure remains visible even when rollback succeeds,
* operators know the stop point if both deployment and rollback fail.

Rollback testing must not be folded into Phase 10I or an otherwise non-deploying preflight.

## 13. Risk and Blocker Table

| Blocker or Risk | Current Verified State | Consequence | Required Future Phase | Production Impact if Mishandled | Approval Status |
| --- | --- | --- | --- | --- | --- |
| AWS CLI unavailable | Previously reported unavailable on EC2 | Current script cannot perform ECR API or authentication work | 10J discovery, then 10L installation guide and separately approved user execution | Deployment fails before image pull; unsafe installation could damage host tooling | Unresolved; no installation approved |
| IAM permission coverage uncertain | Current role policy contents are not assumed; pull permissions require confirmation | AWS or ECR calls may fail | 10J discovery and 10K least-privilege proposal | Over-broad IAM increases exposure; missing permission blocks deployment | Unresolved; no IAM inspection/change approved |
| `ecr:DescribeRepositories` design dependency | Current script invokes it; basic pull does not inherently require it | Additional permission/API dependency can block deployment | 10K architecture and IAM proposal | Incorrect decision may add unnecessary permission or break registry resolution | Decision pending |
| Instance-profile behavior under selected identity | Expected credential source, but root and session-user behavior is unverified | AWS CLI may use no credentials or an unintended higher-priority source | 10J discovery and 10M execution-model guide | Authentication failure or unintended credential use | Unresolved |
| Docker requires sudo | Previously observed | Current non-root script invocation may fail | 10J discovery and 10M execution-model guide | Privilege errors or overly broad root access | Unresolved; no sudo/group change approved |
| Deployment file placement | Updated local artifacts are not confirmed on EC2 | Host may run stale or missing configuration | 10M placement guide and separately approved user placement | Wrong service definition or stale script can disrupt production | Unresolved; no copy approved |
| Ownership and permissions | Target ownership/access model is unconfirmed | Privileged execution may trust mutable files or fail to read required files | 10M execution and ownership plan | Script tampering, secret exposure, or deployment failure | Unresolved; no changes approved |
| Compose readiness | Existing project/service are verified historically; updated file behavior on EC2 is not verified | Compose may reject inputs or affect unintended resources | 10N non-deploying preflight | Container recreation failure or service interruption | Unresolved |
| Safe preflight validation | No approved EC2 preflight has completed for this design | Deployment would begin with unknown prerequisites | 10J discovery and 10N consolidated preflight | Higher first-deployment failure risk | Not approved/executed |
| ECR authorization-token, authentication, and pull boundary | `ecr:GetAuthorizationToken` is conceptually required by the final path, but token retrieval, Docker authentication, and image pull have not been performed and are excluded from non-deploying preflight | Registry credential and core pull behavior remain operationally unvalidated | 10O controlled deployment plan or separate approved ECR-access validation | Credential-material handling, local auth-state changes, storage impact, or pull failure | Deferred; not testable in 10J or 10N |
| Rollback readiness | Script contains rollback logic but has never executed | Recovery may fail after a bad image or unhealthy service | 10O controlled deployment and rollback plan | Extended production outage | Unproven |
| Production deployment authorization | No deployment is authorized | Any deployment would violate project controls | 10O followed by explicit approval | Unauthorized production change | Prohibited |

## 14. Recommended Phase Sequence After 10I

### Phase 10J: User-Executed EC2 Prerequisite Discovery

Confirm sanitized host, command, Docker privilege, Compose, SSM indicator, non-ECR AWS credential-resolution, approved read-only ECR repository/image metadata, exact-file, and health facts. This phase must not retrieve an ECR authorization token, authenticate Docker, pull an image, or deploy.

### Phase 10K: EC2 IAM and Registry-Resolution Architecture Proposal

Use 10J evidence to compare retaining `DescribeRepositories` with removing the dependency. Keep IAM discussion conceptual first; if a policy change becomes necessary, place the exact proposal behind a separate approval gate.

### Phase 10L: AWS CLI Installation Manual Guide

After architecture and version facts are known, document the approved source, architecture, version, verification, and rollback considerations. Installation itself remains a separate user-executed action requiring explicit approval.

### Phase 10M: Deployment Execution Model and File Placement Guide

Finalize the first-run privilege identity, instance-profile verification context, target paths, ownership model, file-integrity checks, env-file protection, and existing-file backup strategy. Any placement or permission change remains separately approved and user-executed.

### Phase 10N: Non-Deploying EC2 Preflight Validation

Run only approved checks that do not retrieve an ECR authorization token, invoke `aws ecr get-login-password`, authenticate Docker to ECR, pull images, alter Compose state, execute the deployment script, or expose secrets. This phase depends on completion of required 10K-10M decisions and prerequisites.

### Phase 10O: Controlled First ECR Backend Deployment Plan

Define the immutable tag, operator, privilege model, ECR authorization-token retrieval, Docker authentication and pull boundary, health checkpoints, rollback decision points, logging/redaction requirements, and explicit go/no-go approval. Execution remains unauthorized until Architect approval after plan review.

If the project wants to test ECR authorization-token retrieval, Docker authentication, or pulling before production replacement, split that work into a separately approved ECR-access validation phase between 10N and 10O. It must treat the token as credential material, acknowledge Docker credential-state and image-cache changes, and must not be called non-deploying.

Dependencies:

```text
10J evidence
  -> 10K IAM/registry decision
  -> 10L AWS CLI readiness
  -> 10M execution identity and file placement
  -> 10N non-deploying preflight
  -> optional approved ECR-access validation
  -> 10O controlled first-deployment plan
```

Every operational phase must be ChatGPT-approved first, user-executed, non-autonomous, and limited to its approved scope.

## 15. Explicit Non-Goals

Phase 10I does not:

* access EC2,
* use SSH or SSM,
* install AWS CLI,
* inspect or modify IAM,
* run AWS CLI,
* use sudo,
* run Docker or Docker Compose,
* inspect environment-file contents,
* authenticate to ECR,
* pull or push an image,
* copy files to EC2,
* change ownership or permissions,
* modify sudoers or Docker-group membership,
* create a service or privileged runner,
* run the deployment script,
* restart or replace containers,
* run Prisma,
* run database migrations,
* change Nginx, Certbot, DuckDNS, RDS, CloudFront, or S3,
* deploy to production,
* stage, commit, or push.

## 16. Security Requirements

Never request, expose, infer, or document:

* environment-file contents,
* `DATABASE_URL`,
* database passwords,
* API keys,
* DuckDNS token,
* Certbot email,
* AWS access keys,
* GitHub tokens,
* private keys,
* full AWS account ID,
* full IAM role ARN,
* full ECR URI,
* EC2 instance ID,
* EC2 public IP or DNS,
* private IPs,
* RDS endpoint.

Do not recommend reading or printing environment variables or env-file contents. Do not recommend rendered Compose output that may reveal secret-derived values.

No production migration command is part of this deployment plan. Any future production database migration remains a separate, explicitly approved phase using only the project-approved production migration mechanism. Development-oriented schema commands remain prohibited in production.

## 17. Architectural Recommendations

### 17.1 Recommendation for the First Controlled Manual Deployment

Proceed only after Phases 10J through 10N establish readiness.

For the first controlled deployment:

* preserve Docker Compose project `app` and service `api`,
* keep the reviewed immutable-tag and rollback script design,
* use one explicitly elevated, manually initiated SSM execution context rather than permanent Docker-group access,
* retain `DescribeRepositories` only if 10K confirms the current design and least-privilege coverage; otherwise revise the design before deployment,
* verify instance-profile credential behavior under the exact elevated identity without exposing identity output,
* place root-controlled or equivalently protected deployment files separately from the runtime env file,
* require a passing non-deploying preflight,
* defer ECR authorization-token retrieval, `aws ecr get-login-password`, Docker login, image pull, Compose update, and rollback exercise to the separately approved ECR-access validation phase or explicitly authorized controlled deployment boundary,
* stop after backend image deployment and health verification; do not add migrations or unrelated infrastructure work.

This is an architectural recommendation, not execution authorization.

### 17.2 Recommendation for a Future Mature Automation Model

Move toward a tightly controlled, root-owned or service-managed deployment runner that:

* accepts only a validated immutable image tag,
* uses EC2 instance-profile credentials,
* has the minimum ECR read permissions required by the final design,
* avoids unnecessary repository-discovery dependencies,
* protects Compose, script, and secret-file boundaries,
* updates only service `api` in project `app`,
* performs local then public health checks,
* provides tested rollback,
* emits sanitized, auditable logs,
* requires an explicit approval signal,
* does not embed migrations or long-lived credentials.

The mature model should minimize interactive root access and avoid granting persistent Docker-group access merely for convenience.

## 18. Phase Conclusion

The repository-side design is coherent, but EC2 is not ready for production deployment under the current evidence.

The blocking prerequisites are:

* AWS CLI readiness,
* IAM and registry-resolution design confirmation,
* instance-profile credential verification under the selected identity,
* Docker privilege-model selection,
* deployment-file placement and protection,
* Compose and rollback readiness,
* passing non-deploying preflight validation,
* explicit production deployment authorization.

Recommended next phase:

```text
Phase 10J: User-Executed EC2 Prerequisite Discovery
```

Do not proceed to Phase 10J until ChatGPT Architect formally approves this Phase 10I plan.
