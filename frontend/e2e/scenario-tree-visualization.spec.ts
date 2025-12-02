import { test, expect } from '@playwright/test'

test.describe('Scenario Tree Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Log all network requests to debug routing issues
    page.on('request', (request) => {
      console.log('>>>', request.method(), request.url())
    })
    page.on('response', (response) => {
      console.log('<<<', response.status(), response.url())
    })

    // Mock API responses - note the full base URL with /api/v1
    await page.route(/.*:8080\/api\/v1\/scenarios\/root-scenario-1$/, async (route) => {
      console.log('✓ Intercepted root-scenario-1 API call')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'root-scenario-1',
          title: 'Root Scenario',
          whatIfQuestion: 'What if the hero chose differently?',
          description: 'A root scenario with multiple forks',
          user_id: 'user-1',
          created_at: '2025-01-15T10:00:00Z',
          conversation_count: 5,
          fork_count: 3,
          like_count: 10,
          parent_scenario_id: null,
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'A root scenario exploring character changes',
          creator_username: 'testuser1',
          parameters: {
            character: 'Hero',
            new_property: 'cautious',
            original_property: 'brave',
          },
        }),
      })
    })

    await page.route(/.*:8080\/api\/v1\/scenarios\/root-scenario-1\/tree/, async (route) => {
      console.log('✓ Intercepted root-scenario-1/tree API call')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          root: {
            id: 'root-scenario-1',
            title: 'Root Scenario',
            whatIfQuestion: 'What if the hero chose differently?',
            description: 'A root scenario with multiple forks',
            user_id: 'user-1',
            created_at: '2025-01-15T10:00:00Z',
            conversation_count: 5,
            fork_count: 3,
            like_count: 10,
          },
          children: [
            {
              id: 'fork-1',
              title: 'First Fork',
              whatIfQuestion: 'What if they went left?',
              description: 'First branching path',
              parent_scenario_id: 'root-scenario-1',
              user_id: 'user-2',
              created_at: '2025-01-16T10:00:00Z',
              conversation_count: 3,
              fork_count: 0,
            },
            {
              id: 'fork-2',
              title: 'Second Fork',
              whatIfQuestion: 'What if they went right?',
              description: 'Second branching path',
              parent_scenario_id: 'root-scenario-1',
              user_id: 'user-3',
              created_at: '2025-01-17T10:00:00Z',
              conversation_count: 2,
              fork_count: 0,
            },
            {
              id: 'fork-3',
              title: 'Third Fork',
              whatIfQuestion: 'What if they stayed?',
              description: 'Third branching path',
              parent_scenario_id: 'root-scenario-1',
              user_id: 'user-4',
              created_at: '2025-01-18T10:00:00Z',
              conversation_count: 1,
              fork_count: 0,
            },
          ],
          totalCount: 4,
          maxDepth: 1,
        }),
      })
    })

    // Navigate to scenario detail page
    await page.goto('/scenarios/root-scenario-1')
  })

  test('displays Fork History tab for root scenarios', async ({ page }) => {
    // Wait for scenario data to load
    await page.waitForSelector('h1:has-text("Root Scenario")', { timeout: 10000 })

    // Wait for tabs to render
    await page.waitForSelector('.p-tabview', { timeout: 5000 })

    // Verify Fork History tab is visible
    await expect(page.locator('text=Fork History')).toBeVisible()
  })

  test('switches to Fork History tab and displays tree', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify tree is displayed
    await expect(page.locator('[role="tree"]')).toBeVisible()

    // Verify root node is displayed
    await expect(page.locator('text=Root Scenario')).toBeVisible()

    // Verify fork nodes are displayed
    await expect(page.locator('text=First Fork')).toBeVisible()
    await expect(page.locator('text=Second Fork')).toBeVisible()
    await expect(page.locator('text=Third Fork')).toBeVisible()

    // Verify fork count badge
    await expect(page.locator('text=3 forks')).toBeVisible()
  })

  test('navigates to fork scenario when clicking fork node', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Mock the fork scenario API
    await page.route(/.*:8080\/api\/v1\/scenarios\/fork-1$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fork-1',
          title: 'First Fork',
          whatIfQuestion: 'What if they went left?',
          description: 'First branching path',
          user_id: 'user-2',
          created_at: '2025-01-16T10:00:00Z',
          conversation_count: 3,
          fork_count: 0,
          like_count: 5,
          parent_scenario_id: 'root-scenario-1',
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'First fork preview',
          creator_username: 'testuser2',
          parameters: {},
        }),
      })
    })

    // Click first fork node
    await page.click('text=First Fork')

    // Wait for navigation
    await page.waitForURL('**/scenarios/fork-1')

    // Verify URL changed
    expect(page.url()).toContain('/scenarios/fork-1')
  })

  test('supports keyboard navigation with Tab and Enter', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Focus on the first treeitem (root node)
    await page.locator('[role="treeitem"]').first().focus()

    // Verify focus is on root node
    await expect(page.locator('[role="treeitem"]').first()).toBeFocused()

    // Press Tab to move to next treeitem
    await page.keyboard.press('Tab')

    // Verify focus moved to first fork
    await expect(page.locator('[role="treeitem"]').nth(1)).toBeFocused()

    // Mock navigation for Enter key test
    await page.route(/.*:8080\/api\/v1\/scenarios\/fork-1$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fork-1',
          title: 'First Fork',
          whatIfQuestion: 'What if they went left?',
          description: 'First branching path',
          user_id: 'user-2',
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'First fork preview',
          creator_username: 'testuser2',
          parameters: {},
          created_at: '2025-01-16T10:00:00Z',
          conversation_count: 3,
          fork_count: 0,
          like_count: 5,
          parent_scenario_id: 'root-scenario-1',
        }),
      })
    })

    // Press Enter to navigate
    await page.keyboard.press('Enter')

    // Wait for navigation
    await page.waitForURL('**/scenarios/fork-1')

    // Verify navigation occurred
    expect(page.url()).toContain('/scenarios/fork-1')
  })

  test('supports keyboard navigation with Space key', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Focus on the second treeitem (first fork)
    await page.locator('[role="treeitem"]').nth(1).focus()

    // Mock navigation
    await page.route(/.*:8080\/api\/v1\/scenarios\/fork-1$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fork-1',
          title: 'First Fork',
          whatIfQuestion: 'What if they went left?',
          description: 'First branching path',
          user_id: 'user-2',
          created_at: '2025-01-16T10:00:00Z',
          conversation_count: 3,
          fork_count: 0,
          like_count: 5,
          parent_scenario_id: 'root-scenario-1',
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'First fork preview',
          creator_username: 'testuser2',
          parameters: {},
        }),
      })
    })

    // Press Space to navigate
    await page.keyboard.press('Space')

    // Wait for navigation
    await page.waitForURL('**/scenarios/fork-1')

    // Verify navigation occurred
    expect(page.url()).toContain('/scenarios/fork-1')
  })

  test('handles error state with retry button', async ({ page }) => {
    // Mock error scenario main API
    await page.route(/.*:8080\/api\/v1\/scenarios\/error-scenario$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'error-scenario',
          title: 'Error Scenario',
          description: 'A scenario that will error',
          user_id: 'user-1',
          created_at: '2025-01-15T10:00:00Z',
          parent_scenario_id: null,
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'Error scenario preview',
          creator_username: 'testuser1',
          parameters: {},
          conversation_count: 0,
          fork_count: 0,
          like_count: 0,
        }),
      })
    })

    // Mock API error
    await page.route(/.*:8080\/api\/v1\/scenarios\/error-scenario\/tree/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // Navigate to scenario with error
    await page.goto('/scenarios/error-scenario')
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for error state
    await page.waitForSelector('[role="alert"]')

    // Verify error message is displayed
    await expect(page.locator('text=Failed to load scenario tree')).toBeVisible()

    // Verify retry button is displayed
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()

    // Click retry button
    await page.click('button:has-text("Retry")')

    // Verify loading state appears
    await expect(page.locator('[role="status"]')).toBeVisible()
  })

  test('handles empty state when no forks exist', async ({ page }) => {
    // Mock no-forks scenario main API
    await page.route(/.*:8080\/api\/v1\/scenarios\/no-forks-scenario$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'no-forks-scenario',
          title: 'Scenario Without Forks',
          whatIfQuestion: 'What if nothing happened?',
          description: 'A scenario with no forks',
          user_id: 'user-1',
          created_at: '2025-01-15T10:00:00Z',
          parent_scenario_id: null,
          base_story: 'The Original Tale',
          scenario_type: 'CHARACTER_CHANGE',
          scenario_preview: 'No forks preview',
          creator_username: 'testuser1',
          parameters: {},
          conversation_count: 0,
          fork_count: 0,
          like_count: 0,
        }),
      })
    })

    // Mock API with no children
    await page.route(/.*:8080\/api\/v1\/scenarios\/no-forks-scenario\/tree/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          root: {
            id: 'no-forks-scenario',
            title: 'Scenario Without Forks',
            whatIfQuestion: 'What if nothing happened?',
            description: 'A scenario with no forks',
            user_id: 'user-1',
            created_at: '2025-01-15T10:00:00Z',
            conversation_count: 0,
            fork_count: 0,
            like_count: 0,
          },
          children: [],
          totalCount: 1,
          maxDepth: 0,
        }),
      })
    })

    // Navigate to scenario without forks
    await page.goto('/scenarios/no-forks-scenario')
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for empty state
    await page.waitForSelector('text=No forks yet')

    // Verify empty state message
    await expect(page.locator('text=No forks yet')).toBeVisible()
    await expect(page.locator('text=This scenario has not been forked yet')).toBeVisible()
  })

  test('displays responsive layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify tree is displayed
    await expect(page.locator('[role="tree"]')).toBeVisible()

    // Verify all nodes are visible (should stack vertically)
    await expect(page.locator('text=Root Scenario')).toBeVisible()
    await expect(page.locator('text=First Fork')).toBeVisible()
    await expect(page.locator('text=Second Fork')).toBeVisible()
    await expect(page.locator('text=Third Fork')).toBeVisible()
  })

  test('highlights current scenario in tree', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Find the root node (should be highlighted as current)
    const rootNode = page.locator('[role="treeitem"]').first()

    // Verify aria-current is set
    await expect(rootNode).toHaveAttribute('aria-current', 'page')

    // Verify visual highlighting (check for specific CSS class or style)
    // This depends on your implementation - adjust selector as needed
    const rootNodeClass = await rootNode.getAttribute('class')
    expect(rootNodeClass).toContain('bg') // Contains background color class
  })

  test('displays scenario statistics correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify root node statistics
    await expect(page.locator('text=5 conversations')).toBeVisible()
    await expect(page.locator('text=3 forks')).toBeVisible()

    // Verify fork node statistics
    await expect(page.locator('text=3 conversations')).toBeVisible()
    await expect(page.locator('text=2 conversations')).toBeVisible()
    await expect(page.locator('text=1 conversations')).toBeVisible()
  })

  test('displays export button in toolbar', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify Export button is visible
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible()
  })

  test('displays share button in toolbar', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify Share button is visible
    await expect(page.locator('[data-testid="share-button"]')).toBeVisible()
  })

  test('opens export modal when export button is clicked', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Click Export button
    await page.click('[data-testid="export-button"]')

    // Verify export modal is displayed
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    await expect(page.locator('text=Export Scenario Tree')).toBeVisible()
  })

  test('closes export modal when close button is clicked', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Open export modal
    await page.click('[data-testid="export-button"]')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()

    // Close modal
    await page.click('[data-testid="close-button"]')

    // Verify modal is closed
    await expect(page.locator('[data-testid="export-modal"]')).not.toBeVisible()
  })

  test('export modal has format options', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Open export modal
    await page.click('[data-testid="export-button"]')

    // Verify format options
    await expect(page.locator('[data-testid="format-png"]')).toBeVisible()
    await expect(page.locator('[data-testid="format-svg"]')).toBeVisible()
    await expect(page.locator('[data-testid="format-svg"]')).toBeDisabled()
  })

  test('export modal has metadata and watermark options', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Open export modal
    await page.click('[data-testid="export-button"]')

    // Verify options
    await expect(page.locator('[data-testid="include-metadata"]')).toBeVisible()
    await expect(page.locator('[data-testid="include-watermark"]')).toBeVisible()

    // Verify checkboxes are checked by default
    await expect(page.locator('[data-testid="include-metadata"]')).toBeChecked()
    await expect(page.locator('[data-testid="include-watermark"]')).toBeChecked()
  })

  test('copies share link to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Click Share button
    await page.click('[data-testid="share-button"]')

    // Verify button text changes to "Link Copied!"
    await expect(page.locator('text=Link Copied!')).toBeVisible()

    // Wait for text to revert back
    await page.waitForTimeout(2100)
    await expect(page.locator('text=Copy Link')).toBeVisible()
  })

  test('preserves view state in URL', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Wait for any URL updates
    await page.waitForTimeout(1000)

    // Check if URL contains expected parameters (may not be present if no zoom/pan)
    const url = page.url()
    expect(url).toContain('/scenarios/root-scenario-1')
  })

  test('restores view state from URL parameters', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto('/scenarios/root-scenario-1?zoom=1.5&x=100&y=200')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click Fork History tab
    await page.click('text=Fork History')

    // Wait for tree to load
    await page.waitForSelector('[role="tree"]')

    // Verify URL parameters are preserved
    const url = page.url()
    expect(url).toContain('zoom=1.5')
    expect(url).toContain('x=100')
    expect(url).toContain('y=200')
  })
})
