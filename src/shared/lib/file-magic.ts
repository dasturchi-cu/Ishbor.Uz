/** Magic-byte tekshiruvi — MIME spoof oldini olish */

const SIGS: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
}

function matchesSignature(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false
  return sig.every((b, i) => bytes[i] === b)
}

export async function validateFileMagicBytes(file: File): Promise<boolean> {
  const expected = SIGS[file.type]
  if (!expected) return false
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  return expected.some((sig) => matchesSignature(head, sig))
}
