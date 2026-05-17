/**
 * Extracts base64 string from data URL
 */
const getBase64Data = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

/**
 * Extracts mimeType from data URL
 */
const getMimeType = (dataUrl: string) => {
  const match = dataUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Step 1: Analyze Reference Image
 */
export async function analyzeReferenceImage(refImageDataUrl: string): Promise<string> {
  const base64Data = getBase64Data(refImageDataUrl);
  const mimeType = getMimeType(refImageDataUrl);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType })
  });
  
  if (!res.ok) {
    throw new Error('Failed to analyze image from backend');
  }
  
  const data = await res.json();
  return data.text || "";
}

/**
 * Step 2: Generate Blended Image
 */
export async function generateBlendedImage(productImageDataUrl: string, styleDescription: string, intensity: number = 50): Promise<string | null> {
  const base64Data = getBase64Data(productImageDataUrl);
  const mimeType = getMimeType(productImageDataUrl);

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType, intensity, styleDescription })
  });
  
  if (!res.ok) {
    throw new Error('Failed to generate image from backend');
  }

  const data = await res.json();
  return data.image || null;
}
