#!/bin/bash

# Script to recreate CloudFront distributions for HotelX
# This will create fresh distributions to resolve caching issues

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

AWS_REGION="us-east-1"
PROJECT_NAME="hotelx"

# Get required resources
print_info "Fetching existing AWS resources..."

# Get S3 bucket
S3_BUCKET=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'hotelx-frontend')].Name" --output text --region $AWS_REGION)
if [ -z "$S3_BUCKET" ]; then
    print_error "Frontend S3 bucket not found"
    exit 1
fi
print_success "Found S3 bucket: $S3_BUCKET"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --query "LoadBalancers[?contains(LoadBalancerName, 'hotelx')].DNSName" \
    --output text \
    --region $AWS_REGION)
if [ -z "$ALB_DNS" ]; then
    print_error "Application Load Balancer not found"
    exit 1
fi
print_success "Found ALB: $ALB_DNS"

# Create Frontend CloudFront Distribution
print_info "Creating frontend CloudFront distribution..."

cat > /tmp/cf-frontend.json <<EOF
{
  "Comment": "HotelX Frontend Distribution - $(date +%Y%m%d-%H%M%S)",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${S3_BUCKET}",
        "DomainName": "${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${S3_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "CallerReference": "hotelx-frontend-$(date +%s)"
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

print_success "Frontend CloudFront created: https://$FRONTEND_CF_DOMAIN"
print_success "Distribution ID: $FRONTEND_CF_ID"

# Create Backend CloudFront Distribution
print_info "Creating backend CloudFront distribution..."

cat > /tmp/cf-backend.json <<EOF
{
  "Comment": "HotelX Backend API Distribution - $(date +%Y%m%d-%H%M%S)",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "ALB-${PROJECT_NAME}",
        "DomainName": "${ALB_DNS}",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-${PROJECT_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": { "Forward": "all" },
      "Headers": {
        "Quantity": 4,
        "Items": ["Authorization", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0,
    "Compress": true
  },
  "CallerReference": "hotelx-backend-$(date +%s)"
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

print_success "Backend CloudFront created: https://$BACKEND_CF_DOMAIN"
print_success "Distribution ID: $BACKEND_CF_ID"

# Summary
echo ""
print_info "======================================="
print_info "CloudFront Distributions Created"
print_info "======================================="
echo ""
echo "Frontend:"
echo "  URL: https://$FRONTEND_CF_DOMAIN"
echo "  Distribution ID: $FRONTEND_CF_ID"
echo ""
echo "Backend:"
echo "  URL: https://$BACKEND_CF_DOMAIN"
echo "  Distribution ID: $BACKEND_CF_ID"
echo ""
print_warning "IMPORTANT: Update the following GitHub secrets:"
echo "  gh secret set CLOUDFRONT_DISTRIBUTION_ID -b \"$FRONTEND_CF_ID\""
echo "  gh secret set BACKEND_API_URL -b \"https://$BACKEND_CF_DOMAIN/api\""
echo ""
print_warning "CloudFront distributions take 10-15 minutes to fully deploy."
print_warning "Wait for 'Deployed' status before testing."
echo ""

# Cleanup
rm -f /tmp/cf-frontend.json /tmp/cf-backend.json
