"""
Perchance Handler Module
Handles Perchance image generation via Playwright automation
"""

import sys
import os
from pathlib import Path
from flask import jsonify
import base64
import time
import json

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')


class PerchanceHandler:
    """Handler for Perchance image generation"""
    
    def __init__(self):
        self.playwright_available = False
        self.browser = None
        self.page = None
        self.gallery = []
        
        # Try to import Playwright
        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
            self.playwright = sync_playwright
            self.PlaywrightTimeout = PlaywrightTimeout
            self.playwright_available = True
            print("✅ Playwright available for Perchance automation")
        except ImportError:
            print("⚠️  Playwright not installed. Perchance features disabled.")
            print("   Install with: pip install playwright && playwright install chromium")
            self.playwright_available = False
    
    def start_browser(self):
        """Initialize Playwright browser"""
        if not self.playwright_available:
            raise Exception("Playwright not available. Install with: pip install playwright")
        
        if not self.browser:
            playwright = self.playwright().start()
            self.browser = playwright.chromium.launch(headless=True)
            self.page = self.browser.new_page()
            self.page.set_viewport_size({"width": 1920, "height": 1080})
    
    def close_browser(self):
        """Clean up browser resources"""
        if self.browser:
            self.browser.close()
            self.browser = None
            self.page = None
    
    def generate(self, data):
        """Generate images from Perchance"""
        if not self.playwright_available:
            return jsonify({"error": "Playwright not installed. Run: pip install playwright && playwright install chromium"}), 500
        
        prompt = data.get('prompt')
        negative_prompt = data.get('negative_prompt', '')
        aspect_ratio = data.get('aspect_ratio', '1:1')
        num_images = data.get('num_images', 4)
        style = data.get('style', 'anime')
        model = data.get('model', 'ai-text-to-image-generator')
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        try:
            self.start_browser()
            
            # Navigate to Perchance generator
            url = f"https://perchance.org/{model}"
            print(f"🌐 Opening {url}")
            self.page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait for page to load
            try:
                self.page.wait_for_selector("#promptTextarea", timeout=10000)
            except:
                # Try alternative selectors
                try:
                    self.page.wait_for_selector("textarea", timeout=10000)
                except:
                    return jsonify({"error": "Could not find prompt textarea on Perchance page"}), 500
            
            # Fill in prompt
            print(f"✏️  Entering prompt: {prompt[:50]}...")
            try:
                self.page.fill("#promptTextarea", prompt)
            except:
                # Try alternative selector
                self.page.fill("textarea", prompt)
            
            # Fill negative prompt if exists
            if negative_prompt:
                try:
                    self.page.fill("#negativePromptTextarea", negative_prompt)
                except:
                    print("⚠️  Negative prompt field not found")
            
            # Click generate button
            try:
                generate_button = self.page.locator("button:has-text('Generate')")
                generate_button.click()
                print("🚀 Generation started...")
            except:
                # Try alternative button selectors
                try:
                    self.page.click("button[type='submit']")
                except:
                    return jsonify({"error": "Could not find generate button"}), 500
            
            # Wait for images to generate
            generated_images = []
            max_wait = 60  # seconds
            start_time = time.time()
            
            while len(generated_images) < num_images and (time.time() - start_time) < max_wait:
                # Find all generated image elements
                try:
                    image_elements = self.page.query_selector_all("img")
                    
                    for img_elem in image_elements:
                        img_src = img_elem.get_attribute("src")
                        
                        if not img_src or img_src.startswith("data:image/svg"):
                            continue
                        
                        # Skip if already processed
                        if any(img['src'] == img_src for img in generated_images):
                            continue
                        
                        # Download image as base64
                        try:
                            if img_src.startswith("data:image"):
                                image_data = img_src
                            else:
                                # Download from URL
                                response = self.page.request.get(img_src)
                                image_bytes = response.body()
                                image_data = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
                            
                            generated_images.append({
                                'id': f"img_{len(generated_images)}_{int(time.time())}",
                                'src': img_src,
                                'data': image_data,
                                'prompt': prompt,
                                'negative_prompt': negative_prompt,
                                'aspect_ratio': aspect_ratio,
                                'style': style,
                                'generated_at': time.time()
                            })
                            
                            print(f"✓ Image {len(generated_images)}/{num_images} captured")
                            
                            if len(generated_images) >= num_images:
                                break
                        except Exception as e:
                            print(f"⚠️  Failed to process image: {e}")
                            continue
                except Exception as e:
                    print(f"⚠️  Error finding images: {e}")
                
                time.sleep(1)  # Check every second
            
            if len(generated_images) == 0:
                return jsonify({"error": "No images were generated. Check if Perchance UI changed."}), 500
            
            print(f"✅ Generated {len(generated_images)} images")
            
            # Save images to temp directory
            saved_paths = self.save_images_to_directory(generated_images)
            
            return jsonify({
                'success': True,
                'images': [
                    {
                        'id': img['id'],
                        'data': img['data'],  # base64
                        'download_url': f"/api/perchance/download/{img['id']}"
                    }
                    for img in generated_images
                ],
                'saved_paths': saved_paths
            })
            
        except Exception as e:
            print(f"❌ Error during generation: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            # Don't close browser - keep it open for faster subsequent requests
            pass
    
    def save_images_to_directory(self, images, output_dir="temp_generated"):
        """Save generated images to file system"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        saved_files = []
        
        for img in images:
            try:
                # Extract base64 data
                if img['data'].startswith("data:image"):
                    base64_data = img['data'].split(",")[1]
                else:
                    base64_data = img['data']
                
                # Decode and save
                img_bytes = base64.b64decode(base64_data)
                filename = f"{img['id']}.png"
                filepath = output_path / filename
                
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                
                saved_files.append(str(filepath))
                print(f"💾 Saved: {filepath}")
            except Exception as e:
                print(f"⚠️  Failed to save image {img['id']}: {e}")
        
        return saved_files
    
    def get_gallery(self):
        """Return all images in gallery"""
        return jsonify({
            'gallery': [
                {
                    'id': img['id'],
                    'prompt': img['prompt'],
                    'thumbnail': img['data'][:100] + '...' if 'data' in img else ''
                }
                for img in self.gallery
            ]
        })
    
    def clear_gallery(self):
        """Clear gallery"""
        self.gallery = []
        return jsonify({"success": True})
