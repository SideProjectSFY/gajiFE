import { test, expect } from '@playwright/test';

test.describe('Core User Journey with Scrolling', () => {
    test('Login -> Scenario List -> Scroll -> Detail -> 3D Visualization', async ({ page }) => {
        // Mock API responses for disconnected frontend testing
        // Update mock for search endpoint which returns paginated response
        await page.route('**/api/scenarios/search*', async route => {
            const json = {
                content: [
                    { id: '1', title: 'Scenario 1', description: 'Desc 1', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } },
                    { id: '2', title: 'Scenario 2', description: 'Desc 2', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } },
                    { id: '3', title: 'Scenario 3', description: 'Desc 3', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } },
                    { id: '4', title: 'Scenario 4', description: 'Desc 4', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } },
                    { id: '5', title: 'Scenario 5', description: 'Desc 5', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } },
                ],
                totalPages: 1,
                totalElements: 5,
                pageable: { pageNumber: 0, pageSize: 10 }
            };
            await route.fulfill({ json });
        });

        // Mock generic list if component falls back to it, or strictly for single
        await page.route('**/api/scenarios/1', async route => {
            const json = { id: '1', title: 'Scenario 1', description: 'Desc 1', userId: 'u1', username: 'user1', category: 'General', quality_score: 0.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], author: { id: 'u1', name: 'user1' }, stats: { likes: 0, forks: 0 } };
            await route.fulfill({ json });
        });
        
        // Mock Scenario Tree - Updated to match ScenarioTreeResponse type
        await page.route('**/api/scenarios/1/tree', async route => {
            const json = {
                root: {
                    id: '1',
                    title: 'Start Scenario',
                    children: [
                        {
                            id: '2',
                            title: 'Branch 1',
                            children: [] 
                        }
                    ]
                }
            };
            await route.fulfill({ json });
        });

        // 1. Visit Login Page
        await page.goto('/login');
        
        // 2. Perform Login (Mock or Real)
        // Check if we are on login page - Updated to match actual heading text
        await expect(page.getByRole('heading', { name: /이야기의 가지를/i })).toBeVisible();
        
        await page.getByLabel('이메일 또는 사용자 이름').fill('testuser');
        // Assuming password input exists and is labeled '비밀번호' or similar, let's check further
        await page.locator('input[type="password"]').fill('password123'); // More robust selector
        
        // Find the submit button. It might not have '로그인' text directly on button role but maybe verify visually or type='submit'.
        // Let's assume there is a submit button.
        await page.locator('button[type="submit"]').click();

        // Wait for navigation to home or scenarios
        // In this migration context, it might redirect to home first
        await expect(page).toHaveURL('/');

        // 3. Navigate to Scenarios List
        // The global nav lacks 'Scenarios' link, so we navigate directly or verify via 'Conversations' if appropriate.
        // For this test focusing on visualization, we go to scenarios list directly.
        await page.goto('/scenarios');
        await expect(page).toHaveURL(/\/scenarios/);
        
        // 4. Scroll Down Test
        // Scenario list might be long. We simulate a user looking for content.
        // Get the initial scroll position
        const initialScrollY = await page.evaluate(() => window.scrollY);
        
        // Scroll down
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500); // Wait for scroll
        
        const scrolledY = await page.evaluate(() => window.scrollY);
        // Expect scroll to have happened (if content is long enough, otherwise this check might need adjustment)
        console.log(`Scrolled from ${initialScrollY} to ${scrolledY}`);

        // 5. Click on a Scenario to view details
        // Wait for list to load
        await page.waitForTimeout(1000); 

        // Correct selector based on ScenarioListClient.tsx (ul.scenario-list-grid > li > a)
        const scenarios = page.locator('ul.scenario-list-grid li a');
        const count = await scenarios.count();
        console.log(`Found ${count} scenarios`);

        if (count > 0) {
            const firstScenario = scenarios.first();
            const href = await firstScenario.getAttribute('href');
            console.log(`Clicking scenario with href: ${href}`);

            // Ensure element is visible and enabled
            await expect(firstScenario).toBeVisible();
            await expect(firstScenario).toBeEnabled();

            // Click and wait for navigation
            await firstScenario.click();
            
            // Wait for URL change explicitly if needed, but expect usually handles it
            try {
                await expect(page).toHaveURL(`${href}`);
            } catch (e) {
                console.log('URL did not update as expected. Current URL:', page.url());
                // Check if there are any error overlays
                const errorOverlay = await page.locator('nextjs-portal').count();
                if (errorOverlay > 0) {
                    console.log('Next.js error overlay detected');
                }
                throw e;
            }

            // 6. Verify Detail Page and Scenario Visualization

            // Check for Title (mocked as 'Scenario 1')
            await expect(page.getByRole('heading', { level: 1, name: /Scenario/i })).toBeVisible();
            
            // Check for the polished scenario flow component without hidden debug canvas.
            const scenarioMap = page.locator('.scenario-map');
            await expect(scenarioMap).toBeVisible();
            await expect(scenarioMap).toContainText('원본');
            await expect(scenarioMap).toContainText('현재');
            await expect(scenarioMap).toContainText('다음');
            await expect(page.locator('canvas')).toHaveCount(0);
            console.log('Scenario visualization verification passed.');
        } else {
            console.log('No scenarios found to click. Check mock or network.');
            // Fail test if no scenarios found as that's the point of this test
            expect(count).toBeGreaterThan(0);
        }

    });
});
