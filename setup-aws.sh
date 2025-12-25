#!/bin/bash

# HotelX AWS Infrastructure Setup Script
# This script creates all necessary AWS resources for the application
# Run this script once to set up the complete infrastructure

# Note: We don't use 'set -e' because we handle errors gracefully and check for existing resources

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
    print_info "Checking VPC..."

    # Check if VPC already exists
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-prod-vpc" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$VPC_ID" != "None" ] && [ -n "$VPC_ID" ]; then
        print_warning "VPC already exists: $VPC_ID"

        # Verify CIDR block matches
        EXISTING_CIDR=$(aws ec2 describe-vpcs \
            --vpc-ids $VPC_ID \
            --query 'Vpcs[0].CidrBlock' \
            --output text \
            --region $AWS_REGION)

        if [ "$EXISTING_CIDR" != "$VPC_CIDR" ]; then
            print_error "Existing VPC has different CIDR block: $EXISTING_CIDR (expected: $VPC_CIDR)"
            print_error "Please manually delete the VPC or update the script configuration"
            exit 1
        fi

        print_success "Using existing VPC with correct CIDR block"
    else
        VPC_ID=$(aws ec2 create-vpc \
            --cidr-block $VPC_CIDR \
            --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-vpc},{Key=CreatedBy,Value=mkurbonov}]" \
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
    fi
}

# Function to create Internet Gateway
create_internet_gateway() {
    print_info "Checking Internet Gateway..."

    # Check if IGW already exists
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-prod-igw" "Name=attachment.vpc-id,Values=$VPC_ID" \
        --query 'InternetGateways[0].InternetGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$IGW_ID" != "None" ] && [ -n "$IGW_ID" ]; then
        print_warning "Internet Gateway already exists and is attached: $IGW_ID"
    else
        IGW_ID=$(aws ec2 create-internet-gateway \
            --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-prod-igw},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'InternetGateway.InternetGatewayId' \
            --output text \
            --region $AWS_REGION)

        aws ec2 attach-internet-gateway \
            --internet-gateway-id $IGW_ID \
            --vpc-id $VPC_ID \
            --region $AWS_REGION

        print_success "Internet Gateway created and attached: $IGW_ID"
    fi
}

# Function to get or create subnet
get_or_create_subnet() {
    local SUBNET_NAME=$1
    local CIDR=$2
    local AZ=$3

    # Check if subnet exists
    SUBNET_ID=$(aws ec2 describe-subnets \
        --filters "Name=tag:Name,Values=${SUBNET_NAME}" "Name=vpc-id,Values=$VPC_ID" \
        --query 'Subnets[0].SubnetId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$SUBNET_ID" != "None" ] && [ -n "$SUBNET_ID" ]; then
        # Verify CIDR matches
        EXISTING_CIDR=$(aws ec2 describe-subnets \
            --subnet-ids $SUBNET_ID \
            --query 'Subnets[0].CidrBlock' \
            --output text \
            --region $AWS_REGION)

        if [ "$EXISTING_CIDR" != "$CIDR" ]; then
            print_error "Subnet $SUBNET_NAME has wrong CIDR: $EXISTING_CIDR (expected: $CIDR)"
            exit 1
        fi

        # Print to stderr so it doesn't pollute the return value
        print_warning "Subnet $SUBNET_NAME already exists: $SUBNET_ID" >&2
    else
        SUBNET_ID=$(aws ec2 create-subnet \
            --vpc-id $VPC_ID \
            --cidr-block $CIDR \
            --availability-zone $AZ \
            --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${SUBNET_NAME}},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'Subnet.SubnetId' \
            --output text \
            --region $AWS_REGION)
        print_success "Subnet $SUBNET_NAME created: $SUBNET_ID" >&2
    fi

    echo $SUBNET_ID
}

# Function to create subnets
create_subnets() {
    print_info "Checking subnets..."

    PUBLIC_SUBNET_1_ID=$(get_or_create_subnet "${PROJECT_NAME}-public-subnet-1" "$PUBLIC_SUBNET_1_CIDR" "${AWS_REGION}a")
    PUBLIC_SUBNET_2_ID=$(get_or_create_subnet "${PROJECT_NAME}-public-subnet-2" "$PUBLIC_SUBNET_2_CIDR" "${AWS_REGION}b")
    PRIVATE_SUBNET_1_ID=$(get_or_create_subnet "${PROJECT_NAME}-private-subnet-1" "$PRIVATE_SUBNET_1_CIDR" "${AWS_REGION}a")
    PRIVATE_SUBNET_2_ID=$(get_or_create_subnet "${PROJECT_NAME}-private-subnet-2" "$PRIVATE_SUBNET_2_CIDR" "${AWS_REGION}b")

    print_success "All subnets ready"
}

