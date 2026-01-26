// parser.js
// File parsing utilities for CSV and Excel files

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Detect file type from extension
 */
export function detectFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  if (ext === 'csv') return 'csv'
  if (['xlsx', 'xls'].includes(ext)) return 'excel'
  return 'unknown'
}

/**
 * Parse a CSV file (RFC 4180 compliant)
 * Handles quoted fields with commas, newlines, and escaped quotes
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy', // Skip lines that are empty or only whitespace
      transformHeader: (header) => header.trim(),
      // RFC 4180 compliant options
      quoteChar: '"',
      escapeChar: '"', // Doubled quotes for escaping (RFC 4180)
      delimiter: ',',
      newline: '', // Auto-detect newlines
      // Error handling
      delimitersToGuess: [',', '\t', '|', ';'], // Fallback delimiters
      complete: (results) => {
        // Filter out completely empty rows
        const cleanedData = results.data.filter(row => {
          const values = Object.values(row)
          return values.some(v => v && String(v).trim() !== '')
        })

        resolve({
          data: cleanedData,
          errors: results.errors,
          meta: results.meta,
          rowsDropped: results.data.length - cleanedData.length
        })
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Parse an Excel file
 */
export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw: false
        })

        resolve({
          data: jsonData,
          sheetName,
          sheets: workbook.SheetNames
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse any supported file
 */
export async function parseFile(file) {
  const fileType = detectFileType(file.name)

  switch (fileType) {
    case 'csv':
      return parseCSV(file)
    case 'excel':
      return parseExcel(file)
    default:
      throw new Error(`Unsupported file type: ${file.name}`)
  }
}

/**
 * Detect column mappings from headers
 */
export function detectColumnMappings(headers) {
  const mappings = {}

  const fieldPatterns = {
    name: ['name', 'company', 'investor', 'firm', 'organization'],
    website: ['website', 'url', 'site', 'web', 'link'],
    description: ['description', 'about', 'bio', 'summary', 'overview'],
    location: ['location', 'city', 'hq', 'headquarters', 'address'],
    check_size: ['check', 'size', 'investment', 'amount', 'ticket'],
    stages: ['stage', 'stages', 'round'],
    sectors: ['sector', 'sectors', 'focus', 'industry', 'industries', 'vertical'],
    opportunity_type: ['type', 'investor type', 'category'],
    email: ['email', 'contact', 'e-mail'],
    chicago_focused: ['chicago', 'midwest', 'local']
  }

  for (const header of headers) {
    const lowerHeader = header.toLowerCase()

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (!mappings[field]) {
        for (const pattern of patterns) {
          if (lowerHeader.includes(pattern)) {
            mappings[field] = header
            break
          }
        }
      }
    }
  }

  return mappings
}

/**
 * Apply column mappings to data
 */
export function applyMappings(data, mappings) {
  return data.map(row => {
    const mapped = {}

    for (const [field, column] of Object.entries(mappings)) {
      if (column && row[column] !== undefined) {
        mapped[field] = row[column]
      }
    }

    return mapped
  })
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename = 'export.csv') {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

/**
 * Export data to Excel
 */
export function exportToExcel(data, filename = 'export.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Investors')
  XLSX.writeFile(workbook, filename)
}

/**
 * Export data to JSON
 */
export function exportToJSON(data, filename = 'export.json') {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export default {
  detectFileType,
  parseCSV,
  parseExcel,
  parseFile,
  detectColumnMappings,
  applyMappings,
  exportToCSV,
  exportToExcel,
  exportToJSON
}
