#!/bin/bash

# HotelX AWS Infrastructure Setup Script
# This script creates all necessary AWS resources for the application
# Run this script once to set up the complete infrastructure

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
PROJECT_NAME="hotelx"
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.11.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.12.0/24"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is installed and configured
check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS Account ID: $AWS_ACCOUNT_ID"
}

# Function to create VPC
create_vpc() {
    print_info "Creating VPC..."

    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block $VPC_CIDR \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-vpc}]" \
        --query 'Vpc.VpcId' \
        --output text \
        --region $AWS_REGION)

    print_success "VPC created: $VPC_ID"

    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id $VPC_ID \
        --enable-dns-hostnames \
        --region $AWS_REGION

    print_success "DNS hostnames enabled"
}

# Function to create Internet Gateway
create_internet_gateway() {
    print_info "Creating Internet Gateway..."

    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-igw}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 attach-internet-gateway \
        --internet-gateway-id $IGW_ID \
        --vpc-id $VPC_ID \
        --region $AWS_REGION

    print_success "Internet Gateway created and attached: $IGW_ID"
}

# Function to create subnets
create_subnets() {
    print_info "Creating subnets..."

    # Public Subnet 1
    PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block $PUBLIC_SUBNET_1_CIDR \
        --availability-zone ${AWS_REGION}a \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region $AWS_REGION)

    # Public Subnet 2
    PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block $PUBLIC_SUBNET_2_CIDR \
        --availability-zone ${AWS_REGION}b \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region $AWS_REGION)

    # Private Subnet 1
    PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block $PRIVATE_SUBNET_1_CIDR \
        --availability-zone ${AWS_REGION}a \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region $AWS_REGION)

    # Private Subnet 2
    PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block $PRIVATE_SUBNET_2_CIDR \
        --availability-zone ${AWS_REGION}b \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-2}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region $AWS_REGION)

    print_success "Subnets created"
}

# Function to create NAT Gateways
create_nat_gateways() {
    print_info "Creating NAT Gateways (this may take a few minutes)..."

    # Allocate Elastic IPs
    EIP_1=$(aws ec2 allocate-address \
        --domain vpc \
        --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-eip-1}]" \
        --query 'AllocationId' \
        --output text \
        --region $AWS_REGION)

    EIP_2=$(aws ec2 allocate-address \
        --domain vpc \
        --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-eip-2}]" \
        --query 'AllocationId' \
        --output text \
        --region $AWS_REGION)

    # Create NAT Gateways
    NAT_GW_1_ID=$(aws ec2 create-nat-gateway \
        --subnet-id $PUBLIC_SUBNET_1_ID \
        --allocation-id $EIP_1 \
        --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-1}]" \
        --query 'NatGateway.NatGatewayId' \
        --output text \
        --region $AWS_REGION)

    NAT_GW_2_ID=$(aws ec2 create-nat-gateway \
        --subnet-id $PUBLIC_SUBNET_2_ID \
        --allocation-id $EIP_2 \
        --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-2}]" \
        --query 'NatGateway.NatGatewayId' \
        --output text \
        --region $AWS_REGION)

    print_success "NAT Gateways created: $NAT_GW_1_ID, $NAT_GW_2_ID"
    print_info "Waiting for NAT Gateways to become available..."

    aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_1_ID --region $AWS_REGION
    aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_2_ID --region $AWS_REGION

    print_success "NAT Gateways are now available"
}

