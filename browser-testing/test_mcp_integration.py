#!/usr/bin/env python3
"""
Test MCP integration with real tour search.
Sends a message asking for hot tours to Kyrgyzstan.
"""

from playwright.sync_api import sync_playwright
import time
import sys

def test_mcp_tour_search():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("📍 Navigating to http://localhost:4000...")
        page.goto('http://localhost:4000')
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('[data-phx-main]', timeout=10000)

        print("✅ LiveView loaded")

        # Send a message asking for hot tours to Kyrgyzstan
        test_message = "покажи горящие туры в Кыргызстан из Бишкека"
        print(f"\n📤 Sending message: '{test_message}'")

        input_field = page.locator('input[name="message"]')
        input_field.fill(test_message)

        # Submit the form
        page.locator('form[phx-submit="send_message"]').evaluate('form => form.requestSubmit()')

        print("⏳ Waiting for AI response with MCP tools (15 seconds)...")
        time.sleep(15)  # Wait for OpenAI + MCP tool calls

        # Take screenshot
        page.screenshot(path='/tmp/krugosvet_mcp_test.png', full_page=True)
        print("📸 Screenshot saved to /tmp/krugosvet_mcp_test.png")

        # Get page content
        page_text = page.content()

        # Check for indicators
        has_stub = "Week 1 MVP" in page_text
        has_tour_data = any([
            "туры" in page_text.lower(),
            "тур" in page_text.lower(),
            "цена" in page_text.lower(),
            "price" in page_text.lower(),
            "hotel" in page_text.lower(),
            "отель" in page_text.lower(),
            "горящие" in page_text.lower()
        ])

        print(f"\n📊 Analysis:")
        print(f"  - Contains stub text: {has_stub}")
        print(f"  - Mentions tour-related terms: {has_tour_data}")

        if has_stub:
            print("\n❌ FAIL: Still showing stub responses")
            browser.close()
            return False
        elif has_tour_data:
            print("\n✅ SUCCESS: Real tour data received from MCP!")
            print("   Response contains tour-related information")
            browser.close()
            return True
        else:
            print("\n⚠️  UNCLEAR: No stub text, but also no clear tour data")
            print("   Check screenshot for details")
            browser.close()
            return False

if __name__ == "__main__":
    print("🚀 Testing MCP integration with tour search")
    print("=" * 60)

    success = test_mcp_tour_search()

    print("\n" + "=" * 60)
    if success:
        print("🎉 Test PASSED - MCP integration working!")
        sys.exit(0)
    else:
        print("💥 Test FAILED - Check logs and screenshot")
        sys.exit(1)
