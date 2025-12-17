#!/usr/bin/env python3

def blob_callback(blob):
    secret = b"sk_test_51SUtdlFqT72Uaf78eyRTSooFdiEJbddmWPRHSYgnrDc1PCEvVgtrrrG1Y1PmDink3idKNUirz3mJAsMzEioClsDc00qF40fa7T"
    replacement = b"REDACTED_STRIPE_SECRET_KEY"
    
    if secret in blob.data:
        blob.data = blob.data.replace(secret, replacement)
    
    return blob
