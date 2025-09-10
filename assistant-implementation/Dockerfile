# FastAPI Nova Sonic Assistant - BIDIRECTIONAL STREAMING ONLY
# Python 3.12 REQUIRED for experimental SDK
# NO CONVERSE API - ONLY BIDIRECTIONAL

FROM python:3.12-slim

# Environment variables para garantizar comportamiento correcto
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NOVA_MODE=bidirectional_stream \
    DISABLE_CONVERSE=true

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# CRITICAL: Install Python dependencies
# The experimental SDK is MANDATORY for bidirectional streaming
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install --no-cache-dir -r requirements.txt && \
    # VERIFY SDK installation - fail if not present
    python3 -c "import aws_sdk_bedrock_runtime; print('✅ SDK experimental installed')" && \
    python3 -c "from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient; print('✅ BedrockRuntimeClient available')" && \
    python3 -c "print('✅ BIDIRECTIONAL STREAMING READY')"

# Copy application code
COPY . .

# Verify nova_sonic_service loads correctly
RUN python3 -c "from nova_sonic_service import NovaSonicOfficialClient; print('✅ Nova Sonic service loads correctly')"

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run with optimized settings for production
# NO WORKERS - bidirectional streaming requires single process
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--loop", "uvloop", \
     "--ws", "websockets", \
     "--ws-max-size", "10485760", \
     "--log-level", "info", \
     "--access-log", \
     "--use-colors"]