# Function to create route tables
create_route_tables() {
    print_info "Creating route tables..."

    # Public route table
    PUBLIC_RT_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt}]" \
        --query 'RouteTable.RouteTableId' \
        --output text \
        --region $AWS_REGION)

    # Add route to Internet Gateway
    aws ec2 create-route \
        --route-table-id $PUBLIC_RT_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id $IGW_ID \
        --region $AWS_REGION

    # Associate public subnets
    aws ec2 associate-route-table \
        --route-table-id $PUBLIC_RT_ID \
        --subnet-id $PUBLIC_SUBNET_1_ID \
        --region $AWS_REGION

    aws ec2 associate-route-table \
        --route-table-id $PUBLIC_RT_ID \
        --subnet-id $PUBLIC_SUBNET_2_ID \
        --region $AWS_REGION

    # Private route table 1
    PRIVATE_RT_1_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-1}]" \
        --query 'RouteTable.RouteTableId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 create-route \
        --route-table-id $PRIVATE_RT_1_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --nat-gateway-id $NAT_GW_1_ID \
        --region $AWS_REGION

    aws ec2 associate-route-table \
        --route-table-id $PRIVATE_RT_1_ID \
        --subnet-id $PRIVATE_SUBNET_1_ID \
        --region $AWS_REGION

    # Private route table 2
    PRIVATE_RT_2_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-2}]" \
        --query 'RouteTable.RouteTableId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 create-route \
        --route-table-id $PRIVATE_RT_2_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --nat-gateway-id $NAT_GW_2_ID \
        --region $AWS_REGION

    aws ec2 associate-route-table \
        --route-table-id $PRIVATE_RT_2_ID \
        --subnet-id $PRIVATE_SUBNET_2_ID \
        --region $AWS_REGION

    print_success "Route tables created and associated"
}

# Function to create security groups
create_security_groups() {
    print_info "Creating security groups..."

    # ALB Security Group
    ALB_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-prod-alb-sg \
        --description "Security group for ALB" \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-alb-sg}]" \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 authorize-security-group-ingress \
        --group-id $ALB_SG_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region $AWS_REGION

    aws ec2 authorize-security-group-ingress \
        --group-id $ALB_SG_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region $AWS_REGION

    # ECS Security Group
    ECS_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-prod-ecs-sg \
        --description "Security group for ECS tasks" \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-ecs-sg}]" \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 authorize-security-group-ingress \
        --group-id $ECS_SG_ID \
        --protocol tcp \
        --port 8080 \
        --source-group $ALB_SG_ID \
        --region $AWS_REGION

    # DocumentDB Security Group
    DOCDB_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-prod-docdb-sg \
        --description "Security group for DocumentDB" \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-docdb-sg}]" \
        --query 'GroupId' \
        --output text \
        --region $AWS_REGION)

    aws ec2 authorize-security-group-ingress \
        --group-id $DOCDB_SG_ID \
        --protocol tcp \
        --port 27017 \
        --source-group $ECS_SG_ID \
        --region $AWS_REGION

    print_success "Security groups created: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID, DocumentDB=$DOCDB_SG_ID"
}

# Function to create DocumentDB
create_documentdb() {
    print_info "Creating DocumentDB cluster (this will take several minutes)..."

    # Create subnet group
    aws docdb create-db-subnet-group \
        --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
        --db-subnet-group-description "Subnet group for DocumentDB" \
        --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID \
        --region $AWS_REGION

    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

    # Create cluster
    aws docdb create-db-cluster \
        --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
        --engine docdb \
        --master-username hotelxadmin \
        --master-user-password "$DB_PASSWORD" \
        --vpc-security-group-ids $DOCDB_SG_ID \
        --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --region $AWS_REGION

    print_info "Waiting for DocumentDB cluster to be available (this takes 10-15 minutes)..."
    # DocumentDB doesn't have a built-in waiter, so we poll manually
    while true; do
        STATUS=$(aws docdb describe-db-clusters \
            --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
            --query 'DBClusters[0].Status' \
            --output text \
            --region $AWS_REGION 2>/dev/null || echo "creating")

        if [ "$STATUS" = "available" ]; then
            break
        fi

        echo "Cluster status: $STATUS - waiting 30 seconds..."
        sleep 30
    done

    print_success "DocumentDB cluster is available"

    # Create instance
    aws docdb create-db-instance \
        --db-instance-identifier ${PROJECT_NAME}-prod-docdb-instance \
        --db-instance-class db.t3.medium \
        --engine docdb \
        --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
        --region $AWS_REGION

    # Get cluster endpoint
    DOCDB_ENDPOINT=$(aws docdb describe-db-clusters \
        --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
        --query 'DBClusters[0].Endpoint' \
        --output text \
        --region $AWS_REGION)

    # Create connection URI
    MONGODB_URI="mongodb://hotelxadmin:${DB_PASSWORD}@${DOCDB_ENDPOINT}:27017/?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false&authSource=admin"

    print_success "DocumentDB created: $DOCDB_ENDPOINT"

    # Store password in Secrets Manager
    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/prod/db-master-password \
        --secret-string "$DB_PASSWORD" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/prod/documentdb-connection-uri \
        --secret-string "$MONGODB_URI" \
        --region $AWS_REGION

    print_success "DocumentDB credentials stored in Secrets Manager"
}

