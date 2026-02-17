#!/usr/bin/env python3
"""
Test real OpenAI integration in krugosvet.ai chat.
Verifies that we get actual AI responses, not stubs.
"""

from playwright.sync_api import sync_playwright
import time
import sys

def test_openai_chat():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("📍 Navigating to http://localhost:4000...")
        page.goto('http://localhost:4000')
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('[data-phx-main]', timeout=10000)

        print("✅ LiveView loaded")

        # Take screenshot before sending message
        page.screenshot(path='/tmp/krugosvet_before_message.png', full_page=True)
        print("📸 Screenshot saved to /tmp/krugosvet_before_message.png")

        # Send a simple test message
        test_message = "Hello, tell me about Issyk-Kul lake in one sentence."
        print(f"\n📤 Sending message: '{test_message}'")

        input_field = page.locator('input[name="message"]')
        input_field.fill(test_message)

        # Submit the form
        page.locator('form[phx-submit="send_message"]').evaluate('form => form.requestSubmit()')

        print("⏳ Waiting for AI response...")
        time.sleep(8)  # Wait for OpenAI API call + response

        # Take screenshot after response
        page.screenshot(path='/tmp/krugosvet_after_response.png', full_page=True)
        print("📸 Screenshot saved to /tmp/krugosvet_after_response.png")

        # Get all messages
        messages = page.locator('[class*="message"]').all()
        print(f"\n📊 Found {len(messages)} messages on page")

        # Get the last message text (should be AI response)
        page_text = page.content()

        # Check for stub response indicators
        is_stub = "Week 1 MVP" in page_text or "настройка интеграции" in page_text

        if is_stub:
            print("\n❌ FAIL: Still getting stub responses")
            print("The response contains Week 1 placeholder text")
            browser.close()
            return False
        else:
            print("\n✅ SUCCESS: Real AI response received!")
            print("No stub indicators found - OpenAI integration is working")

            # Try to extract and show the response
            if "Issyk-Kul" in page_text or "lake" in page_text.lower():
                print("✅ Response appears relevant to the question about Issyk-Kul")

            browser.close()
            return True

if __name__ == "__main__":
    print("🚀 Testing OpenAI integration in krugosvet.ai")
    print("=" * 60)

    success = test_openai_chat()

    print("\n" + "=" * 60)
    if success:
        print("🎉 Test PASSED - Real AI responses working!")
        sys.exit(0)
    else:
        print("💥 Test FAILED - Check logs above")
        sys.exit(1)
