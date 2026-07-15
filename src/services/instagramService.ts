export const instagramService = {
  async getAccountInfo() {
    const resp = await fetch("https://galeria-ia-production.up.railway.app/api/instagram/me");
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
