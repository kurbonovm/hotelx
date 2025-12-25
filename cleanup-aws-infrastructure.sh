#!/bin/bash

# HotelX AWS Infrastructure Cleanup Script
# This script deletes all AWS resources created by setup-aws-infrastructure.sh

# Note: We don't use 'set -e' because we want to continue even if some resources are missing

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - must match setup script
AWS_REGION="us-east-1"
PROJECT_NAME="hotelx"

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to delete CloudFront distributions
delete_cloudfront() {
    print_info "Deleting CloudFront distributions..."

    # Frontend distribution
    FRONTEND_CF_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='CloudFront distribution for hotelx frontend'].Id | [0]" \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$FRONTEND_CF_ID" != "None" ] && [ -n "$FRONTEND_CF_ID" ]; then
        print_warning "Found frontend CloudFront distribution: $FRONTEND_CF_ID"

        # Get current ETag
        ETAG=$(aws cloudfront get-distribution --id $FRONTEND_CF_ID --query 'ETag' --output text --region $AWS_REGION 2>/dev/null)

        # Disable distribution first
        aws cloudfront get-distribution-config --id $FRONTEND_CF_ID --region $AWS_REGION 2>/dev/null | \
            jq '.DistributionConfig | .Enabled = false' > /tmp/cf-config.json

        aws cloudfront update-distribution \
            --id $FRONTEND_CF_ID \
            --distribution-config file:///tmp/cf-config.json \
            --if-match "$ETAG" \
            --region $AWS_REGION 2>/dev/null || print_warning "Could not disable frontend CloudFront"

        print_info "Waiting for frontend CloudFront to be disabled (this may take several minutes)..."
        aws cloudfront wait distribution-deployed --id $FRONTEND_CF_ID --region $AWS_REGION 2>/dev/null || true

        # Delete distribution
        NEW_ETAG=$(aws cloudfront get-distribution --id $FRONTEND_CF_ID --query 'ETag' --output text --region $AWS_REGION 2>/dev/null)
        aws cloudfront delete-distribution --id $FRONTEND_CF_ID --if-match "$NEW_ETAG" --region $AWS_REGION 2>/dev/null || print_warning "Could not delete frontend CloudFront"
        print_success "Frontend CloudFront distribution deleted"
    fi

    # Backend distribution
    BACKEND_CF_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='CloudFront distribution for hotelx backend API'].Id | [0]" \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$BACKEND_CF_ID" != "None" ] && [ -n "$BACKEND_CF_ID" ]; then
        print_warning "Found backend CloudFront distribution: $BACKEND_CF_ID"

        ETAG=$(aws cloudfront get-distribution --id $BACKEND_CF_ID --query 'ETag' --output text --region $AWS_REGION 2>/dev/null)

        aws cloudfront get-distribution-config --id $BACKEND_CF_ID --region $AWS_REGION 2>/dev/null | \
            jq '.DistributionConfig | .Enabled = false' > /tmp/cf-config.json

        aws cloudfront update-distribution \
            --id $BACKEND_CF_ID \
            --distribution-config file:///tmp/cf-config.json \
            --if-match "$ETAG" \
            --region $AWS_REGION 2>/dev/null || print_warning "Could not disable backend CloudFront"

        print_info "Waiting for backend CloudFront to be disabled..."
        aws cloudfront wait distribution-deployed --id $BACKEND_CF_ID --region $AWS_REGION 2>/dev/null || true

        NEW_ETAG=$(aws cloudfront get-distribution --id $BACKEND_CF_ID --query 'ETag' --output text --region $AWS_REGION 2>/dev/null)
        aws cloudfront delete-distribution --id $BACKEND_CF_ID --if-match "$NEW_ETAG" --region $AWS_REGION 2>/dev/null || print_warning "Could not delete backend CloudFront"
        print_success "Backend CloudFront distribution deleted"
    fi

    rm -f /tmp/cf-config.json
}

# Function to delete S3 buckets
delete_s3_buckets() {
    print_info "Deleting S3 buckets..."

    BUCKET_NAME="${PROJECT_NAME}-frontend-${AWS_REGION}"

    if aws s3api head-bucket --bucket $BUCKET_NAME --region $AWS_REGION 2>/dev/null; then
        print_warning "Deleting S3 bucket: $BUCKET_NAME"
        aws s3 rm "s3://$BUCKET_NAME" --recursive 2>/dev/null || true
        aws s3api delete-bucket --bucket $BUCKET_NAME --region $AWS_REGION 2>/dev/null || print_warning "Could not delete bucket"
        print_success "S3 bucket deleted"
    fi
}

