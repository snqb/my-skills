#!/usr/bin/env python3
"""
Test krugosvet.ai chat - improved version with proper LiveView waiting
"""
from playwright.sync_api import sync_playwright
import time

def test_chat_with_liveview():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🌐 Navigating to http://localhost:4000...")
        page.goto('http://localhost:4000')
        page.wait_for_load_state('networkidle')

        # Wait for LiveView to be ready by checking for phx-main attribute
        print("⏳ Waiting for Phoenix LiveView to initialize...")
        page.wait_for_selector('[data-phx-main]', timeout=10000)
        print("✅ LiveView ready!")

        # Take initial screenshot
        page.screenshot(path='/tmp/krugosvet_liveview_ready.png', full_page=True)
        print("📸 Screenshot: /tmp/krugosvet_liveview_ready.png")

        # Test 1: Click quick action button
        print("\n🖱️  Test 1: Clicking 'Issyk-Kul tours' button...")
        issyk_button = page.locator('button:has-text("Туры на Иссык-Куль")')
        issyk_button.click()

        # Wait for loading state to appear and disappear
        print("⏳ Waiting for bot response...")
        time.sleep(3)

        # Check if messages appeared
        page.screenshot(path='/tmp/krugosvet_test1_result.png', full_page=True)
        print("📸 Screenshot: /tmp/krugosvet_test1_result.png")

        # Count messages
        messages = page.locator('[class*="rounded-2xl"]').count()
        print(f"💬 Messages visible: {messages}")

        # Test 2: Type and send manual message
        print("\n⌨️  Test 2: Typing manual message...")
        input_field = page.locator('input[name="message"]')

        # Fill the input
        input_field.fill("Tell me about Ala-Archa National Park")
        print("✍️  Typed: 'Tell me about Ala-Archa National Park'")

        # Wait a moment for LiveView to enable the button
        time.sleep(0.5)

        # Submit the form
        print("📤 Submitting message...")
        page.locator('form[phx-submit="send_message"]').evaluate('form => form.requestSubmit()')

        # Wait for response
        time.sleep(3)

        # Take final screenshot
        page.screenshot(path='/tmp/krugosvet_test2_result.png', full_page=True)
        print("📸 Screenshot: /tmp/krugosvet_test2_result.png")

        # Final message count
        final_messages = page.locator('[class*="rounded-2xl"]').count()
        print(f"💬 Final messages: {final_messages}")

        # Check rate limit counter
        try:
            rate_limit = page.locator('.text-sm.font-medium.text-gray-700').inner_text()
            print(f"📈 Rate limit: {rate_limit}")
        except:
            print("⚠️  Could not read rate limit")

        # Get page HTML to verify structure
        print("\n🔍 Checking page structure...")
        has_header = page.locator('text=Кругосвет.AI').is_visible()
        has_input = page.locator('input[name="message"]').is_visible()
        has_buttons = page.locator('button[phx-click="send_message"]').count()

        print(f"✓ Header visible: {has_header}")
        print(f"✓ Input field visible: {has_input}")
        print(f"✓ Quick action buttons: {has_buttons}")

        print("\n✅ Browser automation test complete!")
        browser.close()

if __name__ == "__main__":
    test_chat_with_liveview()
