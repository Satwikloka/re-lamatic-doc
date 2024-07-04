FROM ubuntu:20.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install some basic tools
RUN apt-get update && apt-get install -y \
    sudo \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*