# Function to delete ECS services and cluster
delete_ecs() {
    print_info "Deleting ECS services and cluster..."

    # Check if cluster exists
    if aws ecs describe-clusters --clusters ${PROJECT_NAME}-prod-cluster --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then

        # List and delete all services in the cluster
        SERVICES=$(aws ecs list-services --cluster ${PROJECT_NAME}-prod-cluster --region $AWS_REGION --query 'serviceArns[*]' --output text 2>/dev/null)

        for SERVICE_ARN in $SERVICES; do
            SERVICE_NAME=$(basename $SERVICE_ARN)
            print_warning "Updating service $SERVICE_NAME to 0 desired count..."

            aws ecs update-service \
                --cluster ${PROJECT_NAME}-prod-cluster \
                --service $SERVICE_NAME \
                --desired-count 0 \
                --region $AWS_REGION 2>/dev/null || true

            print_warning "Deleting service $SERVICE_NAME..."
            aws ecs delete-service \
                --cluster ${PROJECT_NAME}-prod-cluster \
                --service $SERVICE_NAME \
                --force \
                --region $AWS_REGION 2>/dev/null || true
        done

        # Wait a bit for services to be deleted
        if [ -n "$SERVICES" ]; then
            print_info "Waiting for services to be deleted..."
            sleep 30
        fi

        # Delete cluster
        print_warning "Deleting ECS cluster..."
        aws ecs delete-cluster --cluster ${PROJECT_NAME}-prod-cluster --region $AWS_REGION 2>/dev/null || print_warning "Could not delete cluster"
        print_success "ECS cluster deleted"
    fi

    # Deregister all task definition revisions
    print_info "Deregistering ECS task definitions..."

    TASK_FAMILIES=("${PROJECT_NAME}-backend")

    for FAMILY in "${TASK_FAMILIES[@]}"; do
        # List all revisions for this family
        REVISIONS=$(aws ecs list-task-definitions \
            --family-prefix $FAMILY \
            --region $AWS_REGION \
            --query 'taskDefinitionArns[*]' \
            --output text 2>/dev/null)

        if [ -n "$REVISIONS" ]; then
            for TASK_DEF_ARN in $REVISIONS; do
                print_warning "Deregistering task definition: $TASK_DEF_ARN"
                aws ecs deregister-task-definition \
                    --task-definition $TASK_DEF_ARN \
                    --region $AWS_REGION 2>/dev/null || true
            done
            print_success "Task definitions for family '$FAMILY' deregistered"
        fi
    done
}

# Function to delete ECR repositories
delete_ecr() {
    print_info "Deleting ECR repositories..."

    # Backend repository
    if aws ecr describe-repositories --repository-names ${PROJECT_NAME}-backend --region $AWS_REGION &>/dev/null; then
        print_warning "Deleting backend ECR repository..."
        aws ecr delete-repository --repository-name ${PROJECT_NAME}-backend --force --region $AWS_REGION 2>/dev/null || print_warning "Could not delete backend repo"
        print_success "Backend ECR repository deleted"
    fi

    # Frontend repository
    if aws ecr describe-repositories --repository-names ${PROJECT_NAME}-frontend --region $AWS_REGION &>/dev/null; then
        print_warning "Deleting frontend ECR repository..."
        aws ecr delete-repository --repository-name ${PROJECT_NAME}-frontend --force --region $AWS_REGION 2>/dev/null || print_warning "Could not delete frontend repo"
        print_success "Frontend ECR repository deleted"
    fi
}

# Function to delete Application Load Balancer
delete_alb() {
    print_info "Deleting Application Load Balancer..."

    # Get ALB ARN
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names ${PROJECT_NAME}-alb \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ]; then
        # Delete listeners
        LISTENERS=$(aws elbv2 describe-listeners \
            --load-balancer-arn $ALB_ARN \
            --query 'Listeners[*].ListenerArn' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        for LISTENER in $LISTENERS; do
            print_warning "Deleting listener: $LISTENER"
            aws elbv2 delete-listener --listener-arn $LISTENER --region $AWS_REGION 2>/dev/null || true
        done

        # Delete ALB
        print_warning "Deleting ALB..."
        aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $AWS_REGION 2>/dev/null || print_warning "Could not delete ALB"
        print_success "ALB deleted"
    fi

    # Delete target group
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names ${PROJECT_NAME}-backend-tg \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$TG_ARN" != "None" ] && [ -n "$TG_ARN" ]; then
        # Wait for ALB to be deleted
        print_info "Waiting for ALB to be fully deleted before removing target group..."
        sleep 60

        print_warning "Deleting target group..."
        aws elbv2 delete-target-group --target-group-arn $TG_ARN --region $AWS_REGION 2>/dev/null || print_warning "Could not delete target group"
        print_success "Target group deleted"
    fi
}

