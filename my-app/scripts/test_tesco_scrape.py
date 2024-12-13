from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
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
    options.add_argument('--disable-gpu')
    
    print("Creating Chrome driver...")
    driver = webdriver.Chrome(options=options)
    
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

def test_tesco_scrape():
    driver = None
    try:
        driver = setup_driver()
        print("\n=== Starting Tesco Test ===")
        
        # 1. Navigate to Tesco
        print("\nStep 1: Navigating to Tesco...")
        driver.get('https://www.tesco.com/groceries/en-GB/promotions')
        print("Initial page loaded")
        
        # 2. Wait longer for page to load
        print("\nStep 2: Waiting for page to load...")
        time.sleep(15)  # Wait longer for initial load
        
        # 3. Print current URL
        print(f"\nStep 3: Current URL: {driver.current_url}")
        
        # Accept cookies if the popup appears
        try:
            print("\nTrying to accept cookies...")
            accept_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            )
            accept_button.click()
            time.sleep(2)
            print("Cookies accepted")
        except:
            print("No cookie banner found or already accepted")
        
        # 4. Look for product elements with multiple selectors
        print("\nStep 4: Looking for product elements...")
        selectors_to_try = [
            '.product-list--list-item',  # Main product container
            '.styles__StyledVerticalTile-dvv1wj-1',
            '.product-details--wrapper',
            '[data-auto="product-tile"]',
            '[class*="StyledTiledContent"]'
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
            driver.save_screenshot('tesco_test.png')
            print("Screenshot saved as tesco_test.png")
            return
        
        # 5. Try to extract information from first 5 products
        print("\nStep 5: Analyzing first 5 products...")
        offers = []
        for i, product in enumerate(products[:5]):
            print(f"\nProduct {i+1}:")
            try:
                # Print HTML
                print("HTML content:")
                print(product.get_attribute('outerHTML'))
                
                # Print all text content
                print("\nAll text content:")
                print(product.text)
                
                # Try to extract specific information
                try:
                    # Updated selectors based on the HTML structure
                    title = product.find_element(By.CSS_SELECTOR, "[data-auto='product-tile--title']").text
                    
                    # Try different price selectors
                    price_selectors = [
                        ".beans-price__text",
                        ".styled__Text-sc-8qlq5b-1",
                        "[class*='ContentText']"
                    ]
                    
                    price = None
                    for price_selector in price_selectors:
                        try:
                            price_element = product.find_element(By.CSS_SELECTOR, price_selector)
                            price = price_element.text
                            break
                        except:
                            continue
                    
                    if not price:
                        print("Could not find price")
                        continue
                    
                    offers.append({
                        "title": title,
                        "price": price,
                        "store": "Tesco",
                        "location": "London"
                    })
                    print(f"Successfully extracted: {title} - {price}")
                except Exception as e:
                    print(f"Error extracting data: {str(e)}")
                
            except Exception as e:
                print(f"Error analyzing product: {str(e)}")
        
        # 6. Page source analysis
        print("\nStep 6: Analyzing page source...")
        page_source = driver.page_source.lower()
        keywords = ['product', 'price', 'offer', 'deal', 'promotion', '£', 'was']
        for keyword in keywords:
            count = page_source.count(keyword)
            print(f"Keyword '{keyword}' appears {count} times")
        
        # Print results
        if offers:
            print("\nSuccessfully extracted offers:")
            print(json.dumps(offers, indent=2))
        else:
            print("\nNo offers could be extracted")
        
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        traceback.print_exc()
    finally:
        if driver:
            print("\nTest complete. Closing browser...")
            driver.quit()

if __name__ == "__main__":
    print("Starting Tesco scraper test...")
    test_tesco_scrape() 