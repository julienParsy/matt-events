// @feature pdf
// Téléchargement et ouverture des PDF renvoyés par l'API (réponses axios en responseType 'blob').

/** Nom de fichier donné par le serveur (Content-Disposition), sinon celui par défaut */
export function fileNameFrom(res, fallback) {
    const disposition = res.headers?.['content-disposition'] || '';
    return disposition.match(/filename="?([^";]+)"?/)?.[1] || fallback;
}

/** Enregistre le PDF sur l'ordinateur */
export function savePdf(res, fallbackName) {
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileNameFrom(res, fallbackName));
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Ouvre un PDF dans un nouvel onglet.
 * L'onglet est ouvert tout de suite (au clic) pour ne pas être bloqué par le navigateur,
 * puis rempli quand le PDF est prêt.
 */
export async function openPdf(request) {
    const tab = window.open('', '_blank');
    try {
        const res = await request();
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        if (tab) tab.location.href = url;
        else window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
        tab?.close();
        throw err;
    }
}

/** Message d'erreur lisible depuis une réponse en blob (JSON d'erreur du serveur) */
export async function blobErrorMessage(err, fallback) {
    const data = err?.response?.data;
    if (data instanceof Blob) {
        try {
            return JSON.parse(await data.text()).message || fallback;
        } catch {
            return fallback;
        }
    }
    return data?.message || fallback;
}