# Function to create ECR repositories
create_ecr_repositories() {
    print_info "Creating ECR repositories..."

    # Backend repository
    BACKEND_REPO_URI=$(aws ecr create-repository \
        --repository-name ${PROJECT_NAME}-backend \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --query 'repository.repositoryUri' \
        --output text \
        --region $AWS_REGION)

    # Frontend repository
    FRONTEND_REPO_URI=$(aws ecr create-repository \
        --repository-name ${PROJECT_NAME}-frontend \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --query 'repository.repositoryUri' \
        --output text \
        --region $AWS_REGION)

    print_success "ECR repositories created: $BACKEND_REPO_URI, $FRONTEND_REPO_URI"
}

# Function to create ECS cluster
create_ecs_cluster() {
    print_info "Creating ECS cluster..."

    aws ecs create-cluster \
        --cluster-name ${PROJECT_NAME}-prod-cluster \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
        --settings name=containerInsights,value=enabled \
        --region $AWS_REGION

    print_success "ECS cluster created: ${PROJECT_NAME}-prod-cluster"
}

# Function to create Application Load Balancer
create_alb() {
    print_info "Creating Application Load Balancer..."

    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ${PROJECT_NAME}-alb \
        --subnets $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID \
        --security-groups $ALB_SG_ID \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION)

    # Get ALB DNS
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns $ALB_ARN \
        --query 'LoadBalancers[0].DNSName' \
        --output text \
        --region $AWS_REGION)

    # Create target group
    TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
        --name ${PROJECT_NAME}-backend-tg \
        --protocol HTTP \
        --port 8080 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-enabled \
        --health-check-path /actuator/health \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 2 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)

    # Create listener
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
        --region $AWS_REGION

    print_success "ALB created: $ALB_DNS"
}

# Function to create S3 bucket for frontend
create_s3_bucket() {
    print_info "Creating S3 bucket for frontend..."

    BUCKET_NAME="${PROJECT_NAME}-frontend-${AWS_REGION}"

    aws s3api create-bucket \
        --bucket $BUCKET_NAME \
        --region $AWS_REGION

    # Configure for static website hosting
    aws s3 website s3://$BUCKET_NAME/ \
        --index-document index.html \
        --error-document index.html

    # Set bucket policy for public read
    cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file:///tmp/bucket-policy.json

    # Disable block public access
    aws s3api put-public-access-block \
        --bucket $BUCKET_NAME \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    rm /tmp/bucket-policy.json

    S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

    print_success "S3 bucket created: $BUCKET_NAME"
    print_success "Website URL: $S3_WEBSITE_URL"
}

# Function to create CloudFront distributions
create_cloudfront() {
    print_info "Creating CloudFront distributions..."

    # Frontend distribution
    cat > /tmp/cf-frontend.json <<EOF
{
  "CallerReference": "hotelx-frontend-$(date +%s)",
  "Comment": "CloudFront distribution for hotelx frontend",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-hotelx-frontend",
        "DomainName": "${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-hotelx-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "DefaultRootObject": "index.html"
}
EOF

    FRONTEND_CF_ID=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-frontend.json \
        --query 'Distribution.Id' \
        --output text \
        --region $AWS_REGION)

    FRONTEND_CF_DOMAIN=$(aws cloudfront get-distribution \
        --id $FRONTEND_CF_ID \
        --query 'Distribution.DomainName' \
        --output text \
        --region $AWS_REGION)

    rm /tmp/cf-frontend.json

    print_success "Frontend CloudFront distribution created: https://$FRONTEND_CF_DOMAIN"
    print_success "Distribution ID: $FRONTEND_CF_ID"

    # Backend distribution
    cat > /tmp/cf-backend.json <<EOF
{
  "CallerReference": "hotelx-backend-$(date +%s)",
  "Comment": "CloudFront distribution for hotelx backend API",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "ALB-hotelx-backend",
        "DomainName": "${ALB_DNS}",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-hotelx-backend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Headers": {
        "Quantity": 4,
        "Items": ["Authorization", "Accept", "Content-Type", "Origin"]
      },
      "Cookies": {
        "Forward": "all"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0,
    "Compress": true
  }
}
EOF

    BACKEND_CF_ID=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-backend.json \
        --query 'Distribution.Id' \
        --output text \
        --region $AWS_REGION)

    BACKEND_CF_DOMAIN=$(aws cloudfront get-distribution \
        --id $BACKEND_CF_ID \
        --query 'Distribution.DomainName' \
        --output text \
        --region $AWS_REGION)

    rm /tmp/cf-backend.json

    print_success "Backend CloudFront distribution created: https://$BACKEND_CF_DOMAIN"
}

