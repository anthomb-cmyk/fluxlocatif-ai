// Gabarit commun des courriels FluxLocatif.
//
// Contraintes propres au courriel, qui expliquent le style du code ci-dessous:
// - Pas de feuille de style externe ni de <style> fiable: tout est en attribut
//   style, en ligne.
// - Pas de flexbox ni de grid: on met en page avec des tableaux, la seule
//   construction que tous les clients de messagerie rendent correctement.
// - Pas de couleur de fond sur un <a> avec du padding: le bloc se brise en deux
//   des que le texte passe a la ligne. Le fond va sur la cellule du tableau.
// - Largeur bornee a 600px, et 100% en dessous, pour tenir sur un telephone.
//
// Structure reprise de la revue de design de juillet 2026: filet de couleur au
// lieu du bandeau plein, pastille de logo dessinee en cellule de tableau plutot
// qu'en image (elle survit aux clients qui bloquent les images), lien de secours
// dans un encadre, hauteurs de ligne fixees pour Outlook.
//
// La revue proposait aussi de passer la marque au bleu #2563eb. On garde
// l'indigo du portail: un client qui recoit le courriel arrive sur client.html,
// et deux identites differentes entre les deux se remarquent tout de suite.

// Memes valeurs que les variables de www/client.css, pour que le courriel et le
// portail soient la meme marque.
const MARQUE = {
  indigo:  "#4f46e5", // --indigo, boutons et accents
  titre:   "#191d45", // --heading
  corps:   "#1f2350", // --text
  attenue: "#5b6172", // --muted-strong
  faible:  "#6b7280", // --muted, garde un contraste lisible sur blanc
  bordure: "#e5e7eb", // --line-strong
  surface: "#fafbfd", // --surface-soft
  fond:    "#f5f7fb"  // --bg
};

const POLICE = "Arial,Helvetica,sans-serif";

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
    .map((p) => `<p style="margin:0 0 14px;font-family:${POLICE};font-size:16px;line-height:26px;mso-line-height-rule:exactly;color:${MARQUE.corps};">${p}</p>`)
    .join("");

  const bouton = boutonTexte && boutonLien
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
                <tr>
                  <td align="center" bgcolor="${MARQUE.indigo}" style="background-color:${MARQUE.indigo};border-radius:8px;">
                    <a href="${boutonLien}" style="display:block;padding:15px 30px;font-family:${POLICE};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;line-height:20px;mso-line-height-rule:exactly;">${echapper(boutonTexte)}</a>
                  </td>
                </tr>
              </table>`
    : "";

  const noteHtml = note
    ? `
              <p style="margin:16px 0 0;font-family:${POLICE};font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:${MARQUE.attenue};">${note}</p>`
    : "";

  const lienSecours = boutonTexte && boutonLien
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:22px 0 0;background-color:${MARQUE.surface};border:1px solid ${MARQUE.bordure};border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;font-family:${POLICE};font-size:13px;line-height:20px;mso-line-height-rule:exactly;color:${MARQUE.attenue};">
                    Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur&nbsp;:<br>
                    <a href="${boutonLien}" style="color:${MARQUE.indigo};text-decoration:underline;word-break:break-all;">${echapper(boutonLien)}</a>
                  </td>
                </tr>
              </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${echapper(titre)}</title>
<style type="text/css">
  @media only screen and (max-width:620px) {
    .fl-pad { padding-left:24px !important; padding-right:24px !important; }
    .fl-h1 { font-size:21px !important; line-height:29px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${MARQUE.fond};">
  <span style="display:none;font-size:1px;color:${MARQUE.fond};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${echapper(preheader || titre)}</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${MARQUE.fond};">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:16px;border:1px solid ${MARQUE.bordure};">

          <tr>
            <td height="4" bgcolor="${MARQUE.indigo}" style="height:4px;background-color:${MARQUE.indigo};border-radius:16px 16px 0 0;font-size:1px;line-height:4px;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:26px 40px 0;" class="fl-pad">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" valign="middle" style="width:40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="40" style="width:40px;">
                      <tr><td align="center" valign="middle" bgcolor="${MARQUE.indigo}" height="40" style="width:40px;height:40px;background-color:${MARQUE.indigo};border-radius:11px;font-family:${POLICE};font-size:15px;font-weight:bold;color:#ffffff;line-height:40px;mso-line-height-rule:exactly;letter-spacing:0.5px;">FL</td></tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:12px;font-family:${POLICE};">
                    <div style="font-size:15px;font-weight:bold;color:${MARQUE.titre};line-height:20px;mso-line-height-rule:exactly;">FluxLocatif</div>
                    <div style="font-size:12px;color:${MARQUE.faible};line-height:18px;mso-line-height-rule:exactly;">Portail propriétaire</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 30px;" class="fl-pad">
              <h1 class="fl-h1" style="margin:0 0 16px;font-family:${POLICE};font-size:24px;line-height:32px;mso-line-height-rule:exactly;font-weight:bold;color:${MARQUE.titre};">${echapper(titre)}</h1>
              ${corpsParagraphes}${bouton}${noteHtml}${lienSecours}
            </td>
          </tr>

          <tr>
            <td style="padding:18px 40px 30px;border-top:1px solid ${MARQUE.bordure};font-family:${POLICE};font-size:12px;line-height:20px;mso-line-height-rule:exactly;color:${MARQUE.faible};" class="fl-pad">
              FluxLocatif, service locatif externalisé<br>
              <a href="https://client.fluxlocatif.com" style="color:${MARQUE.attenue};text-decoration:underline;">client.fluxlocatif.com</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:equipe@fluxlocatif.com" style="color:${MARQUE.attenue};text-decoration:underline;">equipe@fluxlocatif.com</a><br><br>
              Ce courriel vous est envoyé parce que vous utilisez FluxLocatif. Il ne contient aucune publicité.
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
