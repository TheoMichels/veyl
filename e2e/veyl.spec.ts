import { test as base, expect } from '@playwright/test';

/**
 * Fixture étendue avec garde d'erreurs console et exceptions page non gérées.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignorer uniquement les erreurs réseau volontairement provoquées par les tests négatifs HTTP 400
          if (!text.includes('Failed to load resource: the server responded with a status of 400')) {
            errors.push(`[console.error] ${text}`);
          }
        }
      });
      page.on('pageerror', (err) => {
        errors.push(`[pageerror] ${err.message}`);
      });

      await use(errors);

      expect(errors, `Des erreurs console ou exceptions non gérées ont été détectées :\n${errors.join('\n')}`).toEqual([]);
    },
    { auto: true },
  ],
});

test.describe('Veyl — Parcours E2E Expo Web statique & Mock API', () => {
  let mockSettings = {
    id: 'default',
    geminiPromptIA: 'Tu es un expert IA de haut niveau chargé de synthétiser la veille technologique.',
    geminiPromptLux: 'Tu es un analyste Tech & Business Luxembourg spécialisé dans le marché IT local.',
    geminiPromptTech: 'Tu es un analyste Tech, Hardware & Infra de pointe.',
    cronEnabled: true,
  };

  let mockSources: Array<{
    id: string;
    name: string;
    url: string;
    category: 'IA' | 'Luxembourg' | 'Tech';
    isActive: boolean;
  }> = [
    {
      id: 'source-1',
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      category: 'IA',
      isActive: true,
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const initialIaDigest = {
    id: 'digest-ia-1',
    category: 'IA' as const,
    title: 'Synthèse IA du jour — Test E2E',
    content: '## Modèles & Agents\n* **Nouvelle avancée en IA générative** : Les modèles multimodaux progressent rapidement sur le raisonnement complexe.',
    createdAt: new Date().toISOString(),
  };

  const initialLuxDigest = {
    id: 'digest-lux-1',
    category: 'Luxembourg' as const,
    title: 'Synthèse Luxembourg du jour — Test E2E',
    content: '## Marché & Emploi IT\n* **Forte demande de compétences cloud** : Les recrutements s’accélèrent au Luxembourg.',
    createdAt: new Date().toISOString(),
  };

  const initialTechDigest = {
    id: 'digest-tech-1',
    category: 'Tech' as const,
    title: 'Synthèse Tech du jour — Test E2E',
    content: '## Hardware & Infrastructure\n* **Nouveaux accélérateurs neuronaux** : Des gains substantiels en efficacité énergétique.',
    createdAt: new Date().toISOString(),
  };

  const mockGroupedDigests = [
    {
      dateStr: todayStr,
      displayDate: "Aujourd'hui",
      iaDigest: initialIaDigest,
      luxDigest: initialLuxDigest,
      techDigest: initialTechDigest,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route, request) => {
      const url = new URL(request.url());
      const method = request.method();

      if (url.pathname === '/api/digests') {
        if (method === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              groupedDigests: mockGroupedDigests,
              digests: [initialIaDigest, initialLuxDigest, initialTechDigest],
            }),
          });
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      if (url.pathname.startsWith('/api/cron/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Synthèses générées avec succès', digestsCreated: 3 }),
        });
      }

      if (url.pathname === '/api/go-further') {
        let postData: { text?: string } = {};
        try {
          postData = request.postDataJSON() || {};
        } catch {
          postData = {};
        }
        if (!postData.text || postData.text.trim().length === 0) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Le texte est requis pour approfondir.' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: 'Analyse approfondie de l’actualité sélectionnée avec perspectives stratégiques.',
            analysis: 'Analyse approfondie de l’actualité sélectionnée avec perspectives stratégiques.',
          }),
        });
      }

      if (url.pathname === '/api/settings') {
        if (method === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSettings),
          });
        }
        if (method === 'PUT') {
          try {
            const data = request.postDataJSON() || {};
            mockSettings = { ...mockSettings, ...data };
          } catch {}
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSettings),
          });
        }
      }

      if (url.pathname === '/api/sources') {
        if (method === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ sources: mockSources }),
          });
        }
        if (method === 'POST') {
          let data: { name?: string; url?: string; category?: string } = {};
          try {
            data = request.postDataJSON() || {};
          } catch {}
          if (!data.name || !data.name.trim() || !data.url || !data.url.startsWith('http') || !['IA', 'Luxembourg', 'Tech'].includes(data.category || '')) {
            return route.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Données de source invalides.' }),
            });
          }
          const createdSource = {
            id: `source-${Date.now()}`,
            name: data.name.trim(),
            url: data.url.trim(),
            category: data.category as 'IA' | 'Luxembourg' | 'Tech',
            isActive: true,
          };
          mockSources = [...mockSources, createdSource];
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ source: createdSource, id: createdSource.id }),
          });
        }
        if (method === 'PATCH') {
          let data: { id?: string; isActive?: boolean } = {};
          try {
            data = request.postDataJSON() || {};
          } catch {}
          mockSources = mockSources.map((s) =>
            s.id === data.id ? { ...s, isActive: data.isActive ?? s.isActive } : s
          );
          const found = mockSources.find((s) => s.id === data.id);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ source: found }),
          });
        }
        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          mockSources = mockSources.filter((s) => s.id !== id);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      }

      return route.continue();
    });
  });

  test('Parcours 1 (AC-02, AC-03) : Tableau de bord, bascule de thème Clair/Sombre, navigation par onglets et responsive mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Vérification du titre et de l'en-tête Veyl
    await expect(page.getByText('Veyl').first()).toBeVisible();

    // Bascule du thème Clair / Sombre
    const themeToggleBtn = page.getByTestId('theme-toggle-btn');
    await expect(themeToggleBtn).toBeVisible();
    await themeToggleBtn.click();
    await themeToggleBtn.click();

    // Navigation entre les 3 onglets de catégories
    const tabIA = page.getByTestId('tab-ia');
    const tabLux = page.getByTestId('tab-lux');
    const tabTech = page.getByTestId('tab-tech');

    await expect(tabIA).toBeVisible();
    await expect(tabLux).toBeVisible();
    await expect(tabTech).toBeVisible();

    await tabLux.click();
    await tabTech.click();
    await tabIA.click();

    // Affichage d'une synthèse ou de l'état vide explicite en français
    const hasEmptyState = await page.getByTestId('empty-state').isVisible().catch(() => false);
    const hasGoFurther = await page.getByTestId('go-further-btn-0').isVisible().catch(() => false);
    expect(
      hasEmptyState || hasGoFurther,
      'La vue principale doit afficher soit une synthèse avec ses points d’actualité, soit l’état vide explicite (empty-state)'
    ).toBe(true);

    // Test responsive mobile (375x812) vérifiant l'accordéon mobile-history-trigger
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileHistoryTrigger = page.getByTestId('mobile-history-trigger');
    await expect(mobileHistoryTrigger).toBeVisible();
    await mobileHistoryTrigger.click();
  });

  test('Parcours 2 (AC-04, AC-05) : Approfondissement IA (« Aller plus loin ») et bouton de génération quotidienne', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Vérification de la présence et de l'interactivité de generate-digest-btn (AC-05)
    const generateBtn = page.getByTestId('generate-digest-btn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeEnabled();

    // Si aucune synthèse n'est encore affichée, déclencher la génération
    const hasItemBefore = await page.getByTestId('go-further-btn-0').isVisible().catch(() => false);
    if (!hasItemBefore) {
      await generateBtn.click();
    }

    // Clic sur go-further-btn-0 et ouverture/fermeture de expanded-details-card (AC-04)
    const goFurtherBtn = page.getByTestId('go-further-btn-0');
    await expect(goFurtherBtn).toBeVisible({ timeout: 15000 });
    await goFurtherBtn.click();

    const expandedCard = page.getByTestId('expanded-details-card');
    await expect(expandedCard).toBeVisible();

    // Attendre que l'approfondissement IA apparaisse (texte généré et stocké)
    await expect(page.getByText('Analyse approfondie de l’actualité sélectionnée')).toBeVisible({ timeout: 10000 });

    const closeBtn = page.getByTestId('expanded-details-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(expandedCard).toBeHidden();

    // Quand le texte est masqué mais stocké sur la page, le bouton devient violet (AC)
    const sparkleSvg = goFurtherBtn.locator('svg');
    await expect(sparkleSvg).toHaveAttribute('stroke', /#(7C3AED|8B5CF6)/i);

    // Re-cliquer sur le bouton ré-affiche immédiatement le contenu sans recharger
    await goFurtherBtn.click();
    await expect(expandedCard).toBeVisible();

    // Re-cliquer sur le bouton masque à nouveau le texte et préserve la couleur violette
    await goFurtherBtn.click();
    await expect(expandedCard).toBeHidden();
    await expect(sparkleSvg).toHaveAttribute('stroke', /#(7C3AED|8B5CF6)/i);
  });

  test('Parcours 3 (AC-06, AC-07) : Paramètres Gemini, validation négative, CRUD Sources RSS et persistance après rechargement', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Navigation vers Paramètres
    const navSettingsBtn = page.getByTestId('nav-settings-btn');
    await expect(navSettingsBtn).toBeVisible();
    await navSettingsBtn.click();

    // 1. Test négatif de validation (AC-07) : URL invalide affiche error-banner
    const sourceNameInput = page.getByTestId('source-name-input');
    const sourceUrlInput = page.getByTestId('source-url-input');
    const addSourceBtn = page.getByTestId('add-source-btn');

    await expect(sourceNameInput).toBeVisible();
    await sourceNameInput.fill('Source Invalide E2E');
    await sourceUrlInput.fill('url-malformee-sans-http');
    await addSourceBtn.click();

    const errorBanner = page.getByTestId('error-banner');
    await expect(errorBanner).toBeVisible();

    // 2. Modification d'un prompt Gemini + sauvegarde (AC-06)
    const promptIAInput = page.getByTestId('prompt-ia-input');
    const saveSettingsBtn = page.getByTestId('save-settings-btn');
    await expect(promptIAInput).toBeVisible();

    const originalPrompt = await promptIAInput.inputValue();
    const marker = ` [E2E-${Date.now()}]`;
    const updatedPrompt = `${originalPrompt.replace(/\s*\[E2E-\d+\]/g, '')}${marker}`;

    await promptIAInput.fill(updatedPrompt);
    await saveSettingsBtn.click();

    // 3. Ajout d'une source RSS valide (AC-06)
    const uniqueSourceName = `Veyl E2E Source ${Date.now()}`;
    const uniqueSourceUrl = `https://veyl-e2e-${Date.now()}.example.com/rss.xml`;

    await sourceNameInput.fill(uniqueSourceName);
    await sourceUrlInput.fill(uniqueSourceUrl);

    const categorySelect = page.getByTestId('source-category-select');
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click().catch(() => {});
    }

    await addSourceBtn.click();
    await expect(page.getByText(uniqueSourceName)).toBeVisible();

    // 4. Bascule Actif / En pause sur la source créée
    const toggleButtons = page.locator('[data-testid^="toggle-source-"]');
    const toggleCount = await toggleButtons.count();
    expect(toggleCount).toBeGreaterThan(0);

    // Trouver le conteneur ou le dernier bouton correspondant à la source ajoutée
    const lastToggleBtn = toggleButtons.last();
    const toggleTestId = await lastToggleBtn.getAttribute('data-testid');
    expect(toggleTestId).toBeTruthy();
    const sourceId = toggleTestId!.replace('toggle-source-', '');

    await lastToggleBtn.click();

    // 5. Rechargement complet de la page et vérification de la persistance (AC-06)
    await page.reload();

    await page.getByTestId('nav-settings-btn').click();
    await expect(page.getByTestId('prompt-ia-input')).toHaveValue(updatedPrompt);
    await expect(page.getByText(uniqueSourceName)).toBeVisible();

    // 6. Suppression de la source de test et restauration du prompt initial
    const deleteBtn = page.getByTestId(`delete-source-${sourceId}`);
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await expect(page.getByText(uniqueSourceName)).toBeHidden();

    // Restauration propre du prompt initial
    const cleanPrompt = originalPrompt.replace(/\s*\[E2E-\d+\]/g, '');
    await page.getByTestId('prompt-ia-input').fill(cleanPrompt);
    await page.getByTestId('save-settings-btn').click();
  });

  test('L3 E2E : Badge de mode local et présence des clés de stockage @veyl_*_v1', async ({ page }) => {
    await page.goto('/');

    // Vérification du badge Stockage local dans le Header
    const storageBadge = page.getByTestId('storage-mode-badge');
    await expect(storageBadge).toBeVisible();
    await expect(storageBadge).toHaveText('Stockage local');

    // Vérification que les clés de stockage AsyncStorage sont bien préfixées @veyl_*_v1
    const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    const veylKeys = storageKeys.filter((k) => k.startsWith('@veyl_'));
    expect(veylKeys.length).toBeGreaterThanOrEqual(1);
    for (const key of veylKeys) {
      expect(key).toMatch(/^@veyl_[a-z]+_v1$/);
    }
  });
});

