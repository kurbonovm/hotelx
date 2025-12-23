#!/bin/bash

# HotelX AWS Infrastructure Cleanup Script
# This script removes all AWS resources created by setup-aws-infrastructure.sh
# WARNING: This will delete all data and cannot be undone!

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION="us-east-1"
PROJECT_NAME="hotelx"

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

# Function to delete CloudFront distributions
delete_cloudfront() {
    print_info "Deleting CloudFront distributions..."

    # Get all distributions
    DISTRIBUTIONS=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, 'hotelx')].Id" \
        --output text \
        --region $AWS_REGION)

    for DIST_ID in $DISTRIBUTIONS; do
        print_info "Disabling distribution $DIST_ID..."

        ETAG=$(aws cloudfront get-distribution \
            --id $DIST_ID \
            --query 'ETag' \
            --output text \
            --region $AWS_REGION)

        CONFIG=$(aws cloudfront get-distribution \
            --id $DIST_ID \
            --query 'Distribution.DistributionConfig' \
            --region $AWS_REGION)

        echo "$CONFIG" | jq '.Enabled = false' > /tmp/cf-config.json

        aws cloudfront update-distribution \
            --id $DIST_ID \
            --distribution-config file:///tmp/cf-config.json \
            --if-match "$ETAG" \
            --region $AWS_REGION

        print_warning "Waiting for distribution to be disabled (this may take several minutes)..."
        aws cloudfront wait distribution-deployed --id $DIST_ID --region $AWS_REGION

        ETAG=$(aws cloudfront get-distribution \
            --id $DIST_ID \
            --query 'ETag' \
            --output text \
            --region $AWS_REGION)

        aws cloudfront delete-distribution \
            --id $DIST_ID \
            --if-match "$ETAG" \
            --region $AWS_REGION

        print_success "Distribution $DIST_ID deleted"
    done

    rm -f /tmp/cf-config.json
}

# Function to delete S3 bucket
delete_s3() {
    print_info "Deleting S3 bucket..."

    BUCKET_NAME="${PROJECT_NAME}-frontend-${AWS_REGION}"

    if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
        aws s3 rm s3://$BUCKET_NAME --recursive
        aws s3api delete-bucket --bucket $BUCKET_NAME --region $AWS_REGION
        print_success "S3 bucket deleted: $BUCKET_NAME"
    else
        print_warning "S3 bucket not found: $BUCKET_NAME"
    fi
}

# Function to delete ECS service and cluster
delete_ecs() {
    print_info "Deleting ECS service and cluster..."

    CLUSTER_NAME="${PROJECT_NAME}-prod-cluster"
    SERVICE_NAME="${PROJECT_NAME}-backend-service"

    if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION &>/dev/null; then
        print_info "Updating service to 0 tasks..."
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --desired-count 0 \
            --region $AWS_REGION

        print_info "Deleting service..."
        aws ecs delete-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force \
            --region $AWS_REGION

        print_success "ECS service deleted"
    fi

    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION &>/dev/null; then
        aws ecs delete-cluster \
            --cluster $CLUSTER_NAME \
            --region $AWS_REGION
        print_success "ECS cluster deleted"
    fi
}

# Function to delete ALB
delete_alb() {
    print_info "Deleting Application Load Balancer..."

    ALB_NAME="${PROJECT_NAME}-alb"
    TG_NAME="${PROJECT_NAME}-backend-tg"

    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")

    if [ ! -z "$ALB_ARN" ]; then
        # Delete listeners
        LISTENERS=$(aws elbv2 describe-listeners \
            --load-balancer-arn $ALB_ARN \
            --query 'Listeners[*].ListenerArn' \
            --output text \
            --region $AWS_REGION)

        for LISTENER in $LISTENERS; do
            aws elbv2 delete-listener --listener-arn $LISTENER --region $AWS_REGION
        done

        # Delete ALB
        aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $AWS_REGION
        print_success "ALB deleted"

        # Wait for deletion
        sleep 30
    fi

    # Delete target group
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names $TG_NAME \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")

    if [ ! -z "$TG_ARN" ]; then
        aws elbv2 delete-target-group --target-group-arn $TG_ARN --region $AWS_REGION
        print_success "Target group deleted"
    fi
}

# Function to delete ECR repositories
delete_ecr() {
    print_info "Deleting ECR repositories..."

    for REPO in "${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend"; do
        if aws ecr describe-repositories --repository-names $REPO --region $AWS_REGION &>/dev/null; then
            aws ecr delete-repository \
                --repository-name $REPO \
                --force \
                --region $AWS_REGION
            print_success "ECR repository deleted: $REPO"
        fi
    done
}

