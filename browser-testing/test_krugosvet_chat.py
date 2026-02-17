#!/usr/bin/env python3
"""
Test krugosvet.ai chat interface - click around and test functionality
"""
from playwright.sync_api import sync_playwright
import time

def test_chat_interface():
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🌐 Navigating to http://localhost:4000...")
        page.goto('http://localhost:4000')

        # Wait for the page to fully load
        page.wait_for_load_state('networkidle')
        print("✅ Page loaded successfully")

        # Take initial screenshot
        page.screenshot(path='/tmp/krugosvet_initial.png', full_page=True)
        print("📸 Screenshot saved: /tmp/krugosvet_initial.png")

        # Check page title
        title = page.title()
        print(f"📄 Page title: {title}")

        # Find and list all quick action buttons
        print("\n🔍 Discovering quick action buttons...")
        buttons = page.locator('button[phx-click="send_message"]').all()
        print(f"Found {len(buttons)} quick action buttons:")
        for i, button in enumerate(buttons):
            text = button.inner_text()
            message = button.get_attribute('phx-value-message')
            print(f"  {i+1}. {text.strip()[:50]} → '{message}'")

        # Test clicking the first quick action button (Issyk-Kul tours)
        print("\n🖱️  Clicking first quick action button (Issyk-Kul tours)...")
        first_button = page.locator('button[phx-value-message="Какие туры есть на Иссык-Куль?"]')
        first_button.click()

        # Wait for response (loading indicator should appear then disappear)
        print("⏳ Waiting for response...")
        time.sleep(2)  # Give Phoenix LiveView time to process

        # Take screenshot after first click
        page.screenshot(path='/tmp/krugosvet_after_click1.png', full_page=True)
        print("📸 Screenshot saved: /tmp/krugosvet_after_click1.png")

        # Check for messages in the chat
        print("\n💬 Checking messages...")
        messages = page.locator('.max-w-xl.rounded-2xl').all()
        print(f"Found {len(messages)} message bubbles:")
        for i, msg in enumerate(messages):
            preview = msg.inner_text()[:100].replace('\n', ' ')
            print(f"  {i+1}. {preview}...")

        # Test typing in the input field
        print("\n⌨️  Testing manual message input...")
        input_field = page.locator('input[name="message"]')
        input_field.fill("How much does a trek to Ala-Archa cost?")

        # Take screenshot with typed text
        page.screenshot(path='/tmp/krugosvet_with_text.png', full_page=True)
        print("📸 Screenshot saved: /tmp/krugosvet_with_text.png")

        # Click send button
        send_button = page.locator('button[type="submit"]')
        send_button.click()
        print("✉️  Message sent!")

        # Wait for response
        time.sleep(2)

        # Take final screenshot
        page.screenshot(path='/tmp/krugosvet_final.png', full_page=True)
        print("📸 Screenshot saved: /tmp/krugosvet_final.png")

        # Check final message count
        final_messages = page.locator('.max-w-xl.rounded-2xl').all()
        print(f"\n📊 Final message count: {len(final_messages)}")

        # Check rate limit counter
        rate_limit = page.locator('.text-sm.font-medium.text-gray-700').inner_text()
        print(f"📈 Rate limit status: {rate_limit}")

        print("\n✅ Test complete! Browser automation successful.")

        browser.close()

if __name__ == "__main__":
    test_chat_interface()
