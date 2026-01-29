import { useState, useCallback, useEffect, useMemo } from "react";

// META APP CONFIG - Configuration de l'app Facebook
// Pour configurer votre propre app:
// 1. Allez sur https://developers.facebook.com/apps
// 2. Créez une nouvelle app ou utilisez une existante
// 3. Activez "Facebook Login" et configurez les URLs de redirection
// 4. Activez les permissions nécessaires dans "App Review"
// 5. Remplacez l'appId ci-dessous par votre App ID
const META_APP = {
  appId: "720964414230898", // Votre App ID Facebook
  apiVersion: "v22.0",
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
  conversions: { name: "Conversions", code: "CONV", abbrev: "CV" },
  lead_form: { name: "Lead Form", code: "LF", abbrev: "LF" },
  lead_site: { name: "Lead Site", code: "LS", abbrev: "LS" },
};

const OPTIMIZATION_EVENTS = {
  conversions: [
    { id: "purchase", name: "Achat (Purchase)", code: "PUR" },
    { id: "add_to_cart", name: "Ajout panier (ATC)", code: "ATC" },
    { id: "initiate_checkout", name: "Début paiement", code: "IC" },
    { id: "add_payment_info", name: "Info paiement", code: "API" },
    { id: "view_content", name: "Voir contenu", code: "VC" },
    { id: "search", name: "Recherche", code: "SCH" },
  ],
  lead_form: [{ id: "lead", name: "Lead", code: "LEAD" }],
  lead_site: [{ id: "lead", name: "Lead", code: "LEAD" }],
};

const CALL_TO_ACTIONS = [
  { id: "LEARN_MORE", name: "En savoir plus" },
  { id: "SHOP_NOW", name: "Acheter" },
  { id: "SIGN_UP", name: "S'inscrire" },
  { id: "DOWNLOAD", name: "Télécharger" },
  { id: "APPLY_NOW", name: "Postuler" },
  { id: "BOOK_NOW", name: "Réserver" },
  { id: "CONTACT_US", name: "Nous contacter" },
  { id: "GET_QUOTE", name: "Devis" },
  { id: "SUBSCRIBE", name: "S'abonner" },
  { id: "WATCH_MORE", name: "Voir plus" },
  { id: "NO_BUTTON", name: "Pas de bouton" },
];

