export function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, ...val] = cookie.split('=');
    if (key === name) return decodeURIComponent(val.join('='));
  }
  return null;
}

export function setCookie(res: Response, name: string, value: string, options: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path?: string;
} = {}) {
  const { httpOnly = true, secure = true, sameSite = 'lax', maxAge = 60 * 60 * 24 * 30, path = '/' } = options;
  res.headers.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; HttpOnly=${httpOnly}; Secure=${secure}; SameSite=${sameSite}; Max-Age=${maxAge}; Path=${path}`);
}

export function clearCookie(res: Response, name: string, path = '/') {
  res.headers.append('Set-Cookie', `${name}=; HttpOnly=true; Secure=true; SameSite=lax; Max-Age=0; Path=${path}`);
}