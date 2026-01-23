import { useState, useCallback, useEffect, useMemo } from "react";

// META APP CONFIG - Configuration de l'app Facebook
// Pour configurer votre propre app:
// 1. Allez sur https://developers.facebook.com/apps
// 2. Créez une nouvelle app ou utilisez une existante
// 3. Activez "Facebook Login" et configurez les URLs de redirection
// 4. Activez les permissions nécessaires dans "App Review"
// 5. Remplacez l'appId ci-dessous par votre App ID
const META_APP = {
  appId: "1265761725396528", // Votre App ID Facebook
  apiVersion: "v21.0",
  redirectUri: window.location.origin + window.location.pathname,
};

const GEO_ZONES = {
  france: { name: "France", code: "FR", flag: "🇫🇷" },
  belgium: { name: "Belgique", code: "BE", flag: "🇧🇪" },
  switzerland: { name: "Suisse", code: "CH", flag: "🇨🇭" },
  canada: { name: "Canada", code: "CA", flag: "🇨🇦" },
  usa: { name: "USA", code: "US", flag: "🇺🇸" },
  uk: { name: "UK", code: "UK", flag: "🇬🇧" },
  germany: { name: "Allemagne", code: "DE", flag: "🇩🇪" },
};

const OBJECTIVES = {
  conversions: { name: "Conversions", code: "CONV", icon: "🎯" },
  lead_form: { name: "Lead Form", code: "LF", icon: "📝" },
  lead_site: { name: "Lead Site", code: "LS", icon: "🌐" },
};

