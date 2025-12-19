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
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    try:
        # Only fix encoding if stdout has a buffer attribute
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except (AttributeError, TypeError):
        # If buffer doesn't exist or is already a writer, skip encoding fix
        pass


class PerchanceHandler:
    """Handler for Perchance image generation"""
    
    def __init__(self):
        self.playwright_available = False
        self.browser = None
        self.page = None
        self.gallery = []
        self.executor = None
        
        # Try to import Playwright
        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
            self.playwright = sync_playwright
            self.PlaywrightTimeout = PlaywrightTimeout
            self.playwright_available = True
            # Create a thread pool executor for Playwright operations
            self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="playwright")
            print("✅ Playwright available for Perchance automation")
        except ImportError:
            print("⚠️  Playwright not installed. Perchance features disabled.")
            print("   Install with: pip install playwright && playwright install chromium")
            self.playwright_available = False
    
    
    def _generate_in_thread(self, prompt, negative_prompt, aspect_ratio, num_images, style, model):
        """Internal method to run Playwright operations in isolated thread"""
        playwright = self.playwright().start()
        browser = None
        page = None
        
        try:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Navigate to Perchance generator
            url = f"https://perchance.org/{model}"
            print(f"🌐 Opening {url}")
            page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Wait for page to load
            try:
                page.wait_for_selector("#promptTextarea", timeout=15000)
            except:
                try:
                    page.wait_for_selector("textarea", timeout=15000)
                except:
                    raise Exception("Could not find prompt textarea on Perchance page")
            
            # Fill in prompt
            print(f"✏️  Entering prompt: {prompt[:50]}...")
            try:
                page.fill("#promptTextarea", prompt)
            except:
                page.fill("textarea", prompt)
            
            # Fill negative prompt if exists
            if negative_prompt:
                try:
                    page.fill("#negativePromptTextarea", negative_prompt)
                except:
                    print("⚠️  Negative prompt field not found")
            
            # Set aspect ratio if available
            if aspect_ratio:
                try:
                    aspect_set = False
                    
                    # Try dropdown/select elements
                    try:
                        select_element = page.query_selector("select")
                        if select_element:
                            options = select_element.query_selector_all("option")
                            for option in options:
                                option_value = option.get_attribute("value") or option.inner_text()
                                if aspect_ratio.lower() in option_value.lower() or option_value.lower() in aspect_ratio.lower():
                                    select_element.select_option(option_value)
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via select")
                                    aspect_set = True
                                    break
                    except:
                        pass
                    
                    # Try buttons with data attributes or text
                    if not aspect_set:
                        try:
                            aspect_buttons = page.query_selector_all("button")
                            for btn in aspect_buttons:
                                btn_text = btn.inner_text().lower()
                                btn_data = btn.get_attribute("data-aspect") or btn.get_attribute("data-value") or ""
                                if aspect_ratio.lower() in btn_text or aspect_ratio in btn_data:
                                    btn.click()
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via button")
                                    aspect_set = True
                                    break
                        except:
                            pass
                    
                    # Try input elements
                    if not aspect_set:
                        try:
                            inputs = page.query_selector_all("input[type='radio'], input[type='checkbox']")
                            for inp in inputs:
                                inp_value = inp.get_attribute("value") or ""
                                if aspect_ratio.lower() in inp_value.lower():
                                    inp.click()
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via input")
                                    aspect_set = True
                                    break
                        except:
                            pass
                    
                    if not aspect_set:
                        print(f"⚠️  Could not set aspect ratio '{aspect_ratio}' - UI may have changed")
                except Exception as e:
                    print(f"⚠️  Error setting aspect ratio: {e}")
            
            # Set style if available
            if style:
                try:
                    style_prompt = f"{style} style, {prompt}"
                    try:
                        page.fill("#promptTextarea", style_prompt)
                    except:
                        page.fill("textarea", style_prompt)
                    print(f"✓ Style '{style}' applied to prompt")
                except Exception as e:
                    print(f"⚠️  Could not set style: {e}")
            
            # Click generate button
            try:
                generate_button = page.locator("button:has-text('Generate')")
                generate_button.click()
                print("🚀 Generation started...")
            except:
                try:
                    page.click("button[type='submit']")
                except:
                    raise Exception("Could not find generate button")
            
            # Wait for images to generate
            generated_images = []
            max_wait = 90  # seconds - increased timeout
            start_time = time.time()
            
            while len(generated_images) < num_images and (time.time() - start_time) < max_wait:
                try:
                    image_elements = page.query_selector_all("img")
                    
                    for img_elem in image_elements:
                        img_src = img_elem.get_attribute("src")
                        
                        if not img_src or img_src.startswith("data:image/svg"):
                            continue
                        
                        if any(img['src'] == img_src for img in generated_images):
                            continue
                        
                        try:
                            if img_src.startswith("data:image"):
                                image_data = img_src
                            else:
                                response = page.request.get(img_src)
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
                
                time.sleep(1)
            
            if len(generated_images) == 0:
                raise Exception("No images were generated. Check if Perchance UI changed.")
            
            print(f"✅ Generated {len(generated_images)} images")
            
            # Save images to temp directory
            saved_paths = self.save_images_to_directory(generated_images)
            
            return {
                'success': True,
                'images': [
                    {
                        'id': img['id'],
                        'data': img['data'],
                        'download_url': f"/api/perchance/download/{img['id']}"
                    }
                    for img in generated_images
                ],
                'saved_paths': saved_paths
            }
            
        finally:
            if browser:
                browser.close()
            playwright.stop()
    
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
            # Run Playwright operations in isolated thread
            future = self.executor.submit(
                self._generate_in_thread,
                prompt, negative_prompt, aspect_ratio, num_images, style, model
            )
            
            # Wait for result with timeout
            result = future.result(timeout=120)  # 2 minute timeout
            
            return jsonify(result)
            
        except FutureTimeout:
            return jsonify({"error": "Image generation timed out. Please try again."}), 500
        except Exception as e:
            print(f"❌ Error during generation: {e}")
            return jsonify({"error": str(e)}), 500
            
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
            
            # Set aspect ratio if available
            if aspect_ratio:
                try:
                    # Perchance uses various UI elements for aspect ratio
                    # Try common selectors and interaction patterns
                    aspect_set = False
                    
                    # Try dropdown/select elements
                    try:
                        select_element = self.page.query_selector("select")
                        if select_element:
                            options = select_element.query_selector_all("option")
                            for option in options:
                                option_value = option.get_attribute("value") or option.inner_text()
                                if aspect_ratio.lower() in option_value.lower() or option_value.lower() in aspect_ratio.lower():
                                    select_element.select_option(option_value)
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via select")
                                    aspect_set = True
                                    break
                    except:
                        pass
                    
                    # Try buttons with data attributes or text
                    if not aspect_set:
                        try:
                            aspect_buttons = self.page.query_selector_all("button")
                            for btn in aspect_buttons:
                                btn_text = btn.inner_text().lower()
                                btn_data = btn.get_attribute("data-aspect") or btn.get_attribute("data-value") or ""
                                if aspect_ratio.lower() in btn_text or aspect_ratio in btn_data:
                                    btn.click()
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via button")
                                    aspect_set = True
                                    break
                        except:
                            pass
                    
                    # Try input elements
                    if not aspect_set:
                        try:
                            inputs = self.page.query_selector_all("input[type='radio'], input[type='checkbox']")
                            for inp in inputs:
                                inp_value = inp.get_attribute("value") or ""
                                if aspect_ratio.lower() in inp_value.lower():
                                    inp.click()
                                    print(f"✓ Aspect ratio set to {aspect_ratio} via input")
                                    aspect_set = True
                                    break
                        except:
                            pass
                    
                    if not aspect_set:
                        print(f"⚠️  Could not set aspect ratio '{aspect_ratio}' - UI may have changed")
                except Exception as e:
                    print(f"⚠️  Error setting aspect ratio: {e}")
            
            # Set style if available
            if style:
                try:
                    # Add style to prompt (most reliable method)
                    style_prompt = f"{style} style, {prompt}"
                    try:
                        self.page.fill("#promptTextarea", style_prompt)
                    except:
                        self.page.fill("textarea", style_prompt)
                    print(f"✓ Style '{style}' applied to prompt")
                except Exception as e:
                    print(f"⚠️  Could not set style: {e}")
            
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
