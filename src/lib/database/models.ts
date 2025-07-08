import { db } from './connection'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface Product {
  id?: number
  brand: string
  part_number: string
  size?: string
  description?: string
  category?: string
  created_at?: Date
  updated_at?: Date
}

export interface Supplier {
  id?: number
  name: string
  website_url: string
  search_url_template?: string
  is_active: boolean
  scraper_config?: any
  created_at?: Date
  updated_at?: Date
}

export interface PriceData {
  id?: number
  product_id: number
  supplier_id: number
  price?: number
  currency: string
  availability_status: 'available' | 'out_of_stock' | 'discontinued' | 'not_found' | 'error'
  product_url?: string
  scraped_at?: Date
  is_current: boolean
  scraping_duration_ms?: number
  error_message?: string
  raw_data?: any
}

export interface ScrapingLog {
  id?: number
  session_id: string
  product_id?: number
  supplier_id?: number
  status: 'started' | 'completed' | 'failed' | 'timeout'
  start_time?: Date
  end_time?: Date
  duration_ms?: number
  error_message?: string
  user_agent?: string
  ip_address?: string
}

export class ProductModel {
  static async findAll(): Promise<Product[]> {
    return db.query<Product & RowDataPacket>(
      'SELECT * FROM products ORDER BY brand, part_number'
    )
  }

  static async findById(id: number): Promise<Product | null> {
    return db.queryOne<Product & RowDataPacket>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    )
  }

  static async findByBrandAndPart(brand: string, partNumber: string, size?: string): Promise<Product | null> {
    const sql = size 
      ? 'SELECT * FROM products WHERE brand = ? AND part_number = ? AND size = ?'
      : 'SELECT * FROM products WHERE brand = ? AND part_number = ? AND (size IS NULL OR size = "")'
    const params = size ? [brand, partNumber, size] : [brand, partNumber]
    
    return db.queryOne<Product & RowDataPacket>(sql, params)
  }

  static async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await db.query<ResultSetHeader>(
      'INSERT INTO products (brand, part_number, size, description, category) VALUES (?, ?, ?, ?, ?)',
      [product.brand, product.part_number, product.size || null, product.description || null, product.category || null]
    )
    return (result as any).insertId
  }

  static async update(id: number, product: Partial<Product>): Promise<boolean> {
    const fields = []
    const values = []
    
    if (product.brand !== undefined) { fields.push('brand = ?'); values.push(product.brand) }
    if (product.part_number !== undefined) { fields.push('part_number = ?'); values.push(product.part_number) }
    if (product.size !== undefined) { fields.push('size = ?'); values.push(product.size) }
    if (product.description !== undefined) { fields.push('description = ?'); values.push(product.description) }
    if (product.category !== undefined) { fields.push('category = ?'); values.push(product.category) }
    
    if (fields.length === 0) return false
    
    values.push(id)
    const result = await db.query<ResultSetHeader>(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    
    return (result as any).affectedRows > 0
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.query<ResultSetHeader>(
      'DELETE FROM products WHERE id = ?',
      [id]
    )
    return (result as any).affectedRows > 0
  }
}

export class SupplierModel {
  static async findAll(): Promise<Supplier[]> {
    return db.query<Supplier & RowDataPacket>(
      'SELECT * FROM suppliers ORDER BY name'
    )
  }

  static async findActive(): Promise<Supplier[]> {
    return db.query<Supplier & RowDataPacket>(
      'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name'
    )
  }

  static async findByName(name: string): Promise<Supplier | null> {
    return db.queryOne<Supplier & RowDataPacket>(
      'SELECT * FROM suppliers WHERE name = ?',
      [name]
    )
  }

  static async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await db.query<ResultSetHeader>(
      'INSERT INTO suppliers (name, website_url, search_url_template, is_active, scraper_config) VALUES (?, ?, ?, ?, ?)',
      [supplier.name, supplier.website_url, supplier.search_url_template || null, supplier.is_active, JSON.stringify(supplier.scraper_config) || null]
    )
    return (result as any).insertId
  }
}

export class PriceDataModel {
  static async findCurrentPrices(productId: number): Promise<PriceData[]> {
    return db.query<PriceData & RowDataPacket>(
      `SELECT pd.*, s.name as supplier_name 
       FROM price_data pd 
       JOIN suppliers s ON pd.supplier_id = s.id 
       WHERE pd.product_id = ? AND pd.is_current = TRUE 
       ORDER BY s.name`,
      [productId]
    )
  }

  static async savePriceData(priceData: Omit<PriceData, 'id' | 'scraped_at'>): Promise<number> {
    // First, mark existing prices as not current
    await db.query(
      'UPDATE price_data SET is_current = FALSE WHERE product_id = ? AND supplier_id = ?',
      [priceData.product_id, priceData.supplier_id]
    )

    // Insert new price data
    const result = await db.query<ResultSetHeader>(
      `INSERT INTO price_data 
       (product_id, supplier_id, price, currency, availability_status, product_url, is_current, scraping_duration_ms, error_message, raw_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        priceData.product_id,
        priceData.supplier_id,
        priceData.price || null,
        priceData.currency,
        priceData.availability_status,
        priceData.product_url || null,
        priceData.is_current,
        priceData.scraping_duration_ms || null,
        priceData.error_message || null,
        priceData.raw_data ? JSON.stringify(priceData.raw_data) : null
      ]
    )

    // Save to price history if price is available
    if (priceData.price) {
      await db.query(
        'INSERT INTO price_history (product_id, supplier_id, price, currency) VALUES (?, ?, ?, ?)',
        [priceData.product_id, priceData.supplier_id, priceData.price, priceData.currency]
      )
    }

    return (result as any).insertId
  }

  static async getPriceComparison(): Promise<any[]> {
    return db.query(
      'SELECT * FROM price_comparison ORDER BY brand, part_number'
    )
  }
}

export class ScrapingLogModel {
  static async create(log: Omit<ScrapingLog, 'id' | 'start_time'>): Promise<number> {
    const result = await db.query<ResultSetHeader>(
      'INSERT INTO scraping_logs (session_id, product_id, supplier_id, status, end_time, duration_ms, error_message, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [log.session_id, log.product_id || null, log.supplier_id || null, log.status, log.end_time || null, log.duration_ms || null, log.error_message || null, log.user_agent || null, log.ip_address || null]
    )
    return (result as any).insertId
  }

  static async updateStatus(sessionId: string, status: ScrapingLog['status'], endTime?: Date, errorMessage?: string): Promise<void> {
    await db.query(
      'UPDATE scraping_logs SET status = ?, end_time = ?, error_message = ? WHERE session_id = ?',
      [status, endTime || null, errorMessage || null, sessionId]
    )
  }

  static async getRecentLogs(limit: number = 100): Promise<ScrapingLog[]> {
    return db.query<ScrapingLog & RowDataPacket>(
      'SELECT * FROM scraping_logs ORDER BY start_time DESC LIMIT ?',
      [limit]
    )
  }
}
