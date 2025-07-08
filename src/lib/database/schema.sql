-- HTTSafety Pricing Dashboard Database Schema
-- MySQL Database Schema for Product Pricing Comparison

-- Create database
CREATE DATABASE IF NOT EXISTS pricing_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pricing_dashboard;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    size VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product (brand, part_number, size),
    INDEX idx_brand (brand),
    INDEX idx_part_number (part_number),
    INDEX idx_category (category)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    website_url VARCHAR(255) NOT NULL,
    search_url_template VARCHAR(500) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    scraper_config JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- Price data table
CREATE TABLE IF NOT EXISTS price_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    availability_status ENUM('available', 'out_of_stock', 'discontinued', 'not_found', 'error') DEFAULT 'not_found',
    product_url VARCHAR(500) DEFAULT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE,
    scraping_duration_ms INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    raw_data JSON DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_product_supplier (product_id, supplier_id),
    INDEX idx_scraped_at (scraped_at),
    INDEX idx_current (is_current),
    INDEX idx_availability (availability_status)
);

-- Scraping logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    product_id INT DEFAULT NULL,
    supplier_id INT DEFAULT NULL,
    status ENUM('started', 'completed', 'failed', 'timeout') NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_ms INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- Price history table (for tracking price changes over time)
CREATE TABLE IF NOT EXISTS price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_change_percent DECIMAL(5,2) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_product_supplier_date (product_id, supplier_id, recorded_at),
    INDEX idx_recorded_at (recorded_at)
);

-- Insert default suppliers
INSERT INTO suppliers (name, website_url, search_url_template, is_active) VALUES
('Amazon.ca', 'https://www.amazon.ca', 'https://www.amazon.ca/s?k={query}', TRUE),
('ULINE', 'https://www.uline.ca', 'https://www.uline.ca/Grp_1/Search?keywords={query}', TRUE),
('Brogan Safety', 'https://www.brogansafety.com', NULL, TRUE),
('SB Simpson', 'https://www.sbsimpson.com', NULL, TRUE),
('SPI Health & Safety', 'https://www.spihealth.com', NULL, TRUE),
('Hazmasters', 'https://www.hazmasters.com', NULL, TRUE),
('Acklands Grainger', 'https://www.acklandsgrainger.com', NULL, TRUE),
('Vallen', 'https://www.vallen.com', NULL, TRUE);

-- Insert sample products
INSERT INTO products (brand, part_number, size, description, category) VALUES
('3M', '2091', NULL, '3M 2091 P100 Particulate Filter', 'Respiratory Protection'),
('3M', '2097', NULL, '3M 2097 P100 Particulate Filter with Nuisance Level Organic Vapor Relief', 'Respiratory Protection'),
('3M', '6100', 'Small', '3M 6100 Half Facepiece Reusable Respirator - Small', 'Respiratory Protection'),
('3M', '6200', 'Medium', '3M 6200 Half Facepiece Reusable Respirator - Medium', 'Respiratory Protection'),
('3M', '6300', 'Large', '3M 6300 Half Facepiece Reusable Respirator - Large', 'Respiratory Protection'),
('3M', '6700', 'Small', '3M 6700 Full Facepiece Reusable Respirator - Small', 'Respiratory Protection'),
('3M', '8511', NULL, '3M 8511 N95 Particulate Respirator with Cool Flow Valve', 'Respiratory Protection'),
('Honeywell', 'LL-1', NULL, 'Honeywell LL-1 Laser Light', 'Safety Equipment'),
('Honeywell', 'LL-30', NULL, 'Honeywell LL-30 Laser Light', 'Safety Equipment'),
('Honeywell', 'LT-30', NULL, 'Honeywell LT-30 Laser Target', 'Safety Equipment'),
('Honeywell', '7580P100', NULL, 'Honeywell 7580P100 P100 Filter', 'Respiratory Protection'),
('Honeywell', '7581P100', NULL, 'Honeywell 7581P100 P100 Filter with Organic Vapor', 'Respiratory Protection');

-- Create views for easier data access
CREATE VIEW current_prices AS
SELECT 
    p.id as product_id,
    p.brand,
    p.part_number,
    p.size,
    p.description,
    s.name as supplier_name,
    pd.price,
    pd.currency,
    pd.availability_status,
    pd.product_url,
    pd.scraped_at
FROM products p
CROSS JOIN suppliers s
LEFT JOIN price_data pd ON p.id = pd.product_id 
    AND s.id = pd.supplier_id 
    AND pd.is_current = TRUE
WHERE s.is_active = TRUE
ORDER BY p.brand, p.part_number, s.name;

CREATE VIEW price_comparison AS
SELECT 
    p.brand,
    p.part_number,
    p.size,
    GROUP_CONCAT(
        CONCAT(s.name, ':', COALESCE(pd.price, 'N/A'))
        ORDER BY s.name
        SEPARATOR ' | '
    ) as prices_by_supplier,
    MIN(pd.price) as min_price,
    MAX(pd.price) as max_price,
    AVG(pd.price) as avg_price,
    COUNT(pd.price) as suppliers_with_price
FROM products p
CROSS JOIN suppliers s
LEFT JOIN price_data pd ON p.id = pd.product_id 
    AND s.id = pd.supplier_id 
    AND pd.is_current = TRUE
WHERE s.is_active = TRUE
GROUP BY p.id, p.brand, p.part_number, p.size
ORDER BY p.brand, p.part_number;
