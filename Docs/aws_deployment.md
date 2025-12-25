# AWS Infrastructure Documentation - HotelX

Complete AWS infrastructure deployment guide and current production status.

## Table of Contents
1. [Current Production Infrastructure](#current-production-infrastructure)
2. [Architecture Overview](#architecture-overview)
3. [Deployed Services](#deployed-services)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Cost Breakdown](#cost-breakdown)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Manual Setup Guide](#manual-setup-guide)
8. [Troubleshooting](#troubleshooting)

---

## Current Production Infrastructure

### Production URLs
- **Frontend (HTTPS)**: https://d32joxegsl0xnf.cloudfront.net
- **Backend API (HTTPS)**: https://d1otlwpcr6195.cloudfront.net/api
- **Backend ALB**: http://hotelx-alb-1402628275.us-east-1.elb.amazonaws.com/api

### Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| **Region** | Active | us-east-1 (N. Virginia) |
| **VPC** | Active | hotelx-prod-vpc |
| **ECS Cluster** | Active | hotelx-prod-cluster |
| **ECS Service** | Active | hotelx-backend-service (1 task running) |
| **DocumentDB** | Active | hotelx-prod-docdb-cluster |
| **ALB** | Active | hotelx-alb |
| **CloudFront** | Active | 2 distributions (frontend + backend) |
| **S3 Bucket** | Active | hotelx-frontend-us-east-1 |
| **ECR Repositories** | Active | Backend + Frontend |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼──────────────┐      ┌──────────▼─────────┐
    │  CloudFront      │      │  CloudFront        │
    │  (Frontend)      │      │  (Backend API)     │
    │  d32joxegsl...   │      │  d1otlwpcr6195...  │
    └───┬──────────────┘      └──────────┬─────────┘
        │                                 │
    ┌───▼──────────────┐      ┌──────────▼─────────┐
    │  S3 Bucket       │      │  Application LB    │
    │  (Static Site)   │      │  hotel-res-alb     │
    └──────────────────┘      └──────────┬─────────┘
                                          │
                              ┌───────────▼───────────┐
                              │  VPC (10.0.0.0/16)    │
                              │                       │
                              │  ┌─────────────────┐  │
                              │  │ ECS Fargate     │  │
                              │  │ Service         │  │
                              │  │ (1 vCPU, 2GB)   │  │
                              │  └────────┬────────┘  │
                              │           │           │
                              │  ┌────────▼────────┐  │
                              │  │  DocumentDB     │  │
                              │  │  (db.t3.medium) │  │
                              │  └─────────────────┘  │
                              └───────────────────────┘
```

---

## Deployed Services

### 1. Networking

**VPC Configuration:**
- VPC CIDR: 10.0.0.0/16
- Subnets:
  - Public Subnet 1: us-east-1a (10.0.1.0/24)
  - Public Subnet 2: us-east-1b (10.0.2.0/24)
  - Private Subnet 1: us-east-1a (10.0.11.0/24)
  - Private Subnet 2: us-east-1b (10.0.12.0/24)
- Internet Gateway: hotelx-prod-igw
- NAT Gateways: 2 (one per AZ for HA)

**Security Groups:**
- `hotelx-prod-ecs-sg`: ECS task security group
  - Inbound: Port 8080 from ALB security group
  - Outbound: All traffic
- `hotelx-prod-docdb-sg`: DocumentDB security group
  - Inbound: Port 27017 from ECS security group
  - Outbound: All traffic
- `hotelx-prod-alb-sg`: Application Load Balancer
  - Inbound: Port 80 from 0.0.0.0/0
  - Outbound: All traffic

### 2. Database (DocumentDB)

**Cluster Configuration:**
- Cluster ID: `hotelx-prod-docdb-cluster`
- Endpoint: `hotelx-prod-docdb-cluster.cluster-cy3ey826y545.us-east-1.docdb.amazonaws.com`
- Engine: Amazon DocumentDB 5.0
- Instance Class: db.t3.medium
- Instances: 1 (can scale to 2-3 for HA)
- Storage: Encrypted at rest
- Backup Retention: 7 days
- Port: 27017

**Connection:**
- Authentication: Username/password (stored in Secrets Manager)
- TLS: Required (with certificate validation disabled for compatibility)
- Connection String: Stored in `hotelx/prod/documentdb-connection-uri`

### 3. Container Registry (ECR)

**Repositories:**
- Backend: `837271986183.dkr.ecr.us-east-1.amazonaws.com/hotelx-backend`
- Frontend: `837271986183.dkr.ecr.us-east-1.amazonaws.com/hotelx-frontend`
- Scan on push: Enabled
- Encryption: AES-256

### 4. Container Service (ECS Fargate)

**Cluster:**
- Name: `hotelx-prod-cluster`
- Type: AWS Fargate (serverless)
- Container Insights: Enabled

**Task Definition: hotelx-backend**
- Revision: 31 (current)
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB (2 GB)
- Network Mode: awsvpc
- Launch Type: Fargate

**Container Configuration:**
- Image: Latest from ECR
- Port: 8080 (TCP)
- Health Check:
  - Command: `wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1`
  - Interval: 30s
  - Timeout: 5s
  - Retries: 3
  - Start Period: 60s

**Environment Variables:**
- `SPRING_PROFILES_ACTIVE=prod`
- `FRONTEND_URL=https://d32joxegsl0xnf.cloudfront.net`

**Secrets (from AWS Secrets Manager):**
- MONGODB_URI
- JWT_SECRET
- STRIPE_API_KEY
- STRIPE_WEBHOOK_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- OKTA_CLIENT_ID
- OKTA_CLIENT_SECRET
- OKTA_ISSUER_URI
- BACKEND_URL

**Service:**
- Name: `hotelx-backend-service`
- Desired Count: 1
- Running Count: 1
- Subnets: Private subnets 1 & 2
- Public IP: Enabled
- Load Balancer: Integrated with ALB

**Logging:**
- CloudWatch Log Group: `/ecs/hotelx-backend`
- Stream Prefix: ecs
- Region: us-east-1

### 5. Load Balancer

**Application Load Balancer:**
- Name: `hotelx-alb`
- DNS: `hotelx-alb-1402628275.us-east-1.elb.amazonaws.com`
- Scheme: Internet-facing
- IP Address Type: IPv4
- Subnets: Public subnets in us-east-1a and us-east-1b

**Target Group:**
- Name: `hotel-backend-tg`
- Protocol: HTTP
- Port: 8080
- Target Type: IP
- Health Check:
  - Path: /actuator/health
  - Success Codes: 200-299
  - Interval: 30s
  - Timeout: 5s
  - Healthy Threshold: 2
  - Unhealthy Threshold: 2

**Listener:**
- Port: 80 (HTTP)
- Default Action: Forward to target group

### 6. CloudFront Distributions

**Frontend Distribution:**
- ID: E3AEFUC8QLUDD9
- Domain: `d32joxegsl0xnf.cloudfront.net`
- Origin: S3 bucket (hotelx-frontend-us-east-1)
- Status: Deployed
- SSL Certificate: Default CloudFront certificate
- Comment: CloudFront distribution for hotel reservation frontend

**Backend Distribution:**
- ID: E1IN2SZ3C0Y2LC
- Domain: `d1otlwpcr6195.cloudfront.net`
- Origin: Application Load Balancer
- Status: Deployed
- SSL Certificate: Default CloudFront certificate
- Comment: CloudFront distribution for hotel reservation backend API
- Purpose: HTTPS termination for backend API

### 7. S3 Static Website Hosting

**Bucket:**
- Name: `hotelx-frontend-us-east-1`
- Region: us-east-1
- Website Endpoint: `http://hotelx-frontend-us-east-1.s3-website-us-east-1.amazonaws.com`
- Public Access: Enabled (via bucket policy)
- Hosting: Static website (index.html)

**Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hotelx-frontend-us-east-1/*"
    }
  ]
}
```

### 8. Secrets Manager

**Stored Secrets:**
| Secret Name | Purpose | Last Updated |
|-------------|---------|--------------|
| `hotelx/jwt-secret` | JWT token signing | Dec 12, 2025 |
| `hotelx/stripe-api-key` | Stripe payments | Dec 13, 2025 |
| `hotelx/stripe-webhook-secret` | Stripe webhooks | Dec 13, 2025 |
| `hotelx/google-client-id` | OAuth2 Google | Dec 13, 2025 |
| `hotelx/google-client-secret` | OAuth2 Google | Dec 13, 2025 |
| `hotelx/okta-client-id` | OAuth2 Okta | Dec 25, 2025 |
| `hotelx/okta-client-secret` | OAuth2 Okta | Dec 25, 2025 |
| `hotelx/okta-issuer-uri` | OAuth2 Okta | Dec 25, 2025 |
| `hotelx/backend-url` | Backend URL | Dec 13, 2025 |
| `hotelx/frontend-url` | Frontend URL | Dec 13, 2025 |
| `hotelx/prod/documentdb-connection-uri` | MongoDB connection | Dec 12, 2025 |
| `hotelx/prod/db-master-password` | Database password | Dec 12, 2025 |

---

## GitHub Actions CI/CD

### GitHub Secrets

| Secret Name | Purpose | Current Value |
|-------------|---------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS authentication | (configured) |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication | (configured) |
| `AWS_ACCOUNT_ID` | AWS account number | 837271986183 |
| `BACKEND_API_URL` | Backend CloudFront URL | https://d1otlwpcr6195.cloudfront.net |
| `CLOUDFRONT_DISTRIBUTION_ID` | Frontend distribution | E3AEFUC8QLUDD9 |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key | (configured) |

### Automated Workflows

**Backend Deployment ([deploy-backend.yml](../.github/workflows/deploy-backend.yml)):**
- Trigger: Push to main (backend/** or workflow file)
- Steps:
  1. Build Docker image
  2. Push to ECR
  3. Register new ECS task definition (1 vCPU, 2GB memory)
  4. Update ECS service with force deployment
  5. Wait for service stability
- Deployment Time: ~5-8 minutes

**Frontend Deployment ([deploy-frontend.yml](../.github/workflows/deploy-frontend.yml)):**
- Trigger: Push to main (frontend/** or workflow file)
- Steps:
  1. Build React app with environment variables
  2. Upload to S3 bucket
  3. Invalidate CloudFront cache
- Deployment Time: ~2-3 minutes

### Manual Deployment

**Trigger workflow manually:**
```bash
# Backend
gh workflow run deploy-backend.yml

# Frontend
gh workflow run deploy-frontend.yml
```

---

## Cost Breakdown

### Current Monthly Costs (Estimated)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **VPC - NAT Gateways** | 2 NAT gateways | $65.00 |
| **DocumentDB** | 1x db.t3.medium instance | $200.00 |
| **ECS Fargate** | 1 task (1 vCPU, 2GB RAM) | $30.00 |
| **Application Load Balancer** | 1 ALB | $16.00 |
| **ECR** | ~1 GB images | $1.00 |
| **S3** | Static hosting (~500 MB) | $0.50 |
| **CloudFront** | 2 distributions (~10GB data) | $2.00 |
| **Secrets Manager** | 12 secrets | $4.80 |
| **Data Transfer** | ~20 GB/month | $1.80 |
| **CloudWatch Logs** | ~2 GB/month | $1.00 |
| **Route 53** | (if custom domain added) | $0.50 |
| **Total** | | **~$322/month** |

### Cost Optimization Opportunities

1. **Use Single NAT Gateway** (Save $32/month)
   - Risk: No NAT redundancy across AZs
   - Acceptable for dev/staging environments

2. **Reduce DocumentDB Instance Size** (Save $100/month)
   - Switch to db.t4g.medium when available
   - Use db.r5.large only if performance requires it

3. **Use Fargate Spot** (Save 50-70% on compute)
   - Not recommended for production
   - Good for dev/staging environments

4. **MongoDB Atlas Alternative** (Save $190/month)
   - Free tier: 512MB
   - M10 tier: $9/month vs DocumentDB $200/month
   - Trade-off: Data stored outside AWS VPC

5. **Delete Unused Resources:**
   - Old ECS task definitions (keep last 5 revisions)
   - Unused ECR images
   - Old CloudWatch log streams

---

## Monitoring and Maintenance

### CloudWatch Dashboards

**ECS Metrics:**
- CPU Utilization: Target < 70%
- Memory Utilization: Target < 80%
- Running Task Count: Should be 1

**DocumentDB Metrics:**
- CPU: Target < 75%
- Connections: Monitor active connections
- Storage: Track growth rate

**Application Load Balancer:**
- Request Count
- Target Response Time
- Healthy/Unhealthy Target Count

### Logs

**Application Logs:**
- CloudWatch Log Group: `/ecs/hotelx-backend`
- Retention: 7 days (configurable)
- Access: AWS Console or AWS CLI

```bash
# Tail logs
aws logs tail /ecs/hotelx-backend --follow --region us-east-1

# Get logs from specific time
aws logs tail /ecs/hotelx-backend --since 1h --region us-east-1
```

### Health Checks

**Backend Health:**
```bash
# Via CloudFront (HTTPS)
curl https://d1otlwpcr6195.cloudfront.net/actuator/health

# Via ALB
curl http://hotelx-alb-1402628275.us-east-1.elb.amazonaws.com/actuator/health

# Expected response:
# {"status":"UP"}
```

**Frontend Health:**
- URL: https://d32joxegsl0xnf.cloudfront.net
- Check: Page loads, no console errors

### Backup and Recovery

**DocumentDB Automated Backups:**
- Frequency: Daily
- Retention: 7 days
- Window: 03:00-04:00 UTC

**Manual Snapshot:**
```bash
aws docdb create-db-cluster-snapshot \
  --db-cluster-snapshot-identifier hotelx-manual-backup-$(date +%Y%m%d) \
  --db-cluster-identifier hotelx-prod-docdb-cluster \
  --region us-east-1
```

**ECS Task Definition Versioning:**
- All revisions are retained
- Current revision: 31
- Can rollback to any previous revision

---

## Manual Setup Guide

### Prerequisites

- AWS Account with admin access
- AWS CLI configured
- Docker installed
- GitHub account (for CI/CD)
- Domain name (optional, for custom domain)

### Initial Setup Steps

1. **Create VPC and Networking:**
   - Create VPC with CIDR 10.0.0.0/16
   - Create 4 subnets (2 public, 2 private) across 2 AZs
   - Create Internet Gateway and attach to VPC
   - Create 2 NAT Gateways (one per AZ)
   - Create route tables and associate subnets
   - Create security groups for ECS, DocumentDB, and ALB

2. **Create DocumentDB Cluster:**
   - Follow AWS Console wizard
   - Save master password in Secrets Manager
   - Note cluster endpoint

3. **Create Secrets in AWS Secrets Manager:**
   ```bash
   # JWT Secret
   aws secretsmanager create-secret \
     --name hotelx/jwt-secret \
     --secret-string "$(openssl rand -base64 64)" \
     --region us-east-1

   # Add other secrets similarly
   ```

4. **Create ECR Repositories:**
   ```bash
   aws ecr create-repository \
     --repository-name hotelx-backend \
     --region us-east-1

   aws ecr create-repository \
     --repository-name hotelx-frontend \
     --region us-east-1
   ```

5. **Build and Push Initial Images:**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     837271986183.dkr.ecr.us-east-1.amazonaws.com

   # Build and push backend
   cd backend
   docker build --platform linux/amd64 -t hotelx-backend .
   docker tag hotelx-backend:latest \
     837271986183.dkr.ecr.us-east-1.amazonaws.com/hotelx-backend:latest
   docker push 837271986183.dkr.ecr.us-east-1.amazonaws.com/hotelx-backend:latest
   ```

6. **Create ECS Cluster and Service:**
   - Use GitHub Actions workflow OR
   - Create manually via AWS Console
   - Task definition uses 1 vCPU, 2GB memory

7. **Create Application Load Balancer:**
   - Create ALB in public subnets
   - Create target group (HTTP, port 8080)
   - Configure health check path: /actuator/health
   - Create listener (port 80) forwarding to target group
   - Note: Full commands available in GitHub Actions workflow

8. **Create CloudFront Distributions:**
   - Frontend: Origin = S3 bucket
   - Backend: Origin = ALB
   - Enable HTTPS with default certificate

9. **Setup GitHub Secrets and Workflows:**
   ```bash
   gh secret set AWS_ACCESS_KEY_ID
   gh secret set AWS_SECRET_ACCESS_KEY
   gh secret set AWS_ACCOUNT_ID -b "837271986183"
   gh secret set BACKEND_API_URL -b "https://d1otlwpcr6195.cloudfront.net"
   ```

### Detailed Manual Steps

**Note:** This infrastructure was deployed using a combination of:
- AWS Console for initial resource creation (VPC, DocumentDB, ALB, CloudFront)
- GitHub Actions workflows for automated ECS deployments
- AWS CLI commands for configuration updates

The deployment is managed primarily through GitHub Actions. For new deployments, you can either:
1. Use the GitHub Actions workflows after creating the base infrastructure
2. Follow the AWS Console steps for manual resource creation
3. Create automation scripts based on the commands in the workflows

---

## Troubleshooting

### ECS Task Not Starting

**Symptom:** Task goes from PENDING to STOPPED

**Check:**
1. CloudWatch logs for error messages
2. Task definition secrets ARNs are correct
3. ECS task execution role has Secrets Manager permissions
4. Security groups allow outbound traffic

```bash
# View task logs
aws logs tail /ecs/hotelx-backend --follow --region us-east-1

# Check task stopped reason
aws ecs describe-tasks \
  --cluster hotelx-prod-cluster \
  --tasks $(aws ecs list-tasks --cluster hotelx-prod-cluster --service-name hotelx-backend-service --query 'taskArns[0]' --output text) \
  --query 'tasks[0].stoppedReason' \
  --region us-east-1
```

### DocumentDB Connection Failed

**Symptom:** Backend logs show MongoDB connection timeout

**Solutions:**
1. Verify ECS tasks are in private subnets
2. Check security group allows port 27017 from ECS SG
3. Verify connection string format:
   ```
   mongodb://username:password@endpoint:27017/database?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false&authSource=admin
   ```

### ALB Health Check Failing

**Symptom:** Targets show as unhealthy

**Check:**
1. Backend is running and responding on port 8080
2. Health check path `/actuator/health` returns 200
3. Security group allows ALB to reach ECS tasks on port 8080

```bash
# Test health endpoint directly
curl http://[ECS-TASK-PRIVATE-IP]:8080/actuator/health

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:837271986183:targetgroup/hotel-backend-tg/55451774ae9d747f \
  --region us-east-1
```

### Frontend Not Loading

**Symptom:** CloudFront shows blank page or 404

**Solutions:**
1. Check S3 bucket has files uploaded
2. Verify bucket policy allows public read
3. CloudFront invalidation completed
4. Check browser console for CORS errors

```bash
# List S3 files
aws s3 ls s3://hotelx-frontend-us-east-1/

# Create CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id E3AEFUC8QLUDD9 \
  --paths "/*" \
  --region us-east-1
```

### GitHub Actions Failing

**Common Issues:**

1. **ECR Push Failed:**
   - Check AWS credentials in GitHub Secrets
   - Verify IAM user has ECR permissions

2. **ECS Update Failed:**
   - Check ECS service exists
   - Verify task definition is valid

3. **S3 Upload Failed:**
   - Check bucket name is correct
   - Verify IAM permissions for S3

```bash
# View recent workflow runs
gh run list --limit 5

# View specific run logs
gh run view [RUN_ID] --log
```

### Mixed Content Errors

**Symptom:** HTTPS frontend cannot call HTTP backend

**Solution:**
- Backend must be served over HTTPS
- Use CloudFront distribution: https://d1otlwpcr6195.cloudfront.net
- Update CORS configuration in backend

### OAuth2 Not Working

**Check:**

**For Google OAuth2:**
1. Google credentials in Secrets Manager:
   - `hotelx/google-client-id`
   - `hotelx/google-client-secret`
2. Authorized redirect URIs in Google Console:
   - `https://d1otlwpcr6195.cloudfront.net/login/oauth2/code/google`
   - `http://localhost:8080/login/oauth2/code/google` (for local dev)
3. Authorized JavaScript origins:
   - `https://d32joxegsl0xnf.cloudfront.net` (frontend)
   - `http://localhost:5173` (for local dev)
4. Backend URL configured correctly in secrets

**For Okta OAuth2:**
1. Okta credentials in Secrets Manager:
   - `hotelx/okta-client-id`
   - `hotelx/okta-client-secret`
   - `hotelx/okta-issuer-uri`
2. Sign-in redirect URIs in Okta Console:
   - `https://d1otlwpcr6195.cloudfront.net/login/oauth2/code/okta`
   - `http://localhost:8080/login/oauth2/code/okta` (for local dev)
3. Sign-out redirect URIs:
   - `https://d32joxegsl0xnf.cloudfront.net`
   - `http://localhost:5173` (for local dev)
4. Trusted Origins configured for CORS:
   - `https://d32joxegsl0xnf.cloudfront.net`
   - `http://localhost:5173` (for local dev)

---

## Security Best Practices

### Network Security
- ECS tasks in private subnets
- DocumentDB in private subnets
- Security groups follow least privilege
- NAT gateways for outbound internet access only

### Application Security
- All secrets stored in AWS Secrets Manager
- Secrets rotated regularly (JWT, API keys)
- ECS task execution role limited to required permissions
- TLS enabled for DocumentDB connections
- HTTPS enforced via CloudFront

### Access Control
- IAM users follow principle of least privilege
- GitHub Actions uses dedicated IAM user
- MFA enabled for console access (recommended)
- CloudWatch logs for audit trail

---

## Scaling Considerations

### Horizontal Scaling

**ECS Service Auto Scaling:**
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/hotelx-prod-cluster/hotelx-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 4 \
  --region us-east-1

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/hotelx-prod-cluster/hotelx-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json \
  --region us-east-1
```

**DocumentDB Read Replicas:**
- Add 1-2 read replicas for high availability
- Distributes read traffic across instances
- Automatic failover

### Vertical Scaling

**Increase ECS Task Resources:**
- Current: 1 vCPU, 2GB memory
- Options: Up to 4 vCPU, 30GB memory
- Update task definition in GitHub Actions workflow

**Increase DocumentDB Instance:**
- Current: db.t3.medium
- Options: db.r5.large, db.r5.xlarge, etc.
- Requires cluster modification (minimal downtime)

---

## Disaster Recovery

### Backup Strategy
- DocumentDB: Automated daily backups (7-day retention)
- ECS: Task definitions versioned
- S3: Enable versioning for frontend files
- Secrets: Store backup copy in secure location

### Recovery Procedures

**DocumentDB Restore:**
```bash
# Restore from snapshot
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier hotelx-recovery \
  --snapshot-identifier hotelx-manual-backup-20251213 \
  --region us-east-1
```

**ECS Rollback:**
```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster hotelx-prod-cluster \
  --service hotelx-backend-service \
  --task-definition hotelx-backend:30 \
  --region us-east-1
```

---

## Future Enhancements

### Planned Improvements
1. Custom domain with Route 53
2. SSL certificate from ACM
3. WAF (Web Application Firewall) for security
4. Multi-region deployment for DR
5. CloudWatch alarms and SNS notifications
6. Enhanced monitoring with X-Ray
7. ECS Exec for debugging
8. Secrets rotation automation

### Custom Domain Setup
1. Register domain in Route 53
2. Request SSL certificate in ACM
3. Update CloudFront distributions
4. Create Route 53 records

---

## Support and Contacts

**AWS Support:**
- Console: https://console.aws.amazon.com/support
- Account ID: 837271986183

**Documentation:**
- Project Repository: https://github.com/kurbonovm/20251027-p2-group3
- AWS ECS: https://docs.aws.amazon.com/ecs/
- AWS DocumentDB: https://docs.aws.amazon.com/documentdb/

**Maintenance:**
- Last Updated: December 25, 2025
- Document Version: 2.1
- Infrastructure Version: Production v1.2
- Changes: Added Okta OAuth2 support, removed email secrets

---

## Appendix: Resource ARNs

### ECS Resources
- Cluster: `arn:aws:ecs:us-east-1:837271986183:cluster/hotelx-prod-cluster`
- Service: `arn:aws:ecs:us-east-1:837271986183:service/hotelx-prod-cluster/hotelx-backend-service`
- Task Definition: `arn:aws:ecs:us-east-1:837271986183:task-definition/hotelx-backend:31`

### Load Balancer
- ALB: `arn:aws:elasticloadbalancing:us-east-1:837271986183:loadbalancer/app/hotelx-alb/xxx`
- Target Group: `arn:aws:elasticloadbalancing:us-east-1:837271986183:targetgroup/hotel-backend-tg/55451774ae9d747f`

### DocumentDB
- Cluster: `arn:aws:rds:us-east-1:837271986183:cluster:hotelx-prod-docdb-cluster`
- Instance: `arn:aws:rds:us-east-1:837271986183:db:hotelx-prod-docdb-instance`

### CloudFront
- Frontend: `arn:aws:cloudfront::837271986183:distribution/E3AEFUC8QLUDD9`
- Backend: `arn:aws:cloudfront::837271986183:distribution/E1IN2SZ3C0Y2LC`

### S3
- Frontend Bucket: `arn:aws:s3:::hotelx-frontend-us-east-1`

### ECR
- Backend Repo: `arn:aws:ecr:us-east-1:837271986183:repository/hotelx-backend`
- Frontend Repo: `arn:aws:ecr:us-east-1:837271986183:repository/hotelx-frontend`

---

**END OF DOCUMENT**
