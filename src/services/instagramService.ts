export const instagramService = {
  async getAccountInfo() {
    const resp = await fetch("https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/instagram/me");
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
