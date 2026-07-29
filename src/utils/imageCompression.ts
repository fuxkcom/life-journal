// src/utils/imageCompression.ts
// 上传前压缩图片：限制最长边、转码为 JPEG，显著减少上传/存储/加载体积

interface CompressOptions {
  maxDimension?: number // 长边最大像素
  quality?: number // 0-1
  mimeType?: string
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: 'image/jpeg',
}

/**
 * 压缩单张图片文件。GIF 原样返回（避免破坏动图），其余格式统一
 * 按比例缩放到 maxDimension 以内并重新编码。
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  if (file.type === 'image/gif') {
    return file
  }

  const { maxDimension, quality, mimeType } = { ...DEFAULT_OPTIONS, ...options }

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  // 尺寸已经足够小且不需要转码时，不必重新编码
  if (scale === 1 && file.type === mimeType && file.size < 500 * 1024) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  )

  if (!blob) return file

  // 压缩后反而更大（比如已经是高压缩率的图）就用原图
  if (blob.size >= file.size) return file

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], newName, { type: mimeType, lastModified: Date.now() })
}

/**
 * 批量压缩，单张失败不影响其他图片（失败时回退为原图）。
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(
    files.map(async (file) => {
      try {
        return await compressImage(file, options)
      } catch (error) {
        console.warn('图片压缩失败，使用原图上传:', file.name, error)
        return file
      }
    })
  )
}
