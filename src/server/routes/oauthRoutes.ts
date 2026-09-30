import { Router, Request, Response } from 'express';
import { getAuthenticatedAccountAndSession, oauthLinks, setOauthLinks } from '../db';

export const oauthRouter = Router();

// GET /account/oauth/links
oauthRouter.get('/links', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userLinks = oauthLinks.filter((l) => l.account_id === auth.account.id);
  return res.json(userLinks);
});

// POST /account/oauth/link/:provider
oauthRouter.post('/link/:provider', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const provider = req.params.provider || 'google';
  const frontendUrl = String(
    req.query.frontend_url || req.body?.frontend_url || req.headers['origin'] || 'http://localhost:3000'
  );
  const providerUserId = req.body?.provider_user_id || `${provider}-user-${Date.now()}`;

  const prefix = req.baseUrl || '';
  // Construct redirect URL for browser OAuth linking flow
  const redirect_url = `${frontendUrl.replace(/\/+$/, '')}/${provider}/login?frontend_url=${encodeURIComponent(frontendUrl)}&action=link`;

  let existing = oauthLinks.find(
    (l) => l.account_id === auth.account.id && l.provider.toLowerCase() === provider.toLowerCase()
  );

  if (!existing && req.body?.provider_user_id) {
    const newLink = {
      id: oauthLinks.length + 1,
      account_id: auth.account.id,
      provider: provider.toLowerCase(),
      provider_user_id: providerUserId,
      created_at: new Date().toISOString(),
    };
    setOauthLinks([...oauthLinks, newLink]);
    existing = newLink;
  }

  return res.json({
    redirect_url,
    redirect_to: redirect_url,
    provider,
    linked: Boolean(existing),
    link: existing || null,
  });
});

// DELETE /account/oauth/:provider
oauthRouter.delete('/:provider', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const provider = (req.params.provider || 'google').toLowerCase();
  const userLinks = oauthLinks.filter((l) => l.account_id === auth.account.id);
  const targetLink = userLinks.find((l) => l.provider.toLowerCase() === provider);

  if (!targetLink) {
    return res.status(404).json({ error: `OAuth link for '${provider}' not found` });
  }

  const hasPassword = auth.account.has_password;
  const otherProvidersCount = userLinks.filter((l) => l.provider.toLowerCase() !== provider).length;

  if (!hasPassword && otherProvidersCount === 0) {
    return res.status(400).json({
      error: 'Lockout prevention: Cannot remove the last authentication method (no password and no other connected OAuth providers).',
    });
  }

  setOauthLinks(oauthLinks.filter((l) => !(l.account_id === auth.account.id && l.provider.toLowerCase() === provider)));

  return res.json({
    success: true,
    message: `OAuth link for '${provider}' removed successfully`,
  });
});
