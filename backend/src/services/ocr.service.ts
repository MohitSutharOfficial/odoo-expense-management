import * as Tesseract from 'tesseract.js';

interface OCRResult {
    success: boolean;
    text?: string;
    amount?: number;
    date?: string;
    merchant?: string;
    error?: string;
}

// Tesseract.js is initialized on-demand (no API keys needed!)
console.log('✅ Tesseract.js OCR ready (Free, Local, No API keys)');

export class OCRService {

    /**
     * Extract text and data from receipt image using Tesseract.js
     * 100% Free, Runs locally, No API keys required!
     */
    static async processReceipt(imagePath: string): Promise<OCRResult> {
        try {
            console.log('🔍 Processing receipt with Tesseract.js (local OCR)...');

            // Create a Tesseract worker
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            // Recognize text from image
            const { data } = await worker.recognize(imagePath);

            await worker.terminate();

            const fullText = data.text;

            if (!fullText || fullText.trim().length === 0) {
                return {
                    success: false,
                    error: 'No text found in image'
                };
            }

            console.log('✅ Extracted text:', fullText.substring(0, 200));
            console.log('📊 Confidence:', Math.round(data.confidence) + '%');

            // Parse receipt data from extracted text
            const parsedData = this.parseReceiptText(fullText);

            return {
                success: true,
                text: fullText,
                ...parsedData
            };

        } catch (error: any) {
            console.error('❌ Tesseract.js error:', error.message);
            return {
                success: false,
                error: error.message || 'Failed to process receipt with Tesseract.js'
            };
        }
    }

    /**
     * Parse receipt text to extract structured data
     */
    private static parseReceiptText(text: string): Partial<OCRResult> {
        const result: Partial<OCRResult> = {};

        // Extract amount (look for currency symbols and numbers)
        const amountPatterns = [
            /total[:\s]*\$?\s*(\d+\.?\d{0,2})/i,
            /amount[:\s]*\$?\s*(\d+\.?\d{0,2})/i,
            /\$\s*(\d+\.?\d{0,2})/,
            /(\d+\.\d{2})/
        ];

        for (const pattern of amountPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const amount = parseFloat(match[1]);
                if (amount > 0 && amount < 1000000) { // Reasonable range
                    result.amount = amount;
                    break;
                }
            }
        }

        // Extract date
        const datePatterns = [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                result.date = match[1];
                break;
            }
        }

        // Extract merchant name (usually at the top of receipt)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
            // First non-empty line is often the merchant name
            const firstLine = lines[0].trim();
            if (firstLine.length > 2 && firstLine.length < 50) {
                result.merchant = firstLine;
            }
        }

        return result;
    }

    /**
     * Validate if file is a supported image format for Groq Vision API
     * Groq supports: JPEG, PNG, GIF, WEBP
     */
    static isValidImageFile(filename: string): boolean {
        // Groq Vision API supports these formats
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return validExtensions.includes(ext);
    }

    /**
     * Check if file is a general image (including all common formats)
     */
    static isImageFile(filename: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.svg'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return imageExtensions.includes(ext);
    }
}

export default OCRService;
