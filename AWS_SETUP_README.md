# HotelX AWS Infrastructure Setup Guide

This guide will help you set up the complete AWS infrastructure for the HotelX application using automated scripts.

## Prerequisites

Before running the setup script, ensure you have:

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI (macOS)
   brew install awscli

   # Or download from: https://aws.amazon.com/cli/

   # Configure AWS CLI
   aws configure
   ```

   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

2. **Required tools**
   - `jq` (for JSON processing)
     ```bash
     brew install jq
     ```
   - `openssl` (usually pre-installed)

3. **AWS Account with appropriate permissions**
   - Administrator access or permissions for:
     - VPC, EC2, ECS, ECR
     - DocumentDB
     - S3, CloudFront
     - IAM, Secrets Manager
     - Application Load Balancer

## Cost Estimate

Running the full infrastructure will cost approximately **$322/month**:
- VPC NAT Gateways: $65/month
- DocumentDB (db.t3.medium): $200/month
- ECS Fargate (1 vCPU, 2GB): $30/month
- Application Load Balancer: $16/month
- CloudFront, S3, Secrets Manager, etc.: ~$11/month

## Setup Instructions

### Step 1: Run the Infrastructure Setup Script

```bash
# Navigate to the project directory
cd /Users/muhiddin/Desktop/SKILLSTORM/20251027-java-EY/PROJECTS/p2/hotelx

# Make sure the script is executable
chmod +x setup-aws-infrastructure.sh

# Run the setup script
./setup-aws-infrastructure.sh
```

The script will:
1. ✅ Create VPC with public and private subnets
2. ✅ Set up Internet Gateway and NAT Gateways
3. ✅ Configure Security Groups
4. ✅ Deploy DocumentDB cluster
5. ✅ Create ECR repositories
6. ✅ Set up ECS cluster
7. ✅ Deploy Application Load Balancer
8. ✅ Create S3 bucket for frontend hosting
9. ✅ Set up CloudFront distributions
10. ✅ Generate and store secrets in AWS Secrets Manager
11. ✅ Create IAM roles for ECS

**Duration:** Approximately 20-30 minutes (mostly waiting for DocumentDB and CloudFront)

### Step 2: Review Generated Configuration

After the script completes, it will create a file `infrastructure-config.txt` with all resource details:

```bash
cat infrastructure-config.txt
```

This file contains:
- All resource IDs (VPC, subnets, security groups, etc.)
- Database endpoint
- ECR repository URIs
- Load balancer DNS
- CloudFront distribution URLs
- GitHub secrets to configure

### Step 3: Update AWS Secrets Manager

The script creates placeholder secrets. Update them with real values:

```bash
# Update Stripe API Key
aws secretsmanager update-secret \
  --secret-id hotelx/stripe-api-key \
  --secret-string "sk_test_YOUR_ACTUAL_KEY" \
  --region us-east-1

# Update Stripe Webhook Secret
aws secretsmanager update-secret \
  --secret-id hotelx/stripe-webhook-secret \
  --secret-string "whsec_YOUR_ACTUAL_SECRET" \
  --region us-east-1

# Update Email Username
aws secretsmanager update-secret \
  --secret-id hotelx/email-username \
  --secret-string "your-email@gmail.com" \
  --region us-east-1

# Update Email Password (Gmail App Password)
aws secretsmanager update-secret \
  --secret-id hotelx/email-password \
  --secret-string "your-app-password" \
  --region us-east-1

# Update Google Client ID
aws secretsmanager update-secret \
  --secret-id hotelx/google-client-id \
  --secret-string "YOUR_GOOGLE_CLIENT_ID" \
  --region us-east-1

# Update Google Client Secret
aws secretsmanager update-secret \
  --secret-id hotelx/google-client-secret \
  --secret-string "YOUR_GOOGLE_CLIENT_SECRET" \
  --region us-east-1
```

### Step 4: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**Go to:** Repository → Settings → Secrets and variables → Actions → New repository secret

```
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_ACCOUNT_ID=<from infrastructure-config.txt>
BACKEND_API_URL=<from infrastructure-config.txt>
CLOUDFRONT_DISTRIBUTION_ID=<from infrastructure-config.txt>
STRIPE_PUBLIC_KEY=<your-stripe-publishable-key>
```

To get your AWS access keys:
```bash
# If you don't have access keys, create them:
aws iam create-access-key --user-name YOUR_USERNAME
```

### Step 5: Build and Push Initial Docker Images

Before the GitHub Actions workflows can deploy, you need to push initial images to ECR:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build --platform linux/amd64 -t hotelx-backend .
docker tag hotelx-backend:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hotelx-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hotelx-backend:latest

# Build and push frontend
cd ../frontend
npm install
npm run build
docker build --platform linux/amd64 -t hotelx-frontend .
docker tag hotelx-frontend:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hotelx-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/hotelx-frontend:latest
```

