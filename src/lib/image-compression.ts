// Compresión de imágenes en el cliente (Canvas nativo) antes de subirlas a Storage.

export interface CompressedImage {
  blob: Blob;
  width: number | null;
  height: number | null;
  mimeType: string;
}

// Lado mayor permitido; las imágenes más grandes se escalan manteniendo proporción.
const MAX_LONGEST_SIDE = 1920;
const WEBP_QUALITY = 0.8;

// Escala el tamaño original para que su lado mayor no supere el máximo (nunca agranda).
function targetSize(width: number, height: number): { width: number; height: number } {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_LONGEST_SIDE) return { width, height };

  const ratio = MAX_LONGEST_SIDE / longestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

// Convierte la imagen a WebP con Canvas. Si la compresión falla, devuelve el original.
export async function compressImage(file: File): Promise<CompressedImage> {
  try {
    const bitmap = await createImageBitmap(file);

    try {
      const { width, height } = targetSize(bitmap.width, bitmap.height);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo obtener el contexto 2D del canvas.");

      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
      });
      if (!blob) throw new Error("El canvas no pudo generar la imagen WebP.");

      return { blob, width, height, mimeType: "image/webp" };
    } finally {
      bitmap.close();
    }
  } catch {
    // Sin compresión: se sube el original (su mime ya está permitido por el bucket).
    return { blob: file, width: null, height: null, mimeType: file.type };
  }
}
