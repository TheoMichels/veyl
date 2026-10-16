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

test.describe('Veyl — Parcours E2E Expo Web & SQLite Local', () => {
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
    request,
  }) => {
    // S'assurer qu'au moins une synthèse IA existe pour tester le bouton go-further-btn-0
    await request.post('/api/digests', {
      data: {
        category: 'IA',
        title: 'Synthèse IA du jour — Test E2E',
        content: '## Modèles & Agents\n* **Nouvelle avancée en IA générative** : Les modèles multimodaux progressent rapidement sur le raisonnement complexe.',
      },
    }).catch(() => {
      // Si POST /api/digests n'est pas exposé, le seed/cron de la base locale fournit la synthèse
    });

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

    const closeBtn = page.getByTestId('expanded-details-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(expandedCard).toBeHidden();
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

    // 5. Rechargement complet de la page et vérification de la persistance SQLite (AC-06)
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
});
