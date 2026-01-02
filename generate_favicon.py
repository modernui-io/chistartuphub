#!/usr/bin/env python3
"""
Generate CS favicon for ChiStartupHub
Matches the Bureau design aesthetic - clean, monospace CS on dark background
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Colors matching the Bureau design
DARK_BG = (5, 10, 20)  # #050A14 - Deep navy
WHITE = (255, 255, 255)
BORDER_COLOR = (255, 255, 255, 51)  # white/20

def create_favicon(size, output_path, include_border=True):
    """Create a favicon at the specified size"""
    # Create image with dark background
    img = Image.new('RGBA', (size, size), DARK_BG + (255,))
    draw = ImageDraw.Draw(img)
    
    # Add subtle border if requested
    if include_border and size >= 32:
        border_width = max(1, size // 32)
        draw.rectangle(
            [0, 0, size-1, size-1],
            outline=(255, 255, 255, 40),
            width=border_width
        )
    
    # Calculate font size (approximately 50% of image size for good visibility)
    font_size = int(size * 0.45)
    
    # Try to use a monospace font, fall back to default
    try:
        # Try system monospace fonts
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf',
            '/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf',
        ]
        font = None
        for path in font_paths:
            if os.path.exists(path):
                font = ImageFont.truetype(path, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw "CS" text centered
    text = "CS"
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]  # Adjust for font baseline
    
    # Draw the text
    draw.text((x, y), text, fill=WHITE, font=font)
    
    # Save
    if output_path.endswith('.ico'):
        # For ICO, save as PNG first then convert
        img_rgb = img.convert('RGB')
        img_rgb.save(output_path, format='ICO', sizes=[(size, size)])
    else:
        img.save(output_path, 'PNG')
    
    print(f"Created: {output_path} ({size}x{size})")

def main():
    output_dir = '/home/ubuntu/chistartuphub/public'
    
    # Generate all required sizes
    sizes = [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (180, 'apple-touch-icon.png'),
        (192, 'android-chrome-192x192.png'),
        (512, 'android-chrome-512x512.png'),
    ]
    
    for size, filename in sizes:
        output_path = os.path.join(output_dir, filename)
        create_favicon(size, output_path, include_border=(size >= 32))
    
    # Create favicon.ico (32x32)
    create_favicon(32, os.path.join(output_dir, 'favicon.ico'))
    
    print("\nAll favicons generated successfully!")

if __name__ == '__main__':
    main()
