---
name: Luigi Carpio
github: 0xBahalaNa
specializations:
  - Compliance Automation
  - Cloud Security
  - Identity & Access Management
  - Third-Party Risk
  - Audit & Assurance
languages:
  - Python
  - Bash
  - Terraform
  - OSCAL
  - SQL

title: GRC Engineer
location: California

linkedin: https://linkedin.com/in/luigi-carpio
website: https://luigicarpio.dev
blog: https://luigicarpio.dev
credly: https://www.credly.com/users/luigi-carpio/badges

frameworks:
  - CJIS
  - FedRAMP
  - NIST 800-53
  - SOC 2
  - ISO 27001

certifications:
  - SSCP
  - CySA+
  - PenTest+
  - Security+
  - Network+
  - A+
  - Project+
  - ITIL 4 Foundations
  - Linux LPI Essentials

available_for:
  - collaboration
  - freelance
  - hiring
  - open-source

projects:
  - name: CJIS v6.0 to FedRAMP High Gap Analysis
    url: https://github.com/0xBahalaNa/cjis-fedramp-high-gap-analysis
    description: Control-by-control delta analysis identifying where CJIS v6.0 exceeds FedRAMP High baseline requirements. Covers 13 implementation-level deltas and 15 control-level gaps (CJIS-only controls), including fingerprint-based screening (PS-3), AAL2 phishing-resistant MFA (IA-2), agency-managed encryption keys (SC-28), and CJIS-specific incident reporting (IR-6). Encoded as an OSCAL overlay for automated compliance validation.

  - name: NIST 800-53 Rev 5 to AWS Service Mapping
    url: https://github.com/0xBahalaNa/nist-800-53-rev-5-to-aws-mapping
    description: Maps 31 NIST 800-53 Rev 5 controls to AWS services as an OSCAL Component Definition JSON. Python generator renders markdown with FedRAMP High baseline filtering and CJIS v6.0 delta section. Covers AC, AU, CM, IA, IR, SC, and SI control families.

  - name: OSCAL Evidence Pipeline
    url: https://github.com/0xBahalaNa/oscal-evidence-pipeline
    description: Transforms compliance findings into OSCAL Assessment Results JSON for FedRAMP 20x and CJIS v6.0 evidence workflows. Bridges collector output to machine-readable assessment artifacts auditors and continuous monitoring pipelines can consume.

  - name: AWS GRC Terraform Modules
    url: https://github.com/0xBahalaNa/aws-grc-terraform-modules
    description: Reusable Terraform modules for FedRAMP High and CJIS baseline controls, with OPA/Rego policy tests and tfsec/checkov CI gates. Infrastructure-as-Code building blocks for preventive compliance in AWS environments.

  - name: AWS Compliance as Code
    url: https://github.com/0xBahalaNa/aws-compliance-as-code
    description: Preventive compliance controls as SCPs and CloudFormation — audit log protection (AU-9), SSH boundary enforcement with condition logic (SC-7), S3 encryption requirements (SC-28), and secure-by-default resource deployment. Mapped across CJIS v6.0, FedRAMP High, and NIST 800-53.

  - name: AWS Config Compliance Monitor
    url: https://github.com/0xBahalaNa/aws-config-compliance-monitor
    description: Event-driven compliance monitoring with AWS Config, EventBridge, Lambda, SNS alerting, and SSM auto-remediation. Deploys Config rules for S3 encryption, security groups, and IAM password policy as CloudFormation. Maps to SI-4, AU-6, CM-6, SC-28, and SC-7 across CJIS/FedRAMP/NIST.

  - name: SOC 2 / ISO 27001 / NIST 800-53 Crosswalk
    url: https://github.com/0xBahalaNa/soc2-iso-27001-nist-800-53-rev-5-crosswalk
    description: SOC 2 TSC pivot mapped to NIST 800-53 Rev 5 and ISO 27001:2022 Annex A from a single YAML source. Emits markdown, JSON, and CSV with a --check CI gate to keep the crosswalk consistent.

  - name: Vendor Security Due Diligence
    url: https://github.com/0xBahalaNa/vendor-security-due-diligence
    description: Vendor security due-diligence crosswalk covering SOC 2 CC9 and ISO 27001:2022 A.5.19–A.5.23, plus a risk scorer for third-party assessment workflows.

  - name: Evidence Warehouse
    url: https://github.com/0xBahalaNa/evidence-warehouse
    description: In active development — dbt and DuckDB staging models over collector outputs, with row-count reconciliation and completeness tests as the control layer. Treats audit evidence as a data product for GRC Engineering pipelines.

  - name: Policy Checker
    url: https://github.com/0xBahalaNa/policy-checker
    description: Analyzes AWS IAM policies for wildcard permissions, service-level wildcards, inverse IAM fields, and CJIS v6.0 violations (missing MFA on CJI resources, cross-account access without org restrictions). JSON output with NIST 800-53 control mappings. GitHub Actions CI/CD.

  - name: IAM Audit
    url: https://github.com/0xBahalaNa/iam-audit
    description: Audits root account MFA, user MFA, password policy strength, and access key age using boto3. Exports timestamped CSV and JSON evidence with compliance rate metrics. Maps to IA-2, IA-5, AC-2, and AC-6 across CJIS/FedRAMP/NIST.

  - name: Secret Scanner
    url: https://github.com/0xBahalaNa/secret-scanner
    description: Recursive directory scanner for AWS keys, passwords, and secrets, plus CJI identifier detection (ORI numbers, NCIC codes, FBI Numbers, State IDs). Line-number reporting, binary file handling, and non-zero exit codes for CI/CD gating. Maps to SC-28 and SC-13.
---

## About Me

I'm a GRC Engineer focused on compliance automation for public safety technology. My background spans Identity Governance and Administration (IGA) in financial services — privileged access monitoring, user access reviews, RBAC analysis, and security grids — and compliance-focused technical support at public safety technology companies operating in CJIS and FedRAMP High environments serving federal, state, and local agencies.

That combination shaped how I think about compliance: not as a checkbox exercise, but as something that should be engineered into systems. Working in a FedRAMP High environment every day while supporting customers who handle criminal justice information gave me a front-row seat to the operational reality of frameworks like CJIS, FedRAMP, and NIST 800-53, how controls actually work in production, not just on paper.

I build AWS and Python compliance automation at the intersection of CJIS and FedRAMP, now centered on GRC Engineering × Data Engineering × Identity Governance — treating audit evidence as a data product, with dbt and DuckDB pipelines over collector output. Shipped work includes OSCAL tooling for FedRAMP 20x, Terraform modules for Infrastructure-as-Code, and commercial framework coverage across SOC 2, ISO 27001, and SOX ITGC; federal depth stays the differentiator. Next focus is OPA/Rego for policy-as-code.

## Experience Highlights

I build AWS compliance automation tools that map to CJIS v6.0, FedRAMP High, and NIST 800-53 controls, covering evidence collection, event-driven monitoring, auto-remediation, policy-as-code scanning, and preventive guardrails via CloudFormation and SCPs. I also build SQL pipelines over audit evidence — completeness and reconciliation tests as the control layer — with a UAR/IGA framing grounded in privileged access and access-review work. I identified and fixed six bugs in published GRC Engineering source code during implementation. My IGA background (privileged access monitoring, RBAC analysis, user access reviews) gives me practical grounding in the AC, IA, and AU control families I build tooling against.

https://github.com/0xBahalaNa

## Get in Touch

Feel free to reach out if you want to discuss cloud security, GRC Engineering, public safety technology, or Python!

https://linkedin.com/in/luigi-carpio
