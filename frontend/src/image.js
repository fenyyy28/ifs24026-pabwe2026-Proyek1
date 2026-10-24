// Kecilkan foto dari kamera HP (sering 5-10 MB) sebelum diunggah.
export function compressImage(file, maxSide = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
