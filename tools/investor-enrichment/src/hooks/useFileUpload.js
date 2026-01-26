// useFileUpload.js
// Custom hook for file upload handling

import { useState, useCallback } from 'react'
import { parseFile, detectColumnMappings, applyMappings } from '../lib/parser'
import { detectColumnMappingsForMode } from '../lib/modes'

export function useFileUpload(selectedMode) {
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mappings, setMappings] = useState({})
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Handle primary data file upload
  const handleFileUpload = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setFileName(file.name)

    try {
      const result = await parseFile(file)
      const data = result.data
      const detectedHeaders = Object.keys(data[0] || {})

      // Use mode-aware column detection if mode is selected
      const detectedMappings = selectedMode
        ? detectColumnMappingsForMode(detectedHeaders, selectedMode.id)
        : detectColumnMappings(detectedHeaders)

      setRawData(data)
      setHeaders(detectedHeaders)
      setMappings(detectedMappings)

      return { success: true, data, headers: detectedHeaders, mappings: detectedMappings }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [selectedMode])

  // Apply current mappings to raw data
  const getMappedData = useCallback(() => {
    return applyMappings(rawData, mappings)
  }, [rawData, mappings])

  // Reset file state
  const resetFileState = useCallback(() => {
    setRawData([])
    setHeaders([])
    setMappings({})
    setFileName('')
    setError(null)
  }, [])

  return {
    rawData,
    headers,
    mappings,
    setMappings,
    fileName,
    loading,
    error,
    setError,
    handleFileUpload,
    getMappedData,
    resetFileState
  }
}

export function useExistingDataUpload() {
  const [existingData, setExistingData] = useState([])
  const [existingFileName, setExistingFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleExistingUpload = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setExistingFileName(file.name)

    try {
      const result = await parseFile(file)
      setExistingData(result.data)
      return { success: true, data: result.data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearExistingData = useCallback(() => {
    setExistingData([])
    setExistingFileName('')
    setError(null)
  }, [])

  return {
    existingData,
    existingFileName,
    loading,
    error,
    handleExistingUpload,
    clearExistingData
  }
}

export default useFileUpload
