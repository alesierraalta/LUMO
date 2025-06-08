FROM node:20 AS agent

# Install development dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    openssl \
    ca-certificates \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages useful for development
RUN npm install -g npm@latest typescript ts-node prisma

# Create non-root user
RUN groupadd --gid 1001 ubuntu
RUN useradd --uid 1001 --gid ubuntu --shell /bin/bash --create-home ubuntu

# Set working directory to home directory
WORKDIR /home/ubuntu

# Set proper permissions
RUN chown -R ubuntu:ubuntu /home/ubuntu
USER ubuntu

# Configure git
RUN git config --global init.defaultBranch main && \
    git config --global core.autocrlf input

# Add node_modules/.bin to PATH
ENV PATH="/home/ubuntu/node_modules/.bin:${PATH}"

# Keep container running
CMD ["bash", "-c", "tail -f /dev/null"]
