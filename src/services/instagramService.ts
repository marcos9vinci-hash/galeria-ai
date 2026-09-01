export const instagramService = {
  async getAccountInfo() {
    // Read token from cookie (set by OAuth callback)
    const getCookie = (name: string) => {
      const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    };
    
    const fbToken = getCookie('fb_access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (fbToken) {
      headers['Authorization'] = `Bearer ${fbToken}`;
    }
    
    const resp = await fetch("https://wrybqqitsylqyhgzodyc.supabase.co/functions/v1/api/instagram/me", {
      headers,
    });
    
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.accounts?.length > 0) {
      return {
        profile: data.accounts[0],
        hasPublishPerm: data.hasPublishPerm,
        connected: true
      };
    }
    return { connected: false, profile: null, hasPublishPerm: false };
  }
};
