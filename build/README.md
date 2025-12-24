# Build Resources

This directory contains resources needed for building the application.

## Icon Files

To properly build the application for different platforms, you need to provide icon files:

### macOS
- **File**: `icon.icns`
- **Format**: Apple Icon Image format
- **Recommended size**: 1024x1024px source image
- **Tool**: Use `png2icns` or online converters to create .icns from PNG

### Windows
- **File**: `icon.ico`
- **Format**: Windows Icon format
- **Recommended sizes**: Multiple sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- **Tool**: Use `png2ico` or online converters to create .ico from PNG

### Linux
- **File**: `icon.png`
- **Format**: PNG image
- **Recommended size**: 512x512px or 1024x1024px

## Creating Icons

1. Start with a high-resolution PNG image (1024x1024px recommended)
2. Use online tools or command-line utilities to convert to platform-specific formats
3. Place the converted files in this directory

## Note

The application will build without icons, but they are recommended for a professional appearance.