# Function to create secrets in Secrets Manager
create_secrets() {
    print_info "Creating application secrets..."

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/jwt-secret \
        --secret-string "$JWT_SECRET" \
        --region $AWS_REGION

    # Placeholder secrets (you'll need to update these with real values)
    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/stripe-api-key \
        --secret-string "sk_test_REPLACE_WITH_YOUR_STRIPE_KEY" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/stripe-webhook-secret \
        --secret-string "whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/email-username \
        --secret-string "your-email@gmail.com" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/email-password \
        --secret-string "your-app-password" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/google-client-id \
        --secret-string "REPLACE_WITH_GOOGLE_CLIENT_ID" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/google-client-secret \
        --secret-string "REPLACE_WITH_GOOGLE_CLIENT_SECRET" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/backend-url \
        --secret-string "https://${BACKEND_CF_DOMAIN}" \
        --region $AWS_REGION

    aws secretsmanager create-secret \
        --name ${PROJECT_NAME}/frontend-url \
        --secret-string "https://${FRONTEND_CF_DOMAIN}" \
        --region $AWS_REGION

    print_success "Secrets created in Secrets Manager"
    print_warning "Remember to update placeholder secrets with real values!"
}

# Function to create IAM role for ECS Task Execution
create_ecs_task_execution_role() {
    print_info "Creating ECS Task Execution Role..."

    if aws iam get-role --role-name ecsTaskExecutionRole &>/dev/null; then
        print_warning "ecsTaskExecutionRole already exists, skipping..."
    else
        cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

        aws iam create-role \
            --role-name ecsTaskExecutionRole \
            --assume-role-policy-document file:///tmp/trust-policy.json

        aws iam attach-role-policy \
            --role-name ecsTaskExecutionRole \
            --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

        aws iam attach-role-policy \
            --role-name ecsTaskExecutionRole \
            --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

        rm /tmp/trust-policy.json

        print_success "ECS Task Execution Role created"
    fi
}

# Function to save configuration
save_configuration() {
    print_info "Saving configuration..."

    cat > infrastructure-config.txt <<EOF
# HotelX AWS Infrastructure Configuration
# Generated on $(date)

AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID

# VPC
VPC_ID=$VPC_ID
PUBLIC_SUBNET_1_ID=$PUBLIC_SUBNET_1_ID
PUBLIC_SUBNET_2_ID=$PUBLIC_SUBNET_2_ID
PRIVATE_SUBNET_1_ID=$PRIVATE_SUBNET_1_ID
PRIVATE_SUBNET_2_ID=$PRIVATE_SUBNET_2_ID

# Security Groups
ALB_SG_ID=$ALB_SG_ID
ECS_SG_ID=$ECS_SG_ID
DOCDB_SG_ID=$DOCDB_SG_ID

# Database
DOCDB_ENDPOINT=$DOCDB_ENDPOINT

# ECR
BACKEND_REPO_URI=$BACKEND_REPO_URI
FRONTEND_REPO_URI=$FRONTEND_REPO_URI

# ECS
ECS_CLUSTER=${PROJECT_NAME}-prod-cluster

# Load Balancer
ALB_DNS=$ALB_DNS
TARGET_GROUP_ARN=$TARGET_GROUP_ARN

# S3
S3_BUCKET=$BUCKET_NAME
S3_WEBSITE_URL=$S3_WEBSITE_URL

# CloudFront
FRONTEND_CF_ID=$FRONTEND_CF_ID
FRONTEND_CF_DOMAIN=$FRONTEND_CF_DOMAIN
BACKEND_CF_ID=$BACKEND_CF_ID
BACKEND_CF_DOMAIN=$BACKEND_CF_DOMAIN

# GitHub Secrets to Configure:
# AWS_ACCESS_KEY_ID=<your-aws-access-key>
# AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
# AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
# BACKEND_API_URL=https://$BACKEND_CF_DOMAIN
# CLOUDFRONT_DISTRIBUTION_ID=$FRONTEND_CF_ID
# STRIPE_PUBLIC_KEY=<your-stripe-public-key>
EOF

    print_success "Configuration saved to infrastructure-config.txt"
}