const META_PLACEMENTS = {
  story: {
    name: "Stories",
    abbrev: "ST",
    ratio: "9:16",
    minRatio: 0.5,
    maxRatio: 0.625,
    color: "#e879f9",
    bgColor: "rgba(232,121,249,0.15)",
  },
  feed_square: {
    name: "Feed 1:1",
    abbrev: "1:1",
    ratio: "1:1",
    minRatio: 0.9,
    maxRatio: 1.1,
    color: "#22d3ee",
    bgColor: "rgba(34,211,238,0.15)",
  },
  feed_portrait: {
    name: "Feed 4:5",
    abbrev: "4:5",
    ratio: "4:5",
    minRatio: 0.75,
    maxRatio: 0.89,
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.15)",
  },
  feed_landscape: {
    name: "Feed 16:9",
    abbrev: "16:9",
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

export default function CreativeImporterPro(props = {}) {
  // Props from parent App (when embedded)
  const {
    accessToken: propAccessToken,
    user: propUser,
    onLogout: propOnLogout,
    onBack: propOnBack,
    embedded = false,
    sharedAdAccount = null,
    sharedPage = null,
    sharedPixel = null,
  } = props;

  // Determine if we have all required shared selections
  const hasSharedSelections = embedded && sharedAdAccount && sharedPage;

  // Auth state - use props if provided
  const [accessToken, setAccessToken] = useState(propAccessToken || null);
  const [user, setUser] = useState(propUser || null);
  const [isAuthenticating, setIsAuthenticating] = useState(!propAccessToken);
  const [authError, setAuthError] = useState(null);

  // Data state - use shared props if provided
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState(sharedAdAccount);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(sharedPage);
  const [pixels, setPixels] = useState([]);
  const [selectedPixel, setSelectedPixel] = useState(sharedPixel);
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);
  const [adAccountSearch, setAdAccountSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [adsetSearch, setAdsetSearch] = useState("");

  // Campaign structure - start at step 1 (Structure) if we have shared selections
  const [step, setStep] = useState(hasSharedSelections ? 1 : 0);
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
  const [enableAdvantagePlus, setEnableAdvantagePlus] = useState(true);

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
  const [bidStrategy, setBidStrategy] = useState("LOWEST_COST_WITHOUT_CAP"); // Bid strategy selection

  // Campaign creation states
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);
  const [creationResult, setCreationResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({}); // Progress per creative {fileId: {progress: 0-100, status: 'uploading'|'creating'|'done'}}

  // Sync shared selections from parent (when user changes in sidebar)
  useEffect(() => {
    if (embedded) {
      if (sharedAdAccount) {
        setSelectedAdAccount(sharedAdAccount);
      }
      if (sharedPage) {
        setSelectedPage(sharedPage);
      }
      if (sharedPixel) {
        setSelectedPixel(sharedPixel);
      }
      // If we have all selections and we're at step 0, move to step 1 (Structure)
      if (sharedAdAccount && sharedPage && step === 0) {
        setStep(1);
      }
    }
  }, [embedded, sharedAdAccount, sharedPage, sharedPixel]);

  // Check for OAuth callback or saved token on mount
  useEffect(() => {
    // Skip auth check if props are provided (embedded mode)
    if (propAccessToken) {
      setIsAuthenticating(false);
      return;
    }

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
    if (propOnLogout) {
      propOnLogout();
      return;
    }
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
    // Filter by budget type: CBO campaigns have daily_budget or lifetime_budget, ABO don't
    let filtered = existingCampaigns.filter((c) => {
      const hasCampaignBudget = c.daily_budget || c.lifetime_budget;
      if (budgetType === "cbo") {
        return hasCampaignBudget; // CBO = budget at campaign level
      } else {
        return !hasCampaignBudget; // ABO = no budget at campaign level
      }
    });

    // Then filter by search
    if (campaignSearch.trim()) {
      const s = campaignSearch.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(s) ||
          c.id?.includes(s)
      );
    }
    return filtered;
  }, [existingCampaigns, campaignSearch, budgetType]);

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
    return groups;
  }, [uploadedFiles, splitByMediaType]);

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
    background: "rgba(17,7,38,0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid rgba(168,85,247,0.2)",
    boxShadow: "0 8px 32px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
  };
  const btn1 = {
    padding: "14px 28px",
    borderRadius: "12px",
    border: "1px solid rgba(168,85,247,0.3)",
    background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(168,85,247,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
    transition: "all 0.3s ease",
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
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(168,85,247,0.15)",
    background: "rgba(17,7,38,0.5)",
    color: "#fff",
    fontSize: "13px",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
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
          <div style={{
            width: "48px",
            height: "48px",
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "700",
            color: "#818cf8",
            margin: "0 auto 16px",
          }}>CI</div>
          <p style={{ color: "#52525b", fontSize: "13px" }}>Vérification de la connexion...</p>
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
                width: "56px",
                height: "56px",
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "700",
                color: "#818cf8",
                margin: "0 auto 24px",
              }}
            >
              CI
            </div>
            <h1 style={{ fontSize: "28px", margin: "0 0 8px" }}>
              Creative Importer{" "}
              <span style={{
                background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Pro</span>
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
                  Erreur de connexion
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
            Connexion sécurisée via Facebook OAuth. Vos identifiants ne sont
            jamais stockés.
          </p>
        </div>
      </div>
    );
  }

  // Create campaign on Meta
  const createCampaignOnMeta = async () => {
    setIsCreating(true);
    setCreationError(null);

    try {
      console.log("🚀 Starting campaign creation...");

      // Validate required fields
      if (!selectedPixel?.id && objective === "conversions") {
        throw new Error("Pixel requis pour les conversions. Veuillez sélectionner un pixel dans l'étape 1.");
      }

      const results = {
        campaigns: [],
        adsets: [],
        ads: [],
        errors: []
      };

      // Step 1: Upload images/videos and get hash IDs
      console.log("📤 Uploading creatives...");

      // Helper: extract first frame of a video as a Blob (JPEG)
      const extractVideoThumbnail = (videoFile) => new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(videoFile);
        video.src = url;

        video.addEventListener("loadeddata", () => {
          video.currentTime = 0.5; // Seek to 0.5s to avoid black first frame
        });

        video.addEventListener("seeked", () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            }, "image/jpeg", 0.85);
          } catch (e) {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        });

        video.addEventListener("error", () => {
          URL.revokeObjectURL(url);
          resolve(null);
        });

        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve(null);
        }, 10000);
      });

      // Helper: upload an image blob and return its hash
      const uploadThumbnail = async (blob, name) => {
        const thumbForm = new FormData();
        thumbForm.append("filename", new File([blob], name + "_thumb.jpg", { type: "image/jpeg" }));
        thumbForm.append("access_token", accessToken);
        const res = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adimages`)}`,
          { method: "POST", body: thumbForm }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const images = data.images || {};
        return Object.values(images)[0]?.hash || null;
      };

      // Helper: wait for video to be ready (processed by Facebook)
      const waitForVideoReady = async (videoId, maxWaitMs = 300000) => {
        const startTime = Date.now();
        const pollIntervalMs = 5000; // Check every 5 seconds

        console.log(`⏳ Waiting for video ${videoId} to be processed...`);

        while (Date.now() - startTime < maxWaitMs) {
          try {
            const statusUrl = `https://graph.facebook.com/${META_APP.apiVersion}/${videoId}?fields=status&access_token=${accessToken}`;
            const response = await fetch(statusUrl);
            const data = await response.json();

            if (data.error) {
              console.warn(`⚠️ Error checking video status: ${data.error.message}`);
              // Continue waiting even if status check fails
            } else if (data.status) {
              const videoStatus = data.status.video_status;
              console.log(`📹 Video ${videoId} status: ${videoStatus}`);

              if (videoStatus === 'ready') {
                console.log(`✅ Video ${videoId} is ready!`);
                return true;
              } else if (videoStatus === 'error') {
                console.error(`❌ Video ${videoId} processing failed`);
                return false;
              }
              // Status is 'processing' or other, continue waiting
            }
          } catch (err) {
            console.warn(`⚠️ Network error checking video status: ${err.message}`);
          }

          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        console.warn(`⚠️ Timeout waiting for video ${videoId} to be ready (${maxWaitMs / 1000}s)`);
        return false; // Timeout - try anyway
      };

      // Initialize progress for all files
      const initialProgress = {};
      uploadedFiles.forEach(file => {
        initialProgress[file.id] = { progress: 0, status: 'pending' };
      });
      setUploadProgress(initialProgress);

      // Upload sequentially to avoid rate limiting
      const uploadedHashes = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileSizeMB = file.file.size / 1024 / 1024;
        let uploadSuccess = false;
        let retryCount = 0;
        const maxRetries = file.type === "video" && fileSizeMB > 100 ? 2 : 1; // More retries for large videos

        while (!uploadSuccess && retryCount < maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`🔄 Retry ${retryCount}/${maxRetries - 1} for ${file.name}...`);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
            }

            console.log(`📤 Uploading ${file.type}: ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

            // Update progress: starting upload
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: { progress: 10, status: 'uploading' }
            }));

            let hash;

            // Use resumable upload for large videos (>50MB)
            if (file.type === "video" && fileSizeMB > 50) {
              console.log(`📹 Using resumable upload for large video: ${file.name} (${fileSizeMB.toFixed(1)} MB)`);

              // Upload directly to Facebook (no proxy) - Facebook's video endpoint supports CORS
              const videoUploadUrl = `https://graph-video.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/advideos`;

              // Phase 1: Start upload session
              const startData = new FormData();
              startData.append("upload_phase", "start");
              startData.append("file_size", file.file.size.toString());
              startData.append("access_token", accessToken);

              console.log(`📤 Starting upload session...`);
              const startResponse = await fetch(videoUploadUrl, {
                method: "POST",
                body: startData
              });

              if (!startResponse.ok) {
                const errorText = await startResponse.text();
                console.error(`Start phase error:`, errorText);
                throw new Error(`Start phase failed: ${startResponse.status}`);
              }

              const startResult = await startResponse.json();
              if (startResult.error) {
                throw new Error(startResult.error.message);
              }

              const { upload_session_id, video_id } = startResult;
              console.log(`📦 Upload session created: ${upload_session_id}, video_id: ${video_id}`);

              // Update progress: 20%
              setUploadProgress(prev => ({
                ...prev,
                [file.id]: { progress: 20, status: 'uploading' }
              }));

              // Phase 2: Transfer file in chunks (20MB chunks for direct upload)
              const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks for direct upload
              const fileSize = file.file.size;
              let startOffset = 0;
              let chunkNum = 0;
              const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

              console.log(`📦 Uploading in ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB`);

              while (startOffset < fileSize) {
                const endOffset = Math.min(startOffset + CHUNK_SIZE, fileSize);
                const chunk = file.file.slice(startOffset, endOffset);
                chunkNum++;

                console.log(`📤 Uploading chunk ${chunkNum}/${totalChunks} (${startOffset}-${endOffset})`);

                const transferData = new FormData();
                transferData.append("upload_phase", "transfer");
                transferData.append("upload_session_id", upload_session_id);
                transferData.append("start_offset", startOffset.toString());
                transferData.append("video_file_chunk", chunk);
                transferData.append("access_token", accessToken);

                const transferResponse = await fetch(videoUploadUrl, {
                  method: "POST",
                  body: transferData
                });

                if (!transferResponse.ok) {
                  throw new Error(`Transfer phase failed for chunk ${chunkNum}: ${transferResponse.status}`);
                }

                const transferResult = await transferResponse.json();
                if (transferResult.error) {
                  throw new Error(transferResult.error.message);
                }

                // Facebook returns the next start_offset
                startOffset = parseInt(transferResult.start_offset) || endOffset;

                // Update progress: 20% + (chunk progress * 30%)
                const chunkProgress = 20 + Math.round((chunkNum / totalChunks) * 20);
                setUploadProgress(prev => ({
                  ...prev,
                  [file.id]: { progress: chunkProgress, status: 'uploading' }
                }));
              }

              console.log(`📤 All chunks uploaded`);

              // Phase 3: Finish upload
              const finishData = new FormData();
              finishData.append("upload_phase", "finish");
              finishData.append("upload_session_id", upload_session_id);
              finishData.append("access_token", accessToken);

              const finishResponse = await fetch(videoUploadUrl, {
                method: "POST",
                body: finishData
              });

              if (!finishResponse.ok) {
                throw new Error(`Finish phase failed: ${finishResponse.status}`);
              }

              const finishResult = await finishResponse.json();
              if (finishResult.error) {
                throw new Error(finishResult.error.message);
              }

              hash = video_id;
              console.log(`✅ Resumable upload completed: ${hash}`);

              // Wait for Facebook to process the video before continuing
              setUploadProgress(prev => ({
                ...prev,
                [file.id]: { progress: 45, status: 'processing' }
              }));

              // Wait for video to be ready (max 5 min + 1 min per 100MB)
              const maxWaitMs = 300000 + Math.floor(fileSizeMB / 100) * 60000;
              const isReady = await waitForVideoReady(hash, maxWaitMs);
              if (!isReady) {
                console.warn(`⚠️ Video ${file.name} may not be fully processed yet`);
              }
            } else {
              // Standard upload for images and small videos
              const formData = new FormData();
              formData.append("source", file.file);
              formData.append("access_token", accessToken);

              const fbEndpoint = file.type === "video"
                ? `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/advideos`
                : `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adimages`;

              const response = await fetch(`/api/facebook-proxy?endpoint=${encodeURIComponent(fbEndpoint)}`, {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Upload response not OK for ${file.name}:`, response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
              }

              const data = await response.json();
              if (data.error) {
                console.error(`❌ Meta API error for ${file.name}:`, data.error);
                throw new Error(data.error.message);
              }

              hash = file.type === "video" ? data.id : data.images[Object.keys(data.images)[0]].hash;
            }
            console.log(`✅ Uploaded ${file.name}, hash: ${hash}`);

            // For small/medium videos (10-50MB), wait for Facebook to finish processing
            // Large videos (>50MB) already wait in the resumable upload section
            if (file.type === "video" && fileSizeMB > 10 && fileSizeMB <= 50) {
              setUploadProgress(prev => ({
                ...prev,
                [file.id]: { progress: 35, status: 'processing' }
              }));

              // Wait longer for larger videos (5 minutes base + 1 minute per 100MB)
              const waitTimeMs = 300000 + Math.floor(fileSizeMB / 100) * 60000;
              const isReady = await waitForVideoReady(hash, waitTimeMs);

              if (!isReady) {
                console.warn(`⚠️ Video ${file.name} may not be fully processed, attempting to create creative anyway...`);
              }
            }

            // For videos, extract first frame and upload as thumbnail (REQUIRED by Facebook)
            let thumbnailHash = null;
            if (file.type === "video") {
              console.log(`🖼️ Extracting thumbnail for ${file.name}...`);
              try {
                const thumbBlob = await extractVideoThumbnail(file.file);
                if (thumbBlob) {
                  thumbnailHash = await uploadThumbnail(thumbBlob, file.name);
                  console.log(`✅ Thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
                } else {
                  console.warn(`⚠️ Could not extract thumbnail for ${file.name}, creating default thumbnail...`);
                  // Create a simple colored canvas as fallback thumbnail
                  const canvas = document.createElement('canvas');
                  canvas.width = 1080;
                  canvas.height = 1920;
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#1a1a2e';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 48px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText('Video', canvas.width / 2, canvas.height / 2);
                  const fallbackBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                  if (fallbackBlob) {
                    thumbnailHash = await uploadThumbnail(fallbackBlob, file.name);
                    console.log(`✅ Fallback thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
                  }
                }
              } catch (thumbErr) {
                console.error(`❌ Thumbnail extraction failed for ${file.name}:`, thumbErr.message);
                // Create a simple fallback thumbnail
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = 1080;
                  canvas.height = 1920;
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#1a1a2e';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  const fallbackBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                  if (fallbackBlob) {
                    thumbnailHash = await uploadThumbnail(fallbackBlob, file.name);
                    console.log(`✅ Fallback thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
                  }
                } catch (fallbackErr) {
                  console.error(`❌ Even fallback thumbnail failed for ${file.name}:`, fallbackErr.message);
                }
              }

              // If we still don't have a thumbnail, warn but continue
              if (!thumbnailHash) {
                console.warn(`⚠️ No thumbnail available for ${file.name} - creative may fail`);
              }
            }

            // Update progress: upload complete
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: { progress: 50, status: 'uploaded' }
            }));

            uploadedHashes.push({
              fileId: file.id,
              hash: hash,
              type: file.type,
              thumbnailHash: thumbnailHash,
            });

            uploadSuccess = true;

            // Longer delay between uploads to avoid rate limiting
            // 4 seconds for videos, 2 seconds for images
            if (i < uploadedFiles.length - 1) {
              const delay = file.type === "video" ? 4000 : 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (err) {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error(`❌ Error uploading ${file.name} after ${maxRetries} attempts:`, err);
              results.errors.push(`Upload failed for ${file.name}: ${err.message}`);

              // Update progress: error
              setUploadProgress(prev => ({
                ...prev,
                [file.id]: { progress: 0, status: 'error' }
              }));

              uploadedHashes.push(null);
            }
          }
        }
      }

      const validHashes = uploadedHashes.filter(h => h !== null);
      if (validHashes.length === 0) {
        throw new Error("No creatives uploaded successfully");
      }

      // Step 2: Create or use existing campaign
      let campaignId;
      if (budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) {
        campaignId = selectedCampaign?.id;
        console.log(`✅ Using existing campaign: ${campaignId}`);
      } else {
        console.log("📦 Creating new campaign...");
        const campaignData = new FormData();
        campaignData.append("name", nomenclature.campaign);
        campaignData.append("objective", "OUTCOME_SALES");
        campaignData.append("status", "ACTIVE");
        campaignData.append("special_ad_categories", JSON.stringify([]));

        // Apply bid strategy
        campaignData.append("bid_strategy", bidStrategy);
        console.log(`💰 Using bid strategy: ${bidStrategy}`);

        if (budgetType === "cbo") {
          campaignData.append("daily_budget", Math.round(parseFloat(budget) * 100));
        }

        campaignData.append("access_token", accessToken);

        const campaignResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/campaigns`)}`,
          { method: "POST", body: campaignData }
        );

        const campaignResult = await campaignResponse.json();
        if (campaignResult.error) {
          console.error("Campaign creation error:", campaignResult.error);
          throw new Error(`Campaign: ${campaignResult.error.message} (Code: ${campaignResult.error.code})`);
        }

        campaignId = campaignResult.id;
        results.campaigns.push({ id: campaignId, name: nomenclature.campaign });
        console.log(`✅ Campaign created: ${campaignId}`);
      }

      // Step 3: Create or use existing adset
      let adsetId;
      if (budgetType === "cbo" && cboMode === "existing_adset") {
        adsetId = selectedAdset?.id;
        console.log(`✅ Using existing adset: ${adsetId}`);
      } else {
        console.log("📦 Creating new adset...");

        // Map optimization event to correct Meta format
        const eventMapping = {
          purchase: "PURCHASE",
          add_to_cart: "ADD_TO_CART",
          initiate_checkout: "INITIATE_CHECKOUT",
          add_payment_info: "ADD_PAYMENT_INFO",
          view_content: "VIEW_CONTENT",
          search: "SEARCH",
          lead: "LEAD"
        };

        // Detect dominant format from uploaded files to set placements
        const formats = uploadedFiles.map(f => f.format);
        const hasStoryOnly = formats.every(f => f === 'story');
        const hasFeedOnly = formats.every(f => f === 'feed' || f === 'feed_square');

        // Build targeting
        const targeting = {
          geo_locations: {
            countries: selectedCountries.map(c => GEO_ZONES[c].code),
          },
          age_min: 18,
          age_max: 65,
        };

        // Add placement restrictions based on creative formats
        if (hasStoryOnly) {
          // Only story placements for vertical videos/images
          targeting.publisher_platforms = ['facebook', 'instagram'];
          targeting.facebook_positions = ['story'];
          targeting.instagram_positions = ['story'];
          console.log("📱 Placements limited to Stories (9:16 format detected)");
        } else if (hasFeedOnly) {
          // Only feed placements for square/landscape formats
          targeting.publisher_platforms = ['facebook', 'instagram'];
          targeting.facebook_positions = ['feed'];
          targeting.instagram_positions = ['stream'];
          console.log("📰 Placements limited to Feed (square/landscape format detected)");
        } else {
          // Mixed formats: allow all placements
          console.log("🌐 All placements enabled (mixed formats detected)");
        }

        // Build promoted object
        const promotedObject = {
          pixel_id: selectedPixel.id,
          custom_event_type: eventMapping[optimizationEvent] || "PURCHASE",
        };

        console.log("📤 Adset creation params (detailed):", {
          name: nomenclature.adset,
          campaign_id: campaignId,
          promoted_object_raw: promotedObject,
          promoted_object_stringified: JSON.stringify(promotedObject),
          targeting_raw: targeting,
          targeting_stringified: JSON.stringify(targeting),
          budget_type: budgetType,
          budget_value: budgetType === "abo" ? Math.round(parseFloat(budget) * 100) : "N/A (CBO)",
          pixel_id: selectedPixel.id,
          event: eventMapping[optimizationEvent],
        });

        const adsetData = new FormData();
        adsetData.append("name", nomenclature.adset);
        adsetData.append("campaign_id", campaignId);
        adsetData.append("status", "ACTIVE");
        adsetData.append("billing_event", "IMPRESSIONS");
        adsetData.append("optimization_goal", "OFFSITE_CONVERSIONS");
        // No bid_strategy = "Volume le plus élevé" (obtenir les meilleurs résultats pour le budget)

        // Disable automatic improvements
        adsetData.append("adset_auto_targeting_enabled", "false");

        adsetData.append("promoted_object", JSON.stringify(promotedObject));
        adsetData.append("targeting", JSON.stringify(targeting));

        // Budget handling - required for ABO, not for CBO
        // Ensure minimum budget (Meta requires at least 1000 cents = 10 EUR/day)
        if (budgetType === "abo") {
          const dailyBudget = Math.max(1000, Math.round(parseFloat(budget) * 100));
          adsetData.append("daily_budget", dailyBudget);
          console.log(`💰 Budget: ${dailyBudget} cents (${dailyBudget/100} EUR/day)`);
        }

        adsetData.append("access_token", accessToken);

        const adsetResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adsets`)}`,
          { method: "POST", body: adsetData }
        );

        const adsetResult = await adsetResponse.json();
        if (adsetResult.error) {
          console.error("❌ Adset creation error FULL:", JSON.stringify(adsetResult.error, null, 2));
          console.error("❌ Error details:", {
            message: adsetResult.error.message,
            code: adsetResult.error.code,
            error_subcode: adsetResult.error.error_subcode,
            error_user_title: adsetResult.error.error_user_title,
            error_user_msg: adsetResult.error.error_user_msg,
            fbtrace_id: adsetResult.error.fbtrace_id,
          });
          throw new Error(`Adset: ${adsetResult.error.message} (Code: ${adsetResult.error.code}${adsetResult.error.error_subcode ? `, Subcode: ${adsetResult.error.error_subcode}` : ''})`);
        }

        adsetId = adsetResult.id;
        results.adsets.push({ id: adsetId, name: nomenclature.adset });
        console.log(`✅ Adset created: ${adsetId}`);
      }

      // Step 4: Create ads
      console.log("📦 Creating ads...");
      const filteredTexts = primaryTexts.filter(t => t && t.trim());
      const filteredHeadlines = headlines.filter(h => h && h.trim());

      // Validate required fields
      if (filteredTexts.length === 0) {
        throw new Error("Au moins un texte principal est requis pour créer les publicités");
      }
      if (!destinationUrl || !destinationUrl.trim()) {
        throw new Error("L'URL de destination est requise pour créer les publicités");
      }

      // Helper to get placement positions based on format
      // Only include Instagram if account is linked
      const hasInstagramAccount = !!instagramAccount?.id;
      console.log(`📸 Has Instagram account: ${hasInstagramAccount}`);

      const getPlacementForFormat = (format) => {
        if (format === 'story') {
          // 9:16 vertical format - Stories et Reels uniquement
          const placements = {
            facebook_positions: ["story", "facebook_reels"],
          };
          if (hasInstagramAccount) {
            placements.instagram_positions = ["story", "reels"];
          }
          return placements;
        } else {
          // 1:1, 4:5, 16:9 formats - Feed uniquement
          const placements = {
            facebook_positions: ["feed"],
          };
          if (hasInstagramAccount) {
            placements.instagram_positions = ["stream"];
          }
          return placements;
        }
      };

      // Separate mapped files (in adGroups) from unmapped files
      const mappedFileIds = adGroups.flatMap(g => g.fileIds);
      let unmappedHashes = validHashes.filter(h => !mappedFileIds.includes(h.fileId));

      // Process mapped groups first (create ONE ad per group with asset_feed_spec)
      for (let groupIndex = 0; groupIndex < adGroups.length; groupIndex++) {
        const group = adGroups[groupIndex];
        const groupHashes = validHashes.filter(h => group.fileIds.includes(h.fileId));

        if (groupHashes.length === 0) continue;

        // If only ONE file in group, treat as unmapped (separate ads)
        if (groupHashes.length === 1) {
          console.log(`📦 Group #${groupIndex + 1}: Single file, creating regular ad`);
          groupHashes.forEach(h => unmappedHashes.push(h));
          continue;
        }

        const adName = nomenclature.ad(groupIndex + 1, "multi");
        console.log(`📦 Creating multi-format ad for group #${groupIndex + 1} with ${groupHashes.length} assets`);

        // Update progress for all files in group
        groupHashes.forEach(h => {
          setUploadProgress(prev => ({
            ...prev,
            [h.fileId]: { progress: 60, status: 'creating' }
          }));
        });

        // Build asset_feed_spec for multi-placement ad
        const images = [];
        const videos = [];
        const assetCustomizationRules = [];

        groupHashes.forEach((hashData, idx) => {
          const file = uploadedFiles.find(f => f.id === hashData.fileId);
          const labelName = `asset_${idx}_${file.format}`;
          const placements = getPlacementForFormat(file.format);

          // Only include Instagram if account is linked
          const publisherPlatforms = hasInstagramAccount ? ["facebook", "instagram"] : ["facebook"];

          if (hashData.type === "video") {
            videos.push({
              video_id: hashData.hash,
              thumbnail_hash: hashData.thumbnailHash,
              adlabels: [{ name: labelName }]
            });
            assetCustomizationRules.push({
              customization_spec: {
                publisher_platforms: publisherPlatforms,
                ...placements
              },
              video_label: { name: labelName }
            });
          } else {
            images.push({
              hash: hashData.hash,
              adlabels: [{ name: labelName }]
            });
            assetCustomizationRules.push({
              customization_spec: {
                publisher_platforms: publisherPlatforms,
                ...placements
              },
              image_label: { name: labelName }
            });
          }
        });

        // Determine ad format based on content
        const hasVideos = videos.length > 0;
        const hasImages = images.length > 0;
        const adFormat = hasVideos && !hasImages ? "SINGLE_VIDEO" : "SINGLE_IMAGE";

        const assetFeedSpec = {
          ad_formats: [adFormat],
          ...(images.length > 0 && { images }),
          ...(videos.length > 0 && { videos }),
          bodies: filteredTexts.map(t => ({ text: t })),
          ...(filteredHeadlines.length > 0 && { titles: filteredHeadlines.map(t => ({ text: t })) }),
          link_urls: [{ website_url: destinationUrl.trim() }],
          call_to_action_types: [callToAction !== "NO_BUTTON" ? callToAction : "LEARN_MORE"],
          asset_customization_rules: assetCustomizationRules
        };

        console.log(`📝 Creating multi-format creative with asset_feed_spec:`, JSON.stringify(assetFeedSpec, null, 2));
        console.log(`📸 Instagram account:`, instagramAccount);
        console.log(`📸 Instagram ID:`, instagramAccount?.id);

        const objectStorySpecForFeed = {
          page_id: selectedPage.id,
          // Use Instagram account if linked, otherwise use Facebook Page ID
          // This is equivalent to "Use Facebook Page" option in Meta Ads Manager
          instagram_actor_id: hasInstagramAccount ? instagramAccount.id : selectedPage.id,
        };

        console.log(`📝 object_story_spec:`, JSON.stringify(objectStorySpecForFeed, null, 2));

        const creativeData = new FormData();
        creativeData.append("name", adName);
        creativeData.append("object_story_spec", JSON.stringify(objectStorySpecForFeed));
        creativeData.append("asset_feed_spec", JSON.stringify(assetFeedSpec));
        creativeData.append("link_url", destinationUrl.trim());

        // Add Advantage+ Creative enhancements setting
        if (!enableAdvantagePlus) {
          const degreesOfFreedomSpec = {
            creative_features_spec: {
              image_touchups: { enroll_status: "OPT_OUT" },
              image_enhancement: { enroll_status: "OPT_OUT" },
              image_templates: { enroll_status: "OPT_OUT" },
              image_uncrop: { enroll_status: "OPT_OUT" },
              image_brightness_and_contrast: { enroll_status: "OPT_OUT" },
              image_auto_crop: { enroll_status: "OPT_OUT" },
              text_optimizations: { enroll_status: "OPT_OUT" },
              text_generation: { enroll_status: "OPT_OUT" },
              adapt_to_placement: { enroll_status: "OPT_OUT" },
              enhance_cta: { enroll_status: "OPT_OUT" },
              advantage_plus_creative: { enroll_status: "OPT_OUT" }
            }
          };
          creativeData.append("degrees_of_freedom_spec", JSON.stringify(degreesOfFreedomSpec));
        }

        creativeData.append("access_token", accessToken);

        const creativeResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adcreatives`)}`,
          { method: "POST", body: creativeData }
        );

        const creativeResult = await creativeResponse.json();
        if (creativeResult.error) {
          console.error(`Error creating multi-format creative:`, creativeResult.error);
          results.errors.push(`Multi-format creative failed: ${creativeResult.error.message}`);
          groupHashes.forEach(h => {
            setUploadProgress(prev => ({
              ...prev,
              [h.fileId]: { progress: 0, status: 'error' }
            }));
          });
          continue;
        }

        // Update progress
        groupHashes.forEach(h => {
          setUploadProgress(prev => ({
            ...prev,
            [h.fileId]: { progress: 80, status: 'creating' }
          }));
        });

        // Create ad
        const adData = new FormData();
        adData.append("name", adName);
        adData.append("adset_id", adsetId);
        adData.append("creative", JSON.stringify({ creative_id: creativeResult.id }));
        adData.append("status", "ACTIVE");
        adData.append("access_token", accessToken);

        const adResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/ads`)}`,
          { method: "POST", body: adData }
        );

        const adResult = await adResponse.json();
        if (adResult.error) {
          console.error(`Error creating multi-format ad:`, adResult.error);
          results.errors.push(`Multi-format ad failed: ${adResult.error.message}`);
          groupHashes.forEach(h => {
            setUploadProgress(prev => ({
              ...prev,
              [h.fileId]: { progress: 0, status: 'error' }
            }));
          });
        } else {
          results.ads.push({ id: adResult.id, name: adName });
          console.log(`✅ Multi-format ad created: ${adResult.id}`);
          groupHashes.forEach(h => {
            setUploadProgress(prev => ({
              ...prev,
              [h.fileId]: { progress: 100, status: 'done' }
            }));
          });
        }
      }

      // Process unmapped files (original logic - one ad per file)
      for (let i = 0; i < unmappedHashes.length; i++) {
        const hashData = unmappedHashes[i];
        const file = uploadedFiles.find(f => f.id === hashData.fileId);

        const adName = nomenclature.ad(adGroups.length + i + 1, file.format);

        // Update progress: creating creative
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: { progress: 60, status: 'creating' }
        }));

        // Create ad creative
        const creativeData = new FormData();
        creativeData.append("name", adName);

        // Build object_story_spec using link_data for both images and videos
        let objectStorySpec;

        // For videos, use video_data; for images, use link_data
        if (hashData.type === "video") {
          // Facebook REQUIRES a thumbnail (image_hash) for video ads
          if (!hashData.thumbnailHash) {
            console.error(`❌ No thumbnail available for video ${file.name} - skipping creative`);
            results.errors.push(`No thumbnail for ${file.name}: Facebook requires a thumbnail for video ads`);
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: { progress: 0, status: 'error' }
            }));
            continue;
          }

          const videoData = {
            video_id: hashData.hash,
            image_hash: hashData.thumbnailHash, // REQUIRED by Facebook
            message: filteredTexts[i % filteredTexts.length],
            call_to_action: {
              type: callToAction !== "NO_BUTTON" ? callToAction : "LEARN_MORE",
              value: {
                link: destinationUrl.trim(),
              },
            },
          };

          // Add title (headline) if available
          if (filteredHeadlines.length > 0) {
            videoData.title = filteredHeadlines[i % filteredHeadlines.length];
          }

          objectStorySpec = {
            page_id: selectedPage.id,
            video_data: videoData,
          };
        } else {
          // Images use link_data
          const linkData = {
            link: destinationUrl.trim(),
            message: filteredTexts[i % filteredTexts.length],
            image_hash: hashData.hash,
          };

          // Add headline only if available
          if (filteredHeadlines.length > 0) {
            linkData.name = filteredHeadlines[i % filteredHeadlines.length];
          }

          // Add call_to_action only if not NO_BUTTON
          if (callToAction !== "NO_BUTTON") {
            linkData.call_to_action = {
              type: callToAction,
            };
          }

          objectStorySpec = {
            page_id: selectedPage.id,
            link_data: linkData,
          };
        }

        // Only add instagram_actor_id if available
        if (instagramAccount?.id) {
          objectStorySpec.instagram_actor_id = instagramAccount.id;
        }

        console.log(`📝 Creating creative for ${file.name}:`, JSON.stringify(objectStorySpec, null, 2));

        creativeData.append("object_story_spec", JSON.stringify(objectStorySpec));

        // Add Advantage+ Creative enhancements setting (API v22.0 format)
        if (!enableAdvantagePlus) {
          const degreesOfFreedomSpec = {
            creative_features_spec: {
              image_touchups: { enroll_status: "OPT_OUT" },
              image_enhancement: { enroll_status: "OPT_OUT" },
              image_templates: { enroll_status: "OPT_OUT" },
              image_uncrop: { enroll_status: "OPT_OUT" },
              image_brightness_and_contrast: { enroll_status: "OPT_OUT" },
              image_auto_crop: { enroll_status: "OPT_OUT" },
              text_optimizations: { enroll_status: "OPT_OUT" },
              text_generation: { enroll_status: "OPT_OUT" },
              adapt_to_placement: { enroll_status: "OPT_OUT" },
              enhance_cta: { enroll_status: "OPT_OUT" },
              advantage_plus_creative: { enroll_status: "OPT_OUT" }
            }
          };
          creativeData.append("degrees_of_freedom_spec", JSON.stringify(degreesOfFreedomSpec));
          console.log(`🚫 Advantage+ Creative disabled for ${file.name}`);
        }

        creativeData.append("access_token", accessToken);

        const creativeResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adcreatives`)}`,
          { method: "POST", body: creativeData }
        );

        const creativeResult = await creativeResponse.json();
        if (creativeResult.error) {
          console.error(`Error creating creative for ${file.name}:`, creativeResult.error);
          results.errors.push(`Creative failed for ${file.name}: ${creativeResult.error.message}`);

          // Update progress: error
          setUploadProgress(prev => ({
            ...prev,
            [file.id]: { progress: 0, status: 'error' }
          }));

          continue;
        }

        // Update progress: creative created, now creating ad
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: { progress: 80, status: 'creating' }
        }));

        // Create ad
        const adData = new FormData();
        adData.append("name", adName);
        adData.append("adset_id", adsetId);
        adData.append("creative", JSON.stringify({ creative_id: creativeResult.id }));
        adData.append("status", "ACTIVE");
        adData.append("access_token", accessToken);

        const adResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/ads`)}`,
          { method: "POST", body: adData }
        );

        const adResult = await adResponse.json();
        if (adResult.error) {
          console.error(`Error creating ad for ${file.name}:`, adResult.error);
          results.errors.push(`Ad failed for ${file.name}: ${adResult.error.message}`);

          // Update progress: error
          setUploadProgress(prev => ({
            ...prev,
            [file.id]: { progress: 0, status: 'error' }
          }));
        } else {
          results.ads.push({ id: adResult.id, name: adName });
          console.log(`✅ Ad created: ${adResult.id}`);

          // Update progress: complete
          setUploadProgress(prev => ({
            ...prev,
            [file.id]: { progress: 100, status: 'done' }
          }));
        }
      }

      setCreationResult(results);
      setStep(5);
      console.log("🎉 Campaign creation completed!", results);

    } catch (error) {
      console.error("❌ Campaign creation failed:", error);
      setCreationError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // MAIN APP
  return (
    <div
      style={{
        minHeight: "100vh",
        background: embedded ? "transparent" : "linear-gradient(135deg, #0f0817 0%, #1a0b2e 25%, #2d1b4e 50%, #1a0b2e 75%, #0f0817 100%)",
        fontFamily: "system-ui",
        color: "#e4e4e7",
        padding: embedded ? "32px 40px" : "24px",
        position: "relative",
        overflow: embedded ? "visible" : "hidden",
      }}
    >
      {/* Gradient orbs for background effect - only in standalone mode */}
      {!embedded && (
        <>
          <div style={{
            position: "fixed",
            top: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            zIndex: 0,
          }}></div>
          <div style={{
            position: "fixed",
            bottom: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            zIndex: 0,
          }}></div>
        </>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
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
              width: embedded ? "40px" : "44px",
              height: embedded ? "40px" : "44px",
              background: "rgba(129,140,248,0.12)",
              borderRadius: embedded ? "10px" : "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: embedded ? "14px" : "16px",
              fontWeight: "700",
              color: "#818cf8",
              border: "1px solid rgba(129,140,248,0.2)",
            }}
          >
            CI
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: embedded ? "22px" : "24px", color: "#fff" }}>
              Creative Importer{" "}
              <span style={{
                background: embedded ? "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)" : "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Pro</span>
            </h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#71717a" }}>
              {embedded ? "Importez et lancez vos campagnes Meta Ads" : "Connected to Meta Ads API"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {step >= 1 && selectedAdAccount && (
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
                    color: "#fff",
                    background:
                      step === s.n
                        ? embedded ? "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)" : "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)"
                        : step > s.n
                        ? embedded ? "rgba(99,102,241,0.2)" : "rgba(168,85,247,0.2)"
                        : "rgba(255,255,255,0.05)",
                    border: step === s.n
                      ? embedded ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(168,85,247,0.3)"
                      : "1px solid transparent",
                    boxShadow: step === s.n
                      ? embedded ? "0 4px 12px rgba(99,102,241,0.3)" : "0 4px 12px rgba(168,85,247,0.3)"
                      : "none",
                  }}
                >
                  {step > s.n ? "✓" : s.n} {s.l}
                </div>
              ))}
            </div>
          )}
          {/* User Menu - only show in standalone mode */}
          {!embedded && (
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
          )}
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
              Sélection du compte
            </h2>
            {isLoading && (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: "#18181b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#71717a",
                  margin: "0 auto 16px",
                }}>...</div>
                <p style={{ color: "#71717a", fontSize: "13px" }}>Chargement des comptes...</p>
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
                <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
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
                      Compte Publicitaire ({adAccounts.length})
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
                      S
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
                        Pixel{" "}
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
                        S
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
                      name: "Campagne existante → Adset existant",
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
                        placeholder="Rechercher une campagne..."
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
                      Adset {isLoadingAdsets && "(chargement...)"}
                    </div>
                    {existingAdsets.length > 0 && (
                      <input
                        type="text"
                        placeholder="Rechercher un adset..."
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
                      name: "Structure Multi (Nouvelle campagne)",
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
                        placeholder="Rechercher une campagne..."
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
                    Zones
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
                {/* Only show Objective if creating new campaign */}
                {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
                  <div style={box}>
                    <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                      Objectif
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
                )}

                {/* Événement d'optimisation (seulement pour conversions et si nouvelle campagne) */}
                {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && objective === "conversions" && (
                  <div style={box}>
                    <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                      Événement de conversion
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

                {/* Bid Strategy Selector - Only show if creating new campaign */}
                {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
                  <div style={box}>
                    <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                      💰 Stratégie d'enchère
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => setBidStrategy("LOWEST_COST_WITHOUT_CAP")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: bidStrategy === "LOWEST_COST_WITHOUT_CAP" ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                          background: bidStrategy === "LOWEST_COST_WITHOUT_CAP" ? "rgba(99,102,241,0.2)" : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: "600" }}>Volume le plus élevé</div>
                        <div style={{ fontSize: "9px", color: "#71717a", marginTop: "2px" }}>
                          Obtenir les meilleurs résultats pour le budget
                        </div>
                      </button>
                      <button
                        onClick={() => setBidStrategy("LOWEST_COST_WITH_BID_CAP")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: bidStrategy === "LOWEST_COST_WITH_BID_CAP" ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                          background: bidStrategy === "LOWEST_COST_WITH_BID_CAP" ? "rgba(99,102,241,0.2)" : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: "600" }}>Limite d'enchères</div>
                        <div style={{ fontSize: "9px", color: "#71717a", marginTop: "2px" }}>
                          Contrôler le coût de chaque résultat
                        </div>
                      </button>
                      <button
                        onClick={() => setBidStrategy("COST_CAP")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: bidStrategy === "COST_CAP" ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                          background: bidStrategy === "COST_CAP" ? "rgba(99,102,241,0.2)" : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: "600" }}>Objectif de coût</div>
                        <div style={{ fontSize: "9px", color: "#71717a", marginTop: "2px" }}>
                          Maintenir un coût moyen par résultat
                        </div>
                      </button>
                    </div>
                  </div>
                )}
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
                      {isStep2Valid ? "OK" : "!"}
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
                          Texte {idx === 0 ? "(Requis)" : `#${idx + 1}`}
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
                      URL de destination (Requis)
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
                    Nomenclature
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
                    {/* Only show campaign name if creating new campaign */}
                    {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
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
                    )}
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
                      Aperçu de la structure
                    </div>
                    <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                      {/* Show campaign name only if creating new campaign */}
                      {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "#71717a" }}>Campagne:</span>{" "}
                          <span style={{ color: "#6366f1", fontWeight: "500" }}>
                            {nomenclature.campaign}
                          </span>
                        </div>
                      )}
                      {/* Show adset name only if creating new adset */}
                      {!(budgetType === "cbo" && cboMode === "existing_adset") && (
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "#71717a" }}>Adset:</span>{" "}
                          <span style={{ color: "#22c55e", fontWeight: "500" }}>
                            {nomenclature.adset}
                          </span>
                        </div>
                      )}
                      {/* Always show ad name */}
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
                  <div style={{ width: "48px", height: "48px", background: "rgba(129,140,248,0.12)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "#818cf8", margin: "0 auto 12px" }}>+</div>
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

            {/* Option Advantage+ Creative */}
            <div
              style={{
                background: "rgba(17,24,39,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
                    Améliorations Advantage+ Creative
                  </div>
                  <div style={{ fontSize: "12px", color: "#71717a", maxWidth: "400px" }}>
                    {enableAdvantagePlus
                      ? "Meta peut modifier automatiquement vos créatives (retouches visuelles, texte, CTA...)"
                      : "Vos créatives seront utilisées telles quelles, sans modification automatique"}
                  </div>
                </div>
                <div
                  onClick={() => setEnableAdvantagePlus(!enableAdvantagePlus)}
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: enableAdvantagePlus ? "#8b5cf6" : "rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "10px",
                      background: "white",
                      position: "absolute",
                      top: "2px",
                      left: enableAdvantagePlus ? "22px" : "2px",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                {Object.entries(groupedFiles).map(([key, group]) => {
                  const p = META_PLACEMENTS[group.format] || {
                    name: "Mixed",
                    abbrev: "F",
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
                      Mapping des formats
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
                        <strong>Tip:</strong> <strong>Glissez-déposez</strong> des créatives pour les grouper ensemble. Chaque groupe deviendra une ad avec plusieurs formats.
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
                                        <span>{placement?.abbrev || "F"}</span>
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
                        Créatives disponibles
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
                                    <span>{placement?.abbrev || "F"}</span>
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
                  Résumé
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
                    {selectedAdAccount?.name}
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
                  Export JSON
                </button>
                <button
                  onClick={createCampaignOnMeta}
                  disabled={isCreating}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "none",
                    background: isCreating
                      ? "rgba(99,102,241,0.5)"
                      : "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                >
                  {isCreating ? "Création en cours..." : "Lancer sur Meta"}
                </button>
                {creationError && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "11px",
                  }}>
                    Erreur: {creationError}
                  </div>
                )}

                {/* Progress bars for each creative */}
                {isCreating && Object.keys(uploadProgress).length > 0 && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "8px",
                  }}>
                    <p style={{ fontSize: "11px", color: "#a5b4fc", marginBottom: "12px", fontWeight: "600" }}>
                      Progression des créatives
                    </p>
                    {uploadedFiles.map(file => {
                      const progress = uploadProgress[file.id] || { progress: 0, status: 'pending' };
                      const statusAbbrev = progress.status === 'uploading' ? 'UP' : progress.status === 'processing' ? 'PR' : progress.status === 'uploaded' ? 'OK' : progress.status === 'creating' ? 'CR' : progress.status === 'done' ? 'OK' : progress.status === 'error' ? 'ER' : '...';
                      const statusDesc = progress.status === 'uploading' ? 'Upload...' : progress.status === 'processing' ? 'Traitement vidéo...' : progress.status === 'uploaded' ? 'Uploadé' : progress.status === 'creating' ? 'Création...' : progress.status === 'done' ? 'Terminé' : progress.status === 'error' ? 'Erreur' : 'En attente';

                      return (
                        <div key={file.id} style={{ marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#e4e4e7", marginBottom: "4px" }}>
                            <span>[{statusAbbrev}] {file.name}</span>
                            <span>{statusDesc} ({progress.progress}%)</span>
                          </div>
                          <div style={{
                            width: "100%",
                            height: "6px",
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: "3px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${progress.progress}%`,
                              height: "100%",
                              background: progress.status === 'error' ? "#ef4444" : progress.status === 'done' ? "#10b981" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                              transition: "width 0.3s ease"
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    abbrev: "F",
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
                          {f.type === "video" ? "V" : "I"} {f.adName}
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

        {/* STEP 5: Finalization */}
        {step === 5 && creationResult && (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "24px", color: "#a5b4fc" }}>
              05 — Finalisation
            </h2>

            {/* Success Summary */}
            <div style={{ ...box, marginBottom: "24px" }}>
              <div style={{
                textAlign: "center",
                padding: "24px",
                background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
                borderRadius: "12px",
                marginBottom: "24px",
              }}>
                <div style={{ width: "56px", height: "56px", background: "rgba(34,197,94,0.15)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#22c55e", margin: "0 auto 12px" }}>OK</div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#22c55e", marginBottom: "8px" }}>
                  Campagne créée avec succès !
                </h3>
                <p style={{ fontSize: "12px", color: "#71717a" }}>
                  Vos publicités sont prêtes et en pause sur Meta Ads Manager
                </p>
              </div>

              {/* Stats */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}>
                <div style={{
                  padding: "16px",
                  background: "rgba(99,102,241,0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#6366f1" }}>
                    {creationResult.campaigns.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px" }}>
                    Campagne{creationResult.campaigns.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "rgba(251,191,36,0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#fbbf24" }}>
                    {creationResult.adsets.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px" }}>
                    Adset{creationResult.adsets.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "rgba(34,197,94,0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#22c55e" }}>
                    {creationResult.ads.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px" }}>
                    Publicité{creationResult.ads.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#a5b4fc" }}>
                  Détails de la création
                </h4>

                {creationResult.campaigns.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Campagnes:</div>
                    {creationResult.campaigns.map((c, i) => (
                      <div key={i} style={{
                        padding: "8px 12px",
                        background: "rgba(99,102,241,0.05)",
                        borderLeft: "3px solid #6366f1",
                        borderRadius: "4px",
                        fontSize: "11px",
                        marginBottom: "4px",
                      }}>
                        {c.name}
                        <span style={{ float: "right", color: "#71717a", fontSize: "9px" }}>
                          ID: {c.id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {creationResult.adsets.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>Adsets:</div>
                    {creationResult.adsets.map((a, i) => (
                      <div key={i} style={{
                        padding: "8px 12px",
                        background: "rgba(251,191,36,0.05)",
                        borderLeft: "3px solid #fbbf24",
                        borderRadius: "4px",
                        fontSize: "11px",
                        marginBottom: "4px",
                      }}>
                        {a.name}
                        <span style={{ float: "right", color: "#71717a", fontSize: "9px" }}>
                          ID: {a.id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {creationResult.ads.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>
                      Publicités ({creationResult.ads.length}):
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {creationResult.ads.map((ad, i) => (
                        <div key={i} style={{
                          padding: "6px 10px",
                          background: "rgba(34,197,94,0.05)",
                          borderLeft: "3px solid #22c55e",
                          borderRadius: "4px",
                          fontSize: "10px",
                          marginBottom: "3px",
                        }}>
                          {ad.name}
                          <span style={{ float: "right", color: "#71717a", fontSize: "9px" }}>
                            {ad.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {creationResult.errors.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "6px" }}>
                      Erreurs ({creationResult.errors.length}):
                    </div>
                    {creationResult.errors.map((err, i) => (
                      <div key={i} style={{
                        padding: "8px 12px",
                        background: "rgba(239,68,68,0.05)",
                        borderLeft: "3px solid #ef4444",
                        borderRadius: "4px",
                        fontSize: "10px",
                        marginBottom: "4px",
                        color: "#ef4444",
                      }}>
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    window.open(
                      `https://business.facebook.com/adsmanager/manage/campaigns?act=${selectedAdAccount.id.replace("act_", "")}`,
                      "_blank"
                    );
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(99,102,241,0.2)",
                    color: "#6366f1",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Ouvrir Meta Ads Manager
                </button>
                <button
                  onClick={() => {
                    // Reset all states
                    setStep(0);
                    setUploadedFiles([]);
                    setAdGroups([]);
                    setMappingMode(false);
                    setCampaignName("");
                    setClientCode("");
                    setBudget("50");
                    setPrimaryTexts([""]);
                    setHeadlines([""]);
                    setDestinationUrl("");
                    setBidStrategy("LOWEST_COST_WITHOUT_CAP");
                    setCreationResult(null);
                    setCreationError(null);
                    setSelectedCampaign(null);
                    setSelectedAdset(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Nouvelle intégration
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
