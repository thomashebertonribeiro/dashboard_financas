import fs from 'fs'
import path from 'path'
import { createWorker } from 'tesseract.js'
import { documentRepository } from '../repositories/documentRepository'
import { ocrLogRepository } from '../repositories/ocrLogRepository'
import type { Document } from '../types'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export const ocrService = {
    async upload(userId: string, file: Express.Multer.File): Promise<{ document: Document }> {
        ensureDir(UPLOAD_DIR)

        const ext = path.extname(file.originalname)
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
        const filePath = path.join(UPLOAD_DIR, filename)

        fs.writeFileSync(filePath, file.buffer)

        const document = await documentRepository.create(userId, {
            file_name: file.originalname,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.mimetype,
        })

        const ocrLog = await ocrLogRepository.create(userId, {
            document_id: document.id,
            status: 'pending',
        })

        // Process OCR asynchronously
        this.processDocument(userId, document.id!, ocrLog.id!).catch(err => {
            console.error('OCR processing error:', err)
        })

        return { document }
    },

    async processDocument(userId: string, documentId: string, ocrLogId: string): Promise<void> {
        const document = await documentRepository.findById(userId, documentId)
        if (!document) throw new Error('Documento não encontrado')

        await ocrLogRepository.update(userId, ocrLogId, { status: 'processing' })

        const startTime = Date.now()

        try {
            const worker = await createWorker('por')
            const { data } = await worker.recognize(document.file_path)
            await worker.terminate()

            const processingTime = Date.now() - startTime
            const rawText = data.text.trim()

            const parsed = this.parseOcrText(rawText)

            await ocrLogRepository.update(userId, ocrLogId, {
                status: 'completed',
                raw_text: rawText,
                parsed_data: parsed,
                confidence: Math.round(data.confidence) / 100,
                processing_time_ms: processingTime,
            })
        } catch (err: any) {
            const processingTime = Date.now() - startTime
            await ocrLogRepository.update(userId, ocrLogId, {
                status: 'failed',
                error_message: err.message || 'Erro desconhecido no OCR',
                processing_time_ms: processingTime,
            })
        }
    },

    parseOcrText(text: string): Record<string, unknown> | null {
        if (!text) return null

        const result: Record<string, unknown> = {}

        // Try to extract amount (BRL format: R$ 1.234,56 or 1234,56)
        const amountMatch = text.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/)
        if (amountMatch) {
            const numStr = amountMatch[1].replace(/\./g, '').replace(',', '.')
            result.amount = parseFloat(numStr)
        }

        // Try to extract date (dd/mm/yyyy, dd-mm-yyyy)
        const dateMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
        if (dateMatch) {
            result.date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
        }

        // First line often contains establishment/description
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
            result.description = lines[0]
        }

        return Object.keys(result).length > 0 ? result : null
    },

    async listDocuments(userId: string) {
        const docs = await documentRepository.findAll(userId)

        const result = await Promise.all(
            docs.map(async (doc: Document) => {
                const ocr = await ocrLogRepository.findByDocument(userId, doc.id!)
                return { ...doc, ocr }
            })
        )

        return result
    },

    async getDocumentWithOcr(userId: string, documentId: string) {
        const doc = await documentRepository.findById(userId, documentId)
        if (!doc) return null

        const ocr = await ocrLogRepository.findByDocument(userId, documentId)
        return { ...doc, ocr }
    },

    async deleteDocument(userId: string, documentId: string): Promise<void> {
        const doc = await documentRepository.findById(userId, documentId)
        if (!doc) throw new Error('Documento não encontrado')

        // Delete file from disk
        if (fs.existsSync(doc.file_path)) {
            fs.unlinkSync(doc.file_path)
        }

        await documentRepository.delete(userId, documentId)
    },
}