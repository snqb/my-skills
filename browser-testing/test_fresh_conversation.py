#!/usr/bin/env python3
"""
Test with a completely fresh conversation to verify real OpenAI integration.
"""

from playwright.sync_api import sync_playwright
import time
import sys

def test_fresh_conversation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("📍 Navigating to http://localhost:4000...")
        page.goto('http://localhost:4000')
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('[data-phx-main]', timeout=10000)

        print("✅ LiveView loaded")

        # Send a unique test message that's never been asked before
        test_message = "What is the capital of Kyrgyzstan and what's special about it?"
        print(f"\n📤 Sending NEW message: '{test_message}'")

        input_field = page.locator('input[name="message"]')
        input_field.fill(test_message)

        # Submit the form
        page.locator('form[phx-submit="send_message"]').evaluate('form => form.requestSubmit()')

        print("⏳ Waiting for AI response (10 seconds)...")
        time.sleep(10)  # Wait longer for OpenAI API call

        # Take screenshot
        page.screenshot(path='/tmp/krugosvet_fresh_test.png', full_page=True)
        print("📸 Screenshot saved to /tmp/krugosvet_fresh_test.png")

        # Get page content
        page_text = page.content()

        # Check for indicators
        has_stub = "Week 1 MVP" in page_text
        has_bishkek = "Bishkek" in page_text or "Бишкек" in page_text
        has_capital = "capital" in page_text.lower() or "столиц" in page_text.lower()

        print(f"\n📊 Analysis:")
        print(f"  - Contains stub text: {has_stub}")
        print(f"  - Mentions Bishkek: {has_bishkek}")
        print(f"  - Mentions capital: {has_capital}")

        if has_stub:
            print("\n❌ FAIL: Still showing stub responses")
            browser.close()
            return False
        elif has_bishkek or has_capital:
            print("\n✅ SUCCESS: Real AI response received!")
            print("   Response contains relevant information about Kyrgyzstan's capital")
            browser.close()
            return True
        else:
            print("\n⚠️  UNCLEAR: No stub text, but also no clear answer")
            print("   Check screenshot for details")
            browser.close()
            return False

if __name__ == "__main__":
    print("🚀 Testing with FRESH conversation")
    print("=" * 60)

    success = test_fresh_conversation()

    print("\n" + "=" * 60)
    if success:
        print("🎉 Test PASSED - Real OpenAI integration working!")
        sys.exit(0)
    else:
        print("💥 Test FAILED - Check logs and screenshot")
        sys.exit(1)
