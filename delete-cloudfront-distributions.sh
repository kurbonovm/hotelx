#!/bin/bash

# Script to delete CloudFront distributions
# Run this after distributions have finished deploying in disabled state

AWS_REGION="us-east-1"

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

# Get all hotelx distributions
DISTRIBUTION_IDS=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Comment, 'hotelx')].Id" \
    --output text \
    --region $AWS_REGION)

if [ -z "$DISTRIBUTION_IDS" ]; then
    print_info "No hotelx CloudFront distributions found"
    exit 0
fi

print_info "Found CloudFront distributions to delete:"
echo "$DISTRIBUTION_IDS"
echo ""

for DIST_ID in $DISTRIBUTION_IDS; do
    print_info "Processing distribution: $DIST_ID"

    # Get distribution status and enabled state
    DIST_INFO=$(aws cloudfront get-distribution \
        --id $DIST_ID \
        --region $AWS_REGION \
        --query '[Distribution.Status, Distribution.DistributionConfig.Enabled]' \
        --output text 2>/dev/null)

    if [ -z "$DIST_INFO" ]; then
        print_warning "Could not get info for distribution $DIST_ID (may already be deleted)"
        continue
    fi

    STATUS=$(echo "$DIST_INFO" | awk '{print $1}')
    ENABLED=$(echo "$DIST_INFO" | awk '{print $2}')

    print_info "Status: $STATUS, Enabled: $ENABLED"

    # Check if distribution is deployed and disabled
    if [ "$STATUS" = "Deployed" ] && [ "$ENABLED" = "False" ]; then
        print_info "Distribution is ready to delete"

        # Get ETag for deletion
        ETAG=$(aws cloudfront get-distribution \
            --id $DIST_ID \
            --query 'ETag' \
            --output text \
            --region $AWS_REGION)

        # Delete the distribution
        print_warning "Deleting distribution $DIST_ID..."
        if aws cloudfront delete-distribution \
            --id $DIST_ID \
            --if-match "$ETAG" \
            --region $AWS_REGION 2>/dev/null; then
            print_success "Distribution $DIST_ID deleted successfully"
        else
            print_error "Failed to delete distribution $DIST_ID"
        fi
    elif [ "$STATUS" = "InProgress" ]; then
        print_warning "Distribution $DIST_ID is still deploying. Please wait and try again later."
        print_info "You can check status with: aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.Status'"
    elif [ "$ENABLED" = "True" ]; then
        print_error "Distribution $DIST_ID is still enabled. It must be disabled first."
        print_info "Run the cleanup script or manually disable it first"
    else
        print_warning "Distribution $DIST_ID is in unexpected state: Status=$STATUS, Enabled=$ENABLED"
    fi

    echo ""
done

print_info "Done processing CloudFront distributions"
