#!/usr/bin/env python3
import sys

def redact_secret(data):
    secret = b"sk_test_51SUtdlFqT72Uaf78eyRTSooFdiEJbddmWPRHSYgnrDc1PCEvVgtrrrG1Y1PmDink3idKNUirz3mJAsMzEioClsDc00qF40fa7T"
    redacted = b"REDACTED_STRIPE_SECRET"
    return data.replace(secret, redacted)

def blob_callback(blob):
    blob.data = redact_secret(blob.data)
    return blob
