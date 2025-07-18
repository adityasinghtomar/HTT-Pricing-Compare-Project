import { NextRequest, NextResponse } from 'next/server';
import { scrapeAmazonCA } from '@/lib/scrapers/amazon';

export async function GET(request: NextRequest) {
    try {
        console.log('Testing Amazon scraper with enhanced settings...');

        const testProduct = { brand: '3M', partNumber: '2091', size: '' };

        // Call the function directly with the product
        const result = await scrapeAmazonCA(testProduct);

        return NextResponse.json({
            success: true,
            result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Test scraper error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Test scraping failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}