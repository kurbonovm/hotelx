# AWS Infrastructure Setup Guide - Hotel Reservation System

This guide provides step-by-step instructions for setting up the complete AWS infrastructure using the **AWS Management Console**.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [VPC and Networking](#1-vpc-and-networking)
3. [Security Groups](#2-security-groups)
4. [AWS DocumentDB (MongoDB)](#3-aws-documentdb-mongodb)
5. [AWS Secrets Manager](#4-aws-secrets-manager)
6. [Amazon ECR (Container Registry)](#5-amazon-ecr-container-registry)
7. [Amazon ECS (Container Service)](#6-amazon-ecs-container-service)
8. [Amazon S3 (Frontend Hosting)](#7-amazon-s3-frontend-hosting)
9. [IAM Roles and Policies](#8-iam-roles-and-policies)
10. [Testing and Verification](#9-testing-and-verification)
11. [Cost Estimates](#10-cost-estimates)

---

## Prerequisites

- AWS Account with administrative access
- Region: **us-east-1** (N. Virginia)
- Basic understanding of AWS services

**Estimated Total Time:** 2-3 hours
**Estimated Monthly Cost:** $280-$300

---

## 1. VPC and Networking

### 1.1 Create VPC

1. Navigate to **VPC Dashboard**
   - Go to: https://console.aws.amazon.com/vpc
   - Click **"Your VPCs"** → **"Create VPC"**

2. **Configure VPC:**
   ```
   Name tag:                hotel-reservation-prod-vpc
   IPv4 CIDR block:         10.0.0.0/16
   IPv6 CIDR block:         No IPv6 CIDR block
   Tenancy:                 Default
   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

3. Click **"Create VPC"**
4. Note the **VPC ID** (e.g., `vpc-0a63b04ad942cc161`)

### 1.2 Create Subnets

Create **4 subnets** (2 public, 2 private in different Availability Zones):

#### Public Subnet 1
1. Click **"Subnets"** → **"Create subnet"**
2. Configure:
   ```
   VPC ID:                  [Select the VPC you created]
   Subnet name:             hotel-reservation-prod-public-subnet-1
   Availability Zone:       us-east-1a
   IPv4 CIDR block:         10.0.1.0/24
   Tags:
     - Key: Type,           Value: Public
     - Key: Environment,    Value: prod
   ```
3. Click **"Create subnet"**

#### Public Subnet 2
```
Subnet name:             hotel-reservation-prod-public-subnet-2
Availability Zone:       us-east-1b
IPv4 CIDR block:         10.0.2.0/24
Tags:
  - Key: Type,           Value: Public
```

#### Private Subnet 1
```
Subnet name:             hotel-reservation-prod-private-subnet-1
Availability Zone:       us-east-1a
IPv4 CIDR block:         10.0.11.0/24
Tags:
  - Key: Type,           Value: Private
```

#### Private Subnet 2
```
Subnet name:             hotel-reservation-prod-private-subnet-2
Availability Zone:       us-east-1b
IPv4 CIDR block:         10.0.12.0/24
Tags:
  - Key: Type,           Value: Private
```

### 1.3 Create Internet Gateway

1. Click **"Internet Gateways"** → **"Create internet gateway"**
2. Configure:
   ```
   Name tag:                hotel-reservation-prod-igw
   ```
3. Click **"Create internet gateway"**
4. **Attach to VPC:**
   - Select the IGW you just created
   - Click **"Actions"** → **"Attach to VPC"**
   - Select your VPC
   - Click **"Attach internet gateway"**

### 1.4 Create NAT Gateways

**Important:** Create 2 NAT Gateways (one per AZ) for high availability.

#### NAT Gateway 1
1. Click **"NAT Gateways"** → **"Create NAT gateway"**
2. Configure:
   ```
   Name:                    hotel-reservation-prod-nat-1
   Subnet:                  hotel-reservation-prod-public-subnet-1
   Connectivity type:       Public
   Elastic IP allocation:   [Click "Allocate Elastic IP"]
   Tags:
     - Key: Environment,    Value: prod
   ```
3. Click **"Create NAT gateway"**
4. Wait for status to be **"Available"** (~2-3 minutes)

#### NAT Gateway 2
Repeat for second AZ:
```
Name:                    hotel-reservation-prod-nat-2
Subnet:                  hotel-reservation-prod-public-subnet-2
```

### 1.5 Create Route Tables

#### Public Route Table
1. Click **"Route Tables"** → **"Create route table"**
2. Configure:
   ```
   Name:                    hotel-reservation-prod-public-rt
   VPC:                     [Select your VPC]
   ```
3. Click **"Create route table"**
4. **Add Routes:**
   - Select the route table
   - Click **"Routes"** tab → **"Edit routes"** → **"Add route"**
   - Destination: `0.0.0.0/0`, Target: [Internet Gateway]
   - Click **"Save changes"**
5. **Associate Subnets:**
   - Click **"Subnet associations"** tab → **"Edit subnet associations"**
   - Select both **public subnets**
   - Click **"Save associations"**

#### Private Route Table 1
```
Name:                    hotel-reservation-prod-private-rt-1
Route:
  - Destination:         0.0.0.0/0
  - Target:              NAT Gateway 1
Associated Subnets:      hotel-reservation-prod-private-subnet-1
```

#### Private Route Table 2
```
Name:                    hotel-reservation-prod-private-rt-2
Route:
  - Destination:         0.0.0.0/0
  - Target:              NAT Gateway 2
Associated Subnets:      hotel-reservation-prod-private-subnet-2
```

---

## 2. Security Groups

### 2.1 ECS Security Group

1. Navigate to **EC2 Dashboard** → **Security Groups**
2. Click **"Create security group"**
3. Configure:
   ```
   Security group name:     hotel-reservation-prod-ecs-sg
   Description:             Security group for ECS tasks
   VPC:                     [Select your VPC]

   Inbound rules:
     - Type: Custom TCP
       Port range: 8080
       Source: 0.0.0.0/0 (or limit to your IP for testing)
       Description: Allow HTTP traffic to backend

   Outbound rules:
     - Type: All traffic
       Destination: 0.0.0.0/0

   Tags:
     - Key: Name,           Value: hotel-reservation-prod-ecs-sg
     - Key: Environment,    Value: prod
   ```
4. Click **"Create security group"**

### 2.2 DocumentDB Security Group

1. Click **"Create security group"**
2. Configure:
   ```
   Security group name:     hotel-reservation-prod-docdb-sg
   Description:             Security group for DocumentDB cluster
   VPC:                     [Select your VPC]

   Inbound rules:
     - Type: Custom TCP
       Port range: 27017
       Source: [Select hotel-reservation-prod-ecs-sg]
       Description: Allow MongoDB from ECS tasks

   Outbound rules:
     - Type: All traffic
       Destination: 0.0.0.0/0

   Tags:
     - Key: Name,           Value: hotel-reservation-prod-docdb-sg
     - Key: Environment,    Value: prod
   ```
3. Click **"Create security group"**

---

## 3. AWS DocumentDB (MongoDB)

### 3.1 Create Subnet Group

1. Navigate to **Amazon DocumentDB**
   - Go to: https://console.aws.amazon.com/docdb
   - Click **"Subnet groups"** → **"Create"**

2. Configure:
   ```
   Name:                    hotel-reservation-prod-docdb-subnet-group
   Description:             Subnet group for DocumentDB cluster
   VPC:                     [Select your VPC]
   Availability Zones:      us-east-1a, us-east-1b
   Subnets:                 [Select both private subnets]
   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

3. Click **"Create"**

### 3.2 Create DocumentDB Cluster

1. Click **"Clusters"** → **"Create"**
2. **Configuration:**
   ```
   Cluster identifier:      hotel-reservation-prod-docdb-cluster
   Engine version:          5.0.0
   Instance class:          db.t3.medium
   Number of instances:     1 (increase to 2-3 for production HA)

   Master username:         hoteldbadmin
   Master password:         [Generate strong password, save it!]

   Virtual Private Cloud (VPC):
     VPC:                   [Select your VPC]
     Subnet group:          hotel-reservation-prod-docdb-subnet-group
     VPC security groups:   hotel-reservation-prod-docdb-sg

   Cluster options:
     Port:                  27017
     Backup retention:      7 days
     Preferred backup window: 03:00-04:00 UTC

   Encryption:
     ✅ Enable encryption at rest

   Maintenance:
     Preferred window:      sun:04:00-sun:05:00 UTC
     ✅ Enable auto minor version upgrade

   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
     - Key: ManagedBy,      Value: Manual
   ```

3. Click **"Create cluster"**
4. Wait for status: **"Available"** (~10-15 minutes)
5. **Note the Cluster Endpoint** (e.g., `hotel-reservation-prod-docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com`)

### 3.3 Download DocumentDB Certificate

```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

This is already included in your Docker image, so this is for reference only.

---

## 4. AWS Secrets Manager

Create secrets for application configuration.

### 4.1 Create JWT Secret

1. Navigate to **AWS Secrets Manager**
   - Go to: https://console.aws.amazon.com/secretsmanager
   - Click **"Store a new secret"**

2. Configure:
   ```
   Secret type:             Other type of secret
   Key/value pairs:
     - Plaintext tab
     - Paste: [256-bit random string, e.g., from: openssl rand -base64 64]

   Encryption key:          aws/secretsmanager (default)
   ```

3. Click **"Next"**
4. Configure:
   ```
   Secret name:             hotel-reservation/jwt-secret
   Description:             JWT secret for token signing
   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

5. Click **"Next"** → **"Next"** → **"Store"**

### 4.2 Create Additional Secrets

Repeat the above process for each of these secrets:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `hotel-reservation/stripe-api-key` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `hotel-reservation/stripe-webhook-secret` | Stripe webhook secret | `whsec_...` |
| `hotel-reservation/email-username` | SMTP username | `your-email@gmail.com` |
| `hotel-reservation/email-password` | SMTP app password | Gmail app password |
| `hotel-reservation/google-client-id` | Google OAuth2 client ID | `xxx.apps.googleusercontent.com` |
| `hotel-reservation/google-client-secret` | Google OAuth2 secret | `GOCSPX-...` |
| `hotel-reservation/facebook-client-id` | Facebook app ID | `1234567890` |
| `hotel-reservation/facebook-client-secret` | Facebook app secret | `abc123...` |

### 4.3 Create MongoDB Connection String Secret

1. Create secret: `hotel-reservation/prod/documentdb-connection`
2. **Key/value pairs** (use JSON format):
   ```json
   {
     "username": "hoteldbadmin",
     "password": "[YOUR_DOCDB_PASSWORD]",
     "engine": "docdb",
     "host": "hotel-reservation-prod-docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com",
     "port": 27017,
     "dbClusterIdentifier": "hotel-reservation-prod-docdb-cluster",
     "uri": "mongodb://hoteldbadmin:[PASSWORD]@hotel-reservation-prod-docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com:27017/hotel_reservation?tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true&retryWrites=false"
   }
   ```

**Important:** Replace `[PASSWORD]` and cluster endpoint with your actual values!

---

## 5. Amazon ECR (Container Registry)

### 5.1 Create Backend Repository

1. Navigate to **Amazon ECR**
   - Go to: https://console.aws.amazon.com/ecr
   - Click **"Get Started"** or **"Create repository"**

2. Configure:
   ```
   Visibility settings:     Private
   Repository name:         hotel-reservation-backend
   Tag immutability:        Disabled
   Scan on push:           ✅ Enabled
   Encryption:              AES-256

   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

3. Click **"Create repository"**
4. **Note the URI** (e.g., `837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-backend`)

### 5.2 Create Frontend Repository

Repeat for frontend:
```
Repository name:         hotel-reservation-frontend
[Same settings as backend]
```

### 5.3 Push Images to ECR

**Note:** This is typically done by GitHub Actions, but for manual deployment:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 837271986183.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t hotel-reservation-backend .
docker tag hotel-reservation-backend:latest 837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-backend:latest
docker push 837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-backend:latest

# Build and push frontend
cd ../frontend
docker build -t hotel-reservation-frontend .
docker tag hotel-reservation-frontend:latest 837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-frontend:latest
docker push 837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-frontend:latest
```

---

## 6. Amazon ECS (Container Service)

### 6.1 Create ECS Cluster

1. Navigate to **Amazon ECS**
   - Go to: https://console.aws.amazon.com/ecs
   - Click **"Clusters"** → **"Create cluster"**

2. Configure:
   ```
   Cluster name:            hotel-reservation-prod-cluster
   Infrastructure:          AWS Fargate (serverless)

   Monitoring:
     ✅ Use Container Insights

   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

3. Click **"Create"**

### 6.2 Create Task Execution Role

1. Navigate to **IAM** → **Roles**
   - Go to: https://console.aws.amazon.com/iam/home#/roles
   - Click **"Create role"**

2. Configure:
   ```
   Trusted entity type:     AWS service
   Use case:                Elastic Container Service → Elastic Container Service Task
   ```

3. Click **"Next"**
4. **Attach policies:**
   - ✅ `AmazonECSTaskExecutionRolePolicy`
   - Click **"Create policy"** (new tab) for Secrets Manager access:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "secretsmanager:GetSecretValue",
             "secretsmanager:DescribeSecret"
           ],
           "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:hotel-reservation/*"
         }
       ]
     }
     ```
   - Name: `SecretsManagerReadPolicy`
   - Attach this policy to the role

5. Configure role:
   ```
   Role name:               hotel-reservation-ecs-task-execution-role
   Description:             Allows ECS tasks to pull images and access secrets
   ```

6. Click **"Create role"**

### 6.3 Create Task Definition

1. Click **"Task Definitions"** → **"Create new task definition"** → **"Create new task definition"**
2. Configure:
   ```
   Task definition family:  hotel-reservation-backend

   Infrastructure requirements:
     Launch type:           AWS Fargate
     Operating system:      Linux/X86_64
     Task size:
       CPU:                 0.5 vCPU
       Memory:              1 GB
     Task role:             (none - not needed)
     Task execution role:   hotel-reservation-ecs-task-execution-role

   Container - 1:
     Name:                  hotel-reservation-backend
     Image URI:             837271986183.dkr.ecr.us-east-1.amazonaws.com/hotel-reservation-backend:latest

     Port mappings:
       Container port:      8080
       Protocol:            TCP
       Port name:           http
       App protocol:        HTTP

     Environment variables:
       - SPRING_PROFILES_ACTIVE = prod
       - FRONTEND_URL = http://hotel-reservation-system-backend.s3-website-us-east-1.amazonaws.com
       - JWT_EXPIRATION = 86400000

     Secrets (from AWS Secrets Manager):
       - MONGODB_URI          → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/prod/documentdb-connection:uri::
       - JWT_SECRET           → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/jwt-secret
       - STRIPE_API_KEY       → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/stripe-api-key
       - STRIPE_WEBHOOK_SECRET → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/stripe-webhook-secret
       - EMAIL_USERNAME       → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/email-username
       - EMAIL_PASSWORD       → arn:aws:secretsmanager:us-east-1:837271986183:secret:hotel-reservation/email-password

     HealthCheck:
       Command:             CMD-SHELL,wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1
       Interval:            30
       Timeout:             5
       Start period:        60
       Retries:             3

     Logging:
       Log driver:          awslogs
       Options:
         awslogs-group:           /ecs/hotel-reservation-backend
         awslogs-region:          us-east-1
         awslogs-stream-prefix:   ecs
         awslogs-create-group:    true
   ```

3. Click **"Create"**

### 6.4 Create ECS Service

1. Go to **Clusters** → **hotel-reservation-prod-cluster**
2. Click **"Services"** tab → **"Create"**
3. **Deployment configuration:**
   ```
   Application type:        Service

   Task definition:
     Family:                hotel-reservation-backend
     Revision:              LATEST

   Service name:            hotel-reservation-backend-service

   Desired tasks:           1 (increase to 2+ for HA)

   Deployment options:
     Min running tasks:     100%
     Max running tasks:     200%
   ```

4. **Networking:**
   ```
   VPC:                     [Select your VPC]
   Subnets:                 [Select both PRIVATE subnets]
   Security group:
     Use existing:          hotel-reservation-prod-ecs-sg
   Public IP:              ✅ TURNED ON (required without ALB)
   ```

5. **Load balancing:** None (we're using public IP for now)

6. **Service auto scaling:** (Optional)
   ```
   ✅ Use service auto scaling
   Minimum tasks:           1
   Maximum tasks:           4
   Scaling metric:          ECSServiceAverageCPUUtilization
   Target value:            70
   ```

7. Click **"Create"**
8. Wait for service to be **"Active"** and tasks **"Running"** (~3-5 minutes)

### 6.5 Get Backend Public IP

1. Go to **Tasks** tab
2. Click on the running task
3. In **"Network"** section, find **"Public IP"**
4. **Save this IP** - it's your backend API URL: `http://[PUBLIC-IP]:8080`

---

## 7. Amazon S3 (Frontend Hosting)

### 7.1 Create S3 Bucket

1. Navigate to **Amazon S3**
   - Go to: https://s3.console.aws.amazon.com/s3
   - Click **"Create bucket"**

2. Configure:
   ```
   Bucket name:             hotel-reservation-system-backend
   AWS Region:              us-east-1

   Object Ownership:        ACLs disabled

   Block Public Access:
     ❌ Block all public access (UNCHECK)
     ✅ I acknowledge... (CHECK)

   Bucket Versioning:       Disabled

   Encryption:
     Encryption type:       Server-side encryption with Amazon S3 managed keys (SSE-S3)

   Tags:
     - Key: Environment,    Value: prod
     - Key: Project,        Value: hotel-reservation
   ```

3. Click **"Create bucket"**

### 7.2 Enable Static Website Hosting

1. Click on the bucket name
2. Go to **"Properties"** tab
3. Scroll to **"Static website hosting"** → Click **"Edit"**
4. Configure:
   ```
   Static website hosting:  ✅ Enable
   Hosting type:            Host a static website
   Index document:          index.html
   Error document:          index.html (for React Router)
   ```
5. Click **"Save changes"**
6. **Note the Website endpoint:** `http://hotel-reservation-system-backend.s3-website-us-east-1.amazonaws.com`

### 7.3 Set Bucket Policy

1. Go to **"Permissions"** tab
2. Click **"Bucket policy"** → **"Edit"**
3. Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::hotel-reservation-system-backend/*"
       }
     ]
   }
   ```
4. Click **"Save changes"**

### 7.4 Upload Frontend Files

**Option 1: AWS Console**
1. Go to **"Objects"** tab → **"Upload"**
2. Click **"Add files"** or drag & drop
3. Upload all files from `frontend/dist/` directory
4. Click **"Upload"**

**Option 2: AWS CLI** (recommended)
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://hotel-reservation-system-backend/ --delete
```

---

## 8. IAM Roles and Policies

### 8.1 GitHub Actions User (Optional)

If using GitHub Actions for CI/CD:

1. Navigate to **IAM** → **Users** → **"Create user"**
2. Configure:
   ```
   User name:               github-actions-user
   ✅ Provide user access to AWS Management Console (optional)
   ```

3. **Attach policies directly:**
   - `AmazonEC2ContainerRegistryPowerUser`
   - `AmazonECS_FullAccess`
   - `AmazonS3FullAccess`
   - `SecretsManagerReadWrite`

4. Create **Access Keys:**
   - Go to **"Security credentials"** tab
   - Click **"Create access key"**
   - Use case: **"Application running outside AWS"**
   - **Save Access Key ID and Secret Access Key** (you won't see them again!)

5. Add to GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ACCOUNT_ID` = `837271986183`

---

## 9. Testing and Verification

### 9.1 Test Backend API

```bash
# Health check
curl http://[ECS-TASK-PUBLIC-IP]:8080/actuator/health

# Should return:
# {"status":"UP"}

# Test API endpoint
curl http://[ECS-TASK-PUBLIC-IP]:8080/api/health
```

### 9.2 Test Frontend

Open in browser:
```
http://hotel-reservation-system-backend.s3-website-us-east-1.amazonaws.com
```

### 9.3 Test Full Flow

1. Open frontend URL
2. Try to register/login
3. Check browser console for any errors
4. Verify API calls are successful

### 9.4 Check CloudWatch Logs

1. Navigate to **CloudWatch** → **Log groups**
2. Find `/ecs/hotel-reservation-backend`
3. Click on latest log stream
4. Verify application started successfully

---

## 10. Cost Estimates

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **NAT Gateway** | 2 gateways | $65 |
| **DocumentDB** | 1x db.t3.medium | $200 |
| **ECS Fargate** | 1 task (0.5 vCPU, 1GB RAM) | $15 |
| **ECR** | < 500 MB images | $0.50 |
| **S3** | < 1 GB storage, minimal requests | $1 |
| **Secrets Manager** | 9 secrets | $3.60 |
| **Data Transfer** | ~10 GB/month | $0.90 |
| **CloudWatch Logs** | ~1 GB/month | $0.50 |
| **Total** | | **~$286/month** |

### Cost Optimization Tips:

1. **Use 1 NAT Gateway** instead of 2 (saves $32/month)
   - Risk: No NAT redundancy in multi-AZ setup

2. **Use MongoDB Atlas** instead of DocumentDB
   - Free tier: 512MB storage
   - M10 paid tier: $9/month (saves ~$191/month!)

3. **Use Fargate Spot** for dev/staging
   - Saves 50-70% on compute costs
   - Not recommended for production

4. **Delete unused resources:**
   - Elastic IPs not attached to instances
   - Old ECS task revisions
   - ECR images with no tags

---

## Troubleshooting

### Backend Not Starting
1. Check **CloudWatch Logs** → `/ecs/hotel-reservation-backend`
2. Common issues:
   - Secrets not accessible (check IAM role)
   - DocumentDB connection failed (check security group)
   - Invalid environment variables

### Frontend Shows Blank Page
1. Check browser console for errors
2. Verify S3 bucket policy allows public read
3. Check if `index.html` exists in bucket root

### Cannot Connect to DocumentDB
1. Verify ECS tasks are in **private subnets**
2. Check DocumentDB security group allows port 27017 from ECS SG
3. Verify connection string includes TLS parameters
4. Check if certificate is in Docker image

### GitHub Actions Failing
1. Verify all GitHub Secrets are set correctly
2. Check IAM user has required permissions
3. Review workflow logs for specific errors

---

## Next Steps

After infrastructure is set up:

1. **Configure GitHub Secrets** for automated deployments
2. **Set up custom domain** (Route 53)
3. **Add CloudFront** for HTTPS and CDN
4. **Configure monitoring** with CloudWatch Alarms
5. **Set up backups** for DocumentDB
6. **Implement CI/CD** with GitHub Actions

---

## Additional Resources

- [AWS DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/)
- [Amazon ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

---

## Support

For issues or questions:
- AWS Support: https://console.aws.amazon.com/support
- DocumentDB Forums: https://forums.aws.amazon.com/forum.jspa?forumID=311
- Project Repository: https://github.com/kurbonovm/20251027-p2-group3

---

**Document Version:** 1.0
**Last Updated:** December 12, 2025
**Maintained By:** DevOps Team
