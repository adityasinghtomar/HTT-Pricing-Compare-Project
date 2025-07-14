'use client'

import { useState } from 'react'

export default function DebugVallen() {
  const [searchTerm, setSearchTerm] = useState('3M 2097')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const debugVallen = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-vallen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm }),
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Debug error:', error)
      setResult({ success: false, error: 'Request failed' })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vallen Debug Tool</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 mr-2 w-64"
          placeholder="Search term"
        />
        <button
          onClick={debugVallen}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Debugging...' : 'Debug Vallen'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              <div className="bg-green-100 p-4 rounded">
                <h2 className="font-bold">Page Info</h2>
                <p><strong>URL:</strong> {result.pageInfo.url}</p>
                <p><strong>Title:</strong> {result.pageInfo.title}</p>
                <p><strong>Total Elements:</strong> {result.pageInfo.totalElements}</p>
              </div>

              <div className="bg-blue-100 p-4 rounded">
                <h2 className="font-bold">All data-testid Elements ({result.pageInfo.allTestIds.length})</h2>
                <div className="max-h-96 overflow-y-auto">
                  {result.pageInfo.allTestIds.map((item: any, index: number) => (
                    <div key={index} className="border-b py-2">
                      <p><strong>data-testid:</strong> {item.testId}</p>
                      <p><strong>Tag:</strong> {item.tagName}</p>
                      <p><strong>Text:</strong> {item.text}</p>
                      <details>
                        <summary>HTML</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1">{item.outerHTML}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-100 p-4 rounded">
                <h2 className="font-bold">Price-related Elements ({result.pageInfo.priceElements.length})</h2>
                <div className="max-h-96 overflow-y-auto">
                  {result.pageInfo.priceElements.map((item: any, index: number) => (
                    <div key={index} className="border-b py-2">
                      <p><strong>data-testid:</strong> {item.testId}</p>
                      <p><strong>Text:</strong> {item.text}</p>
                      <details>
                        <summary>HTML</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1">{item.outerHTML}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-100 p-4 rounded">
                <h2 className="font-bold">Elements with $ ({result.pageInfo.dollarElements.length})</h2>
                <div className="max-h-96 overflow-y-auto">
                  {result.pageInfo.dollarElements.map((item: any, index: number) => (
                    <div key={index} className="border-b py-2">
                      <p><strong>Tag:</strong> {item.tagName}</p>
                      <p><strong>Class:</strong> {item.className}</p>
                      <p><strong>data-testid:</strong> {item.testId}</p>
                      <p><strong>Text:</strong> {item.text}</p>
                      <details>
                        <summary>HTML</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1">{item.outerHTML}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-bold">Page Text Content</h2>
                <pre className="text-xs max-h-96 overflow-y-auto">{result.pageInfo.bodyText}</pre>
              </div>
            </>
          ) : (
            <div className="bg-red-100 p-4 rounded">
              <h2 className="font-bold">Error</h2>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
