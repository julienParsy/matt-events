// @feature logo

/**
 * Réduit une image avant l'envoi (PNG, transparence conservée).
 * Une photo de plusieurs Mo devient un fichier de quelques dizaines de Ko,
 * ce qui allège la barre de navigation et le favicon pour chaque visiteur.
 * Les images déjà petites (et les SVG) sont renvoyées telles quelles.
 */
export async function resizeImage(file, maxSize = 512) {
    if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml') return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 200 * 1024) {
        bitmap.close();
        return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.png';
    return new File([blob], name, { type: 'image/png' });
}
