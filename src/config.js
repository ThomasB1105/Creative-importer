// META APP CONFIG - Configuration de l'app Facebook
// Pour configurer votre propre app:
// 1. Allez sur https://developers.facebook.com/apps
// 2. Créez une nouvelle app ou utilisez une existante
// 3. Activez "Facebook Login" et configurez les URLs de redirection
// 4. Activez les permissions nécessaires dans "App Review"
// 5. Remplacez l'appId ci-dessous par votre App ID
export const META_APP = {
  appId: "720964414230898", // Votre App ID Facebook
  apiVersion: "v21.0",
  redirectUri: window.location.origin + window.location.pathname,
};

export const GEO_ZONES = {
  france: { name: "France", code: "FR", flag: "🇫🇷" },
  belgium: { name: "Belgique", code: "BE", flag: "🇧🇪" },
  switzerland: { name: "Suisse", code: "CH", flag: "🇨🇭" },
  canada: { name: "Canada", code: "CA", flag: "🇨🇦" },
  usa: { name: "USA", code: "US", flag: "🇺🇸" },
  uk: { name: "UK", code: "UK", flag: "🇬🇧" },
  germany: { name: "Allemagne", code: "DE", flag: "🇩🇪" },
};

export const OBJECTIVES = {
  conversions: { name: "Conversions", code: "CONV", icon: "🎯" },
  lead_form: { name: "Lead Form", code: "LF", icon: "📝" },
  lead_site: { name: "Lead Site", code: "LS", icon: "🌐" },
};

export const OPTIMIZATION_EVENTS = {
  conversions: [
    { id: "purchase", name: "Achat (Purchase)", code: "PUR", icon: "💳" },
    { id: "add_to_cart", name: "Ajout panier (ATC)", code: "ATC", icon: "🛒" },
    { id: "initiate_checkout", name: "Début paiement", code: "IC", icon: "💰" },
    { id: "add_payment_info", name: "Info paiement", code: "API", icon: "💳" },
    { id: "view_content", name: "Voir contenu", code: "VC", icon: "👁️" },
    { id: "search", name: "Recherche", code: "SCH", icon: "🔍" },
  ],
  lead_form: [{ id: "lead", name: "Lead", code: "LEAD", icon: "📋" }],
  lead_site: [{ id: "lead", name: "Lead", code: "LEAD", icon: "📋" }],
};

export const CALL_TO_ACTIONS = [
  { id: "LEARN_MORE", name: "En savoir plus", icon: "📖" },
  { id: "SHOP_NOW", name: "Acheter", icon: "🛍️" },
  { id: "SIGN_UP", name: "S'inscrire", icon: "✍️" },
  { id: "DOWNLOAD", name: "Télécharger", icon: "⬇️" },
  { id: "APPLY_NOW", name: "Postuler", icon: "📝" },
  { id: "BOOK_NOW", name: "Réserver", icon: "📅" },
  { id: "CONTACT_US", name: "Nous contacter", icon: "📞" },
  { id: "GET_QUOTE", name: "Devis", icon: "💼" },
  { id: "SUBSCRIBE", name: "S'abonner", icon: "🔔" },
  { id: "WATCH_MORE", name: "Voir plus", icon: "▶️" },
  { id: "NO_BUTTON", name: "Pas de bouton", icon: "⚪" },
];

export const META_PLACEMENTS = {
  story: {
    name: "Stories",
    icon: "📱",
    ratio: "9:16",
    minRatio: 0.5,
    maxRatio: 0.625,
    color: "#e879f9",
    bgColor: "rgba(232,121,249,0.15)",
  },
  feed_square: {
    name: "Feed 1:1",
    icon: "⬜",
    ratio: "1:1",
    minRatio: 0.9,
    maxRatio: 1.1,
    color: "#22d3ee",
    bgColor: "rgba(34,211,238,0.15)",
  },
  feed_portrait: {
    name: "Feed 4:5",
    icon: "📋",
    ratio: "4:5",
    minRatio: 0.75,
    maxRatio: 0.89,
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.15)",
  },
  feed_landscape: {
    name: "Feed 16:9",
    icon: "🖼️",
    ratio: "16:9",
    minRatio: 1.5,
    maxRatio: 2.0,
    color: "#fbbf24",
    bgColor: "rgba(251,191,36,0.15)",
  },
};

export const CTA_OPTIONS = [
  { id: "learn_more", name: "En savoir plus" },
  { id: "shop_now", name: "Acheter" },
  { id: "sign_up", name: "S'inscrire" },
  { id: "contact_us", name: "Nous contacter" },
];

export const detectFormat = (w, h) => {
  const r = w / h;
  for (const [k, p] of Object.entries(META_PLACEMENTS))
    if (r >= p.minRatio && r <= p.maxRatio) return k;
  return r < 0.75
    ? "story"
    : r < 1.1
    ? "feed_square"
    : r < 1.5
    ? "feed_portrait"
    : "feed_landscape";
};

export const getMediaDimensions = (file) =>
  new Promise((resolve) => {
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(v.src);
        resolve({ width: v.videoWidth, height: v.videoHeight });
      };
      v.onerror = () => resolve({ width: 1080, height: 1080 });
      v.src = URL.createObjectURL(file);
    } else {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => resolve({ width: 1080, height: 1080 });
      img.src = URL.createObjectURL(file);
    }
  });

