from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
import time
import json
import random

def setup_driver():
    """Set up Chrome driver with optimal settings."""
    options = Options()
    
    # Mobile emulation settings
    mobile_emulation = {
        "deviceMetrics": { "width": 375, "height": 812, "pixelRatio": 3.0 },
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    }
    options.add_experimental_option("mobileEmulation", mobile_emulation)
    
    # Basic options
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    
    # Disable automation flags
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    
    # Additional anti-detection measures
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        '''
    })
    
    return driver

def scrape_checkers():
    """Scrape discounts from Checkers."""
    driver = setup_driver()
    discounts = []
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Go to Checkers mobile specials page
            driver.get('https://www.checkers.co.za/m/specials')
            
            # Add random delay to appear more human-like
            time.sleep(random.uniform(8, 12))
            
            # Accept cookies if present
            try:
                cookie_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
                )
                cookie_button.click()
                time.sleep(2)
            except:
                pass
            
            # Scroll down a few times to load more products
            for _ in range(3):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(random.uniform(2, 4))
            
            # Wait for products to load
            products = WebDriverWait(driver, 15).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".product-card, .product-item"))
            )
            
            if not products:
                print("No products found, retrying...")
                retry_count += 1
                continue
            
            for product in products:
                try:
                    # Get title
                    title = WebDriverWait(product, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".product-card__name, .product-item__name"))
                    ).text.strip()
                    
                    if not title:  # Skip if no title
                        continue
                    
                    # Get current price
                    try:
                        price_element = WebDriverWait(product, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, ".price__current, .product-item__price"))
                        )
                        current_price = price_element.text.strip()
                    except:
                        continue  # Skip if no price
                    
                    # Get original price
                    try:
                        original_price = product.find_element(By.CSS_SELECTOR, ".price__was, .product-item__was-price").text.strip()
                    except:
                        original_price = None
                    
                    # Clean up the price for display
                    if '\n' in current_price:
                        # Handle card member prices
                        prices = current_price.split('\n')
                        current_price = prices[-1].replace('WITH CARD', '').strip()
                        if not original_price and len(prices) > 1:
                            original_price = prices[0].strip()
                    
                    # Calculate discount percentage
                    discount_percentage = None
                    if original_price:
                        try:
                            original_value = float(original_price.replace('R', '').replace(',', '').strip())
                            current_value = float(current_price.replace('R', '').replace(',', '').strip())
                            if original_value > 0:
                                discount_percentage = ((original_value - current_value) / original_value) * 100
                        except:
                            pass
                    
                    # Try to determine category from product title
                    title_lower = title.lower()
                    if any(word in title_lower for word in ['milk', 'cheese', 'yogurt']):
                        category = 'dairy'
                    elif any(word in title_lower for word in ['bread', 'roll', 'bun']):
                        category = 'bakery'
                    elif any(word in title_lower for word in ['chicken', 'beef', 'pork', 'meat']):
                        category = 'meat'
                    elif any(word in title_lower for word in ['apple', 'banana', 'orange']):
                        category = 'fruits'
                    elif any(word in title_lower for word in ['carrot', 'potato', 'onion']):
                        category = 'vegetables'
                    elif any(word in title_lower for word in ['coca-cola', 'sprite', 'fanta', 'juice']):
                        category = 'beverages'
                    elif any(word in title_lower for word in ['chips', 'chocolate', 'candy']):
                        category = 'snacks'
                    else:
                        category = 'other'
                    
                    discounts.append({
                        'title': title,
                        'price': current_price,
                        'original_price': original_price,
                        'discount_percentage': f"{discount_percentage:.1f}%" if discount_percentage else None,
                        'store': 'Checkers',
                        'location': 'Cape Town',
                        'category': category
                    })
                except Exception as e:
                    print(f"Error processing Checkers product: {str(e)}")
                    continue
            
            # If we got here successfully, break the retry loop
            break
            
        except Exception as e:
            print(f"Error scraping Checkers: {str(e)}")
            retry_count += 1
            if retry_count < max_retries:
                print(f"Retrying... (Attempt {retry_count + 1} of {max_retries})")
                time.sleep(random.uniform(5, 10))  # Wait before retrying
            continue
        
        finally:
            if retry_count >= max_retries:
                print("Max retries reached, giving up")
    
    try:
        driver.quit()
    except:
        pass
    
    # Remove duplicates based on title and price
    unique_discounts = []
    seen = set()
    for d in discounts:
        key = (d['title'], d['price'])
        if key not in seen:
            seen.add(key)
            unique_discounts.append(d)
    
    discounts = unique_discounts
    print(f"Found {len(discounts)} Checkers discounts")
    
    return discounts

def scrape_tesco():
    """Scrape discounts from Tesco."""
    driver = setup_driver()
    discounts = []
    
    try:
        # Go to Tesco Offers page
        driver.get('https://www.tesco.com/groceries/en-GB/promotions')
        time.sleep(15)  # Wait longer for initial load
        
        # Accept cookies if the popup appears
        try:
            accept_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            )
            accept_button.click()
            time.sleep(2)
        except:
            print("No cookie banner found or already accepted")
        
        # Wait for products to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "product-list--list-item"))
        )
        
        # Find all product elements
        products = driver.find_elements(By.CLASS_NAME, "product-list--list-item")
        
        for product in products:
            try:
                # Get title
                title = product.find_element(By.CSS_SELECTOR, "[data-auto='product-tile--title']").text
                
                # Try different price selectors
                current_price = None
                original_price = None
                price_selectors = [
                    ".beans-price__text",
                    ".styled__Text-sc-8qlq5b-1",
                    "[class*='ContentText']",
                    ".styled__StyledHeading-sc-119w3hf-2"
                ]
                
                for selector in price_selectors:
                    try:
                        price_element = product.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_element.text
                        if '£' in price_text:
                            if 'was' in price_text.lower():
                                original_price = price_text.split('was')[-1].strip()
                            else:
                                current_price = price_text
                    except:
                        continue
                
                if not current_price:
                    continue
                
                # Get clubcard price if available
                try:
                    clubcard_element = product.find_element(By.CSS_SELECTOR, "[class*='ContentText']")
                    clubcard_text = clubcard_element.text
                    if 'Clubcard Price' in clubcard_text:
                        current_price = clubcard_text.split(' ')[0]  # Get just the price
                except:
                    pass
                
                # Try to get category
                try:
                    category = product.find_element(By.CSS_SELECTOR, "[class*='category']").text.lower()
                except:
                    category = 'uncategorized'
                
                # Calculate discount percentage
                discount_percentage = None
                if original_price and current_price:
                    try:
                        original_value = float(original_price.replace('£', '').strip())
                        current_value = float(current_price.replace('£', '').strip())
                        if original_value > 0:
                            discount_percentage = ((original_value - current_value) / original_value) * 100
                    except:
                        pass
                
                discounts.append({
                    'title': title,
                    'price': current_price,
                    'original_price': original_price,
                    'discount_percentage': f"{discount_percentage:.1f}%" if discount_percentage else None,
                    'store': 'Tesco',
                    'location': 'London',
                    'category': category
                })
                
            except Exception as e:
                print(f"Error processing Tesco product: {str(e)}")
                continue
        
        print(f"Found {len(discounts)} Tesco discounts")
        
    except Exception as e:
        print(f"Error scraping Tesco: {str(e)}")
    
    finally:
        driver.quit()
    
    return discounts

def main(location):
    all_discounts = []
    
    if location.lower() == 'cape town':
        checkers_discounts = scrape_checkers()
        all_discounts.extend(checkers_discounts)
    elif location.lower() == 'london':
        tesco_discounts = scrape_tesco()
        all_discounts.extend(tesco_discounts)
    
    return all_discounts

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        location = sys.argv[1]
    else:
        location = 'london'  # default location
    
    discounts = main(location)
    
    # Save discounts to file
    with open('discounts.json', 'w') as f:
        json.dump(discounts, f, indent=2)
    
    # Also print for debugging
    print(json.dumps(discounts, indent=2)) 