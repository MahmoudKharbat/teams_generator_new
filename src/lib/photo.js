// Player photos are shrunk in the browser to a small square image and stored as a data URL on the
// player's Firestore document (no Firebase Storage needed). At 256px they are ~15-30 KB each.

const SIZE = 256;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image'));
    };
    img.src = url;
  });

// Crops a square (biased towards the top of portrait photos, where the face usually is) and resizes it.
export async function photoFromFile(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('The image is too large (max 20 MB)');

  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) * 0.25;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

  // Safari can't encode WebP and silently returns PNG (much larger), so fall back to JPEG there.
  const webp = canvas.toDataURL('image/webp', 0.82);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

// Only accept image data URLs from the database, never arbitrary URLs.
export const isPhoto = (value) => typeof value === 'string' && /^data:image\/(webp|jpeg|png);base64,/.test(value);
