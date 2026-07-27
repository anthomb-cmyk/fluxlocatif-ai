// Gabarit commun des courriels FluxLocatif.
//
// Contraintes propres au courriel, qui expliquent le style du code ci-dessous:
// - Pas de feuille de style externe ni de <style> fiable: tout est en attribut
//   style, en ligne.
// - Pas de flexbox ni de grid: on met en page avec des tableaux, la seule
//   construction que tous les clients de messagerie rendent correctement.
// - Pas de couleur de fond sur un <a> avec du padding: le bloc se brise en deux
//   des que le texte passe a la ligne. Le fond va sur la cellule du tableau.
// - Largeur bornee a 560px, et 100% en dessous, pour tenir sur un telephone.

const MARQUE = {
  bleu:   "#1e90ff",
  indigo: "#4f46e5",
  mauve:  "#9333ea",
  texte:  "#1f2350",
  attenue: "#6b7280",
  bordure: "#e8eaf2",
  fond:    "#f5f7fb"
};

function echapper(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} options
 * @param {string} options.titre        Titre affiche en haut du contenu.
 * @param {string[]} options.paragraphes Paragraphes de texte, deja echappes ou surs.
 * @param {string} [options.boutonTexte]
 * @param {string} [options.boutonLien]
 * @param {string} [options.note]       Petite note grise sous le bouton.
 * @param {string} [options.preheader]  Texte d'apercu dans la liste des courriels.
 */
export function renderEmailLayout({ titre, paragraphes = [], boutonTexte, boutonLien, note, preheader }) {
  const corpsParagraphes = paragraphes
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${MARQUE.texte};">${p}</p>`)
    .join("");

  const bouton = boutonTexte && boutonLien
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
        <tr>
          <td align="center" bgcolor="${MARQUE.indigo}" style="border-radius:12px;">
            <a href="${boutonLien}"
               style="display:block;padding:15px 28px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              ${echapper(boutonTexte)}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px;font-size:12.5px;line-height:1.6;color:${MARQUE.attenue};">
        Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:
      </p>
      <p style="margin:0 0 6px;font-size:12.5px;line-height:1.6;word-break:break-all;">
        <a href="${boutonLien}" style="color:${MARQUE.indigo};">${echapper(boutonLien)}</a>
      </p>`
    : "";

  const noteHtml = note
    ? `<p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:${MARQUE.attenue};">${note}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echapper(titre)}</title>
</head>
<body style="margin:0;padding:0;background:${MARQUE.fond};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(preheader || titre)}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MARQUE.fond};padding:28px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${MARQUE.bordure};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

          <tr>
            <td style="background:${MARQUE.indigo};background-image:linear-gradient(135deg,${MARQUE.bleu} 0%,${MARQUE.indigo} 48%,${MARQUE.mauve} 100%);padding:24px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;">
                    <div style="width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.20);color:#ffffff;font-size:17px;font-weight:800;text-align:center;line-height:40px;">F</div>
                  </td>
                  <td>
                    <div style="color:#ffffff;font-size:17px;font-weight:800;line-height:1.2;">FluxLocatif</div>
                    <div style="color:rgba(255,255,255,.82);font-size:12.5px;line-height:1.4;">Optimisation locative</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 28px 26px;">
              <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:800;color:${MARQUE.texte};">${echapper(titre)}</h1>
              ${corpsParagraphes}
              ${bouton}
              ${noteHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${MARQUE.bordure};">
              <p style="margin:0;font-size:12.5px;line-height:1.6;color:${MARQUE.attenue};">
                FluxLocatif &middot; Optimisation locative pour propriétaires<br>
                Ce courriel vous est envoyé parce que vous utilisez FluxLocatif.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { echapper as echapperCourriel };
