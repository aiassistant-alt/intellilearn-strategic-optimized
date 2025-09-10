#!/usr/bin/env python3
"""
Test to check what happens when importing nova_sonic_service
"""

import sys
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("=" * 60)
print("IMPORT CHECK TEST")
print("=" * 60)

print(f"\nPython version: {sys.version}")

# Try to import the experimental SDK
try:
    print("\n1. Testing experimental SDK import...")
    from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient
    print("✅ SDK experimental imported successfully")
    SDK_AVAILABLE = True
except ImportError as e:
    print(f"❌ SDK import failed: {e}")
    SDK_AVAILABLE = False

# Try to import the nova_sonic_service
try:
    print("\n2. Testing nova_sonic_service import...")
    from nova_sonic_service import NovaSonicOfficialClient
    print("✅ NovaSonicOfficialClient imported successfully")
    
    # Check what methods it has
    client = NovaSonicOfficialClient()
    print("\n3. Available methods:")
    for method in dir(client):
        if not method.startswith('_'):
            print(f"   - {method}")
    
    # Check specific methods
    print("\n4. Method checks:")
    print(f"   - Has process_audio_simple: {hasattr(client, 'process_audio_simple')}")
    print(f"   - Has process_audio: {hasattr(client, 'process_audio')}")
    
except ImportError as e:
    print(f"❌ nova_sonic_service import failed: {e}")
except Exception as e:
    print(f"❌ Error creating client: {e}")

print("\n" + "=" * 60)
print(f"SDK Available: {SDK_AVAILABLE}")
print("=" * 60)