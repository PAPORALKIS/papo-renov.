// @ts-nocheck
function getGeminiKey_() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!key) throw new Error('Clé GEMINI_API_KEY manquante dans PropertiesService.');
      return key;
      }

      function doPost(e) {
        const p = e?.parameter || {};
          const nom = (p.nom || '').trim();
            const email = (p.email || '').trim();
              const tel = (p.tel || '').trim();
                const budget = (p.budget || '').trim();
                  const dimensions = (p.dimensions || '').trim();
                    const style = (p.style || '').trim();

                      const BASE_TARIFS = getBaseTarifs();

                        const prompt = `
                        En tant qu'IA de Papo-Rénov, génère une estimation indicative pour **la POSE d'une cuisine**.
                        Données client:
                        - Nom: ${nom || 'Non communiqué'}
                        - Budget fourniture (indicatif): ${budget || 'Non précisé'}
                        - Dimensions / description: ${dimensions || 'Non précisé'}
                        - Style: ${style || 'Non précisé'}

                        Exigences:
                        - Appuie-toi uniquement sur les TARIFS ci-dessous (montants en HT).
                        - Donne une fourchette **TTC** pour la pose (main-d’œuvre + déplacements), avec rappel du forfait déplacement.
                        - Rappelle que le **courtage est offert si la pose est assurée par Papo-Rénov**.
                        - **Sortie en HTML simple**: utilise <h3>, <p>, <strong>, <br> (aucun autre tag, pas de CSS/JS). 
                        - Sois concis, pro, avec un petit paragraphe "Étapes suivantes" (visite technique, prise de mesures, délai moyen).

                        --- BASE_TARIFS ---
                        ${BASE_TARIFS}
                        --- FIN BASE_TARIFS ---
                        `.trim();

                          let estimation_html = '';
                            try {
                                const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(getGeminiKey_());
                                    const payload = JSON.stringify({
                                          contents: [{ role: 'user', parts: [{ text: prompt }]}],
                                                generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
                                                    });
                                                        const res = UrlFetchApp.fetch(url, {
                                                              method: 'post',
                                                                    contentType: 'application/json',
                                                                          payload,
                                                                                muteHttpExceptions: true,
                                                                                    });
                                                                                        const json = JSON.parse(res.getContentText());
                                                                                            const text =
                                                                                                  json?.candidates?.[0]?.content?.parts?.[0]?.text
                                                                                                          ? String(json.candidates[0].content.parts[0].text).trim()
                                                                                                                  : '';

                                                                                                                      estimation_html = text
                                                                                                                            .replace(/```html?/gi, '')
                                                                                                                                  .replace(/```/g, '')
                                                                                                                                        .trim() || "<h3>Oups !</h3><p>Impossible de générer l'estimation cette fois. Réessaie.</p>";
                                                                                                                                          } catch (err) {
                                                                                                                                              estimation_html = "<h3>Erreur technique</h3><p>Problème de connexion au service IA. Merci de réessayer.</p>";
                                                                                                                                                }

                                                                                                                                                  try {
                                                                                                                                                      if (NOTIFY_EMAIL) {
                                                                                                                                                            MailApp.sendEmail(NOTIFY_EMAIL, 'Nouvelle demande courtage cuisine',
                                                                                                                                                                    `Nom: ${nom}\nEmail: ${email}\nTel: ${tel}\nBudget: ${budget}\nDimensions: ${dimensions}\nStyle: ${style}\n`);
                                                                                                                                                                        }
                                                                                                                                                                          } catch (errMail) {}

                                                                                                                                                                            const safe = encodeURIComponent(Utilities.base64Encode(estimation_html));
                                                                                                                                                                              const finalUrl = TARGET_URL + '?estimation=' + safe;
                                                                                                                                                                                const html = `<!doctype html><meta http-equiv="refresh" content="0; url=${finalUrl}">`;
                                                                                                                                                                                  return HtmlService.createHtmlOutput(html)
                                                                                                                                                                                      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
                                                                                                                                                                                      }
                                                                                                                                                                                      