# Function to delete DocumentDB
delete_documentdb() {
    print_info "Deleting DocumentDB cluster..."

    CLUSTER_ID="${PROJECT_NAME}-prod-docdb-cluster"
    INSTANCE_ID="${PROJECT_NAME}-prod-docdb-instance"

    if aws docdb describe-db-instances --db-instance-identifier $INSTANCE_ID --region $AWS_REGION &>/dev/null; then
        aws docdb delete-db-instance \
            --db-instance-identifier $INSTANCE_ID \
            --region $AWS_REGION
        print_info "Waiting for instance deletion..."
    fi

    if aws docdb describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $AWS_REGION &>/dev/null; then
        aws docdb delete-db-cluster \
            --db-cluster-identifier $CLUSTER_ID \
            --skip-final-snapshot \
            --region $AWS_REGION
        print_success "DocumentDB cluster deleted"
    fi

    # Delete subnet group
    if aws docdb describe-db-subnet-groups --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group --region $AWS_REGION &>/dev/null; then
        aws docdb delete-db-subnet-group \
            --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
            --region $AWS_REGION
        print_success "DocumentDB subnet group deleted"
    fi
}

# Function to delete NAT Gateways
delete_nat_gateways() {
    print_info "Deleting NAT Gateways..."

    NAT_GWS=$(aws ec2 describe-nat-gateways \
        --filter "Name=tag:Name,Values=${PROJECT_NAME}-nat-gw-*" \
        --query 'NatGateways[*].NatGatewayId' \
        --output text \
        --region $AWS_REGION)

    for NAT_GW in $NAT_GWS; do
        print_info "Deleting NAT Gateway: $NAT_GW"
        aws ec2 delete-nat-gateway --nat-gateway-id $NAT_GW --region $AWS_REGION
    done

    if [ ! -z "$NAT_GWS" ]; then
        print_info "Waiting for NAT Gateways to be deleted..."
        sleep 60
    fi

    # Release Elastic IPs
    EIPs=$(aws ec2 describe-addresses \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-nat-eip-*" \
        --query 'Addresses[*].AllocationId' \
        --output text \
        --region $AWS_REGION)

    for EIP in $EIPs; do
        aws ec2 release-address --allocation-id $EIP --region $AWS_REGION
        print_success "Elastic IP released: $EIP"
    done
}

# Function to delete VPC and networking
delete_vpc() {
    print_info "Deleting VPC and networking..."

    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-prod-vpc" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")

    if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
        print_warning "VPC not found"
        return
    fi

    # Delete security groups
    SG_IDS=$(aws ec2 describe-security-groups \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'SecurityGroups[?GroupName!=`default`].GroupId' \
        --output text \
        --region $AWS_REGION)

    for SG_ID in $SG_IDS; do
        aws ec2 delete-security-group --group-id $SG_ID --region $AWS_REGION 2>/dev/null || true
        print_success "Security group deleted: $SG_ID"
    done

    # Delete subnets
    SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'Subnets[*].SubnetId' \
        --output text \
        --region $AWS_REGION)

    for SUBNET_ID in $SUBNET_IDS; do
        aws ec2 delete-subnet --subnet-id $SUBNET_ID --region $AWS_REGION
        print_success "Subnet deleted: $SUBNET_ID"
    done

    # Delete route tables
    RT_IDS=$(aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' \
        --output text \
        --region $AWS_REGION)

    for RT_ID in $RT_IDS; do
        aws ec2 delete-route-table --route-table-id $RT_ID --region $AWS_REGION
        print_success "Route table deleted: $RT_ID"
    done

    # Detach and delete Internet Gateway
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
        --query 'InternetGateways[0].InternetGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")

    if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
        aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region $AWS_REGION
        aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID --region $AWS_REGION
        print_success "Internet Gateway deleted: $IGW_ID"
    fi

    # Delete VPC
    aws ec2 delete-vpc --vpc-id $VPC_ID --region $AWS_REGION
    print_success "VPC deleted: $VPC_ID"
}

# Function to delete secrets
delete_secrets() {
    print_info "Deleting secrets from Secrets Manager..."

    SECRETS=$(aws secretsmanager list-secrets \
        --query "SecretList[?contains(Name, '${PROJECT_NAME}')].Name" \
        --output text \
        --region $AWS_REGION)

    for SECRET in $SECRETS; do
        aws secretsmanager delete-secret \
            --secret-id "$SECRET" \
            --force-delete-without-recovery \
            --region $AWS_REGION
        print_success "Secret deleted: $SECRET"
    done
}

# Main execution
main() {
    echo "=========================================="
    echo "  HotelX AWS Infrastructure Cleanup"
    echo "=========================================="
    echo ""
    print_error "WARNING: This will DELETE all AWS resources for HotelX!"
    print_error "This action CANNOT be undone!"
    echo ""
    read -p "Are you absolutely sure you want to continue? Type 'DELETE' to confirm: " -r
    echo

    if [ "$REPLY" != "DELETE" ]; then
        print_info "Cleanup cancelled"
        exit 0
    fi

    print_info "Starting cleanup process..."
    echo ""

    delete_cloudfront
    delete_s3
    delete_ecs
    delete_alb
    delete_ecr
    delete_documentdb
    delete_nat_gateways
    delete_vpc
    delete_secrets

    echo ""
    print_success "All HotelX AWS resources have been deleted!"
    echo ""
}

main