# Function to delete DocumentDB
delete_documentdb() {
    print_info "Deleting DocumentDB cluster..."

    # Check if cluster exists
    if aws docdb describe-db-clusters --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster --region $AWS_REGION &>/dev/null; then

        # Delete instances first
        INSTANCES=$(aws docdb describe-db-instances \
            --filters "Name=db-cluster-id,Values=${PROJECT_NAME}-prod-docdb-cluster" \
            --query 'DBInstances[*].DBInstanceIdentifier' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        for INSTANCE in $INSTANCES; do
            print_warning "Deleting DocumentDB instance: $INSTANCE"
            aws docdb delete-db-instance \
                --db-instance-identifier $INSTANCE \
                --region $AWS_REGION 2>/dev/null || true
        done

        # Wait for instances to be deleted
        if [ -n "$INSTANCES" ]; then
            print_info "Waiting for DocumentDB instances to be deleted (this may take several minutes)..."
            sleep 60
        fi

        # Delete cluster (skip final snapshot)
        print_warning "Deleting DocumentDB cluster..."
        aws docdb delete-db-cluster \
            --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
            --skip-final-snapshot \
            --region $AWS_REGION 2>/dev/null || print_warning "Could not delete cluster"
        print_success "DocumentDB cluster deletion initiated"
    fi

    # Delete subnet group
    if aws docdb describe-db-subnet-groups --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group --region $AWS_REGION &>/dev/null; then
        print_info "Waiting for cluster to be fully deleted before removing subnet group..."
        sleep 120

        print_warning "Deleting DB subnet group..."
        aws docdb delete-db-subnet-group \
            --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
            --region $AWS_REGION 2>/dev/null || print_warning "Could not delete subnet group"
        print_success "DB subnet group deleted"
    fi
}

# Function to delete VPC and networking resources
delete_vpc() {
    print_info "Deleting VPC and networking resources..."

    # Get VPC ID
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-prod-vpc" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        print_info "No VPC found"
        return
    fi

    print_warning "Found VPC: $VPC_ID"

    # Delete NAT Gateways
    NAT_GWS=$(aws ec2 describe-nat-gateways \
        --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available,pending" \
        --query 'NatGateways[*].NatGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for NAT_GW in $NAT_GWS; do
        print_warning "Deleting NAT Gateway: $NAT_GW"
        aws ec2 delete-nat-gateway --nat-gateway-id $NAT_GW --region $AWS_REGION 2>/dev/null || true
    done

    if [ -n "$NAT_GWS" ]; then
        print_info "Waiting for NAT Gateways to be deleted (this may take a few minutes)..."
        sleep 120
    fi

    # Release Elastic IPs
    EIP_ALLOCS=$(aws ec2 describe-addresses \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-nat-eip-*" \
        --query 'Addresses[*].AllocationId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for EIP in $EIP_ALLOCS; do
        print_warning "Releasing Elastic IP: $EIP"
        aws ec2 release-address --allocation-id $EIP --region $AWS_REGION 2>/dev/null || true
    done

    # Delete route table associations and routes
    ROUTE_TABLES=$(aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[?Associations[0].Main != `true`].RouteTableId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for RT in $ROUTE_TABLES; do
        # Delete associations
        ASSOCIATIONS=$(aws ec2 describe-route-tables \
            --route-table-ids $RT \
            --query 'RouteTables[0].Associations[?!Main].RouteTableAssociationId' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        for ASSOC in $ASSOCIATIONS; do
            print_warning "Deleting route table association: $ASSOC"
            aws ec2 disassociate-route-table --association-id $ASSOC --region $AWS_REGION 2>/dev/null || true
        done

        # Delete route table
        print_warning "Deleting route table: $RT"
        aws ec2 delete-route-table --route-table-id $RT --region $AWS_REGION 2>/dev/null || true
    done

    # Detach and delete Internet Gateway
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
        --query 'InternetGateways[0].InternetGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$IGW_ID" != "None" ] && [ -n "$IGW_ID" ]; then
        print_warning "Detaching Internet Gateway: $IGW_ID"
        aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region $AWS_REGION 2>/dev/null || true

        print_warning "Deleting Internet Gateway: $IGW_ID"
        aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID --region $AWS_REGION 2>/dev/null || true
    fi

    # Delete network interfaces (often left behind by DocumentDB/RDS)
    NETWORK_INTERFACES=$(aws ec2 describe-network-interfaces \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'NetworkInterfaces[*].NetworkInterfaceId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for ENI in $NETWORK_INTERFACES; do
        print_warning "Deleting network interface: $ENI"

        # Check if attached to an instance and detach if needed
        ATTACHMENT_ID=$(aws ec2 describe-network-interfaces \
            --network-interface-ids $ENI \
            --query 'NetworkInterfaces[0].Attachment.AttachmentId' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ "$ATTACHMENT_ID" != "None" ] && [ -n "$ATTACHMENT_ID" ]; then
            print_info "Detaching network interface: $ENI"
            aws ec2 detach-network-interface --attachment-id $ATTACHMENT_ID --region $AWS_REGION --force 2>/dev/null || true
            sleep 5
        fi

        aws ec2 delete-network-interface --network-interface-id $ENI --region $AWS_REGION 2>/dev/null || true
    done

    # Wait a bit for network interfaces to be deleted
    if [ -n "$NETWORK_INTERFACES" ]; then
        print_info "Waiting for network interfaces to be deleted..."
        sleep 10
    fi

    # Delete subnets
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'Subnets[*].SubnetId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for SUBNET in $SUBNETS; do
        print_warning "Deleting subnet: $SUBNET"
        aws ec2 delete-subnet --subnet-id $SUBNET --region $AWS_REGION 2>/dev/null || true
    done

    # Delete security groups (except default)
    SECURITY_GROUPS=$(aws ec2 describe-security-groups \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'SecurityGroups[?GroupName!=`default`].GroupId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    for SG in $SECURITY_GROUPS; do
        print_warning "Deleting security group: $SG"
        aws ec2 delete-security-group --group-id $SG --region $AWS_REGION 2>/dev/null || true
    done

    # Delete VPC
    print_warning "Deleting VPC: $VPC_ID"
    aws ec2 delete-vpc --vpc-id $VPC_ID --region $AWS_REGION 2>/dev/null || print_warning "Could not delete VPC"
    print_success "VPC and networking resources deleted"
}

# Function to delete Secrets Manager secrets
delete_secrets() {
    print_info "Deleting Secrets Manager secrets..."

    SECRETS=(
        "${PROJECT_NAME}/prod/db-master-password"
        "${PROJECT_NAME}/prod/documentdb-connection-uri"
        "${PROJECT_NAME}/jwt-secret"
        "${PROJECT_NAME}/stripe-api-key"
        "${PROJECT_NAME}/stripe-webhook-secret"
        "${PROJECT_NAME}/email-username"
        "${PROJECT_NAME}/email-password"
        "${PROJECT_NAME}/google-client-id"
        "${PROJECT_NAME}/google-client-secret"
        "${PROJECT_NAME}/backend-url"
        "${PROJECT_NAME}/frontend-url"
    )

    for SECRET in "${SECRETS[@]}"; do
        if aws secretsmanager describe-secret --secret-id "$SECRET" --region $AWS_REGION &>/dev/null; then
            print_warning "Deleting secret: $SECRET"
            aws secretsmanager delete-secret \
                --secret-id "$SECRET" \
                --force-delete-without-recovery \
                --region $AWS_REGION 2>/dev/null || print_warning "Could not delete secret"
        fi
    done

    print_success "Secrets deleted"
}

# Main execution
main() {
    echo "=========================================="
    echo "  HotelX AWS Infrastructure Cleanup"
    echo "=========================================="
    echo ""

    print_warning "This will DELETE all AWS resources for the HotelX project!"
    print_warning "Resources in region: $AWS_REGION"
    print_warning "Project name: $PROJECT_NAME"
    echo ""
    read -p "Type 'DELETE' to confirm: " -r
    echo

    if [[ ! $REPLY = "DELETE" ]]; then
        print_info "Cleanup cancelled"
        exit 0
    fi

    print_info "Starting cleanup process..."
    echo ""

    # Delete in reverse order of creation
    delete_cloudfront
    delete_s3_buckets
    delete_ecs
    delete_alb
    delete_ecr
    delete_documentdb
    delete_secrets
    delete_vpc

    echo ""
    print_success "Cleanup complete!"
    echo ""
    print_info "Note: Some resources may take additional time to fully delete."
    print_info "CloudFront distributions can take up to 15 minutes to delete."
    print_info "DocumentDB clusters can take up to 10 minutes to delete."
    echo ""
}

# Run main function
main