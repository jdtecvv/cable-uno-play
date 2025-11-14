#!/bin/bash

#################################################
# FFmpeg Installation Script for Cable Uno Play
# Supports Ubuntu/Debian and CentOS/RHEL
#################################################

set -e

echo "===================================="
echo "Cable Uno Play - FFmpeg Installation"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  Please run as root (use sudo)"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo "❌ Cannot detect operating system"
    exit 1
fi

echo "Detected OS: $OS $VERSION"
echo ""

# Install FFmpeg based on OS
case "$OS" in
    ubuntu|debian)
        echo "📦 Installing FFmpeg on Ubuntu/Debian..."
        apt-get update
        apt-get install -y ffmpeg
        ;;
    centos|rhel|fedora)
        echo "📦 Installing FFmpeg on CentOS/RHEL..."
        # Enable EPEL repository
        yum install -y epel-release
        # Install RPM Fusion repository (needed for FFmpeg)
        yum localinstall -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
        yum install -y ffmpeg ffmpeg-devel
        ;;
    *)
        echo "❌ Unsupported OS: $OS"
        echo "Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
        ;;
esac

echo ""
echo "✅ FFmpeg installation complete!"
echo ""

# Verify installation
if command -v ffmpeg &> /dev/null; then
    echo "📊 FFmpeg version:"
    ffmpeg -version | head -n 1
    echo ""
    echo "✅ FFmpeg is ready for Cable Uno Play transcoding!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Restart your application: pm2 restart cable-uno-play"
    echo "   2. Test transcoding with a HEAD audio stream"
    echo ""
else
    echo "❌ FFmpeg installation failed"
    exit 1
fi
