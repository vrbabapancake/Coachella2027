/**
 * share.js
 * Encodes a pick list into a URL-safe base64 string and back.
 */

export function encodePicks(picks, userName) {
  const payload = { picks, userName, createdAt: Date.now(), version: 1 }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

export function decodePicks(encoded) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))))
  } catch {
    return null
  }
}

export function getShareUrl(picks, userName) {
  const encoded = encodePicks(picks, userName)
  const base = window.location.origin + window.location.pathname
  return `${base}#shared/${encoded}`
}

export function getSharedPicksFromUrl() {
  const hash = window.location.hash
  const match = hash.match(/^#shared\/(.+)/)
  if (!match) return null
  return decodePicks(match[1])
}
