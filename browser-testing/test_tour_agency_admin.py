#!/usr/bin/env python3
"""
Test Tour Agency admin panel and investigate translator file visibility issue
"""
from playwright.sync_api import sync_playwright
import time

def test_admin_panel():
    with sync_playwright() as p:
        # Launch browser in headless mode (no focus stealing)
        browser = p.chromium.launch(headless=True)  # Always run in background
        page = browser.new_page()

        # Navigate to admin panel
        print("📍 Navigating to admin panel...")
        page.goto('https://tour-agency-backend-production.up.railway.app/admin')
        page.wait_for_load_state('networkidle')

        # Take screenshot of login page
        page.screenshot(path='/tmp/tour_agency_login.png', full_page=True)
        print("📸 Login page screenshot saved to /tmp/tour_agency_login.png")

        # Login
        print("🔐 Logging in as admin...")
        page.fill('input[name="username"]', 'admin')
        page.fill('input[name="password"]', 'adminadmin')
        page.click('button[type="submit"]')

        # Wait for dashboard to load
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Extra wait for any dynamic content

        # Take screenshot of dashboard
        page.screenshot(path='/tmp/tour_agency_dashboard.png', full_page=True)
        print("📸 Dashboard screenshot saved to /tmp/tour_agency_dashboard.png")

        # Look for translator-related sections
        print("🔍 Looking for translator file sections...")

        # Check if there's a sidebar or menu
        page_content = page.content()

        # Take screenshot of current state
        page.screenshot(path='/tmp/tour_agency_current_state.png', full_page=True)
        print("📸 Current state screenshot saved")

        # List all visible links/menu items
        links = page.locator('a').all()
        print(f"\n📋 Found {len(links)} links on the page:")
        for i, link in enumerate(links[:20]):  # Show first 20
            try:
                text = link.inner_text()
                href = link.get_attribute('href')
                if text.strip():
                    print(f"  {i+1}. {text.strip()} -> {href}")
            except:
                pass

        # Try to find translator/файл/переводчик related elements
        translator_keywords = ['translator', 'переводчик', 'файл', 'file', 'translation']
        print("\n🔍 Searching for translator-related elements...")

        for keyword in translator_keywords:
            try:
                elements = page.get_by_text(keyword, exact=False).all()
                if elements:
                    print(f"  ✅ Found elements with '{keyword}': {len(elements)}")
            except:
                pass

        # Keep browser open for manual inspection
        print("\n⏸️  Browser will stay open for 30 seconds for manual inspection...")
        time.sleep(30)

        browser.close()
        print("\n✅ Testing complete!")

if __name__ == '__main__':
    test_admin_panel()
