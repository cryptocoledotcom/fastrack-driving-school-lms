#!/usr/bin/env python3
import re

def filter_content(content):
    """Remove Stripe secret key from file content"""
    # Remove the line with VITE_STRIPE_SECRET_KEY
    secret_key = r"VITE_STRIPE_SECRET_KEY=sk_test_[^\n]*"
    content = re.sub(secret_key, "", content)
    
    # Also handle any remaining instances of the actual key
    content = content.replace("sk_test_51SUtdlFqT72Uaf78eyRTSooFdiEJbddmWPRHSYgnrDc1PCEvVgtrrrG1Y1PmDink3idKNUirz3mJAsMzEioClsDc00qF40fa7T", "REDACTED")
    
    return content.encode('utf-8')

def blob_callback(blob):
    """Process blob to remove secrets"""
    blob.data = filter_content(blob.data.decode('utf-8', errors='ignore'))
    return blob
