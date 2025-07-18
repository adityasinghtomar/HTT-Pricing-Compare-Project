import mysql from 'mysql2/promise'

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

class DatabaseConnection {
  private pool: mysql.Pool | null = null
  private config: DatabaseConfig

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pricing_dashboard'
    }
  }

  async getConnection(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool({
        ...this.config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        charset: 'utf8mb4'
      })

      // Test the connection
      try {
        const connection = await this.pool.getConnection()
        console.log('Database connected successfully')
        connection.release()
      } catch (error) {
        console.error('Database connection failed:', error)
        throw error
      }
    }

    return this.pool
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const pool = await this.getConnection()
    try {
      const [rows] = await pool.execute(sql, params)
      return rows as T[]
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results.length > 0 ? results[0] : null
  }

  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const pool = await this.getConnection()
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log('Database connection closed')
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

// Singleton instance
export const db = new DatabaseConnection()

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await db.close()
  process.exit(0)
})
