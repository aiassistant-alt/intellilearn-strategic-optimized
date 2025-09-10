"""
AWS Cognito JWT Token Validation
"""

import json
import time
from typing import Optional, Dict
import logging
from jose import jwk, jwt
from jose.utils import base64url_decode
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class CognitoTokenValidator:
    """Validates JWT tokens from AWS Cognito"""
    
    def __init__(self, user_pool_id: str, region: str, client_id: str):
        self.user_pool_id = user_pool_id
        self.region = region
        self.client_id = client_id
        self.jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
        self.issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
        self.jwks = None
        self.jwks_client = None
        self._fetch_jwks()
    
    def _fetch_jwks(self):
        """Fetch JSON Web Key Set from Cognito"""
        try:
            import urllib.request
            with urllib.request.urlopen(self.jwks_url) as response:
                self.jwks = json.loads(response.read())
            logger.info(f"✅ Fetched JWKS from Cognito: {self.jwks_url}")
        except Exception as e:
            logger.error(f"❌ Failed to fetch JWKS: {e}")
            self.jwks = {"keys": []}
    
    def _get_key(self, token: str) -> Optional[Dict]:
        """Get the signing key for the token"""
        try:
            # Get the kid from the token header
            headers = jwt.get_unverified_header(token)
            kid = headers.get('kid')
            
            if not kid:
                logger.error("No kid found in token header")
                return None
            
            # Find the key in JWKS
            for key in self.jwks.get('keys', []):
                if key.get('kid') == kid:
                    return key
            
            logger.error(f"Key {kid} not found in JWKS")
            return None
            
        except Exception as e:
            logger.error(f"Error getting key: {e}")
            return None
    
    def validate_token(self, token: str) -> Optional[Dict]:
        """Validate a Cognito JWT token"""
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Get the signing key
            key = self._get_key(token)
            if not key:
                logger.error("Could not find signing key")
                return None
            
            # Construct the public key
            public_key = jwk.construct(key)
            
            # Decode and verify the token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                issuer=self.issuer,
                audience=self.client_id,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "require_exp": True,
                    "require_iat": True
                }
            )
            
            # Additional Cognito-specific validations
            token_use = payload.get('token_use')
            if token_use not in ['id', 'access']:
                logger.error(f"Invalid token_use: {token_use}")
                return None
            
            # Check if token is expired
            exp = payload.get('exp', 0)
            if exp < time.time():
                logger.error("Token is expired")
                return None
            
            logger.info(f"✅ Token validated for user: {payload.get('sub', 'unknown')}")
            
            return {
                "user_id": payload.get('sub'),
                "email": payload.get('email'),
                "username": payload.get('cognito:username', payload.get('username')),
                "groups": payload.get('cognito:groups', []),
                "token_use": token_use,
                "exp": exp
            }
            
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.JWTClaimsError as e:
            logger.error(f"Invalid claims: {e}")
            return None
        except jwt.JWTError as e:
            logger.error(f"JWT validation error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error validating token: {e}")
            return None
    
    def verify_access_token(self, token: str) -> bool:
        """Quick check if access token is valid"""
        result = self.validate_token(token)
        return result is not None and result.get('token_use') == 'access'
    
    def verify_id_token(self, token: str) -> bool:
        """Quick check if ID token is valid"""
        result = self.validate_token(token)
        return result is not None and result.get('token_use') == 'id'

# Singleton instance
_validator = None

def get_validator(user_pool_id: str, region: str, client_id: str) -> CognitoTokenValidator:
    """Get or create the Cognito token validator"""
    global _validator
    if _validator is None:
        _validator = CognitoTokenValidator(user_pool_id, region, client_id)
    return _validator