const OPTIMIZATION_EVENTS = {
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

const CALL_TO_ACTIONS = [
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

const META_PLACEMENTS = {
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

const CTA_OPTIONS = [
  { id: "learn_more", name: "En savoir plus" },
  { id: "shop_now", name: "Acheter" },
  { id: "sign_up", name: "S'inscrire" },
  { id: "contact_us", name: "Nous contacter" },
];

const detectFormat = (w, h) => {
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

const getMediaDimensions = (file) =>
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
const authHelpers = {
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
    // Permissions de base qui ne nécessitent pas d'App Review Facebook
    const permissions = [
      "ads_management",
      "ads_read",
      "business_management",
      "pages_read_engagement",
      "pages_show_list",
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
const createMetaApi = (accessToken) => ({
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
        `${this.baseUrl}/me/accounts?fields=id,name,picture,instagram_business_account{id,name,username,profile_picture_url}&limit=100&access_token=${accessToken}`
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

export default function App() {
  // Auth state
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Data state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pixels, setPixels] = useState([]);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);
  const [adAccountSearch, setAdAccountSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [adsetSearch, setAdsetSearch] = useState("");

  // Campaign structure
  const [step, setStep] = useState(0);
  const [budgetType, setBudgetType] = useState("cbo");
  const [cboMode, setCboMode] = useState("new");
  const [aboMode, setAboMode] = useState("1:1:1");
  const [existingCampaigns, setExistingCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [existingAdsets, setExistingAdsets] = useState([]);
  const [selectedAdset, setSelectedAdset] = useState(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingAdsets, setIsLoadingAdsets] = useState(false);

  // Options
  const [splitByMediaType, setSplitByMediaType] = useState(true);
  const [groupByFormat, setGroupByFormat] = useState(true);

  // Config
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adGroups, setAdGroups] = useState([]); // Groups of creatives mapped together
  const [mappingMode, setMappingMode] = useState(false); // Enable mapping interface
  const [draggedFile, setDraggedFile] = useState(null); // File being dragged
  const [campaignName, setCampaignName] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [objective, setObjective] = useState("conversions");
  const [optimizationEvent, setOptimizationEvent] = useState("purchase");
  const [callToAction, setCallToAction] = useState("LEARN_MORE");
  const [budget, setBudget] = useState("50");
  const [selectedCountries, setSelectedCountries] = useState(["france"]);
  const [primaryTexts, setPrimaryTexts] = useState([""]);  // Array of texts
  const [headlines, setHeadlines] = useState([""]);  // Array of headlines
  const [destinationUrl, setDestinationUrl] = useState("");

  // Check for OAuth callback or saved token on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthenticating(true);

      // Check URL for OAuth callback
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        const expiresIn = parseInt(params.get("expires_in") || "5184000"); // Default 60 days

        if (token) {
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);

          try {
            const api = createMetaApi(token);
            const userData = await api.fetchUser();

            authHelpers.saveToken(token, expiresIn);
            authHelpers.saveUser(userData);

            setAccessToken(token);
            setUser(userData);
          } catch (err) {
            console.error("Auth error:", err);
            setAuthError("Erreur lors de la connexion: " + err.message);
            authHelpers.clearToken();
          }
        }
      } else {
        // Check for saved token
        const savedToken = authHelpers.getToken();
        const savedUser = authHelpers.getUser();

        if (savedToken) {
          // Verify token is still valid
          try {
            const api = createMetaApi(savedToken);
            const userData = await api.fetchUser();
            setAccessToken(savedToken);
            setUser(userData);
            authHelpers.saveUser(userData);
          } catch (err) {
            // Token expired or invalid
            console.error("Token validation error:", err);
            authHelpers.clearToken();
            setAuthError("Session expirée. Veuillez vous reconnecter.");
          }
        }
      }

      setIsAuthenticating(false);
    };

    checkAuth();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const api = createMetaApi(accessToken);
        const [accounts, pagesData] = await Promise.all([
          api.fetchAdAccounts(),
          api.fetchPages(),
        ]);
        setAdAccounts(accounts.filter((a) => a.account_status === 1));
        setPages(pagesData);
      } catch (err) {
        if (
          err.message.includes("expired") ||
          err.message.includes("invalid")
        ) {
          handleLogout();
        } else {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [accessToken]);

  // Load pixels when ad account selected
  useEffect(() => {
    if (!selectedAdAccount || !accessToken) return;

    setIsLoadingPixels(true);
    setPixels([]);
    setSelectedPixel(null);

    const api = createMetaApi(accessToken);
    api
      .fetchPixels(selectedAdAccount.id)
      .then((data) => {
        setPixels(data);
        if (data.length > 0) setSelectedPixel(data[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoadingPixels(false));

    setIsLoadingCampaigns(true);
    setExistingCampaigns([]);
    api
      .fetchCampaigns(selectedAdAccount.id)
      .then((campaigns) => {
        console.log("✅ Campaigns loaded:", campaigns.length, "campaigns");
        setExistingCampaigns(campaigns);
      })
      .catch((error) => {
        console.error("❌ Error loading campaigns:", error);
      })
      .finally(() => setIsLoadingCampaigns(false));
  }, [selectedAdAccount, accessToken]);

  // Load adsets when campaign selected
  useEffect(() => {
    if (!selectedCampaign || !accessToken) return;

    setIsLoadingAdsets(true);
    setExistingAdsets([]);
    setSelectedAdset(null);

    const api = createMetaApi(accessToken);
    api
      .fetchAdsets(selectedCampaign.id)
      .then(setExistingAdsets)
      .catch(() => {})
      .finally(() => setIsLoadingAdsets(false));
  }, [selectedCampaign, accessToken]);

  const handleLogin = () => {
    window.location.href = authHelpers.getOAuthUrl();
  };

  const handleLogout = () => {
    authHelpers.clearToken();
    setAccessToken(null);
    setUser(null);
    setAdAccounts([]);
    setPages([]);
    setSelectedAdAccount(null);
    setSelectedPage(null);
    setStep(0);
  };

  const filteredAdAccounts = useMemo(() => {
    if (!adAccountSearch.trim()) return adAccounts;
    const s = adAccountSearch.toLowerCase();
    return adAccounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(s) ||
        a.id?.includes(s) ||
        a.business?.name?.toLowerCase().includes(s)
    );
  }, [adAccounts, adAccountSearch]);

  const filteredPages = useMemo(() => {
    if (!pageSearch.trim()) return pages;
    const s = pageSearch.toLowerCase();
    return pages.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.instagram_business_account?.username?.toLowerCase().includes(s)
    );
  }, [pages, pageSearch]);

  const filteredCampaigns = useMemo(() => {
    if (!campaignSearch.trim()) return existingCampaigns;
    const s = campaignSearch.toLowerCase();
    return existingCampaigns.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.id?.includes(s)
    );
  }, [existingCampaigns, campaignSearch]);

  const filteredAdsets = useMemo(() => {
    if (!adsetSearch.trim()) return existingAdsets;
    const s = adsetSearch.toLowerCase();
    return existingAdsets.filter(
      (a) =>
        a.name?.toLowerCase().includes(s) ||
        a.id?.includes(s)
    );
  }, [existingAdsets, adsetSearch]);

  const instagramAccount = selectedPage?.instagram_business_account || null;

  const processFiles = async (files) => {
    setIsProcessing(true);
    const valid = files.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    const processed = [];
    for (const file of valid) {
      const dim = await getMediaDimensions(file);
      const format = detectFormat(dim.width, dim.height);
      processed.push({
        id: Date.now() + "-" + Math.random(),
        name: file.name,
        file,
        type: file.type.startsWith("video/") ? "video" : "static",
        preview: URL.createObjectURL(file),
        adName: file.name.replace(/\.[^/.]+$/, ""),
        width: dim.width,
        height: dim.height,
        format,
        placement: META_PLACEMENTS[format],
      });
    }
    setUploadedFiles((p) => [...p, ...processed]);
    setIsProcessing(false);
  };

  const groupedFiles = useMemo(() => {
    let groups = {};
    if (groupByFormat) {
      uploadedFiles.forEach((f) => {
        let key = f.format;
        if (splitByMediaType) key += "_" + f.type;
        if (!groups[key])
          groups[key] = {
            format: f.format,
            type: splitByMediaType ? f.type : "mixed",
            files: [],
          };
        groups[key].files.push(f);
      });
    } else {
      if (splitByMediaType) {
        uploadedFiles.forEach((f) => {
          if (!groups[f.type])
            groups[f.type] = { format: "mixed", type: f.type, files: [] };
          groups[f.type].files.push(f);
        });
      } else {
        groups["all"] = {
          format: "mixed",
          type: "mixed",
          files: uploadedFiles,
        };
      }
    }
    return groups;
  }, [uploadedFiles, groupByFormat, splitByMediaType]);

  // Nomenclature dynamique
  const nomenclature = useMemo(() => {
    const countries = selectedCountries
      .map((c) => GEO_ZONES[c]?.code)
      .join("")
      .toUpperCase();
    const budget = budgetType.toUpperCase();
    const obj = OBJECTIVES[objective]?.name || "Conversions";

    const campaign = [
      clientCode || "XXX",
      countries || "FR",
      budget,
      obj,
      campaignName || "campagne",
    ]
      .filter(Boolean)
      .join("_");

    const adset = `${campaignName || "campagne"}_Broad`;

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getFullYear()).slice(-2)}`;

    const ad = (num, mediaType) =>
      `Ads${num}_${mediaType}_${dateStr}`;

    return { campaign, adset, ad };
  }, [clientCode, selectedCountries, budgetType, objective, campaignName]);

  const isStep2Valid =
    primaryTexts[0]?.trim() && headlines[0]?.trim() && destinationUrl?.startsWith("http");

  const structurePreview = useMemo(() => {
    const numGroups = Object.keys(groupedFiles).length;
    const numFiles = uploadedFiles.length;
    if (budgetType === "abo") {
      if (aboMode === "1:1:1")
        return { campaigns: numFiles, adsets: numFiles, ads: numFiles };
      if (aboMode === "multi")
        return { campaigns: 1, adsets: numGroups, ads: numFiles };
      if (aboMode === "existing")
        return { campaigns: 0, adsets: numGroups, ads: numFiles };
    }
    if (budgetType === "cbo") {
      if (cboMode === "new" || cboMode === "existing_new_adset")
        return {
          campaigns: cboMode === "new" ? 1 : 0,
          adsets: numGroups,
          ads: numFiles,
        };
      return { campaigns: 0, adsets: 0, ads: numFiles };
    }
    return { campaigns: 0, adsets: 0, ads: 0 };
  }, [budgetType, aboMode, cboMode, groupedFiles, uploadedFiles]);

  const box = {
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const btn1 = {
    padding: "14px 28px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  };
  const btn2 = {
    padding: "14px 24px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
  };
  const inp = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    fontSize: "13px",
  };
  const toggle = (active, color) => ({
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    background: active ? color : "rgba(255,255,255,0.1)",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
  });
  const toggleKnob = (active) => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#fff",
    position: "absolute",
    top: "2px",
    left: active ? "22px" : "2px",
    transition: "left 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  });

  // LOGIN SCREEN
  if (isAuthenticating) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#0a0a0f,#1a1a2e,#16213e)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          color: "#e4e4e7",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p>Vérification de la connexion...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#0a0a0f,#1a1a2e,#16213e)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          color: "#e4e4e7",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "440px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg,#6366f1,#d946ef)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                margin: "0 auto 24px",
              }}
            >
              ⚡
            </div>
            <h1 style={{ fontSize: "28px", margin: "0 0 8px" }}>
              Creative Importer Pro
            </h1>
            <p style={{ color: "#71717a", margin: 0 }}>
              Importez vos créatives sur Meta Ads en quelques clics
            </p>
          </div>

          <div style={{ ...box, textAlign: "center" }}>
            <h2
              style={{ fontSize: "18px", margin: "0 0 16px", color: "#a5b4fc" }}
            >
              Connexion requise
            </h2>
            <p
              style={{
                color: "#71717a",
                fontSize: "13px",
                marginBottom: "24px",
              }}
            >
              Connectez-vous avec votre compte Facebook pour accéder à vos
              comptes publicitaires Meta.
            </p>

            {authError && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#ef4444",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  ⚠️ Erreur de connexion
                </div>
                <div>{authError}</div>
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#fca5a5" }}>
                  Assurez-vous que votre App Facebook est correctement configurée avec les permissions requises.
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                background: "#1877f2",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continuer avec Facebook
            </button>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#71717a",
                  margin: "0 0 8px",
                }}
              >
                Permissions demandées :
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  "Comptes publicitaires",
                  "Pages Facebook",
                  "Instagram",
                  "Business Manager",
                ].map((p) => (
                  <span
                    key={p}
                    style={{
                      padding: "4px 8px",
                      background: "rgba(99,102,241,0.2)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#a5b4fc",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: "#52525b",
              marginTop: "24px",
            }}
          >
            🔒 Connexion sécurisée via Facebook OAuth. Vos identifiants ne sont
            jamais stockés.
          </p>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0a0f,#1a1a2e,#16213e)",
        fontFamily: "system-ui",
        color: "#e4e4e7",
        padding: "24px",
      }}
    >
      <header
        style={{
          maxWidth: "1400px",
          margin: "0 auto 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg,#6366f1,#d946ef)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            ⚡
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#fff" }}>
              Creative Importer Pro
            </h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#71717a" }}>
              Connected to Meta Ads API
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {step > 0 && selectedAdAccount && (
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { n: 1, l: "Structure" },
                { n: 2, l: "Config" },
                { n: 3, l: "Upload" },
                { n: 4, l: "Export" },
              ].map((s) => (
                <div
                  key={s.n}
                  onClick={() => s.n < step && setStep(s.n)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    cursor: s.n < step ? "pointer" : "default",
                    background:
                      step === s.n
                        ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                        : step > s.n
                        ? "rgba(139,92,246,0.2)"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  {step > s.n ? "✓" : s.n} {s.l}
                </div>
              ))}
            </div>
          )}
          {/* User Menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "10px",
            }}
          >
            {user?.picture?.data?.url && (
              <img
                src={user.picture.data.url}
                alt=""
                style={{ width: "32px", height: "32px", borderRadius: "50%" }}
              />
            )}
            <div>
              <div style={{ fontSize: "12px", fontWeight: "500" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: "10px", color: "#71717a" }}>Connecté</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "8px",
                padding: "6px 10px",
                background: "rgba(239,68,68,0.2)",
                border: "none",
                borderRadius: "6px",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* STEP 0: Account Selection */}
        {step === 0 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "24px",
                color: "#a5b4fc",
              }}
            >
              🔐 Sélection du compte
            </h2>
            {isLoading && (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                <p>Chargement des comptes...</p>
              </div>
            )}
            {error && (
              <div
                style={{
                  ...box,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  marginBottom: "24px",
                }}
              >
                <p style={{ color: "#ef4444", margin: 0 }}>❌ {error}</p>
              </div>
            )}
            {!isLoading && !error && (
              <>
                {/* Ad Accounts */}
                <div style={{ ...box, marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <h3
                      style={{ margin: 0, fontSize: "14px", color: "#a5b4fc" }}
                    >
                      📊 Compte Publicitaire ({adAccounts.length})
                    </h3>
                    {selectedAdAccount && (
                      <span
                        style={{
                          padding: "6px 12px",
                          background: "rgba(34,197,94,0.2)",
                          borderRadius: "6px",
                          fontSize: "11px",
                          color: "#22c55e",
                        }}
                      >
                        ✓ {selectedAdAccount.name}
                      </span>
                    )}
                  </div>
                  <div style={{ position: "relative", marginBottom: "16px" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={adAccountSearch}
                      onChange={(e) => setAdAccountSearch(e.target.value)}
                      style={{ ...inp, paddingLeft: "36px" }}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "12px",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredAdAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAdAccount(acc)}
                        style={{
                          padding: "14px",
                          borderRadius: "10px",
                          border:
                            selectedAdAccount?.id === acc.id
                              ? "2px solid #6366f1"
                              : "1px solid rgba(255,255,255,0.1)",
                          background:
                            selectedAdAccount?.id === acc.id
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(0,0,0,0.2)",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            marginBottom: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {acc.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#71717a" }}>
                          {acc.id.replace("act_", "")} • {acc.currency}
                        </div>
                        {acc.business && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#a5b4fc",
                              marginTop: "2px",
                            }}
                          >
                            🏢 {acc.business.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedAdAccount && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "14px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "500",
                          marginBottom: "10px",
                        }}
                      >
                        🎯 Pixel{" "}
                        {isLoadingPixels && (
                          <span style={{ color: "#71717a", fontSize: "11px" }}>
                            (chargement...)
                          </span>
                        )}
                      </div>
                      {pixels.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {pixels.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedPixel(p)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border:
                                  selectedPixel?.id === p.id
                                    ? "2px solid #22c55e"
                                    : "1px solid rgba(255,255,255,0.1)",
                                background:
                                  selectedPixel?.id === p.id
                                    ? "rgba(34,197,94,0.15)"
                                    : "transparent",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              {selectedPixel?.id === p.id && "✓ "}
                              {p.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        !isLoadingPixels && (
                          <div style={{ fontSize: "11px", color: "#71717a" }}>
                            Aucun pixel
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Pages */}
                {selectedAdAccount && (
                  <div style={{ ...box, marginBottom: "20px" }}>
                    <h3
                      style={{
                        margin: "0 0 16px",
                        fontSize: "14px",
                        color: "#a5b4fc",
                      }}
                    >
                      📄 Page Facebook & Instagram
                    </h3>
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={pageSearch}
                        onChange={(e) => setPageSearch(e.target.value)}
                        style={{ ...inp, paddingLeft: "36px" }}
                      />
                    </div>
                    {selectedPage ? (
                      <div
                        style={{
                          padding: "14px",
                          background: "rgba(99,102,241,0.1)",
                          borderRadius: "10px",
                          border: "1px solid rgba(99,102,241,0.3)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {selectedPage.picture?.data?.url && (
                            <img
                              src={selectedPage.picture.data.url}
                              alt=""
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "10px",
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div
                              style={{ fontWeight: "600", fontSize: "13px" }}
                            >
                              {selectedPage.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "#71717a" }}>
                              Page Facebook
                            </div>
                          </div>
                          {instagramAccount && (
                            <div
                              style={{
                                padding: "8px 12px",
                                background:
                                  "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {instagramAccount.profile_picture_url && (
                                <img
                                  src={instagramAccount.profile_picture_url}
                                  alt=""
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    border: "2px solid white",
                                  }}
                                />
                              )}
                              <div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    color: "#fff",
                                  }}
                                >
                                  @{instagramAccount.username}
                                </div>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedPage(null)}
                            style={{
                              padding: "6px 10px",
                              background: "rgba(239,68,68,0.2)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {filteredPages.map((page, i) => (
                          <div
                            key={page.id}
                            onClick={() => setSelectedPage(page)}
                            style={{
                              padding: "10px 14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              cursor: "pointer",
                              background:
                                i % 2 === 0
                                  ? "rgba(0,0,0,0.2)"
                                  : "rgba(0,0,0,0.1)",
                            }}
                          >
                            {page.picture?.data?.url && (
                              <img
                                src={page.picture.data.url}
                                alt=""
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div
                                style={{ fontWeight: "500", fontSize: "12px" }}
                              >
                                {page.name}
                              </div>
                              {page.instagram_business_account && (
                                <div
                                  style={{ fontSize: "10px", color: "#e879f9" }}
                                >
                                  📸 @{page.instagram_business_account.username}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setStep(1)}
                  disabled={!selectedAdAccount || !selectedPage}
                  style={{
                    ...btn1,
                    opacity: selectedAdAccount && selectedPage ? 1 : 0.5,
                  }}
                >
                  Continuer → Structure
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 1: Structure */}
        {step === 1 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "24px",
                color: "#a5b4fc",
              }}
            >
              01 — Structure de campagne
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                onClick={() => setBudgetType("cbo")}
                style={{
                  ...box,
                  border:
                    budgetType === "cbo"
                      ? "2px solid #22c55e"
                      : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    🎯
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>CBO</h3>
                    <p
                      style={{ margin: 0, fontSize: "11px", color: "#71717a" }}
                    >
                      Campaign Budget Optimization
                    </p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => setBudgetType("abo")}
                style={{
                  ...box,
                  border:
                    budgetType === "abo"
                      ? "2px solid #f59e0b"
                      : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    🎚️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>ABO</h3>
                    <p
                      style={{ margin: 0, fontSize: "11px", color: "#71717a" }}
                    >
                      Adset Budget Optimization
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {budgetType === "cbo" && (
              <div style={{ ...box, marginBottom: "24px" }}>
                <h4
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    color: "#22c55e",
                  }}
                >
                  Options CBO
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {[
                    {
                      id: "new",
                      name: "🆕 Nouvelle campagne",
                      desc: "Créer une nouvelle campagne CBO + adsets",
                    },
                    {
                      id: "existing_new_adset",
                      name: "📦 Campagne existante → Nouvel Adset",
                      desc: "Ajouter des adsets à une campagne existante",
                    },
                    {
                      id: "existing_adset",
                      name: "📁 Campagne existante → Adset existant",
                      desc: "Ajouter des ads à un adset existant",
                    },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setCboMode(opt.id);
                        setSelectedCampaign(null);
                        setSelectedAdset(null);
                      }}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border:
                          cboMode === opt.id
                            ? "2px solid #22c55e"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          cboMode === opt.id
                            ? "rgba(34,197,94,0.1)"
                            : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "500", fontSize: "13px" }}>
                        {opt.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#71717a",
                          marginTop: "2px",
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>

                {(cboMode === "existing_new_adset" ||
                  cboMode === "existing_adset") && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "10px",
                      }}
                    >
                      📦 Campagne {isLoadingCampaigns && "(chargement...)"}
                    </div>
                    {existingCampaigns.length > 0 && (
                      <input
                        type="text"
                        placeholder="🔍 Rechercher une campagne..."
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          fontSize: "12px",
                          marginBottom: "10px",
                          outline: "none",
                        }}
                      />
                    )}
                    {filteredCampaigns.length === 0 && !isLoadingCampaigns ? (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#71717a",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        {existingCampaigns.length === 0
                          ? "Aucune campagne CBO trouvée. Créez d'abord une campagne CBO dans Meta Ads Manager."
                          : "Aucune campagne ne correspond à votre recherche."}
                      </div>
                    ) : (
                      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {filteredCampaigns.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCampaign(c)}
                            style={{
                              padding: "10px",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              border:
                                selectedCampaign?.id === c.id
                                  ? "2px solid #22c55e"
                                  : "1px solid rgba(255,255,255,0.1)",
                              background:
                                selectedCampaign?.id === c.id
                                  ? "rgba(34,197,94,0.1)"
                                  : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: "500" }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "#71717a" }}>
                              {c.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {cboMode === "existing_adset" && selectedCampaign && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "14px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "10px",
                      }}
                    >
                      📁 Adset {isLoadingAdsets && "(chargement...)"}
                    </div>
                    {existingAdsets.length > 0 && (
                      <input
                        type="text"
                        placeholder="🔍 Rechercher un adset..."
                        value={adsetSearch}
                        onChange={(e) => setAdsetSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          fontSize: "12px",
                          marginBottom: "10px",
                          outline: "none",
                        }}
                      />
                    )}
                    {filteredAdsets.length === 0 && !isLoadingAdsets ? (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#71717a",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        {existingAdsets.length === 0
                          ? "Aucun adset trouvé pour cette campagne"
                          : "Aucun adset ne correspond à votre recherche."}
                      </div>
                    ) : (
                      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                        {filteredAdsets.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => setSelectedAdset(a)}
                            style={{
                              padding: "10px",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              border:
                                selectedAdset?.id === a.id
                                  ? "2px solid #e879f9"
                                  : "1px solid rgba(255,255,255,0.1)",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: "500" }}>
                              {a.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {budgetType === "abo" && (
              <div style={{ ...box, marginBottom: "24px" }}>
                <h4
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    color: "#f59e0b",
                  }}
                >
                  Options ABO
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {[
                    {
                      id: "1:1:1",
                      name: "1️⃣ Structure 1:1:1 (Nouvelle campagne)",
                      desc: "1 campagne par créa → 1 adset → 1 ad",
                    },
                    {
                      id: "multi",
                      name: "📊 Structure Multi (Nouvelle campagne)",
                      desc: "1 campagne → X adsets → Y ads",
                    },
                    {
                      id: "existing",
                      name: "📦 Campagne existante → Nouveaux Adsets",
                      desc: "Ajouter des adsets à une campagne ABO existante",
                    },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setAboMode(opt.id);
                        if (opt.id !== "existing") {
                          setSelectedCampaign(null);
                          setSelectedAdset(null);
                        }
                      }}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border:
                          aboMode === opt.id
                            ? "2px solid #f59e0b"
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          aboMode === opt.id
                            ? "rgba(245,158,11,0.1)"
                            : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "500", fontSize: "13px" }}>
                        {opt.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#71717a",
                          marginTop: "2px",
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>

                {aboMode === "existing" && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "10px",
                      }}
                    >
                      📦 Campagne {isLoadingCampaigns && "(chargement...)"}
                    </div>
                    {existingCampaigns.length > 0 && (
                      <input
                        type="text"
                        placeholder="🔍 Rechercher une campagne..."
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          fontSize: "12px",
                          marginBottom: "10px",
                          outline: "none",
                        }}
                      />
                    )}
                    {filteredCampaigns.length === 0 && !isLoadingCampaigns ? (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#71717a",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        {existingCampaigns.length === 0
                          ? "Aucune campagne trouvée"
                          : "Aucune campagne ne correspond à votre recherche."}
                      </div>
                    ) : (
                      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {filteredCampaigns.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCampaign(c)}
                            style={{
                              padding: "10px",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              border:
                                selectedCampaign?.id === c.id
                                  ? "2px solid #f59e0b"
                                  : "1px solid rgba(255,255,255,0.1)",
                              background:
                                selectedCampaign?.id === c.id
                                  ? "rgba(245,158,11,0.1)"
                                  : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: "500" }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "#71717a" }}>
                              {c.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!(
              (budgetType === "cbo" && cboMode === "existing_adset") ||
              (budgetType === "abo" && aboMode === "1:1:1") ||
              (budgetType === "abo" && aboMode === "existing")
            ) && (
              <div style={{ ...box, marginBottom: "24px" }}>
                <h4
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    color: "#a5b4fc",
                  }}
                >
                  ⚙️ Groupement
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "500" }}>
                        📐 Grouper par format
                      </div>
                    </div>
                    <div
                      onClick={() => setGroupByFormat(!groupByFormat)}
                      style={toggle(groupByFormat, "#6366f1")}
                    >
                      <div style={toggleKnob(groupByFormat)} />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "500" }}>
                        🎬 Séparer Vidéo / Statique
                      </div>
                    </div>
                    <div
                      onClick={() => setSplitByMediaType(!splitByMediaType)}
                      style={toggle(splitByMediaType, "#22c55e")}
                    >
                      <div style={toggleKnob(splitByMediaType)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(0)} style={btn2}>
                ← Compte
              </button>
              <button onClick={() => setStep(2)} style={btn1}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Config */}
        {step === 2 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "24px",
                color: "#a5b4fc",
              }}
            >
              02 — Configuration
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={box}>
                  {/* Budget logic based on structure */}
                  {(() => {
                    // CBO: Campagne existante → Budget de la campagne (read-only)
                    if (
                      budgetType === "cbo" &&
                      (cboMode === "existing_new_adset" ||
                        cboMode === "existing_adset")
                    ) {
                      const campaignBudget =
                        selectedCampaign?.daily_budget ||
                        selectedCampaign?.lifetime_budget;
                      return (
                        <>
                          <p style={{ margin: "0 0 8px", fontWeight: "600" }}>
                            💰 Budget campagne actuel
                          </p>
                          <div
                            style={{
                              padding: "12px",
                              background: "rgba(99,102,241,0.1)",
                              borderRadius: "8px",
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#6366f1",
                            }}
                          >
                            {campaignBudget
                              ? `${(campaignBudget / 100).toFixed(2)} ${
                                  selectedAdAccount?.currency
                                }/jour`
                              : "Budget non défini"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#71717a",
                              marginTop: "6px",
                            }}
                          >
                            ℹ️ Budget de la campagne existante (non modifiable)
                          </div>
                        </>
                      );
                    }

                    // ABO: Campagne existante → Budget de la campagne (read-only)
                    if (budgetType === "abo" && aboMode === "existing") {
                      const campaignBudget =
                        selectedCampaign?.daily_budget ||
                        selectedCampaign?.lifetime_budget;
                      return (
                        <>
                          <p style={{ margin: "0 0 8px", fontWeight: "600" }}>
                            💰 Budget campagne actuel
                          </p>
                          <div
                            style={{
                              padding: "12px",
                              background: "rgba(245,158,11,0.1)",
                              borderRadius: "8px",
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#f59e0b",
                            }}
                          >
                            {campaignBudget
                              ? `${(campaignBudget / 100).toFixed(2)} ${
                                  selectedAdAccount?.currency
                                }/jour`
                              : "Budget non défini"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#71717a",
                              marginTop: "6px",
                            }}
                          >
                            ℹ️ Le budget sera alloué par adset
                          </div>
                        </>
                      );
                    }

                    // CBO nouvelle campagne → Budget éditable
                    if (budgetType === "cbo" && cboMode === "new") {
                      return (
                        <>
                          <p style={{ margin: "0 0 8px", fontWeight: "600" }}>
                            💰 Budget de campagne ({selectedAdAccount?.currency}
                            /jour)
                          </p>
                          <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="Ex: 50"
                            style={{
                              ...inp,
                              fontSize: "18px",
                              fontWeight: "600",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#71717a",
                              marginTop: "6px",
                            }}
                          >
                            ℹ️ Meta optimise la répartition entre adsets
                          </div>
                        </>
                      );
                    }

                    // ABO (1:1:1 ou multi) → Budget par adset
                    if (
                      budgetType === "abo" &&
                      (aboMode === "1:1:1" || aboMode === "multi")
                    ) {
                      return (
                        <>
                          <p style={{ margin: "0 0 8px", fontWeight: "600" }}>
                            💰 Budget par adset ({selectedAdAccount?.currency}
                            /jour)
                          </p>
                          <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="Ex: 50"
                            style={{
                              ...inp,
                              fontSize: "18px",
                              fontWeight: "600",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#71717a",
                              marginTop: "6px",
                            }}
                          >
                            ℹ️ Chaque adset aura ce budget quotidien
                          </div>
                        </>
                      );
                    }

                    // Par défaut (ne devrait pas arriver)
                    return (
                      <>
                        <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                          💰 Budget ({selectedAdAccount?.currency}/jour)
                        </p>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          style={{ ...inp, fontSize: "18px", fontWeight: "600" }}
                        />
                      </>
                    );
                  })()}
                </div>
                <div style={box}>
                  <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                    🌍 Zones
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {Object.entries(GEO_ZONES).map(([k, z]) => (
                      <button
                        key={k}
                        onClick={() =>
                          setSelectedCountries((p) =>
                            p.includes(k) ? p.filter((c) => c !== k) : [...p, k]
                          )
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: selectedCountries.includes(k)
                            ? "2px solid #6366f1"
                            : "1px solid rgba(255,255,255,0.1)",
                          background: selectedCountries.includes(k)
                            ? "rgba(99,102,241,0.2)"
                            : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {z.flag} {z.code}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={box}>
                  <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                    🎯 Objectif
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: "8px",
                    }}
                  >
                    {Object.entries(OBJECTIVES).map(([k, o]) => (
                      <button
                        key={k}
                        onClick={() => {
                          setObjective(k);
                          setOptimizationEvent(OPTIMIZATION_EVENTS[k][0].id);
                        }}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          border:
                            objective === k
                              ? "2px solid #6366f1"
                              : "1px solid rgba(255,255,255,0.1)",
                          background:
                            objective === k
                              ? "rgba(99,102,241,0.2)"
                              : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <span style={{ fontSize: "18px", display: "block" }}>
                          {o.icon}
                        </span>
                        <span style={{ fontSize: "10px" }}>{o.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Événement d'optimisation (seulement pour conversions) */}
                {objective === "conversions" && (
                  <div style={box}>
                    <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                      🎯 Événement de conversion
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,1fr)",
                        gap: "8px",
                      }}
                    >
                      {OPTIMIZATION_EVENTS.conversions.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setOptimizationEvent(event.id)}
                          style={{
                            padding: "10px 8px",
                            borderRadius: "8px",
                            border:
                              optimizationEvent === event.id
                                ? "2px solid #22c55e"
                                : "1px solid rgba(255,255,255,0.1)",
                            background:
                              optimizationEvent === event.id
                                ? "rgba(34,197,94,0.2)"
                                : "transparent",
                            color: "#fff",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          <span style={{ fontSize: "16px", display: "block" }}>
                            {event.icon}
                          </span>
                          <span style={{ fontSize: "10px" }}>{event.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div style={box}>
                  <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                    👆 Bouton d'action (CTA)
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,1fr)",
                      gap: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {CALL_TO_ACTIONS.map((cta) => (
                      <button
                        key={cta.id}
                        onClick={() => setCallToAction(cta.id)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: "8px",
                          border:
                            callToAction === cta.id
                              ? "2px solid #f59e0b"
                              : "1px solid rgba(255,255,255,0.1)",
                          background:
                            callToAction === cta.id
                              ? "rgba(245,158,11,0.2)"
                              : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{cta.icon}</span>
                        <span style={{ fontSize: "11px" }}>{cta.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={box}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontWeight: "600" }}>✍️ Textes & Titres</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "10px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: isStep2Valid
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(239,68,68,0.2)",
                        color: isStep2Valid ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {isStep2Valid ? "✓" : "⚠️"}
                    </span>
                  </div>

                  {/* Textes */}
                  {primaryTexts.map((text, idx) => (
                    <div key={`text-${idx}`} style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#71717a" }}>
                          📝 Texte {idx === 0 ? "(Requis)" : `#${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            onClick={() => {
                              const newTexts = primaryTexts.filter((_, i) => i !== idx);
                              setPrimaryTexts(newTexts);
                            }}
                            style={{
                              marginLeft: "auto",
                              padding: "2px 6px",
                              fontSize: "10px",
                              border: "none",
                              background: "rgba(239,68,68,0.2)",
                              color: "#ef4444",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <textarea
                        value={text}
                        onChange={(e) => {
                          const newTexts = [...primaryTexts];
                          newTexts[idx] = e.target.value;
                          setPrimaryTexts(newTexts);
                        }}
                        placeholder={idx === 0 ? "Texte principal..." : `Variante ${idx}...`}
                        rows={3}
                        style={{
                          ...inp,
                          border:
                            idx === 0 && !text
                              ? "1px solid rgba(239,68,68,0.5)"
                              : "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                  ))}
                  {primaryTexts.length < 5 && (
                    <button
                      onClick={() => setPrimaryTexts([...primaryTexts, ""])}
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "16px",
                        borderRadius: "6px",
                        border: "1px dashed rgba(255,255,255,0.2)",
                        background: "transparent",
                        color: "#71717a",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      + Ajouter une variante de texte
                    </button>
                  )}

                  {/* Titres */}
                  {headlines.map((headline, idx) => (
                    <div key={`headline-${idx}`} style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#71717a" }}>
                          📌 Titre {idx === 0 ? "(Requis)" : `#${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            onClick={() => {
                              const newHeadlines = headlines.filter((_, i) => i !== idx);
                              setHeadlines(newHeadlines);
                            }}
                            style={{
                              marginLeft: "auto",
                              padding: "2px 6px",
                              fontSize: "10px",
                              border: "none",
                              background: "rgba(239,68,68,0.2)",
                              color: "#ef4444",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <input
                        value={headline}
                        onChange={(e) => {
                          const newHeadlines = [...headlines];
                          newHeadlines[idx] = e.target.value;
                          setHeadlines(newHeadlines);
                        }}
                        placeholder={idx === 0 ? "Titre principal..." : `Variante ${idx}...`}
                        style={{
                          ...inp,
                          border:
                            idx === 0 && !headline
                              ? "1px solid rgba(239,68,68,0.5)"
                              : "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                  ))}
                  {headlines.length < 5 && (
                    <button
                      onClick={() => setHeadlines([...headlines, ""])}
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "16px",
                        borderRadius: "6px",
                        border: "1px dashed rgba(255,255,255,0.2)",
                        background: "transparent",
                        color: "#71717a",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      + Ajouter une variante de titre
                    </button>
                  )}

                  {/* URL */}
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      🔗 URL de destination (Requis)
                    </span>
                  </div>
                  <input
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://..."
                    style={{
                      ...inp,
                      border: destinationUrl?.startsWith("http")
                        ? "1px solid rgba(34,197,94,0.5)"
                        : "1px solid rgba(239,68,68,0.5)",
                    }}
                  />
                </div>
                <div style={box}>
                  <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                    🏷️ Nomenclature
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Code client
                      </span>
                      <input
                        value={clientCode}
                        onChange={(e) =>
                          setClientCode(e.target.value.toUpperCase())
                        }
                        placeholder="Ex: ANG"
                        style={{ ...inp, marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Nom de campagne
                      </span>
                      <input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Ex: prospection"
                        style={{ ...inp, marginTop: "4px" }}
                      />
                    </div>
                  </div>

                  {/* Preview de la nomenclature */}
                  <div
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "#a5b4fc", marginBottom: "8px" }}>
                      📋 Aperçu de la structure
                    </div>
                    <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ color: "#71717a" }}>Campagne:</span>{" "}
                        <span style={{ color: "#6366f1", fontWeight: "500" }}>
                          {nomenclature.campaign}
                        </span>
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ color: "#71717a" }}>Adset:</span>{" "}
                        <span style={{ color: "#22c55e", fontWeight: "500" }}>
                          {nomenclature.adset}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#71717a" }}>Ad (exemple):</span>{" "}
                        <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                          {nomenclature.ad(1, "statique")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setStep(1)} style={btn2}>
                ← Structure
              </button>
              <button
                onClick={() => {
                  if (!isStep2Valid) {
                    alert("Remplissez les champs");
                    return;
                  }
                  setStep(3);
                }}
                style={btn1}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Upload */}
        {step === 3 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "24px",
                color: "#a5b4fc",
              }}
            >
              03 — Upload
            </h2>
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                processFiles([...e.dataTransfer.files]);
              }}
              style={{
                border: `2px dashed ${
                  isDragging ? "#e879f9" : "rgba(255,255,255,0.15)"
                }`,
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              {isProcessing ? (
                <p>Analyse...</p>
              ) : (
                <div>
                  <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📁</p>
                  <p>Glisser vos fichiers</p>
                  <label
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.1)",
                      cursor: "pointer",
                    }}
                  >
                    Parcourir
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => processFiles([...e.target.files])}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                {Object.entries(groupedFiles).map(([key, group]) => {
                  const p = META_PLACEMENTS[group.format] || {
                    name: "Mixed",
                    icon: "📁",
                    color: "#71717a",
                    bgColor: "rgba(255,255,255,0.05)",
                  };
                  return (
                    <div key={key} style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          padding: "10px 14px",
                          background: p.bgColor,
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        {p.icon}{" "}
                        <span style={{ fontWeight: "600", color: p.color }}>
                          {p.name}
                        </span>{" "}
                        {group.type !== "mixed" &&
                          `• ${
                            group.type === "video" ? "Vidéos" : "Images"
                          }`}{" "}
                        <span style={{ float: "right", color: "#71717a" }}>
                          {group.files.length}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill,minmax(200px,1fr))",
                          gap: "8px",
                          paddingLeft: "12px",
                        }}
                      >
                        {group.files.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: "8px",
                              padding: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "6px",
                                overflow: "hidden",
                              }}
                            >
                              {file.type === "video" ? (
                                <video
                                  src={file.preview}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <img
                                  src={file.preview}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                value={file.adName}
                                onChange={(e) =>
                                  setUploadedFiles((p) =>
                                    p.map((x) =>
                                      x.id === file.id
                                        ? { ...x, adName: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                style={{
                                  ...inp,
                                  fontSize: "11px",
                                  padding: "6px",
                                }}
                              />
                            </div>
                            <button
                              onClick={() =>
                                setUploadedFiles((p) =>
                                  p.filter((x) => x.id !== file.id)
                                )
                              }
                              style={{
                                background: "rgba(239,68,68,0.2)",
                                color: "#ef4444",
                                border: "none",
                                borderRadius: "6px",
                                width: "28px",
                                height: "28px",
                                cursor: "pointer",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mapping Mode */}
            {uploadedFiles.length > 0 && (() => {
              const formats = [...new Set(uploadedFiles.map(f => f.format))];
              const hasMultipleFormats = formats.length > 1;

              if (!hasMultipleFormats) return null;

              return (
                <div style={{ ...box, marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                      🔗 Mapping des formats
                    </h3>
                    <button
                      onClick={() => setMappingMode(!mappingMode)}
                      style={{
                        marginLeft: "auto",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: mappingMode ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)",
                        color: mappingMode ? "#22c55e" : "#6366f1",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {mappingMode ? "✓ Mode actif" : "Activer"}
                    </button>
                  </div>

                  {!mappingMode ? (
                    <div style={{ fontSize: "12px", color: "#71717a", lineHeight: "1.6" }}>
                      Plusieurs formats détectés ({formats.length} formats). Activez le mapping pour grouper des créatives de formats différents dans la même ad (ex: story + carré).
                    </div>
                  ) : (
                    <div>
                      {/* Instructions */}
                      <div style={{
                        padding: "12px",
                        background: "rgba(99,102,241,0.1)",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "11px",
                        lineHeight: "1.6",
                      }}>
                        💡 <strong>Glissez-déposez</strong> des créatives pour les grouper ensemble. Chaque groupe deviendra une ad avec plusieurs formats.
                      </div>

                      {/* Existing Groups */}
                      {adGroups.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "10px", color: "#a5b4fc" }}>
                            📦 Groupes créés ({adGroups.length})
                          </div>
                          {adGroups.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              style={{
                                padding: "12px",
                                background: "rgba(34,197,94,0.05)",
                                border: "1px solid rgba(34,197,94,0.2)",
                                borderRadius: "8px",
                                marginBottom: "10px",
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (draggedFile && !group.fileIds.includes(draggedFile.id)) {
                                  setAdGroups(prev => prev.map((g, i) =>
                                    i === groupIndex
                                      ? { ...g, fileIds: [...g.fileIds, draggedFile.id] }
                                      : { ...g, fileIds: g.fileIds.filter(id => id !== draggedFile.id) }
                                  ));
                                }
                                setDraggedFile(null);
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "600", color: "#22c55e" }}>
                                  Groupe #{groupIndex + 1}
                                </span>
                                <button
                                  onClick={() => {
                                    setAdGroups(prev => prev.filter((_, i) => i !== groupIndex));
                                  }}
                                  style={{
                                    marginLeft: "auto",
                                    padding: "2px 6px",
                                    fontSize: "10px",
                                    border: "none",
                                    background: "rgba(239,68,68,0.2)",
                                    color: "#ef4444",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {group.fileIds.map(fileId => {
                                  const file = uploadedFiles.find(f => f.id === fileId);
                                  if (!file) return null;
                                  const placement = META_PLACEMENTS[file.format];
                                  return (
                                    <div
                                      key={fileId}
                                      style={{
                                        position: "relative",
                                        background: "rgba(255,255,255,0.05)",
                                        border: `1px solid ${placement?.color || "rgba(255,255,255,0.1)"}`,
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        width: "100px",
                                      }}
                                    >
                                      {/* Thumbnail */}
                                      <div style={{
                                        width: "100%",
                                        height: "100px",
                                        background: "#18181b",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        position: "relative",
                                      }}>
                                        {file.type === "video" ? (
                                          <>
                                            <video
                                              src={file.preview}
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                              }}
                                              muted
                                            />
                                            <div style={{
                                              position: "absolute",
                                              top: "50%",
                                              left: "50%",
                                              transform: "translate(-50%, -50%)",
                                              background: "rgba(0,0,0,0.6)",
                                              borderRadius: "50%",
                                              width: "24px",
                                              height: "24px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "10px",
                                            }}>
                                              ▶
                                            </div>
                                          </>
                                        ) : (
                                          <img
                                            src={file.preview}
                                            alt={file.name}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        )}
                                      </div>

                                      {/* Format Badge */}
                                      <div style={{
                                        padding: "4px 6px",
                                        background: placement?.bgColor || "rgba(99,102,241,0.2)",
                                        fontSize: "8px",
                                        fontWeight: "600",
                                        color: placement?.color || "#6366f1",
                                        textAlign: "center",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "3px",
                                      }}>
                                        <span>{placement?.icon || "📁"}</span>
                                        <span>{placement?.name || file.format}</span>
                                      </div>

                                      {/* Remove Button */}
                                      <button
                                        onClick={() => {
                                          setAdGroups(prev => prev.map((g, i) =>
                                            i === groupIndex
                                              ? { ...g, fileIds: g.fileIds.filter(id => id !== fileId) }
                                              : g
                                          ).filter(g => g.fileIds.length > 0));
                                        }}
                                        style={{
                                          position: "absolute",
                                          top: "4px",
                                          right: "4px",
                                          background: "rgba(239,68,68,0.9)",
                                          border: "none",
                                          color: "#fff",
                                          borderRadius: "4px",
                                          width: "20px",
                                          height: "20px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Create New Group */}
                      <button
                        onClick={() => {
                          setAdGroups(prev => [...prev, { fileIds: [] }]);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px dashed rgba(99,102,241,0.3)",
                          background: "transparent",
                          color: "#6366f1",
                          cursor: "pointer",
                          fontSize: "12px",
                          marginBottom: "16px",
                        }}
                      >
                        + Créer un nouveau groupe
                      </button>

                      {/* Available Files */}
                      <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "10px", color: "#a5b4fc" }}>
                        📁 Créatives disponibles
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                        gap: "12px",
                      }}>
                        {uploadedFiles
                          .filter(file => !adGroups.some(g => g.fileIds.includes(file.id)))
                          .map(file => {
                            const placement = META_PLACEMENTS[file.format];
                            return (
                              <div
                                key={file.id}
                                draggable
                                onDragStart={() => setDraggedFile(file)}
                                onDragEnd={() => setDraggedFile(null)}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: `2px solid ${placement?.color || "rgba(255,255,255,0.1)"}`,
                                  borderRadius: "10px",
                                  cursor: "grab",
                                  overflow: "hidden",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.02)";
                                  e.currentTarget.style.borderColor = placement?.color || "#6366f1";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.borderColor = placement?.color || "rgba(255,255,255,0.1)";
                                }}
                              >
                                {/* Thumbnail */}
                                <div style={{
                                  width: "100%",
                                  height: "140px",
                                  background: "#18181b",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                  position: "relative",
                                }}>
                                  {file.type === "video" ? (
                                    <>
                                      <video
                                        src={file.preview}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        muted
                                      />
                                      <div style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        background: "rgba(0,0,0,0.6)",
                                        borderRadius: "50%",
                                        width: "32px",
                                        height: "32px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "14px",
                                      }}>
                                        ▶
                                      </div>
                                    </>
                                  ) : (
                                    <img
                                      src={file.preview}
                                      alt={file.name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Info */}
                                <div style={{ padding: "8px" }}>
                                  <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "3px 8px",
                                    background: placement?.bgColor || "rgba(99,102,241,0.2)",
                                    borderRadius: "4px",
                                    fontSize: "9px",
                                    fontWeight: "600",
                                    color: placement?.color || "#6366f1",
                                    marginBottom: "4px",
                                  }}>
                                    <span>{placement?.icon || "📁"}</span>
                                    <span>{placement?.name || file.format}</span>
                                  </div>
                                  <div style={{
                                    fontSize: "10px",
                                    color: "#71717a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {file.name}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(2)} style={btn2}>
                ← Config
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!uploadedFiles.length}
                style={{ ...btn1, opacity: uploadedFiles.length ? 1 : 0.5 }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Export */}
        {step === 4 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "24px",
                color: "#a5b4fc",
              }}
            >
              04 — Export
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "300px 1fr",
                gap: "20px",
              }}
            >
              <div style={box}>
                <h3
                  style={{
                    fontSize: "14px",
                    marginBottom: "16px",
                    color: "#a5b4fc",
                  }}
                >
                  📊 Résumé
                </h3>
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(34,197,94,0.1)",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontWeight: "600", fontSize: "12px" }}>
                    ✅ {selectedAdAccount?.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#71717a" }}>
                    📄 {selectedPage?.name}
                  </div>
                  {instagramAccount && (
                    <div style={{ fontSize: "11px", color: "#e879f9" }}>
                      📸 @{instagramAccount.username}
                    </div>
                  )}
                </div>

                {/* Configuration summary */}
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(99,102,241,0.1)",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#71717a" }}>Objectif:</span>{" "}
                    <span style={{ fontWeight: "500" }}>
                      {OBJECTIVES[objective]?.name}
                    </span>
                  </div>
                  {objective === "conversions" && (
                    <div style={{ marginBottom: "6px" }}>
                      <span style={{ color: "#71717a" }}>Événement:</span>{" "}
                      <span style={{ fontWeight: "500" }}>
                        {
                          OPTIMIZATION_EVENTS.conversions.find(
                            (e) => e.id === optimizationEvent
                          )?.name
                        }
                      </span>
                    </div>
                  )}
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#71717a" }}>CTA:</span>{" "}
                    <span style={{ fontWeight: "500" }}>
                      {CALL_TO_ACTIONS.find((c) => c.id === callToAction)?.name}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#71717a" }}>Budget:</span>{" "}
                    <span style={{ fontWeight: "500" }}>
                      {budget} {selectedAdAccount?.currency}/jour
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(99,102,241,0.15)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#6366f1",
                      }}
                    >
                      {structurePreview.campaigns}
                    </div>
                    <div style={{ fontSize: "9px", color: "#71717a" }}>
                      Camp.
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(251,191,36,0.15)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#fbbf24",
                      }}
                    >
                      {structurePreview.adsets}
                    </div>
                    <div style={{ fontSize: "9px", color: "#71717a" }}>
                      Adsets
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(74,222,128,0.15)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#4ade80",
                      }}
                    >
                      {structurePreview.ads}
                    </div>
                    <div style={{ fontSize: "9px", color: "#71717a" }}>Ads</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const data = {
                      meta: {
                        adAccountId: selectedAdAccount?.id,
                        pageId: selectedPage?.id,
                        pixelId: selectedPixel?.id,
                      },
                      structure: { budgetType, cboMode, aboMode },
                      config: {
                        campaignName,
                        budget,
                        objective,
                        optimizationEvent,
                        callToAction,
                        countries: selectedCountries,
                        nomenclature,
                      },
                      adCopy: {
                        texts: primaryTexts.filter((t) => t.trim()),
                        headlines: headlines.filter((h) => h.trim()),
                        url: destinationUrl,
                        cta: CALL_TO_ACTIONS.find((c) => c.id === callToAction)?.name,
                      },
                      files: uploadedFiles.map((f) => ({
                        name: f.adName,
                        type: f.type,
                        format: f.format,
                      })),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                      type: "application/json",
                    });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "export.json";
                    a.click();
                  }}
                  style={{ ...btn2, width: "100%", marginBottom: "10px" }}
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={() => alert("🚀 Lancement!")}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🚀 Lancer sur Meta
                </button>
              </div>
              <div style={{ ...box, maxHeight: "400px", overflowY: "auto" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    marginBottom: "16px",
                    color: "#a5b4fc",
                  }}
                >
                  🏗️ Structure
                </h3>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(99,102,241,0.1)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  📦 [
                  {selectedCountries.map((c) => GEO_ZONES[c]?.code).join("-")}]{" "}
                  {campaignName || "Campaign"}
                </div>
                {Object.entries(groupedFiles).map(([key, group]) => {
                  const p = META_PLACEMENTS[group.format] || {
                    icon: "📁",
                    color: "#71717a",
                    bgColor: "rgba(255,255,255,0.05)",
                  };
                  return (
                    <div
                      key={key}
                      style={{ marginLeft: "20px", marginBottom: "8px" }}
                    >
                      <div
                        style={{
                          padding: "8px 12px",
                          background: p.bgColor,
                          borderRadius: "6px",
                        }}
                      >
                        {p.icon} {p.name || "Mixed"}{" "}
                        <span style={{ float: "right", color: "#71717a" }}>
                          {group.files.length}
                        </span>
                      </div>
                      {group.files.map((f) => (
                        <div
                          key={f.id}
                          style={{
                            marginLeft: "20px",
                            marginTop: "4px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            color: "#a1a1aa",
                            borderLeft: "2px solid #22c55e",
                          }}
                        >
                          {f.type === "video" ? "🎬" : "🖼️"} {f.adName}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <button onClick={() => setStep(3)} style={btn2}>
                ← Upload
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
