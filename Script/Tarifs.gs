
// @ts-nocheck
/**
 * Trouve la ligne d'en-tête (celle où apparaissent "Catégorie", "Prix min", "Prix max", "Unité", "Notes").
  * Retourne l'index (0-based) ou -1 si introuvable.
   */
   function findHeaderRow_(values) {
     const headerKeys = ['catégorie', 'prix min', 'prix max', 'unité', 'notes'];
       for (let i = 0; i < Math.min(values.length, 20); i++) {
           const row = values[i].map(v => String(v || '').toLowerCase());
               const hitCount = headerKeys.reduce((n, key) => n + (row.some(c => c.includes(key)) ? 1 : 0), 0);
                   if (hitCount >= 3) return i;
                     }
                       return -1;
                       }

                       /**
                        * Convertit une feuille en lignes "lisibles" pour l’IA.
                         * S'attend à une entête quelque part dans les ~20 premières lignes.
                          */
                          function sheetToBullets_(sheet) {
                            const values = sheet.getDataRange().getValues();
                              const headerRow = findHeaderRow_(values);
                                if (headerRow === -1) return [];

                                  const headers = values[headerRow].map(h => String(h || '').trim().toLowerCase());
                                    const getIdx = (labelCandidates) => {
                                        return labelCandidates
                                              .map(l => headers.findIndex(h => h.includes(l)))
                                                    .find(idx => idx !== -1);
                                                      };

                                                        const idxCat   = getIdx(['catégorie', 'categorie']);
                                                          const idxMin   = getIdx(['prix min']);
                                                            const idxMax   = getIdx(['prix max']);
                                                              const idxUnit  = getIdx(['unité', 'unite']);
                                                                const idxNotes = getIdx(['notes']);

                                                                  const out = [];
                                                                    for (let r = headerRow + 1; r < values.length; r++) {
                                                                        const row = values[r];
                                                                            // ignore lignes vides ou de séparation
                                                                                const rawCat = row[idxCat] !== undefined ? String(row[idxCat]).trim() : '';
                                                                                    if (!rawCat || rawCat === 'nan') continue;

                                                                                        const min = idxMin !== undefined && idxMin >=0 ? row[idxMin] : '';
                                                                                            const max = idxMax !== undefined && idxMax >=0 ? row[idxMax] : '';
                                                                                                const unit = idxUnit !== undefined && idxUnit >=0 ? row[idxUnit] : '';
                                                                                                    const notes = idxNotes !== undefined && idxNotes >=0 ? row[idxNotes] : '';

                                                                                                        // formats propres
                                                                                                            const fmt = (v) => (v !== '' && !isNaN(v)) ? Number(v).toFixed(2) : String(v || '');
                                                                                                                const minStr = fmt(min);
                                                                                                                    const maxStr = fmt(max);

                                                                                                                        // * Catégorie : 45.00 € à 65.00 € / h — Notes
                                                                                                                            const line = `* ${rawCat} : ${minStr} € à ${maxStr} € / ${unit || ''}${notes ? ' — ' + notes : ''}`;
                                                                                                                                out.push(line);
                                                                                                                                  }
                                                                                                                                    return out;
                                                                                                                                    }

                                                                                                                                    /** Concatène plusieurs onglets tarifs + préfixe "section" par onglet */
                                                                                                                                    function buildTarifsFromSheets_() {
                                                                                                                                      const ss = SpreadsheetApp.openById(SHEET_ID);
                                                                                                                                        let bullets = [];
                                                                                                                                          SHEETS_TARIFS.forEach(name => {
                                                                                                                                              const sh = ss.getSheetByName(name);
                                                                                                                                                  if (!sh) return; // ignore si absent
                                                                                                                                                      const lines = sheetToBullets_(sh);
                                                                                                                                                          if (lines.length) {
                                                                                                                                                                bullets.push(`\n### ${name} ###`);
                                                                                                                                                                      bullets = bullets.concat(lines);
                                                                                                                                                                          }
                                                                                                                                                                            });
                                                                                                                                                                              return bullets.join('\n');
                                                                                                                                                                              }

                                                                                                                                                                              /** Lit l’onglet "C) Directives" (clé / valeur) et assemble un petit préambule */
                                                                                                                                                                              function buildDirectives_() {
                                                                                                                                                                                const ss = SpreadsheetApp.openById(SHEET_ID);
                                                                                                                                                                                  const sh = ss.getSheetByName(SHEET_DIRECTIVES);
                                                                                                                                                                                    if (!sh) return '';

                                                                                                                                                                                      const v = sh.getDataRange().getValues();
                                                                                                                                                                                        // tente d’identifier colonnes A et B
                                                                                                                                                                                          // cherche les libellés "A (clé)" / "B (valeur)" ou utilise colonnes 0/1
                                                                                                                                                                                            let startRow = 0;
                                                                                                                                                                                              if (String(v[0][0]).toLowerCase().includes('clé') || String(v[0][1]).toLowerCase().includes('valeur')) {
                                                                                                                                                                                                  startRow = 1;
                                                                                                                                                                                                    }
                                                                                                                                                                                                      const kv = {};
                                                                                                                                                                                                        for (let r = startRow; r < v.length; r++) {
                                                                                                                                                                                                            const k = String(v[r][0] || '').trim();
                                                                                                                                                                                                                const val = String(v[r][1] || '').trim();
                                                                                                                                                                                                                    if (k) kv[k] = val;
                                                                                                                                                                                                                      }

                                                                                                                                                                                                                        const contexte = kv['contexte'] || "Papo-Rénov — rénovation intérieure (13)";
                                                                                                                                                                                                                          const condition = kv['condition'] || "Courtage offert si pose assurée par Papo-Rénov";
                                                                                                                                                                                                                            const ton = kv['ton'] || "Professionnel, transparent, orienté solutions";
                                                                                                                                                                                                                              const sortie = kv['sortie'] || "Réponds en HTML uniquement (h3, p, strong, br)";

                                                                                                                                                                                                                                return `
                                                                                                                                                                                                                                ### CONTEXTE ET DIRECTIVES ###
                                                                                                                                                                                                                                - ${contexte}
                                                                                                                                                                                                                                - ${condition}
                                                                                                                                                                                                                                - Ton: ${ton}
                                                                                                                                                                                                                                - ${sortie}
                                                                                                                                                                                                                                - TVA: 20% (10% si logement > 2 ans). Fournir une fourchette TTC.
                                                                                                                                                                                                                                `.trim();
                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                /** Cache 10 min */
                                                                                                                                                                                                                                function getBaseTarifs() {
                                                                                                                                                                                                                                  const cache = CacheService.getScriptCache();
                                                                                                                                                                                                                                    const key = 'BASE_TARIFS_V2';
                                                                                                                                                                                                                                      let txt = cache.get(key);
                                                                                                                                                                                                                                        if (!txt) {
                                                                                                                                                                                                                                            const header = buildDirectives_();
                                                                                                                                                                                                                                                const tarifs = buildTarifsFromSheets_();
                                                                                                                                                                                                                                                    txt = `${header}\n\n### TARIFS (issus de Google Sheets) ###\n${tarifs}`.trim();
                                                                                                                                                                                                                                                        cache.put(key, txt, 600);
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                            return txt;
                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                            // Optionnel: GET ?refresh=1 pour vider le cache
                                                                                                                                                                                                                                                            function doGet(e) {
                                                                                                                                                                                                                                                              if (e?.parameter?.refresh === '1') {
                                                                                                                                                                                                                                                                  CacheService.getScriptCache().remove('BASE_TARIFS_V2');
                                                                                                                                                                                                                                                                      return ContentService.createTextOutput('Cache vidé.').setMimeType(ContentService.MimeType.TEXT);
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                          return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
                                                                                                                                                                                                                                                                          }
