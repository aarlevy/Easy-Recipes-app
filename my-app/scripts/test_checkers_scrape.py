from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
import time
import traceback
import sys

def setup_driver():
    print("\n=== Setting up Chrome Driver ===")
    options = Options()
    
    # Make selenium less detectable
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument('--disable-blink-features=AutomationControlled')
    
    # Add regular browser headers
    options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Basic options
    options.add_argument('--no-sandbox')
    options.add_argument('--start-maximized')
    options.add_argument('--disable-dev-shm-usage')
    
    print("Installing Chrome driver...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    # Make webdriver less detectable
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        '''
    })
    
    print("Chrome driver setup complete")
    return driver

def test_checkers_scrape():
    driver = None
    try:
        driver = setup_driver()
        print("\n=== Starting Checkers Test ===")
        
        # 1. Navigate to Checkers
        print("\nStep 1: Navigating to Checkers...")
        driver.get('https://www.checkers.co.za/specials')
        print("Initial page loaded")
        
        # 2. Wait longer for page to load
        print("\nStep 2: Waiting for page to load...")
        time.sleep(15)  # Wait longer for initial load
        
        # 3. Print current URL
        print(f"\nStep 3: Current URL: {driver.current_url}")
        
        # 4. Look for product elements
        print("\nStep 4: Looking for product elements...")
        selectors_to_try = [
            'article',  # Try article tags first
            '[class*="product"]',  # Any class containing "product"
            '[class*="special"]',  # Any class containing "special"
            '[class*="promotion"]',  # Any class containing "promotion"
            '.product-card',
            '.product-item',
            '[data-testid="product-card"]',
            '.product-grid-item'
        ]
        
        products = []
        for selector in selectors_to_try:
            print(f"Trying selector: {selector}")
            try:
                # Wait for products to load
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                products = driver.find_elements(By.CSS_SELECTOR, selector)
                if products:
                    print(f"Found {len(products)} products with selector: {selector}")
                    break
            except Exception as e:
                print(f"Selector {selector} failed: {str(e)}")
        
        if not products:
            print("No products found with any selector!")
            # Print page source for debugging
            print("\nPage source preview (first 1000 chars):")
            print(driver.page_source[:1000])
            # Take screenshot
            driver.save_screenshot('checkers_test.png')
            print("Screenshot saved as checkers_test.png")
            return
        
        # 5. Try to extract information from first 5 products
        print("\nStep 5: Analyzing first 5 products...")
        for i, product in enumerate(products[:5]):
            print(f"\nProduct {i+1}:")
            try:
                # Print HTML
                print("HTML content:")
                print(product.get_attribute('outerHTML'))
                
                # Print all text content
                print("\nAll text content:")
                print(product.text)
                
            except Exception as e:
                print(f"Error analyzing product: {str(e)}")
        
        # 6. Page source analysis
        print("\nStep 6: Analyzing page source...")
        page_source = driver.page_source.lower()
        keywords = ['product', 'price', 'special', 'deal', 'discount', 'r ', 'was']
        for keyword in keywords:
            count = page_source.count(keyword)
            print(f"Keyword '{keyword}' appears {count} times")
        
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        traceback.print_exc()
    finally:
        if driver:
            print("\nTest complete. Closing browser...")
            driver.quit()

if __name__ == "__main__":
    test_checkers_scrape() 