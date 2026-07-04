# CODEX Phase 5BA: HTTPS Port 443 Security Group Opening Guide

## 1. Phase Name and Purpose

Phase 5BA prepares the safe manual AWS Console guide for opening HTTPS TCP `443` on the EC2 security group so Nginx can later serve HTTPS for `aucrm.duckdns.org`.

This phase is guide-only. It does not modify AWS resources, open port `443`, install Certbot, request certificates, configure HTTPS, or edit Nginx files.

## 2. Current Security Group State

Current approved state:

* EC2 instance: `crm-modern-prod-ec2`
* Region: `ap-southeast-1`
* EC2 security group: `crm-modern-prod-ec2-sg`
* Public HTTP port `80` is already open.
* HTTPS port `443` is not open yet.
* SSH port `22` remains restricted to the user-approved `/32`.
* App port `4000` remains private and must not be opened publicly.
* RDS port `5432` remains private and must not be opened publicly.
* RDS security group must not be modified.

Current app state:

* API container is running.
* Nginx is running.
* DuckDNS hostname is configured: `aucrm.duckdns.org`
* HTTP health endpoint works:
  * `http://aucrm.duckdns.org/api/health`
  * result: `HTTP 200 OK`
* Certbot is not installed yet.
* HTTPS certificate is not issued yet.
* Elastic IP remains intentionally skipped for cost-control.

## 3. Why HTTPS Port 443 Is Needed

Port `443` is the standard public HTTPS port.

It will be needed in a later Certbot/Nginx HTTPS phase so:

* browsers can reach `https://aucrm.duckdns.org`,
* Nginx can serve the Let's Encrypt certificate,
* the public API health endpoint can be verified over HTTPS,
* HTTP `80` can remain available for Let's Encrypt validation and optional redirect behavior.

Opening `443` alone does not complete HTTPS. Certbot and Nginx HTTPS configuration must still be completed in a later approved phase.

## 4. Exact AWS Console Path

In the AWS Console, use this path:

1. Go to `EC2`.
2. Open `Security Groups`.
3. Select `crm-modern-prod-ec2-sg`.
4. Open `Inbound rules`.
5. Choose `Edit inbound rules`.

Before saving anything, confirm the selected security group is exactly `crm-modern-prod-ec2-sg`.

## 5. Exact Inbound Rule to Add

Add this inbound rule only:

* Type: `HTTPS`
* Protocol: `TCP`
* Port range: `443`
* Source: `0.0.0.0/0`
* Description: `Public HTTPS for DuckDNS/Nginx`

Do not add or modify any other rule in this phase.

## 6. IPv6 Note

Only add an IPv6 HTTPS rule with source `::/0` if the EC2 instance and DNS are intentionally using IPv6.

If IPv6 is not intentionally configured for this deployment, skip IPv6.

## 7. Rules That Must Remain Unchanged

These boundaries must remain unchanged:

* HTTP `80` public access remains.
* SSH `22` remains restricted to the user-approved `/32`.
* App port `4000` is not opened publicly.
* RDS port `5432` is not opened publicly.
* RDS security group is not modified.
* No broad SSH source is added.
* No DuckDNS, Cloudflare, Nginx, Certbot, Docker, Prisma, frontend, or secret changes are made.

## 8. Verification Plan After User Opens 443

After the user manually opens HTTPS `443` in a later execution step, verify:

* `crm-modern-prod-ec2-sg` inbound rules include HTTPS TCP `443`.
* HTTP TCP `80` remains present.
* SSH TCP `22` remains restricted to the user-approved `/32`.
* No public app port `4000` rule exists.
* No public RDS port `5432` rule exists.
* RDS security group was not modified.
* The HTTP endpoint still works:
  * `http://aucrm.duckdns.org/api/health`
  * expected result: `HTTP 200 OK`

Do not expect HTTPS to work yet. HTTPS will not be ready until Certbot certificate issuance and Nginx HTTPS configuration are completed in a later approved phase.

## 9. Stop Conditions

Stop before saving any AWS security group change if:

* Wrong security group is selected.
* Multiple similar security groups are visible and the user is unsure.
* AWS asks for broader access than expected.
* App port `4000` is proposed.
* RDS port `5432` is proposed.
* SSH source would be changed from the restricted `/32`.
* RDS security group would be modified.
* HTTPS `443` rule would be added to the wrong resource.
* User is unsure what to click.

## 10. Evidence and Security Notes

Safe to document:

* Security group name `crm-modern-prod-ec2-sg`
* HTTPS port `443` opened after execution
* HTTP port `80` remaining public
* SSH `22` remaining restricted
* App port `4000` not opened publicly
* RDS port `5432` not opened publicly

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* RDS endpoint
* Full `DATABASE_URL`
* Passwords
* Env file contents
* Private key path or contents
* Any other secret material

## 11. Next Phase Recommendation

Recommended next phases:

* Phase 5BB: HTTPS Port 443 Security Group Opening Execution
* Phase 5BC: Certbot/Nginx HTTPS Execution Guide

The Phase 5BB execution report should document only the approved security group change and confirm that SSH, app, and RDS exposure boundaries were preserved.

The Phase 5BC guide should then define the exact safe Certbot/Nginx HTTPS steps for `aucrm.duckdns.org`.
