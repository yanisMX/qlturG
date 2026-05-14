import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API = 'http://localhost:3001';

// 1×1 px transparent PNG (base64)
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makePngBuffer() {
  return Buffer.from(TINY_PNG_B64, 'base64');
}

test.describe('Avatar upload — POST /upload/avatar', () => {
  test('route exists (registered in NestJS router)', async ({ request }) => {
    // Without a file the server must return 400, not 404.
    // A 404 "Cannot POST …" means the route was never registered.
    const res = await request.post(`${API}/upload/avatar`);
    expect(res.status()).not.toBe(404);
    expect(res.status()).toBe(400);
    const body = await res.json();
    // Should be either "Aucun fichier reçu" or "Upload non configuré sur ce serveur"
    expect(body.message).toBeTruthy();
  });

  test('rejects non-image MIME types with 400', async ({ request }) => {
    const res = await request.post(`${API}/upload/avatar`, {
      multipart: {
        avatar: {
          name: 'evil.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not an image'),
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/image/i);
  });

  test('rejects files over 10 MB with 413', async ({ request }) => {
    // Build a buffer just over 10 MB (10.1 MB of zeros)
    const big = Buffer.alloc(10.1 * 1024 * 1024, 0);
    const res = await request.post(`${API}/upload/avatar`, {
      multipart: {
        avatar: {
          name: 'heavy.png',
          mimeType: 'image/png',
          buffer: big,
        },
      },
    });
    // Multer returns 413 Payload Too Large (not 400) for oversized files
    expect([400, 413]).toContain(res.status());
  });

  test('accepts a valid PNG and returns a URL or Cloudinary-not-configured error', async ({ request }) => {
    const res = await request.post(`${API}/upload/avatar`, {
      multipart: {
        avatar: {
          name: 'avatar.png',
          mimeType: 'image/png',
          buffer: makePngBuffer(),
        },
      },
    });
    const body = await res.json();

    if (res.status() === 200) {
      // Cloudinary is configured → should return a URL
      expect(body.url).toMatch(/^https?:\/\//);
    } else {
      // Cloudinary not configured in dev → 400 with a clear message
      expect(res.status()).toBe(400);
      expect(body.message).toMatch(/configur/i);
    }
  });

  test('UI — AvatarPicker shows upload error message on failure', async ({ page }) => {
    await page.goto('/create');
    // Intercept the upload request and force a server error
    await page.route('**/upload/avatar', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erreur serveur simulée' }),
      }),
    );

    // Click the avatar button to open the file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('button[title="Choisir un avatar"]').click(),
    ]);

    // Upload the tiny PNG through the file chooser
    const tmpPath = path.join('/tmp', 'e2e-avatar.png');
    fs.writeFileSync(tmpPath, makePngBuffer());
    await fileChooser.setFiles(tmpPath);
    fs.rmSync(tmpPath);

    // AvatarPicker should display the error message
    await expect(page.getByText('Erreur serveur simulée')).toBeVisible({ timeout: 8_000 });
  });
});