Replace `<AWS_ACCOUNT_ID>` with your actual AWS Account ID from `infrastructure-config.txt`.

### Step 6: Deploy Using GitHub Actions

Now you can deploy using the GitHub Actions workflows:

**Option 1: Push to main branch**
```bash
git add .
git commit -m "Configure AWS infrastructure"
git push origin main
```

**Option 2: Manually trigger workflows**
- Go to GitHub → Actions
- Select "Deploy Backend to AWS" or "Deploy Frontend to AWS"
- Click "Run workflow"

## Verify Deployment

### Check ECS Service
```bash
aws ecs describe-services \
  --cluster hotelx-prod-cluster \
  --services hotelx-backend-service \
  --region us-east-1
```

### Check Backend Health
```bash
# Via ALB (from infrastructure-config.txt)
curl http://<ALB_DNS>/actuator/health

# Via CloudFront (HTTPS)
curl https://<BACKEND_CF_DOMAIN>/actuator/health
```

### Check Frontend
Open in browser: `https://<FRONTEND_CF_DOMAIN>`

### View Logs
```bash
# Backend logs
aws logs tail /ecs/hotelx-backend --follow --region us-east-1

# List log streams
aws logs describe-log-streams \
  --log-group-name /ecs/hotelx-backend \
  --region us-east-1
```

## Common Issues and Solutions

### Issue: NAT Gateway creation fails
**Solution:** Check your AWS service quota limits. You might need to request an increase.

### Issue: DocumentDB creation takes too long
**Solution:** This is normal. DocumentDB cluster creation can take 10-15 minutes. The script waits automatically.

### Issue: CloudFront distribution not working immediately
**Solution:** CloudFront distributions take 15-20 minutes to fully propagate. Wait and try again.

### Issue: "Access Denied" errors
**Solution:** Ensure your AWS CLI user has administrator permissions or the specific permissions listed in Prerequisites.

### Issue: ECR push fails
**Solution:**
1. Ensure you're logged in to ECR: `aws ecr get-login-password | docker login ...`
2. Check your Docker is running
3. Verify the repository exists: `aws ecr describe-repositories --region us-east-1`

## Cleanup

To delete all AWS resources and stop incurring charges:

```bash
./cleanup-aws-infrastructure.sh
```

**WARNING:** This will permanently delete:
- All data in DocumentDB
- All Docker images in ECR
- All frontend files in S3
- All infrastructure resources

Type `DELETE` when prompted to confirm.

## Resource Details

### Created Resources

| Resource | Name/ID | Purpose |
|----------|---------|---------|
| VPC | hotelx-prod-vpc | Network isolation |
| Subnets | 2 public, 2 private | Multi-AZ deployment |
| NAT Gateways | 2 | Outbound internet for private subnets |
| Security Groups | 3 (ALB, ECS, DocumentDB) | Network security |
| DocumentDB | hotelx-prod-docdb-cluster | Database |
| ECR Repos | hotelx-backend, hotelx-frontend | Docker images |
| ECS Cluster | hotelx-prod-cluster | Container orchestration |
| ALB | hotelx-alb | Load balancing |
| S3 Bucket | hotelx-frontend-us-east-1 | Static website hosting |
| CloudFront | 2 distributions | CDN and HTTPS |
| Secrets Manager | 11 secrets | Configuration management |

### Network Architecture

```
Internet
   │
   ├─── CloudFront (Frontend) ─── S3 Bucket
   │
   └─── CloudFront (Backend) ─── ALB
                                  │
                              VPC (10.0.0.0/16)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              Public Subnets              Private Subnets
              (NAT Gateways)              (ECS + DocumentDB)
                    │                           │
                    └─────────── IGW ───────────┘
```

## Cost Optimization Tips

1. **Use Single NAT Gateway** (Save $32/month)
   - Reduces redundancy but acceptable for dev/staging

2. **Use Smaller DocumentDB Instance** (Save ~$100/month)
   - Switch to MongoDB Atlas free tier for development

3. **Use Fargate Spot** (Save 50-70%)
   - Not recommended for production

4. **Delete Unused Resources**
   - Old ECR images
   - Old ECS task definitions
   - CloudWatch log streams

## Next Steps

1. ✅ Configure OAuth2 redirect URIs in Google/Facebook consoles
2. ✅ Update Stripe webhook URL to point to your backend
3. ✅ Set up custom domain (optional)
4. ✅ Configure CloudWatch alarms for monitoring
5. ✅ Set up automated backups for DocumentDB
6. ✅ Review and optimize security group rules

## Support

For issues or questions:
1. Check CloudWatch Logs: `/ecs/hotelx-backend`
2. Review `infrastructure-config.txt`
3. Verify all secrets are updated in AWS Secrets Manager
4. Check GitHub Actions workflow logs

## References

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

**Last Updated:** December 23, 2025
**Script Version:** 1.0.0
