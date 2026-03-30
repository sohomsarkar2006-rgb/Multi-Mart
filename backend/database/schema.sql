-- Platform Settings Table Schema
CREATE TABLE IF NOT EXISTS platform_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    description TEXT
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, is_public, description) VALUES
('tax_rate', '5', 'number', TRUE, 'Tax rate percentage (e.g., 5 for 5%)'),
('shipping_cost', '40', 'number', TRUE, 'Standard shipping cost in local currency'),
('free_shipping_threshold', '500', 'number', TRUE, 'Order amount for free shipping'),
('max_quantity_per_item', '10', 'number', TRUE, 'Maximum quantity allowed per item'),
('default_commission_rate', '10', 'number', TRUE, 'Default commission rate for vendors'),
('platform_fee', '2.5', 'number', TRUE, 'Platform fee percentage'),
('support_email', 'support@multimart.com', 'string', TRUE, 'Customer support email'),
('support_phone', '1-800-MULTIMART', 'string', TRUE, 'Customer support phone'),
('company_address', 'MultiMart HQ, Business District', 'string', TRUE, 'Company headquarters address'),
('company_name', 'MultiMart', 'string', TRUE, 'Company name'),
('website', 'https://multimart.com', 'string', TRUE, 'Company website');

-- Index for faster lookups
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_platform_settings_public ON platform_settings(is_public);
