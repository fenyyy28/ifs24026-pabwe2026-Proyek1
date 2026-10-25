// Pembungkus dialog konfirmasi browser, dipisah agar composable mudah diuji.
export const konfirmasi = (pesan) => typeof window !== 'undefined' && window.confirm(pesan)