# Function to create NAT Gateways
create_nat_gateways() {
    print_info "Checking NAT Gateways..."

    # Check for existing NAT Gateway 1
    NAT_GW_1_ID=$(aws ec2 describe-nat-gateways \
        --filter "Name=tag:Name,Values=${PROJECT_NAME}-nat-gw-1" "Name=state,Values=available" "Name=subnet-id,Values=$PUBLIC_SUBNET_1_ID" \
        --query 'NatGateways[0].NatGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$NAT_GW_1_ID" != "None" ] && [ -n "$NAT_GW_1_ID" ]; then
        print_warning "NAT Gateway 1 already exists: $NAT_GW_1_ID"
    else
        print_info "Creating NAT Gateway 1..."
        # Check for existing EIP
        EIP_1=$(aws ec2 describe-addresses \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-nat-eip-1" \
            --query 'Addresses[0].AllocationId' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ "$EIP_1" = "None" ] || [ -z "$EIP_1" ]; then
            EIP_1=$(aws ec2 allocate-address \
                --domain vpc \
                --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-eip-1},{Key=CreatedBy,Value=mkurbonov}]" \
                --query 'AllocationId' \
                --output text \
                --region $AWS_REGION)
        fi

        NAT_GW_1_ID=$(aws ec2 create-nat-gateway \
            --subnet-id $PUBLIC_SUBNET_1_ID \
            --allocation-id $EIP_1 \
            --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-1},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'NatGateway.NatGatewayId' \
            --output text \
            --region $AWS_REGION)
        print_success "NAT Gateway 1 created: $NAT_GW_1_ID"
    fi

    # Check for existing NAT Gateway 2
    NAT_GW_2_ID=$(aws ec2 describe-nat-gateways \
        --filter "Name=tag:Name,Values=${PROJECT_NAME}-nat-gw-2" "Name=state,Values=available" "Name=subnet-id,Values=$PUBLIC_SUBNET_2_ID" \
        --query 'NatGateways[0].NatGatewayId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$NAT_GW_2_ID" != "None" ] && [ -n "$NAT_GW_2_ID" ]; then
        print_warning "NAT Gateway 2 already exists: $NAT_GW_2_ID"
    else
        print_info "Creating NAT Gateway 2..."
        # Check for existing EIP
        EIP_2=$(aws ec2 describe-addresses \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-nat-eip-2" \
            --query 'Addresses[0].AllocationId' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ "$EIP_2" = "None" ] || [ -z "$EIP_2" ]; then
            EIP_2=$(aws ec2 allocate-address \
                --domain vpc \
                --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-eip-2},{Key=CreatedBy,Value=mkurbonov}]" \
                --query 'AllocationId' \
                --output text \
                --region $AWS_REGION)
        fi

        NAT_GW_2_ID=$(aws ec2 create-nat-gateway \
            --subnet-id $PUBLIC_SUBNET_2_ID \
            --allocation-id $EIP_2 \
            --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-2},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'NatGateway.NatGatewayId' \
            --output text \
            --region $AWS_REGION)
        print_success "NAT Gateway 2 created: $NAT_GW_2_ID"
    fi

    print_success "NAT Gateways ready: $NAT_GW_1_ID, $NAT_GW_2_ID"
    print_info "Waiting for NAT Gateways to become available..."

    aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_1_ID --region $AWS_REGION 2>/dev/null || true
    aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_2_ID --region $AWS_REGION 2>/dev/null || true

    print_success "NAT Gateways are now available"
}