# Function to print summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "  AWS Infrastructure Setup Complete!"
    echo "=========================================="
    echo ""
    print_success "All resources have been created successfully!"
    echo ""
    echo "📋 Configuration Details:"
    echo "   VPC ID: $VPC_ID"
    echo "   ECS Cluster: ${PROJECT_NAME}-prod-cluster"
    echo "   DocumentDB: $DOCDB_ENDPOINT"
    echo "   ALB: $ALB_DNS"
    echo "   S3 Bucket: $BUCKET_NAME"
    echo "   Frontend URL: https://$FRONTEND_CF_DOMAIN"
    echo "   Backend URL: https://$BACKEND_CF_DOMAIN"
    echo ""
    echo "📝 Next Steps:"
    echo ""
    echo "1. Update Secrets in AWS Secrets Manager:"
    echo "   - ${PROJECT_NAME}/stripe-api-key"
    echo "   - ${PROJECT_NAME}/stripe-webhook-secret"
    echo "   - ${PROJECT_NAME}/email-username"
    echo "   - ${PROJECT_NAME}/email-password"
    echo "   - ${PROJECT_NAME}/google-client-id"
    echo "   - ${PROJECT_NAME}/google-client-secret"
    echo ""
    echo "2. Configure GitHub Secrets:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo "   - AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
    echo "   - BACKEND_API_URL=https://$BACKEND_CF_DOMAIN"
    echo "   - CLOUDFRONT_DISTRIBUTION_ID=$FRONTEND_CF_ID"
    echo "   - STRIPE_PUBLIC_KEY"
    echo ""
    echo "3. Build and push Docker images to ECR:"
    echo "   Backend: $BACKEND_REPO_URI"
    echo "   Frontend: $FRONTEND_REPO_URI"
    echo ""
    echo "4. Deploy using GitHub Actions workflows"
    echo ""
    echo "💾 Full configuration saved to: infrastructure-config.txt"
    echo ""
    print_warning "Note: CloudFront distributions can take 15-20 minutes to fully deploy"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "  HotelX AWS Infrastructure Setup"
    echo "=========================================="
    echo ""

    check_prerequisites

    print_info "This script will create the following resources:"
    echo "  - VPC with public/private subnets"
    echo "  - Internet Gateway and NAT Gateways"
    echo "  - Security Groups"
    echo "  - DocumentDB Cluster"
    echo "  - ECR Repositories"
    echo "  - ECS Cluster"
    echo "  - Application Load Balancer"
    echo "  - S3 Bucket for frontend"
    echo "  - CloudFront Distributions"
    echo "  - Secrets Manager secrets"
    echo ""
    print_warning "This will incur AWS charges. Current estimated cost: ~$322/month"
    echo ""
    read -p "Do you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi

    create_vpc
    create_internet_gateway
    create_subnets
    create_nat_gateways
    create_route_tables
    create_security_groups
    create_documentdb
    create_ecr_repositories
    create_ecs_cluster
    create_ecs_task_execution_role
    create_alb
    create_s3_bucket
    create_cloudfront
    create_secrets
    save_configuration
    print_summary
}

# Run main function
main
