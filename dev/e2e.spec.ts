import { expect, test } from '@playwright/test'

const credentials = { email: 'security-test@example.test', password: 'local-regression-test-123' }

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/users/first-register', { data: credentials })
  if (!response.ok()) {
    // A restarted worker uses the same disposable server/database.
    const login = await request.post('/api/users/login', { data: credentials })
    expect(login.ok(), await login.text()).toBe(true)
  }
})

test('admin login, AI fields, rich-text editor, media and instruction screens', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/admin/login')
  await page.fill('#field-email', credentials.email)
  await page.fill('#field-password', credentials.password)
  await page.click('.form-submit button')
  await expect(page).toHaveTitle(/Dashboard/)
  await page.goto('/admin/collections/posts/create')
  await expect(page.locator('#field-title')).toBeVisible()
  await page.locator('#field-title').fill('Dependency regression smoke test')
  await page.getByRole('button', { name: 'AI Content (Rich Text)', exact: true }).click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.locator('[contenteditable="true"]').first().fill('Rich text still works.')
  await page.getByRole('button', { name: 'AI Voice-Over', exact: true }).click()
  await expect(page.getByText('Voice Audio', { exact: true })).toBeVisible()
  await page.goto('/admin/collections/media')
  await expect(page).toHaveTitle(/Media/)
  await page.goto('/admin/collections/plugin-ai-instructions')
  await expect(page).toHaveTitle(/Compose Settings/)
  expect(errors).toEqual([])
})

test('authenticated post create, read, update and delete preserve rich text', async ({
  request,
}) => {
  expect((await request.post('/api/users/login', { data: credentials })).ok()).toBe(true)
  const content = {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Saved rich text',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
  const created = await request.post('/api/posts', {
    data: { articleBody: { content }, description: 'Original', title: 'Security regression' },
  })
  expect(created.ok(), await created.text()).toBe(true)
  const { doc } = await created.json()
  try {
    const updated = await request.patch(`/api/posts/${doc.id}`, {
      data: { description: 'Updated' },
    })
    expect(updated.ok(), await updated.text()).toBe(true)
    const read = await request.get(`/api/posts/${doc.id}`)
    expect(read.ok()).toBe(true)
    expect(await read.json()).toMatchObject({
      articleBody: { content },
      description: 'Updated',
      title: 'Security regression',
    })
  } finally {
    expect((await request.delete(`/api/posts/${doc.id}`)).ok()).toBe(true)
  }
})

test('Compose Settings discovers models and keeps a saved custom ID when offline', async ({
  page,
}) => {
  expect((await page.request.post('/api/users/login', { data: credentials })).ok()).toBe(true)

  const created = await page.request.post('/api/plugin-ai-instructions', {
    data: {
      'field-type': 'text',
      'model-id': 'Oai-text',
      'Oai-text-settings': { model: 'custom-saved-model' },
      'schema-path': 'posts.model-discovery-test',
    },
  })
  expect(created.ok(), await created.text()).toBe(true)
  const { doc } = await created.json()
  const inventoryRoute = /\/api\/plugin-ai\/models\?provider=openai$/
  const modelID = page.locator('#field-Oai-text-settings__model')

  try {
    await page.route(inventoryRoute, (route) =>
      route.fulfill({
        json: {
          models: [{ id: 'gpt-fixture-live', label: 'Discovered fixture model' }],
          source: 'live',
        },
      }),
    )
    await page.goto(`/admin/collections/plugin-ai-instructions/${doc.id}`)
    await expect(modelID).toHaveValue('custom-saved-model')
    await expect(page.getByText(/OpenAI lists candidate models/)).toBeVisible()
    await page.locator('#field-Oai-text-settings__model-catalog').getByRole('combobox').click()
    await page.getByText('Discovered fixture model', { exact: true }).click()
    await expect(modelID).toHaveValue('gpt-fixture-live')

    await modelID.fill('custom-user-model')
    const update = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname === `/api/plugin-ai-instructions/${doc.id}`,
    )
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    expect((await update).ok()).toBe(true)

    await page.unroute(inventoryRoute)
    await page.route(inventoryRoute, (route) => route.abort())
    await page.reload()
    await expect(modelID).toHaveValue('custom-user-model')
    await expect(page.getByText(/Live model discovery unavailable/)).toBeVisible()
  } finally {
    expect((await page.request.delete(`/api/plugin-ai-instructions/${doc.id}`)).ok()).toBe(true)
  }
})