# Function to create route tables
create_route_tables() {
    print_info "Checking route tables..."

    # Check for existing public route table
    PUBLIC_RT_ID=$(aws ec2 describe-route-tables \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-public-rt" "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[0].RouteTableId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$PUBLIC_RT_ID" != "None" ] && [ -n "$PUBLIC_RT_ID" ]; then
        print_warning "Public route table already exists: $PUBLIC_RT_ID"
    else
        PUBLIC_RT_ID=$(aws ec2 create-route-table \
            --vpc-id $VPC_ID \
            --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'RouteTable.RouteTableId' \
            --output text \
            --region $AWS_REGION)
        print_success "Public route table created: $PUBLIC_RT_ID"
    fi

    # Add route to Internet Gateway (if doesn't exist)
    aws ec2 create-route \
        --route-table-id $PUBLIC_RT_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id $IGW_ID \
        --region $AWS_REGION 2>/dev/null || true

    # Associate public subnets (only if not already associated)
    aws ec2 associate-route-table \
        --route-table-id $PUBLIC_RT_ID \
        --subnet-id $PUBLIC_SUBNET_1_ID \
        --region $AWS_REGION 2>/dev/null || true

    aws ec2 associate-route-table \
        --route-table-id $PUBLIC_RT_ID \
        --subnet-id $PUBLIC_SUBNET_2_ID \
        --region $AWS_REGION 2>/dev/null || true

    # Check for existing private route table 1
    PRIVATE_RT_1_ID=$(aws ec2 describe-route-tables \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-private-rt-1" "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[0].RouteTableId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$PRIVATE_RT_1_ID" != "None" ] && [ -n "$PRIVATE_RT_1_ID" ]; then
        print_warning "Private route table 1 already exists: $PRIVATE_RT_1_ID"
    else
        PRIVATE_RT_1_ID=$(aws ec2 create-route-table \
            --vpc-id $VPC_ID \
            --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-1},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'RouteTable.RouteTableId' \
            --output text \
            --region $AWS_REGION)
        print_success "Private route table 1 created: $PRIVATE_RT_1_ID"
    fi

    aws ec2 create-route \
        --route-table-id $PRIVATE_RT_1_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --nat-gateway-id $NAT_GW_1_ID \
        --region $AWS_REGION 2>/dev/null || true

    aws ec2 associate-route-table \
        --route-table-id $PRIVATE_RT_1_ID \
        --subnet-id $PRIVATE_SUBNET_1_ID \
        --region $AWS_REGION 2>/dev/null || true

    # Check for existing private route table 2
    PRIVATE_RT_2_ID=$(aws ec2 describe-route-tables \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-private-rt-2" "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[0].RouteTableId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$PRIVATE_RT_2_ID" != "None" ] && [ -n "$PRIVATE_RT_2_ID" ]; then
        print_warning "Private route table 2 already exists: $PRIVATE_RT_2_ID"
    else
        PRIVATE_RT_2_ID=$(aws ec2 create-route-table \
            --vpc-id $VPC_ID \
            --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-2},{Key=CreatedBy,Value=mkurbonov}]" \
            --query 'RouteTable.RouteTableId' \
            --output text \
            --region $AWS_REGION)
        print_success "Private route table 2 created: $PRIVATE_RT_2_ID"
    fi

    aws ec2 create-route \
        --route-table-id $PRIVATE_RT_2_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --nat-gateway-id $NAT_GW_2_ID \
        --region $AWS_REGION 2>/dev/null || true

    aws ec2 associate-route-table \
        --route-table-id $PRIVATE_RT_2_ID \
        --subnet-id $PRIVATE_SUBNET_2_ID \
        --region $AWS_REGION 2>/dev/null || true

    print_success "Route tables ready and associated"
}

# Function to get or create security group
get_or_create_security_group() {
    local SG_NAME=$1
    local DESCRIPTION=$2

    # Check if security group exists
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=$VPC_ID" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
        print_warning "Security group $SG_NAME already exists: $SG_ID" >&2
    else
        SG_ID=$(aws ec2 create-security-group \
            --group-name ${SG_NAME} \
            --description "$DESCRIPTION" \
            --vpc-id $VPC_ID \
            --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${SG_NAME},{Key=CreatedBy,Value=mkurbonov}}]" \
            --query 'GroupId' \
            --output text \
            --region $AWS_REGION)
        print_success "Security group $SG_NAME created: $SG_ID" >&2
    fi

    echo $SG_ID
}

