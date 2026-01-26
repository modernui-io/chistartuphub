// validate-url.js
// Free URL validation - checks if website is live

/**
 * Validate if a URL is live and responding
 * @param {string} url - The URL to validate
 * @param {number} timeout - Timeout in ms (default 5000)
 * @returns {Promise<{valid: boolean, status: number, redirectUrl?: string, responseTime: number}>}
 */
export async function validateUrl(url, timeout = 5000) {
  if (!url) {
    return { valid: false, status: 0, responseTime: 0, error: 'No URL provided' }
  }

  // Normalize URL
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InvestorEnrichment/1.0)'
      }
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      valid: response.ok,
      status: response.status,
      finalUrl: response.url,
      redirected: response.redirected,
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Try GET if HEAD fails (some servers don't support HEAD)
    if (error.name !== 'AbortError') {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(normalizedUrl, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; InvestorEnrichment/1.0)'
          }
        })

        clearTimeout(timeoutId)

        return {
          valid: response.ok,
          status: response.status,
          finalUrl: response.url,
          redirected: response.redirected,
          responseTime: Date.now() - startTime
        }
      } catch (retryError) {
        return {
          valid: false,
          status: 0,
          responseTime,
          error: retryError.message
        }
      }
    }

    return {
      valid: false,
      status: 0,
      responseTime,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    }
  }
}

/**
 * Batch validate multiple URLs
 * @param {string[]} urls - Array of URLs to validate
 * @param {number} concurrency - Max concurrent requests (default 5)
 * @returns {Promise<Map<string, object>>}
 */
export async function validateUrls(urls, concurrency = 5) {
  const results = new Map()
  const queue = [...urls]

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()
      if (url) {
        results.set(url, await validateUrl(url))
      }
    }
  }

  // Run workers in parallel
  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => worker())

  await Promise.all(workers)
  return results
}

/**
 * Get URL validation score contribution
 * @param {object} validation - Result from validateUrl
 * @returns {number} Score 0-100
 */
export function getUrlValidationScore(validation) {
  if (!validation) return 0

  if (validation.valid) {
    // Live site with HTTPS
    if (validation.finalUrl?.startsWith('https://')) {
      return 100
    }
    // Live site with HTTP
    return 90
  }

  // Site responded but with error
  if (validation.status >= 400 && validation.status < 500) {
    return 30 // Client error, might be blocking bots
  }

  if (validation.status >= 500) {
    return 20 // Server error
  }

  // Timeout or network error
  return 10
}

export default {
  validateUrl,
  validateUrls,
  getUrlValidationScore
}