// AUTH HELPERS
export const authHelpers = {
  // Save token to localStorage
  saveToken(accessToken, expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem("meta_access_token", accessToken);
    localStorage.setItem("meta_token_expires", expiresAt.toString());
  },

  // Get saved token
  getToken() {
    const token = localStorage.getItem("meta_access_token");
    const expires = localStorage.getItem("meta_token_expires");
    if (token && expires && Date.now() < parseInt(expires)) {
      return token;
    }
    return null;
  },

  // Clear token
  clearToken() {
    localStorage.removeItem("meta_access_token");
    localStorage.removeItem("meta_token_expires");
    localStorage.removeItem("meta_user");
  },

  // Save user info
  saveUser(user) {
    localStorage.setItem("meta_user", JSON.stringify(user));
  },

  // Get user info
  getUser() {
    const user = localStorage.getItem("meta_user");
    return user ? JSON.parse(user) : null;
  },

  // Generate OAuth URL
  getOAuthUrl() {
    // Permissions pour l'app
    const permissions = [
      "ads_management",
      "ads_read",
      "business_management",
      "pages_read_engagement",
      "pages_show_list",
      "pages_read_user_content",  // Dépendance de instagram_basic
      "instagram_basic",          // Pour lire les comptes Instagram liés aux pages
    ].join(",");

    return (
      `https://www.facebook.com/${META_APP.apiVersion}/dialog/oauth?` +
      `client_id=${META_APP.appId}` +
      `&redirect_uri=${encodeURIComponent(META_APP.redirectUri)}` +
      `&scope=${permissions}` +
      `&response_type=token` +
      `&state=meta_ads_importer`
    );
  },
};

// META API
export const createMetaApi = (accessToken) => ({
  baseUrl: `https://graph.facebook.com/${META_APP.apiVersion}`,

  async fetchUser() {
    try {
      const res = await fetch(
        `${this.baseUrl}/me?fields=id,name,picture&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des données utilisateur");
      }
      return data;
    } catch (error) {
      console.error("fetchUser error:", error);
      throw error;
    }
  },

  async fetchAdAccounts() {
    try {
      const res = await fetch(
        `${this.baseUrl}/me/adaccounts?fields=id,name,currency,account_status,amount_spent,business{id,name}&limit=100&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des comptes publicitaires");
      }
      return data.data || [];
    } catch (error) {
      console.error("fetchAdAccounts error:", error);
      throw error;
    }
  },

  async fetchPages() {
    try {
      const res = await fetch(
        `${this.baseUrl}/me/accounts?fields=id,name,picture,access_token,instagram_business_account{id,name,username,profile_picture_url}&limit=100&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des pages");
      }
      return data.data || [];
    } catch (error) {
      console.error("fetchPages error:", error);
      throw error;
    }
  },

  async fetchPixels(adAccountId) {
    try {
      const res = await fetch(
        `${this.baseUrl}/${adAccountId}/adspixels?fields=id,name&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des pixels");
      }
      return data.data || [];
    } catch (error) {
      console.error("fetchPixels error:", error);
      throw error;
    }
  },

  async fetchInstagramAccounts(adAccountId) {
    try {
      const res = await fetch(
        `${this.baseUrl}/${adAccountId}/instagram_accounts?fields=id,username,profile_pic&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des comptes Instagram");
      }
      return data.data || [];
    } catch (error) {
      console.error("fetchInstagramAccounts error:", error);
      throw error;
    }
  },

  async fetchPageInstagramAccount(pageId, pageAccessToken = null) {
    try {
      // Use page access token if provided, otherwise use user access token
      const token = pageAccessToken || accessToken;
      const res = await fetch(
        `${this.baseUrl}/${pageId}?fields=instagram_business_account{id,username,profile_picture_url,name}&access_token=${token}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération du compte Instagram");
      }
      return data.instagram_business_account || null;
    } catch (error) {
      console.error("fetchPageInstagramAccount error:", error);
      return null;
    }
  },

  async fetchCampaigns(adAccountId) {
    try {
      console.log("🔍 Fetching campaigns for account:", adAccountId);

      // Simplified: no filtering, we'll filter client-side
      const url = `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=100&access_token=${accessToken}`;
      console.log("📡 API URL:", url.replace(accessToken, "***TOKEN***"));

      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ HTTP error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("📦 Raw API response:", data);

      if (data.error) {
        console.error("❌ API returned error:", data.error);
        throw new Error(data.error.message || "Erreur lors de la récupération des campagnes");
      }
      console.log("✅ Total campaigns found:", data.data?.length || 0);

      // Filter ACTIVE and PAUSED campaigns in JavaScript
      const activeCampaigns = (data.data || []).filter(c =>
        c.status === "ACTIVE" || c.status === "PAUSED"
      );
      console.log("✅ Active/Paused campaigns:", activeCampaigns.length);
      return activeCampaigns;
    } catch (error) {
      console.error("💥 fetchCampaigns error:", error);
      throw error;
    }
  },

  async fetchAdsets(campaignId) {
    try {
      // Simplified: no filtering, filter client-side
      const res = await fetch(
        `${this.baseUrl}/${campaignId}/adsets?fields=id,name,status,daily_budget&limit=100&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des adsets");
      }
      // Filter ACTIVE and PAUSED adsets client-side
      const activeAdsets = (data.data || []).filter(a =>
        a.status === "ACTIVE" || a.status === "PAUSED"
      );
      return activeAdsets;
    } catch (error) {
      console.error("fetchAdsets error:", error);
      throw error;
    }
  },
});