# Function to add ingress rule if it doesn't exist
add_sg_rule_if_not_exists() {
    local SG_ID=$1
    local PROTOCOL=$2
    local PORT=$3
    local SOURCE=$4
    local SOURCE_TYPE=$5  # "cidr" or "sg"

    # Check if rule already exists
    if [ "$SOURCE_TYPE" = "cidr" ]; then
        EXISTING=$(aws ec2 describe-security-groups \
            --group-ids $SG_ID \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`$PORT\` && ToPort==\`$PORT\` && IpProtocol==\`$PROTOCOL\`].IpRanges[?CidrIp==\`$SOURCE\`] | [0]" \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ -z "$EXISTING" ] || [ "$EXISTING" = "None" ]; then
            aws ec2 authorize-security-group-ingress \
                --group-id $SG_ID \
                --protocol $PROTOCOL \
                --port $PORT \
                --cidr $SOURCE \
                --region $AWS_REGION 2>/dev/null || print_warning "Rule already exists or failed to add"
        fi
    else
        EXISTING=$(aws ec2 describe-security-groups \
            --group-ids $SG_ID \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`$PORT\` && ToPort==\`$PORT\` && IpProtocol==\`$PROTOCOL\`].UserIdGroupPairs[?GroupId==\`$SOURCE\`] | [0]" \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ -z "$EXISTING" ] || [ "$EXISTING" = "None" ]; then
            aws ec2 authorize-security-group-ingress \
                --group-id $SG_ID \
                --protocol $PROTOCOL \
                --port $PORT \
                --source-group $SOURCE \
                --region $AWS_REGION 2>/dev/null || print_warning "Rule already exists or failed to add"
        fi
    fi
}

# Function to create security groups
create_security_groups() {
    print_info "Checking security groups..."

    # ALB Security Group
    ALB_SG_ID=$(get_or_create_security_group "${PROJECT_NAME}-prod-alb-sg" "Security group for ALB")
    add_sg_rule_if_not_exists $ALB_SG_ID "tcp" 80 "0.0.0.0/0" "cidr"
    add_sg_rule_if_not_exists $ALB_SG_ID "tcp" 443 "0.0.0.0/0" "cidr"

    # ECS Security Group
    ECS_SG_ID=$(get_or_create_security_group "${PROJECT_NAME}-prod-ecs-sg" "Security group for ECS tasks")
    add_sg_rule_if_not_exists $ECS_SG_ID "tcp" 8080 $ALB_SG_ID "sg"

    # DocumentDB Security Group
    DOCDB_SG_ID=$(get_or_create_security_group "${PROJECT_NAME}-prod-docdb-sg" "Security group for DocumentDB")
    add_sg_rule_if_not_exists $DOCDB_SG_ID "tcp" 27017 $ECS_SG_ID "sg"

    print_success "Security groups ready: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID, DocumentDB=$DOCDB_SG_ID"
}

# Function to create or update a secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $AWS_REGION &>/dev/null; then
        # Check if it's scheduled for deletion
        DELETION_DATE=$(aws secretsmanager describe-secret \
            --secret-id "$SECRET_NAME" \
            --query 'DeletedDate' \
            --output text \
            --region $AWS_REGION 2>/dev/null)

        if [ "$DELETION_DATE" != "None" ] && [ -n "$DELETION_DATE" ]; then
            print_warning "Secret $SECRET_NAME is scheduled for deletion, restoring it..."
            aws secretsmanager restore-secret \
                --secret-id "$SECRET_NAME" \
                --region $AWS_REGION
        fi

        # Update existing secret
        aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE" \
            --region $AWS_REGION &>/dev/null
        print_info "Updated existing secret: $SECRET_NAME"
    else
        # Create new secret
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE" \
            --region $AWS_REGION &>/dev/null
        print_success "Created secret: $SECRET_NAME"
    fi
}

# Function to create DocumentDB
create_documentdb() {
    print_info "Checking DocumentDB cluster..."

    # Check if cluster already exists
    if aws docdb describe-db-clusters \
        --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
        --region $AWS_REGION &>/dev/null; then

        print_warning "DocumentDB cluster already exists, skipping creation..."

        # Get existing cluster endpoint
        DOCDB_ENDPOINT=$(aws docdb describe-db-clusters \
            --db-cluster-identifier ${PROJECT_NAME}-prod-docdb-cluster \
            --query 'DBClusters[0].Endpoint' \
            --output text \
            --region $AWS_REGION)

        print_success "Using existing DocumentDB: $DOCDB_ENDPOINT"

        # Try to get password from Secrets Manager
        # First check if secret exists and restore if needed
        if aws secretsmanager describe-secret --secret-id ${PROJECT_NAME}/prod/db-master-password --region $AWS_REGION &>/dev/null; then
            DELETION_DATE=$(aws secretsmanager describe-secret \
                --secret-id ${PROJECT_NAME}/prod/db-master-password \
                --query 'DeletedDate' \
                --output text \
                --region $AWS_REGION 2>/dev/null)

            if [ "$DELETION_DATE" != "None" ] && [ -n "$DELETION_DATE" ]; then
                print_warning "DB password secret is scheduled for deletion, restoring it..."
                aws secretsmanager restore-secret \
                    --secret-id ${PROJECT_NAME}/prod/db-master-password \
                    --region $AWS_REGION
            fi

            DB_PASSWORD=$(aws secretsmanager get-secret-value \
                --secret-id ${PROJECT_NAME}/prod/db-master-password \
                --query 'SecretString' \
                --output text \
                --region $AWS_REGION 2>/dev/null || echo "")
        else
            DB_PASSWORD=""
        fi

        if [ -z "$DB_PASSWORD" ]; then
            print_warning "Could not retrieve existing DB password. If you need to update it, do so manually."
            # Use a placeholder for the URI
            MONGODB_URI="mongodb://hotelxadmin:YOUR_PASSWORD@${DOCDB_ENDPOINT}:27017/?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false&authSource=admin"
        else
            MONGODB_URI="mongodb://hotelxadmin:${DB_PASSWORD}@${DOCDB_ENDPOINT}:27017/?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false&authSource=admin"
            create_or_update_secret "${PROJECT_NAME}/prod/documentdb-connection-uri" "$MONGODB_URI"
        fi

        return
    fi

    print_info "Creating DocumentDB cluster (this will take several minutes)..."

    # Check if subnet group exists
    if aws docdb describe-db-subnet-groups \
        --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
        --region $AWS_REGION &>/dev/null; then
        print_warning "DB subnet group already exists, reusing..."
    else
        # Create subnet group
        aws docdb create-db-subnet-group \
            --db-subnet-group-name ${PROJECT_NAME}-docdb-subnet-group \
            --db-subnet-group-description "Subnet group for DocumentDB" \
            --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-docdb-subnet-group Key=CreatedBy,Value=mkurbonov \
            --region $AWS_REGION
        print_success "DB subnet group created"
    fi

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
        --tags Key=Name,Value=${PROJECT_NAME}-prod-docdb-cluster Key=CreatedBy,Value=mkurbonov \
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
        --tags Key=Name,Value=${PROJECT_NAME}-prod-docdb-instance Key=CreatedBy,Value=mkurbonov \
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
    create_or_update_secret "${PROJECT_NAME}/prod/db-master-password" "$DB_PASSWORD"
    create_or_update_secret "${PROJECT_NAME}/prod/documentdb-connection-uri" "$MONGODB_URI"

    print_success "DocumentDB credentials stored in Secrets Manager"
}

# Function to create ECR repositories
create_ecr_repositories() {
    print_info "Checking ECR repositories..."

    # Backend repository
    if aws ecr describe-repositories \
        --repository-names ${PROJECT_NAME}-backend \
        --region $AWS_REGION &>/dev/null; then
        print_warning "Backend ECR repository already exists, reusing..."
        BACKEND_REPO_URI=$(aws ecr describe-repositories \
            --repository-names ${PROJECT_NAME}-backend \
            --query 'repositories[0].repositoryUri' \
            --output text \
            --region $AWS_REGION)
    else
        BACKEND_REPO_URI=$(aws ecr create-repository \
            --repository-name ${PROJECT_NAME}-backend \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags Key=Name,Value=${PROJECT_NAME}-backend Key=CreatedBy,Value=mkurbonov \
            --query 'repository.repositoryUri' \
            --output text \
            --region $AWS_REGION)
        print_success "Backend ECR repository created"
    fi

    # Frontend repository
    if aws ecr describe-repositories \
        --repository-names ${PROJECT_NAME}-frontend \
        --region $AWS_REGION &>/dev/null; then
        print_warning "Frontend ECR repository already exists, reusing..."
        FRONTEND_REPO_URI=$(aws ecr describe-repositories \
            --repository-names ${PROJECT_NAME}-frontend \
            --query 'repositories[0].repositoryUri' \
            --output text \
            --region $AWS_REGION)
    else
        FRONTEND_REPO_URI=$(aws ecr create-repository \
            --repository-name ${PROJECT_NAME}-frontend \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags Key=Name,Value=${PROJECT_NAME}-frontend Key=CreatedBy,Value=mkurbonov \
            --query 'repository.repositoryUri' \
            --output text \
            --region $AWS_REGION)
        print_success "Frontend ECR repository created"
    fi

    print_success "ECR repositories ready: $BACKEND_REPO_URI, $FRONTEND_REPO_URI"
}

# Function to create ECS cluster
create_ecs_cluster() {
    print_info "Checking ECS cluster..."

    # Check if cluster exists
    if aws ecs describe-clusters \
        --clusters ${PROJECT_NAME}-prod-cluster \
        --region $AWS_REGION \
        --query 'clusters[0].status' \
        --output text 2>/dev/null | grep -q "ACTIVE"; then
        print_warning "ECS cluster already exists, reusing..."
    else
        aws ecs create-cluster \
            --cluster-name ${PROJECT_NAME}-prod-cluster \
            --capacity-providers FARGATE FARGATE_SPOT \
            --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
            --settings name=containerInsights,value=enabled \
            --tags key=Name,value=${PROJECT_NAME}-prod-cluster key=CreatedBy,value=mkurbonov \
            --region $AWS_REGION
        print_success "ECS cluster created"
    fi

    print_success "ECS cluster ready: ${PROJECT_NAME}-prod-cluster"
}

# Function to create Application Load Balancer
create_alb() {
    print_info "Checking Application Load Balancer..."

    # Check if ALB exists
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names ${PROJECT_NAME}-alb \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "" ]; then
        print_warning "ALB already exists"
        ALB_DNS=$(aws elbv2 describe-load-balancers \
            --load-balancer-arns $ALB_ARN \
            --query 'LoadBalancers[0].DNSName' \
            --output text \
            --region $AWS_REGION)
        print_success "Using existing ALB: $ALB_DNS"
    else
        print_info "Creating ALB..."
        ALB_ARN=$(aws elbv2 create-load-balancer \
            --name ${PROJECT_NAME}-alb \
            --subnets $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID \
            --security-groups $ALB_SG_ID \
            --scheme internet-facing \
            --type application \
            --ip-address-type ipv4 \
            --tags Key=Name,Value=${PROJECT_NAME}-alb Key=CreatedBy,Value=mkurbonov \
            --query 'LoadBalancers[0].LoadBalancerArn' \
            --output text \
            --region $AWS_REGION)

        ALB_DNS=$(aws elbv2 describe-load-balancers \
            --load-balancer-arns $ALB_ARN \
            --query 'LoadBalancers[0].DNSName' \
            --output text \
            --region $AWS_REGION)
        print_success "ALB created: $ALB_DNS"
    fi

    # Check if target group exists and is in the correct VPC
    TG_INFO=$(aws elbv2 describe-target-groups \
        --names ${PROJECT_NAME}-backend-tg \
        --query 'TargetGroups[0].[TargetGroupArn,VpcId]' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ -n "$TG_INFO" ]; then
        TARGET_GROUP_ARN=$(echo "$TG_INFO" | awk '{print $1}')
        TG_VPC_ID=$(echo "$TG_INFO" | awk '{print $2}')

        if [ "$TG_VPC_ID" = "$VPC_ID" ]; then
            print_warning "Target group already exists in correct VPC"
        else
            print_warning "Target group exists but in different VPC ($TG_VPC_ID), deleting it..."
            aws elbv2 delete-target-group \
                --target-group-arn $TARGET_GROUP_ARN \
                --region $AWS_REGION 2>/dev/null || true
            sleep 2
            TARGET_GROUP_ARN=""
        fi
    fi

    if [ -z "$TARGET_GROUP_ARN" ]; then
        print_info "Creating target group..."
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
            --tags Key=Name,Value=${PROJECT_NAME}-backend-tg Key=CreatedBy,Value=mkurbonov \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text \
            --region $AWS_REGION)
        print_success "Target group created"
    fi

    # Check if listener exists
    LISTENER_ARN=$(aws elbv2 describe-listeners \
        --load-balancer-arn $ALB_ARN \
        --query 'Listeners[?Port==`80`].ListenerArn | [0]' \
        --output text \
        --region $AWS_REGION 2>/dev/null)

    if [ "$LISTENER_ARN" != "None" ] && [ -n "$LISTENER_ARN" ] && [ "$LISTENER_ARN" != "" ]; then
        print_warning "ALB listener already exists"
    else
        print_info "Creating ALB listener..."
        aws elbv2 create-listener \
            --load-balancer-arn $ALB_ARN \
            --protocol HTTP \
            --port 80 \
            --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
            --region $AWS_REGION >/dev/null
        print_success "Listener created"
    fi

    print_success "ALB ready: $ALB_DNS"
}

# Function to create S3 bucket for frontend
create_s3_bucket() {
    print_info "Checking S3 bucket for frontend..."

    BUCKET_NAME="${PROJECT_NAME}-frontend-${AWS_REGION}"

    # Check if bucket exists
    if aws s3api head-bucket --bucket $BUCKET_NAME --region $AWS_REGION 2>/dev/null; then
        print_warning "S3 bucket already exists: $BUCKET_NAME"
    else
        print_info "Creating S3 bucket..."
        aws s3api create-bucket \
            --bucket $BUCKET_NAME \
            --region $AWS_REGION 2>/dev/null || print_warning "Bucket may already exist"

        # Add tags to bucket
        aws s3api put-bucket-tagging \
            --bucket $BUCKET_NAME \
            --tagging "TagSet=[{Key=Name,Value=${BUCKET_NAME}},{Key=CreatedBy,Value=mkurbonov}]" \
            --region $AWS_REGION 2>/dev/null || true
        print_success "S3 bucket created"
    fi

    # Configure for static website hosting
    aws s3 website s3://$BUCKET_NAME/ \
        --index-document index.html \
        --error-document index.html 2>/dev/null || true

    # Try to disable block public access (may fail due to account-level policies)
    aws s3api put-public-access-block \
        --bucket $BUCKET_NAME \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>/dev/null || print_warning "Could not disable public access block - may be blocked by account policy"

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
        --policy file:///tmp/bucket-policy.json 2>/dev/null || print_warning "Could not set bucket policy - public access may be blocked"

    rm /tmp/bucket-policy.json

    S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

    print_success "S3 bucket ready: $BUCKET_NAME"
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

    # Get the ARN and add tags
    FRONTEND_CF_ARN=$(aws cloudfront get-distribution \
        --id $FRONTEND_CF_ID \
        --query 'Distribution.ARN' \
        --output text \
        --region $AWS_REGION)

    aws cloudfront tag-resource \
        --resource $FRONTEND_CF_ARN \
        --tags "Items=[{Key=Name,Value=hotelx-frontend-cf},{Key=CreatedBy,Value=mkurbonov}]" \
        --region $AWS_REGION 2>/dev/null || true

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

    # Get the ARN and add tags
    BACKEND_CF_ARN=$(aws cloudfront get-distribution \
        --id $BACKEND_CF_ID \
        --query 'Distribution.ARN' \
        --output text \
        --region $AWS_REGION)

    aws cloudfront tag-resource \
        --resource $BACKEND_CF_ARN \
        --tags "Items=[{Key=Name,Value=hotelx-backend-cf},{Key=CreatedBy,Value=mkurbonov}]" \
        --region $AWS_REGION 2>/dev/null || true

    rm /tmp/cf-backend.json

    print_success "Backend CloudFront distribution created: https://$BACKEND_CF_DOMAIN"
}

# Function to create secrets in Secrets Manager
create_secrets() {
    print_info "Creating application secrets..."

    # Generate JWT secret (only if creating new)
    if ! aws secretsmanager describe-secret --secret-id ${PROJECT_NAME}/jwt-secret --region $AWS_REGION &>/dev/null; then
        JWT_SECRET=$(openssl rand -base64 64)
    else
        JWT_SECRET=$(aws secretsmanager get-secret-value \
            --secret-id ${PROJECT_NAME}/jwt-secret \
            --query 'SecretString' \
            --output text \
            --region $AWS_REGION 2>/dev/null || openssl rand -base64 64)
    fi
    create_or_update_secret "${PROJECT_NAME}/jwt-secret" "$JWT_SECRET"

    # Placeholder secrets (you'll need to update these with real values)
    create_or_update_secret "${PROJECT_NAME}/stripe-api-key" "sk_test_REPLACE_WITH_YOUR_STRIPE_KEY"
    create_or_update_secret "${PROJECT_NAME}/stripe-webhook-secret" "whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET"
    create_or_update_secret "${PROJECT_NAME}/google-client-id" "REPLACE_WITH_GOOGLE_CLIENT_ID"
    create_or_update_secret "${PROJECT_NAME}/google-client-secret" "REPLACE_WITH_GOOGLE_CLIENT_SECRET"
    create_or_update_secret "${PROJECT_NAME}/okta-client-id" "REPLACE_WITH_OKTA_CLIENT_ID"
    create_or_update_secret "${PROJECT_NAME}/okta-client-secret" "REPLACE_WITH_OKTA_CLIENT_SECRET"
    create_or_update_secret "${PROJECT_NAME}/okta-issuer-uri" "https://dev-XXXXXXXX.okta.com/oauth2/default"
    create_or_update_secret "${PROJECT_NAME}/backend-url" "https://${BACKEND_CF_DOMAIN}"
    create_or_update_secret "${PROJECT_NAME}/frontend-url" "https://${FRONTEND_CF_DOMAIN}"

    print_success "Secrets created/updated in Secrets Manager"
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

# Function to create ECS task definition and service
create_ecs_backend_service() {
    print_info "Creating ECS backend task definition and service..."

    # Check if we have the aws/task-definition.json file
    if [ ! -f "aws/task-definition.json" ]; then
        print_warning "Task definition file not found at aws/task-definition.json"
        print_warning "Skipping ECS service creation. You'll need to deploy via GitHub Actions."
        return
    fi

    # Create a temporary task definition with account ID substituted
    cat aws/task-definition.json | sed "s/\${AWS_ACCOUNT_ID}/$AWS_ACCOUNT_ID/g" > /tmp/task-definition-temp.json

    # Check if task definition family exists
    EXISTING_TASK_DEF=$(aws ecs describe-task-definition \
        --task-definition hotelx-backend \
        --region $AWS_REGION \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text 2>/dev/null)

    if [ "$EXISTING_TASK_DEF" != "None" ] && [ -n "$EXISTING_TASK_DEF" ] && [ "$EXISTING_TASK_DEF" != "" ]; then
        print_warning "Task definition family 'hotelx-backend' already exists"
        print_info "Latest version: $EXISTING_TASK_DEF"
    else
        print_info "Registering initial task definition..."

        # Register the task definition (this will fail initially because there's no Docker image yet)
        # We'll create a placeholder task definition that GitHub Actions will update
        TASK_DEF_ARN=$(aws ecs register-task-definition \
            --cli-input-json file:///tmp/task-definition-temp.json \
            --region $AWS_REGION \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text 2>/dev/null)

        if [ -n "$TASK_DEF_ARN" ]; then
            print_success "Task definition registered: $TASK_DEF_ARN"
        else
            print_warning "Could not register task definition (this is normal if no Docker image exists yet)"
            print_info "GitHub Actions will register the task definition on first deployment"
            rm /tmp/task-definition-temp.json
            return
        fi
    fi

    rm /tmp/task-definition-temp.json

    # Check if service already exists
    EXISTING_SERVICE=$(aws ecs describe-services \
        --cluster ${PROJECT_NAME}-prod-cluster \
        --services hotelx-backend-service \
        --region $AWS_REGION \
        --query 'services[0].status' \
        --output text 2>/dev/null)

    if [ "$EXISTING_SERVICE" = "ACTIVE" ]; then
        print_warning "ECS service 'hotelx-backend-service' already exists and is ACTIVE"
        return
    elif [ "$EXISTING_SERVICE" = "DRAINING" ]; then
        print_warning "ECS service 'hotelx-backend-service' exists but is DRAINING"
        return
    fi

    # Only create service if we successfully registered a task definition
    if [ -z "$TASK_DEF_ARN" ]; then
        print_info "Skipping service creation (no task definition available)"
        print_info "Deploy via GitHub Actions to create the service"
        return
    fi

    print_info "Creating ECS service..."

    # Create the service
    SERVICE_ARN=$(aws ecs create-service \
        --cluster ${PROJECT_NAME}-prod-cluster \
        --service-name hotelx-backend-service \
        --task-definition hotelx-backend \
        --desired-count 1 \
        --launch-type FARGATE \
        --platform-version LATEST \
        --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_1_ID,$PRIVATE_SUBNET_2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=DISABLED}" \
        --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=hotelx-backend,containerPort=8080" \
        --health-check-grace-period-seconds 60 \
        --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
        --enable-execute-command \
        --tags key=Name,value=hotelx-backend-service key=CreatedBy,value=mkurbonov \
        --region $AWS_REGION \
        --query 'service.serviceArn' \
        --output text 2>/dev/null)

    if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
        print_success "ECS service created: $SERVICE_ARN"
        print_info "Service will start once a Docker image is deployed via GitHub Actions"
    else
        print_warning "Could not create ECS service"
        print_info "This is normal if no Docker image exists in ECR yet"
        print_info "GitHub Actions will create/update the service on first deployment"
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
    echo "   - ${PROJECT_NAME}/google-client-id"
    echo "   - ${PROJECT_NAME}/google-client-secret"
    echo "   - ${PROJECT_NAME}/okta-client-id"
    echo "   - ${PROJECT_NAME}/okta-client-secret"
    echo "   - ${PROJECT_NAME}/okta-issuer-uri"
    echo ""
    echo "2. Configure GitHub Secrets:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo "   - AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
    echo "   - BACKEND_API_URL=https://$BACKEND_CF_DOMAIN"
    echo "   - CLOUDFRONT_DISTRIBUTION_ID=$FRONTEND_CF_ID"
    echo "   - STRIPE_PUBLIC_KEY"
    echo ""
    echo "3. Deploy the application:"
    echo "   - Push code to main branch to trigger GitHub Actions"
    echo "   - OR manually build and push Docker images:"
    echo "     Backend: $BACKEND_REPO_URI"
    echo "     Frontend: $FRONTEND_REPO_URI"
    echo ""
    echo "💾 Full configuration saved to: infrastructure-config.txt"
    echo ""
    print_warning "Note: CloudFront distributions can take 15-20 minutes to fully deploy"
    print_info "The ECS service will be created/updated when you deploy via GitHub Actions"
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
    echo "  - ECS Task Definition and Service (if Docker image available)"
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
    create_ecs_backend_service
    save_configuration
    print_summary
}

# Run main function
main
