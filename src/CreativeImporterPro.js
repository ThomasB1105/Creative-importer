import { useState, useCallback, useEffect, useMemo } from "react";
// v2.1 - Multi-Placement fix
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

// Extract base name from filename for auto-grouping
// Examples: "creative1_9x16.mp4" → "creative1", "ad_feed_4x5.jpg" → "ad_feed"
const extractBaseName = (filename) => {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Patterns to remove (format indicators)
  const formatPatterns = [
    /_?(9x16|9:16|916|story|stories|vertical)$/i,
    /_?(4x5|4:5|45|portrait)$/i,
    /_?(1x1|1:1|11|square|carre)$/i,
    /_?(16x9|16:9|169|landscape|horizontal)$/i,
    /_?(feed|reel|reels)$/i,
  ];

  let baseName = nameWithoutExt;
  for (const pattern of formatPatterns) {
    baseName = baseName.replace(pattern, "");
  }

  // Clean up trailing underscores/dashes
  baseName = baseName.replace(/[-_]+$/, "");

  return baseName || nameWithoutExt;
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
        `${this.baseUrl}/me/accounts?fields=id,name,picture,access_token,instagram_business_account{id,name,username,profile_picture_url}&limit=100&access_token=${accessToken}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des pages");
      }

      // For each page, try to fetch the Page-Backed Instagram Account using the page's access token
      const pagesWithPBIA = await Promise.all((data.data || []).map(async (page) => {
        if (page.access_token) {
          try {
            const pbiaRes = await fetch(
              `${this.baseUrl}/${page.id}/page_backed_instagram_accounts?access_token=${page.access_token}`
            );
            if (pbiaRes.ok) {
              const pbiaData = await pbiaRes.json();
              if (pbiaData.data && pbiaData.data.length > 0) {
                page.page_backed_instagram_accounts = pbiaData;
              }
            }
          } catch (e) {
            console.warn(`Could not fetch PBIA for page ${page.name}:`, e);
          }
        }
        return page;
      }));

      return pagesWithPBIA;
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
      const url = `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=100&access_token=${accessToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Erreur lors de la récupération des campagnes");
      }
      // Filter ACTIVE and PAUSED campaigns
      return (data.data || []).filter(c => c.status === "ACTIVE" || c.status === "PAUSED");
    } catch (error) {
      console.error("fetchCampaigns error:", error);
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
    sharedInstagramAccountId = null,
    usePageForInstagram = true, // If true, use FB Page ID for Instagram placements
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
  const [maxAdsPerAdset, setMaxAdsPerAdset] = useState(5); // For ABO Multi (1-X-Y)
  const [existingCampaigns, setExistingCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [existingAdsets, setExistingAdsets] = useState([]);
  const [selectedAdset, setSelectedAdset] = useState(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingAdsets, setIsLoadingAdsets] = useState(false);

  // Options
  const [splitByMediaType, setSplitByMediaType] = useState(true);
  const [enableAdvantagePlus, setEnableAdvantagePlus] = useState(true);

  // Ad Type (Ads | Carousel | Multi-Placement)
  const [adType, setAdType] = useState("single"); // "single" | "carousel" | "multi"

  // Multi-Placement manual groups (no auto-grouping)
  const [multiGroups, setMultiGroups] = useState([]); // [{ id, name, feed: fileId|null, story: fileId|null }]
  const [draggedFileId, setDraggedFileId] = useState(null); // For drag & drop

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

  // Lead Forms (for Lead Form objective)
  const [leadForms, setLeadForms] = useState([]);
  const [selectedLeadForm, setSelectedLeadForm] = useState(null);
  const [isLoadingLeadForms, setIsLoadingLeadForms] = useState(false);

  const [budget, setBudget] = useState("50");
  const [selectedCountries, setSelectedCountries] = useState(["france"]);
  const [primaryTexts, setPrimaryTexts] = useState([""]);  // Array of texts
  const [headlines, setHeadlines] = useState([""]);  // Array of headlines
  const [destinationUrl, setDestinationUrl] = useState("");
  const [bidStrategy, setBidStrategy] = useState("LOWEST_COST_WITHOUT_CAP"); // Bid strategy selection

  // Scheduling (Programmation)
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("00:00");
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("23:59");

  // Nomenclature templates with dynamic fields
  const [nomenclatureFields, setNomenclatureFields] = useState({
    product: "",
    strategy: "testing", // testing | scaling
    customField1: "",
    customField2: "",
  });
  const [nomenclatureTemplate, setNomenclatureTemplate] = useState({
    campaign: "{CLIENT}_{COUNTRY}_{BUDGET}_{OBJECTIVE}_{CAMPAIGN}",
    adset: "{CAMPAIGN}_Broad",
    ad: "Ads{NUM}_{MEDIA}_{DATE}",
  });
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem("nomenclatureTemplates");
    return saved ? JSON.parse(saved) : [];
  });

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

  // Load lead forms when objective is leadform and page is selected
  useEffect(() => {
    if (objective !== "leadform" || !selectedPage || !accessToken) {
      setLeadForms([]);
      setSelectedLeadForm(null);
      return;
    }

    setIsLoadingLeadForms(true);
    setLeadForms([]);
    setSelectedLeadForm(null);

    // Fetch lead forms from the page
    fetch(
      `/api/facebook-proxy?endpoint=${encodeURIComponent(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedPage.id}/leadgen_forms?fields=id,name,status,created_time&limit=100&access_token=${accessToken}`
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("📋 Lead forms API response:", data);
        if (data.error) {
          console.error("❌ Lead forms API error:", data.error);
          return;
        }
        if (data.data) {
          // Show all forms (ACTIVE, DRAFT, etc.) - don't filter by status
          const forms = data.data
            .sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
          console.log(`📋 Found ${forms.length} lead forms:`, forms);
          setLeadForms(forms);
          if (forms.length > 0) setSelectedLeadForm(forms[0]);
        }
      })
      .catch((error) => {
        console.error("❌ Error loading lead forms:", error);
      })
      .finally(() => setIsLoadingLeadForms(false));
  }, [objective, selectedPage, accessToken]);

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

  // Instagram: Use page's instagram_business_account or PBIA passed from App.js
  const instagramActorId = sharedInstagramAccountId || null;
  // Multi-Placement requires an Instagram account (real IG or PBIA)
  const hasRealInstagramAccount = !!sharedInstagramAccountId;
  // Instagram account object for display (username, profile_picture_url)
  const instagramAccount = selectedPage?.instagram_business_account || null;

  // Debug: Log Instagram ID on mount
  console.log("📸 Instagram actor ID:", instagramActorId, "hasRealInstagramAccount:", hasRealInstagramAccount);

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

  // Smart auto-grouping by filename base name
  const autoGroupedFiles = useMemo(() => {
    if (uploadedFiles.length === 0) return {};

    const groups = {};

    // Group files by their base name (without format suffix)
    uploadedFiles.forEach((f) => {
      const baseName = extractBaseName(f.name);
      if (!groups[baseName]) {
        groups[baseName] = {
          baseName,
          files: [],
          formats: new Set(),
        };
      }
      groups[baseName].files.push(f);
      groups[baseName].formats.add(f.format);
    });

    // Convert Set to Array and add metadata
    Object.keys(groups).forEach((key) => {
      groups[key].formats = Array.from(groups[key].formats);
      groups[key].isMultiFormat = groups[key].formats.length > 1;
      groups[key].hasStory = groups[key].formats.includes("story");
      groups[key].hasFeed = groups[key].formats.some(f => f.startsWith("feed"));
    });

    return groups;
  }, [uploadedFiles]);

  // Legacy groupedFiles for backward compatibility
  const groupedFiles = useMemo(() => {
    let groups = {};

    if (adType === "multi") {
      // Multi-Placement: group by filename base name
      Object.entries(autoGroupedFiles).forEach(([baseName, group], idx) => {
        groups[`multi_${idx + 1}`] = {
          format: group.isMultiFormat ? "multi" : group.formats[0],
          type: "multi",
          files: group.files,
          baseName: baseName,
          isMultiFormat: group.isMultiFormat,
        };
      });
    } else if (splitByMediaType) {
      // Single ads: group by media type
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
  }, [uploadedFiles, splitByMediaType, adType, autoGroupedFiles]);

  // Nomenclature dynamique avec templates
  const nomenclature = useMemo(() => {
    const countries = selectedCountries
      .map((c) => GEO_ZONES[c]?.code)
      .join("")
      .toUpperCase();
    const budgetStr = budgetType.toUpperCase();
    const obj = OBJECTIVES[objective]?.name || "Conversions";

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getFullYear()).slice(-2)}`;

    // Token replacements
    const tokens = {
      "{CLIENT}": clientCode || "XXX",
      "{COUNTRY}": countries || "FR",
      "{BUDGET}": budgetStr,
      "{OBJECTIVE}": obj,
      "{CAMPAIGN}": campaignName || "campagne",
      "{DATE}": dateStr,
      "{PRODUCT}": nomenclatureFields.product || "",
      "{STRATEGY}": nomenclatureFields.strategy?.toUpperCase() || "TESTING",
      "{CUSTOM1}": nomenclatureFields.customField1 || "",
      "{CUSTOM2}": nomenclatureFields.customField2 || "",
    };

    // Replace tokens in template
    const replaceTokens = (template) => {
      let result = template;
      Object.entries(tokens).forEach(([token, value]) => {
        result = result.replace(new RegExp(token.replace(/[{}]/g, "\\$&"), "g"), value);
      });
      // Clean up multiple underscores and trailing/leading underscores
      return result.replace(/_+/g, "_").replace(/^_|_$/g, "");
    };

    const campaign = replaceTokens(nomenclatureTemplate.campaign);
    const adset = replaceTokens(nomenclatureTemplate.adset);

    const ad = (num, mediaType) => {
      let adTemplate = nomenclatureTemplate.ad;
      return replaceTokens(adTemplate)
        .replace("{NUM}", num)
        .replace("{MEDIA}", mediaType);
    };

    return { campaign, adset, ad };
  }, [clientCode, selectedCountries, budgetType, objective, campaignName, nomenclatureFields, nomenclatureTemplate]);

  const isStep2Valid =
    primaryTexts[0]?.trim() &&
    headlines[0]?.trim() &&
    (objective === "leadform"
      ? selectedLeadForm !== null
      : destinationUrl?.startsWith("http"));

  const structurePreview = useMemo(() => {
    const numGroups = Object.keys(groupedFiles).length;
    const numFiles = uploadedFiles.length;

    // For multi-placement mode, count how many multi-format ads will be created
    const numMultiAds = adType === "multi" ? numGroups : numFiles;

    if (budgetType === "abo") {
      if (aboMode === "1:1:1") {
        // 1-x-1 structure: 1 campaign, X adsets (1 per group/file), 1 ad per adset
        return { campaigns: 1, adsets: numMultiAds, ads: numMultiAds };
      }
      if (aboMode === "multi")
        return { campaigns: 1, adsets: numGroups, ads: numMultiAds };
      if (aboMode === "existing")
        return { campaigns: 0, adsets: numGroups, ads: numMultiAds };
    }
    if (budgetType === "cbo") {
      if (cboMode === "new" || cboMode === "existing_new_adset")
        return {
          campaigns: cboMode === "new" ? 1 : 0,
          adsets: 1,
          ads: numMultiAds,
        };
      return { campaigns: 0, adsets: 0, ads: numMultiAds };
    }
    return { campaigns: 0, adsets: 0, ads: 0 };
  }, [budgetType, aboMode, cboMode, groupedFiles, uploadedFiles, adType]);

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

        // console.log(`⏳ Waiting for video ${videoId} to be processed...`);

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
              // console.log(`📹 Video ${videoId} status: ${videoStatus}`);

              if (videoStatus === 'ready') {
                // console.log(`✅ Video ${videoId} is ready!`);
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
              // console.log(`🔄 Retry ${retryCount}/${maxRetries - 1} for ${file.name}...`);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
            }

            // console.log(`📤 Uploading ${file.type}: ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

            // Update progress: starting upload
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: { progress: 10, status: 'uploading' }
            }));

            let hash;

            // Use resumable upload for large videos (>50MB)
            if (file.type === "video" && fileSizeMB > 50) {
              // console.log(`📹 Using resumable upload for large video: ${file.name} (${fileSizeMB.toFixed(1)} MB)`);

              // Upload directly to Facebook (no proxy) - Facebook's video endpoint supports CORS
              const videoUploadUrl = `https://graph-video.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/advideos`;

              // Phase 1: Start upload session
              const startData = new FormData();
              startData.append("upload_phase", "start");
              startData.append("file_size", file.file.size.toString());
              startData.append("access_token", accessToken);

              // console.log(`📤 Starting upload session...`);
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
              // console.log(`📦 Upload session created: ${upload_session_id}, video_id: ${video_id}`);

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

              // console.log(`📦 Uploading in ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB`);

              while (startOffset < fileSize) {
                const endOffset = Math.min(startOffset + CHUNK_SIZE, fileSize);
                const chunk = file.file.slice(startOffset, endOffset);
                chunkNum++;

                // console.log(`📤 Uploading chunk ${chunkNum}/${totalChunks} (${startOffset}-${endOffset})`);

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

              // console.log(`📤 All chunks uploaded`);

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
              // console.log(`✅ Resumable upload completed: ${hash}`);

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
            // console.log(`✅ Uploaded ${file.name}, hash: ${hash}`);

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
              // console.log(`🖼️ Extracting thumbnail for ${file.name}...`);
              try {
                const thumbBlob = await extractVideoThumbnail(file.file);
                if (thumbBlob) {
                  thumbnailHash = await uploadThumbnail(thumbBlob, file.name);
                  // console.log(`✅ Thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
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
                    // console.log(`✅ Fallback thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
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
                    // console.log(`✅ Fallback thumbnail uploaded for ${file.name}, hash: ${thumbnailHash}`);
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
        // console.log(`✅ Using existing campaign: ${campaignId}`);
      } else {
        // console.log("📦 Creating new campaign...");
        const campaignData = new FormData();
        campaignData.append("name", nomenclature.campaign);
        campaignData.append("objective", "OUTCOME_SALES");
        campaignData.append("status", "ACTIVE");
        campaignData.append("special_ad_categories", JSON.stringify([]));

        // Apply bid strategy
        campaignData.append("bid_strategy", bidStrategy);
        // console.log(`💰 Using bid strategy: ${bidStrategy}`);

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
        // console.log(`✅ Campaign created: ${campaignId}`);
      }

      // Helper function to create a single adset
      const createAdset = async (adsetName, groupFiles = null, isDynamicCreative = false) => {
        // console.log(`📦 Creating adset: ${adsetName}... (dynamic_creative: ${isDynamicCreative})`);

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

        // Detect formats from group files or all uploaded files
        const filesToCheck = groupFiles || uploadedFiles;
        const formats = filesToCheck.map(f => f.format);
        const hasStoryOnly = formats.every(f => f === 'story');
        const hasFeedOnly = formats.every(f => f === 'feed' || f.startsWith('feed_'));

        // Build targeting
        const targeting = {
          geo_locations: {
            countries: selectedCountries.map(c => GEO_ZONES[c].code),
          },
          age_min: 18,
          age_max: 65,
        };

        // Add placement restrictions based on creative formats
        // Use instagramActorId to check if we have Instagram capability (defined earlier in component)
        const canUseInstagram = !!instagramActorId;

        if (isDynamicCreative) {
          // Multi-placement mode: Facebook only, or Facebook + Instagram if we have an account
          if (canUseInstagram) {
            targeting.publisher_platforms = ['facebook', 'instagram'];
          } else {
            targeting.publisher_platforms = ['facebook'];
          }
        } else if (hasStoryOnly) {
          if (canUseInstagram) {
            targeting.publisher_platforms = ['facebook', 'instagram'];
            targeting.facebook_positions = ['story'];
            targeting.instagram_positions = ['story'];
          } else {
            targeting.publisher_platforms = ['facebook'];
            targeting.facebook_positions = ['story'];
          }
        } else if (hasFeedOnly) {
          if (canUseInstagram) {
            targeting.publisher_platforms = ['facebook', 'instagram'];
            targeting.facebook_positions = ['feed'];
            targeting.instagram_positions = ['stream'];
          } else {
            targeting.publisher_platforms = ['facebook'];
            targeting.facebook_positions = ['feed'];
          }
        } else {
          // Default: Facebook only without Instagram account
          if (!canUseInstagram) {
            targeting.publisher_platforms = ['facebook'];
          }
        }

        // Build promoted object
        const promotedObject = {
          pixel_id: selectedPixel.id,
          custom_event_type: eventMapping[optimizationEvent] || "PURCHASE",
        };

        const adsetData = new FormData();
        adsetData.append("name", adsetName);
        adsetData.append("campaign_id", campaignId);
        adsetData.append("status", "ACTIVE");
        adsetData.append("billing_event", "IMPRESSIONS");
        adsetData.append("optimization_goal", "OFFSITE_CONVERSIONS");
        adsetData.append("adset_auto_targeting_enabled", "false");
        adsetData.append("promoted_object", JSON.stringify(promotedObject));
        adsetData.append("targeting", JSON.stringify(targeting));

        // Enable dynamic creative for multi-format ads (asset_feed_spec)
        if (isDynamicCreative) {
          adsetData.append("is_dynamic_creative", "true");
          // console.log(`🎨 Dynamic creative enabled for this adset`);
        }

        // Budget for ABO
        if (budgetType === "abo") {
          const dailyBudget = Math.max(1000, Math.round(parseFloat(budget) * 100));
          adsetData.append("daily_budget", dailyBudget);
          // console.log(`💰 Budget: ${dailyBudget} cents (${dailyBudget/100} EUR/day)`);
        }

        // Scheduling (start_time / end_time) - ISO 8601 format
        if (enableScheduling && scheduleStartDate) {
          const startDateTime = new Date(`${scheduleStartDate}T${scheduleStartTime || "00:00"}:00`);
          adsetData.append("start_time", startDateTime.toISOString());
          console.log(`📅 Scheduled start: ${startDateTime.toISOString()}`);
        }
        if (enableScheduling && enableEndDate && scheduleEndDate) {
          const endDateTime = new Date(`${scheduleEndDate}T${scheduleEndTime || "23:59"}:00`);
          adsetData.append("end_time", endDateTime.toISOString());
          console.log(`📅 Scheduled end: ${endDateTime.toISOString()}`);
        }

        adsetData.append("access_token", accessToken);

        const adsetResponse = await fetch(
          `/api/facebook-proxy?endpoint=${encodeURIComponent(`https://graph.facebook.com/${META_APP.apiVersion}/${selectedAdAccount.id}/adsets`)}`,
          { method: "POST", body: adsetData }
        );

        const adsetResult = await adsetResponse.json();
        if (adsetResult.error) {
          console.error("❌ Adset creation error:", adsetResult.error);
          throw new Error(`Adset: ${adsetResult.error.message}`);
        }

        // console.log(`✅ Adset created: ${adsetResult.id}`);
        return adsetResult.id;
      };

      // Step 3: Create adset(s) based on structure
      // For ABO 1-x-1: Create one adset per group (later in the loop)
      // For ABO multi: Create multiple adsets with max Y ads per adset
      // For other modes: Create a single adset here
      let adsetId;
      const isAbo1x1 = budgetType === "abo" && aboMode === "1:1:1";
      const isAboMulti = budgetType === "abo" && aboMode === "multi";

      // Multi-placement with different feed/story assets uses asset_feed_spec
      // This REQUIRES is_dynamic_creative on the adset

      // Determine upfront if we need dynamic creative for multi-placement
      // (when we have both feed and story format files)
      const allFormats = uploadedFiles.map(f => f.format);
      const hasFeedFormat = allFormats.some(f => f !== 'story');
      const hasStoryFormat = allFormats.some(f => f === 'story');
      const globalNeedsDynamicCreative = adType === "multi" && hasFeedFormat && hasStoryFormat;
      // console.log(`🎨 Global needs dynamic creative: ${globalNeedsDynamicCreative} (hasFeed: ${hasFeedFormat}, hasStory: ${hasStoryFormat})`);

      // For ABO Multi: Create multiple adsets to distribute ads
      let aboMultiAdsets = []; // Array of { id, name, adsCount }
      if (isAboMulti) {
        // Calculate total number of ads (groups + unmapped files)
        const totalAds = effectiveGroups.length + unmappedHashes.length;
        const numAdsets = Math.ceil(totalAds / maxAdsPerAdset);

        console.log(`📦 ABO Multi: Creating ${numAdsets} adsets for ${totalAds} ads (max ${maxAdsPerAdset} per adset)`);

        for (let adsetIndex = 0; adsetIndex < numAdsets; adsetIndex++) {
          const adsetName = `${nomenclature.adset}_${adsetIndex + 1}`;
          try {
            const newAdsetId = await createAdset(adsetName, null, globalNeedsDynamicCreative);
            aboMultiAdsets.push({ id: newAdsetId, name: adsetName, adsCount: 0 });
            results.adsets.push({ id: newAdsetId, name: adsetName });
            console.log(`✅ ABO Multi adset created: ${adsetName} (${newAdsetId})`);
          } catch (err) {
            console.error(`❌ Failed to create ABO Multi adset ${adsetIndex + 1}:`, err);
            results.errors.push(`Adset creation failed: ${err.message}`);
          }
        }
      }

      if (budgetType === "cbo" && cboMode === "existing_adset" && !globalNeedsDynamicCreative) {
        // Use existing adset ONLY if we don't need dynamic creative
        adsetId = selectedAdset?.id;
        console.log(`✅ Using existing adset: ${adsetId}`);
      } else if (budgetType === "cbo" && cboMode === "existing_adset" && globalNeedsDynamicCreative) {
        // Multi-placement needs is_dynamic_creative - must create NEW adset
        console.log(`🎨 Multi-placement requires new adset with is_dynamic_creative=true`);
        adsetId = await createAdset(nomenclature.adset + "_multi", null, true);
        results.adsets.push({ id: adsetId, name: nomenclature.adset + "_multi" });
      } else if (!isAbo1x1 && !isAboMulti) {
        // Create single adset for CBO or ABO existing modes
        // Enable is_dynamic_creative when we have multi-placement with different formats
        adsetId = await createAdset(nomenclature.adset, null, globalNeedsDynamicCreative);
        results.adsets.push({ id: adsetId, name: nomenclature.adset });
      }
      // For ABO 1-x-1, adsets will be created in the group loop below
      // For ABO Multi, adsets are already created above in aboMultiAdsets

      // Skip old adset creation code for non-1x1 modes
      if (false) {
        // console.log("📦 Creating new adset...");

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
        // Only include Instagram if we have a real Instagram account
        if (hasStoryOnly) {
          if (hasInstagramCapability) {
            targeting.publisher_platforms = ['facebook', 'instagram'];
            targeting.facebook_positions = ['story'];
            targeting.instagram_positions = ['story'];
          } else {
            targeting.publisher_platforms = ['facebook'];
            targeting.facebook_positions = ['story'];
          }
        } else if (hasFeedOnly) {
          if (hasInstagramCapability) {
            targeting.publisher_platforms = ['facebook', 'instagram'];
            targeting.facebook_positions = ['feed'];
            targeting.instagram_positions = ['stream'];
          } else {
            targeting.publisher_platforms = ['facebook'];
            targeting.facebook_positions = ['feed'];
          }
        } else {
          // Mixed formats: Facebook only without Instagram account
          if (!hasInstagramCapability) {
            targeting.publisher_platforms = ['facebook'];
          }
        }

        // Build promoted object
        const promotedObject = {
          pixel_id: selectedPixel.id,
          custom_event_type: eventMapping[optimizationEvent] || "PURCHASE",
        };


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
          // console.log(`💰 Budget: ${dailyBudget} cents (${dailyBudget/100} EUR/day)`);
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
        // console.log(`✅ Adset created: ${adsetId}`);
      } // End of if(false) block for legacy adset creation

      // Step 4: Create ads
      // console.log("📦 Creating ads...");
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
      // Include Instagram placements - Meta auto-uses page's connected IG account
      // We DON'T send instagram_actor_id in object_story_spec (causes validation errors)
      const hasInstagramCapability = true;
      console.log(`📸 Multi-Placement: FB + IG placements (no instagram_actor_id in request)`);

      const getPlacementForFormat = (format) => {
        if (format === 'story') {
          // 9:16 vertical format - Stories et Reels uniquement
          const placements = {
            facebook_positions: ["story", "facebook_reels"],
          };
          if (hasInstagramCapability) {
            placements.instagram_positions = ["story", "reels"];
          }
          return placements;
        } else {
          // 1:1, 4:5, 16:9 formats - Feed uniquement
          const placements = {
            facebook_positions: ["feed"],
          };
          if (hasInstagramCapability) {
            placements.instagram_positions = ["stream"];
          }
          return placements;
        }
      };

      // Grouping logic:
      // - Multi-Placement: ALL files → ONE ad with asset_feed_spec (placement customization)
      // - Single ads: Each file → one ad

      let effectiveGroups = [];
      let unmappedHashes = []; // For single ads mode

      if (adType === "multi") {
        // MULTI-PLACEMENT: ALL files in ONE group = ONE ad
        // console.log(`📦 Multi-Placement mode: combining ALL ${validHashes.length} files into ONE ad`);
        effectiveGroups = [{
          key: 'multi_placement_group',
          baseName: null,
          files: uploadedFiles.filter(f => validHashes.some(h => h.fileId === f.id)),
          fileIds: validHashes.map(h => h.fileId),
          isMultiFormat: true,
        }];
      } else if (adType === "single") {
        // SINGLE ADS: Each file becomes its own ad
        unmappedHashes = [...validHashes];
        effectiveGroups = []; // No groups - use unmappedHashes loop
      } else {
        // Legacy/other modes: use groupedFiles or adGroups
        const useSmartGrouping = Object.keys(groupedFiles).length > 0;

        if (useSmartGrouping) {
          effectiveGroups = Object.entries(groupedFiles).map(([key, group]) => ({
            key,
            baseName: group.baseName,
            files: group.files,
            fileIds: group.files.map(f => f.id),
            isMultiFormat: group.isMultiFormat,
          }));
          // console.log(`📦 Using smart auto-grouping: ${effectiveGroups.length} groups`);
        } else {
          const mappedFileIds = adGroups.flatMap(g => g.fileIds);
          unmappedHashes = validHashes.filter(h => !mappedFileIds.includes(h.fileId));

          if (adGroups.length > 0) {
            effectiveGroups = adGroups.map((g, idx) => ({
              key: `legacy_${idx}`,
              baseName: null,
              files: uploadedFiles.filter(f => g.fileIds.includes(f.id)),
              fileIds: g.fileIds,
              isMultiFormat: g.fileIds.length > 1,
            }));
          }
        }
      }

      // Global ad counter for ABO Multi distribution
      let globalAdIndex = 0;

      // Helper function to get the adset ID for ABO Multi mode
      const getAboMultiAdsetId = () => {
        if (!isAboMulti || aboMultiAdsets.length === 0) return adsetId;
        const adsetIndex = Math.floor(globalAdIndex / maxAdsPerAdset);
        const safeIndex = Math.min(adsetIndex, aboMultiAdsets.length - 1);
        return aboMultiAdsets[safeIndex]?.id;
      };

      // Process each group: For ABO 1-x-1, create one adset per group
      for (let groupIndex = 0; groupIndex < effectiveGroups.length; groupIndex++) {
        const group = effectiveGroups[groupIndex];
        const groupHashes = validHashes.filter(h => group.fileIds.includes(h.fileId));

        if (groupHashes.length === 0) continue;

        // Separate files by format (feed vs story) - needed for adset creation decision
        const feedFiles = [];
        const storyFiles = [];

        groupHashes.forEach((hashData) => {
          const file = uploadedFiles.find(f => f.id === hashData.fileId);
          if (file.format === 'story') {
            storyFiles.push({ hashData, file });
          } else {
            feedFiles.push({ hashData, file });
          }
        });

        // Determine if we need dynamic creative (different assets for feed vs story)
        const needsDynamicCreative = adType === "multi" && feedFiles.length > 0 && storyFiles.length > 0;

        // For ABO 1-x-1: Create a new adset for this group
        // For ABO Multi: Use the pre-created adsets with distribution
        let currentAdsetId = adsetId;
        if (isAbo1x1) {
          const adsetName = group.baseName
            ? `${nomenclature.adset}_${group.baseName}`
            : `${nomenclature.adset}_${groupIndex + 1}`;
          try {
            // Enable is_dynamic_creative when we have different assets for feed vs story
            currentAdsetId = await createAdset(adsetName, group.files, needsDynamicCreative);
            results.adsets.push({ id: currentAdsetId, name: adsetName });
          } catch (err) {
            console.error(`❌ Failed to create adset for group ${groupIndex + 1}:`, err);
            results.errors.push(`Adset creation failed for group ${groupIndex + 1}: ${err.message}`);
            continue;
          }
        } else if (isAboMulti) {
          // Use pre-created adsets with round-robin distribution
          currentAdsetId = getAboMultiAdsetId();
        }

        // Determine ad name
        const adName = group.baseName
          ? nomenclature.ad(groupIndex + 1, group.baseName)
          : nomenclature.ad(groupIndex + 1, groupHashes.length > 1 ? "multi" : "single");

        // console.log(`📦 Creating ad for group #${groupIndex + 1} (${group.baseName || 'unnamed'}) with ${groupHashes.length} asset(s)`);

        // Update progress for all files in group
        groupHashes.forEach(h => {
          setUploadProgress(prev => ({
            ...prev,
            [h.fileId]: { progress: 60, status: 'creating' }
          }));
        });

        // Get the primary asset (feed) - fallback to first file if no feed format
        const primaryAsset = feedFiles[0] || storyFiles[0];
        // Get story asset if different from primary
        const storyAsset = storyFiles[0] || feedFiles[0];
        const isVideo = primaryAsset.hashData.type === "video";

        // console.log(`📸 Primary asset (feed):`, primaryAsset?.file?.name, primaryAsset?.hashData?.hash);
        // console.log(`📸 Story asset:`, storyAsset?.file?.name, storyAsset?.hashData?.hash);
        // console.log(`📸 Instagram actor ID:`, instagramActorId);
        // console.log(`🎨 Needs dynamic creative:`, needsDynamicCreative);

        const creativeData = new FormData();
        creativeData.append("name", adName);

        // TWO APPROACHES:
        // 1. If we have different assets for feed vs story: use asset_feed_spec with asset_customization_rules
        // 2. If only one asset: use simple object_story_spec

        if (needsDynamicCreative && !isVideo) {
          // APPROACH 1: asset_feed_spec with asset_customization_rules
          // This is the proper Meta API way to do placement asset customization
          // console.log(`🎨 Using asset_feed_spec with asset_customization_rules`);

          // Build asset_customization_rules for story vs feed placements
          // Include Instagram only if we have a real Instagram account
          const assetCustomizationRules = [];

          // Rule for story/reels placements (vertical 9:16)
          const storyRule = {
            customization_spec: {
              publisher_platforms: hasInstagramCapability ? ["facebook", "instagram"] : ["facebook"],
              facebook_positions: ["story", "facebook_reels"],
            },
            image_label: { name: "STORY_IMG" }
          };
          if (hasInstagramCapability) {
            storyRule.customization_spec.instagram_positions = ["story", "reels"];
          }
          assetCustomizationRules.push(storyRule);

          // Rule for feed placements (square/portrait)
          const feedRule = {
            customization_spec: {
              publisher_platforms: hasInstagramCapability ? ["facebook", "instagram"] : ["facebook"],
              facebook_positions: ["feed"],
            },
            image_label: { name: "FEED_IMG" }
          };
          if (hasInstagramCapability) {
            feedRule.customization_spec.instagram_positions = ["stream", "explore"];
          }
          assetCustomizationRules.push(feedRule);

          // Build images array with labels
          const images = [
            {
              hash: storyAsset.hashData.hash,
              adlabels: [{ name: "STORY_IMG" }]
            },
            {
              hash: primaryAsset.hashData.hash,
              adlabels: [{ name: "FEED_IMG" }]
            }
          ];

          // Build asset_feed_spec
          const assetFeedSpec = {
            optimization_type: "ASSET_CUSTOMIZATION",
            ad_formats: ["SINGLE_IMAGE"],
            asset_customization_rules: assetCustomizationRules,
            images: images,
            bodies: [{ text: filteredTexts[0] || "" }],
            link_urls: [{ website_url: destinationUrl.trim() }],
            call_to_action_types: [callToAction !== "NO_BUTTON" ? callToAction : "LEARN_MORE"],
          };
          // Add titles only if we have one (avoid empty array)
          if (filteredHeadlines[0]) {
            assetFeedSpec.titles = [{ text: filteredHeadlines[0] }];
          }

          console.log(`📝 asset_feed_spec:`, JSON.stringify(assetFeedSpec, null, 2));

          creativeData.append("asset_feed_spec", JSON.stringify(assetFeedSpec));

          // object_story_spec is needed for page_id
          const objectStorySpec = {
            page_id: selectedPage.id,
          };
          console.log(`📝 object_story_spec:`, JSON.stringify(objectStorySpec, null, 2));
          creativeData.append("object_story_spec", JSON.stringify(objectStorySpec));

        } else {
          // APPROACH 2: Simple object_story_spec for single asset
          // console.log(`📝 Using simple object_story_spec (no placement customization needed)`);

          let objectStorySpec;
          if (isVideo) {
            // Video ad
            objectStorySpec = {
              page_id: selectedPage.id,
              video_data: {
                video_id: primaryAsset.hashData.hash,
                message: filteredTexts[0] || "",
                title: filteredHeadlines[0] || "",
                call_to_action: {
                  type: callToAction !== "NO_BUTTON" ? callToAction : "LEARN_MORE",
                  value: objective === "leadform" && selectedLeadForm
                    ? { lead_gen_form_id: selectedLeadForm.id }
                    : { link: destinationUrl.trim() }
                },
                ...(primaryAsset.hashData.thumbnailHash && { image_hash: primaryAsset.hashData.thumbnailHash })
              }
            };
          } else {
            // Image ad
            objectStorySpec = {
              page_id: selectedPage.id,
              link_data: {
                image_hash: primaryAsset.hashData.hash,
                link: destinationUrl.trim(),
                message: filteredTexts[0] || "",
                name: filteredHeadlines[0] || "",
                call_to_action: {
                  type: callToAction !== "NO_BUTTON" ? callToAction : "LEARN_MORE",
                  value: objective === "leadform" && selectedLeadForm
                    ? { lead_gen_form_id: selectedLeadForm.id }
                    : { link: destinationUrl.trim() }
                }
              }
            };
          }

          // Add Instagram actor if available (real account or PBIA)
          if (instagramActorId) {
            objectStorySpec.instagram_actor_id = instagramActorId;
          }

          // console.log(`📝 object_story_spec:`, JSON.stringify(objectStorySpec, null, 2));
          creativeData.append("object_story_spec", JSON.stringify(objectStorySpec));
        }

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
        adData.append("adset_id", currentAdsetId || adsetId);
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
          globalAdIndex++; // Increment for ABO Multi distribution
          // console.log(`✅ Multi-format ad created: ${adResult.id}`);
          groupHashes.forEach(h => {
            setUploadProgress(prev => ({
              ...prev,
              [h.fileId]: { progress: 100, status: 'done' }
            }));
          });
        }
      }

      // Process unmapped files (for single ads mode - one ad per file)
      // For multi-placement mode, unmappedHashes is empty so this loop won't run
      for (let i = 0; i < unmappedHashes.length; i++) {
        const hashData = unmappedHashes[i];
        const file = uploadedFiles.find(f => f.id === hashData.fileId);

        const adName = nomenclature.ad(effectiveGroups.length + i + 1, file.format);

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
              value: objective === "leadform" && selectedLeadForm
                ? { lead_gen_form_id: selectedLeadForm.id }
                : { link: destinationUrl.trim() },
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
              ...(objective === "leadform" && selectedLeadForm && {
                value: { lead_gen_form_id: selectedLeadForm.id }
              }),
            };
          }

          objectStorySpec = {
            page_id: selectedPage.id,
            link_data: linkData,
          };
        }

        // Add instagram_actor_id if we have a linked Instagram account or PBIA
        if (instagramActorId) {
          objectStorySpec.instagram_actor_id = instagramActorId;
        }

        // console.log(`📝 Creating creative for ${file.name}:`, JSON.stringify(objectStorySpec, null, 2));

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
          // console.log(`🚫 Advantage+ Creative disabled for ${file.name}`);
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

        // Create ad (use ABO Multi adset distribution or main adsetId)
        const unmappedAdsetId = isAboMulti ? getAboMultiAdsetId() : adsetId;
        const adData = new FormData();
        adData.append("name", adName);
        adData.append("adset_id", unmappedAdsetId);
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
          globalAdIndex++; // Increment for ABO Multi distribution
          // console.log(`✅ Ad created: ${adResult.id}`);

          // Update progress: complete
          setUploadProgress(prev => ({
            ...prev,
            [file.id]: { progress: 100, status: 'done' }
          }));
        }
      }

      setCreationResult(results);
      setStep(5);
      // console.log("🎉 Campaign creation completed!", results);

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
                            onClick={() => {
                              setSelectedCampaign(c);
                              // Detect objective from campaign
                              if (c.objective === "OUTCOME_LEADS" || c.objective === "LEAD_GENERATION") {
                                setObjective("leadform");
                              } else if (c.objective === "OUTCOME_SALES" || c.objective === "CONVERSIONS") {
                                setObjective("conversions");
                              }
                            }}
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
                      desc: "1 campagne → X adsets → X ads",
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

                {aboMode === "multi" && (
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
                      🎯 Max ads par adset
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={maxAdsPerAdset}
                      onChange={(e) => setMaxAdsPerAdset(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#71717a",
                        marginTop: "6px",
                      }}
                    >
                      Les ads seront réparties automatiquement sur plusieurs adsets
                    </div>
                  </div>
                )}

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
                            onClick={() => {
                              setSelectedCampaign(c);
                              // Detect objective from campaign
                              if (c.objective === "OUTCOME_LEADS" || c.objective === "LEAD_GENERATION") {
                                setObjective("leadform");
                              } else if (c.objective === "OUTCOME_SALES" || c.objective === "CONVERSIONS") {
                                setObjective("conversions");
                              }
                            }}
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

                {/* Programmation (Scheduling) */}
                <div style={box}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: enableScheduling ? "16px" : "0",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      📅 Programmation
                    </p>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={enableScheduling}
                        onChange={(e) => setEnableScheduling(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      Activer
                    </label>
                  </div>
                  {enableScheduling && (
                    <>
                      <div style={{ marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", color: "#71717a" }}>
                          Date de début
                        </span>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <input
                            type="date"
                            value={scheduleStartDate}
                            onChange={(e) => setScheduleStartDate(e.target.value)}
                            style={{ ...inp, flex: 2 }}
                          />
                          <input
                            type="time"
                            value={scheduleStartTime}
                            onChange={(e) => setScheduleStartTime(e.target.value)}
                            style={{ ...inp, flex: 1 }}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={enableEndDate}
                            onChange={(e) => setEnableEndDate(e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                          Définir une date de fin
                        </label>
                        {enableEndDate && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              type="date"
                              value={scheduleEndDate}
                              onChange={(e) => setScheduleEndDate(e.target.value)}
                              style={{ ...inp, flex: 2 }}
                            />
                            <input
                              type="time"
                              value={scheduleEndTime}
                              onChange={(e) => setScheduleEndTime(e.target.value)}
                              style={{ ...inp, flex: 1 }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

                {/* Lead Form selector (when Lead Form objective is selected) */}
                {objective === "leadform" && (
                  <div style={box}>
                    <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                      📋 Formulaire Lead {isLoadingLeadForms && "(chargement...)"}
                    </p>
                    {leadForms.length === 0 && !isLoadingLeadForms ? (
                      <div
                        style={{
                          padding: "16px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#fca5a5",
                        }}
                      >
                        Aucun formulaire trouvé sur cette Page. Créez un formulaire dans Meta Ads Manager.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {leadForms.map((form) => (
                          <div
                            key={form.id}
                            onClick={() => setSelectedLeadForm(form)}
                            style={{
                              padding: "12px",
                              borderRadius: "8px",
                              border:
                                selectedLeadForm?.id === form.id
                                  ? "2px solid #6366f1"
                                  : "1px solid rgba(255,255,255,0.1)",
                              background:
                                selectedLeadForm?.id === form.id
                                  ? "rgba(99,102,241,0.15)"
                                  : "rgba(0,0,0,0.2)",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: "13px", fontWeight: "500" }}>
                              {form.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "#71717a", marginTop: "2px" }}>
                              ID: {form.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

                  {/* URL or Lead Form selector based on objective */}
                  {objective === "leadform" ? (
                    <>
                      <div style={{ marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "#71717a" }}>
                          📋 Formulaire Lead (Requis) {isLoadingLeadForms && "(chargement...)"}
                        </span>
                      </div>
                      {leadForms.length === 0 && !isLoadingLeadForms ? (
                        <div
                          style={{
                            padding: "12px",
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: "#fca5a5",
                          }}
                        >
                          Aucun formulaire actif trouvé. Créez un formulaire dans Meta Ads Manager.
                        </div>
                      ) : (
                        <select
                          value={selectedLeadForm?.id || ""}
                          onChange={(e) => {
                            const form = leadForms.find(f => f.id === e.target.value);
                            setSelectedLeadForm(form);
                          }}
                          style={{
                            ...inp,
                            border: selectedLeadForm
                              ? "1px solid rgba(34,197,94,0.5)"
                              : "1px solid rgba(239,68,68,0.5)",
                          }}
                        >
                          <option value="">Sélectionner un formulaire...</option>
                          {leadForms.map((form) => (
                            <option key={form.id} value={form.id}>
                              {form.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <div style={box}>
                  <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
                    Nomenclature
                  </p>

                  {/* Templates préenregistrés */}
                  {savedTemplates.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Templates sauvegardés
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {savedTemplates.map((template, idx) => (
                          <button
                            key={idx}
                            onClick={() => setNomenclatureTemplate(template.template)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid rgba(99,102,241,0.3)",
                              background: "rgba(99,102,241,0.1)",
                              color: "#a5b4fc",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Champs de base */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Code client {"{CLIENT}"}
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
                    {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
                      <div>
                        <span style={{ fontSize: "11px", color: "#71717a" }}>
                          Nom campagne {"{CAMPAIGN}"}
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

                  {/* Champs dynamiques supplémentaires */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Produit {"{PRODUCT}"}
                      </span>
                      <input
                        value={nomenclatureFields.product}
                        onChange={(e) =>
                          setNomenclatureFields(prev => ({ ...prev, product: e.target.value }))
                        }
                        placeholder="Ex: serum"
                        style={{ ...inp, marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Stratégie {"{STRATEGY}"}
                      </span>
                      <select
                        value={nomenclatureFields.strategy}
                        onChange={(e) =>
                          setNomenclatureFields(prev => ({ ...prev, strategy: e.target.value }))
                        }
                        style={{ ...inp, marginTop: "4px" }}
                      >
                        <option value="testing">Testing</option>
                        <option value="scaling">Scaling</option>
                        <option value="retargeting">Retargeting</option>
                        <option value="lookalike">Lookalike</option>
                      </select>
                    </div>
                  </div>

                  {/* Champs personnalisés */}
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
                        Custom 1 {"{CUSTOM1}"}
                      </span>
                      <input
                        value={nomenclatureFields.customField1}
                        onChange={(e) =>
                          setNomenclatureFields(prev => ({ ...prev, customField1: e.target.value }))
                        }
                        placeholder="Optionnel"
                        style={{ ...inp, marginTop: "4px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#71717a" }}>
                        Custom 2 {"{CUSTOM2}"}
                      </span>
                      <input
                        value={nomenclatureFields.customField2}
                        onChange={(e) =>
                          setNomenclatureFields(prev => ({ ...prev, customField2: e.target.value }))
                        }
                        placeholder="Optionnel"
                        style={{ ...inp, marginTop: "4px" }}
                      />
                    </div>
                  </div>

                  {/* Éditeur de templates */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#a5b4fc", marginBottom: "8px" }}>
                      Templates (tokens: {"{CLIENT}"} {"{COUNTRY}"} {"{BUDGET}"} {"{OBJECTIVE}"} {"{CAMPAIGN}"} {"{PRODUCT}"} {"{STRATEGY}"} {"{DATE}"} {"{CUSTOM1}"} {"{CUSTOM2}"})
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#71717a" }}>Campagne</span>
                      <input
                        value={nomenclatureTemplate.campaign}
                        onChange={(e) =>
                          setNomenclatureTemplate(prev => ({ ...prev, campaign: e.target.value }))
                        }
                        style={{ ...inp, marginTop: "2px", fontSize: "11px" }}
                      />
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#71717a" }}>Adset</span>
                      <input
                        value={nomenclatureTemplate.adset}
                        onChange={(e) =>
                          setNomenclatureTemplate(prev => ({ ...prev, adset: e.target.value }))
                        }
                        style={{ ...inp, marginTop: "2px", fontSize: "11px" }}
                      />
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#71717a" }}>Ad (utiliser {"{NUM}"} et {"{MEDIA}"})</span>
                      <input
                        value={nomenclatureTemplate.ad}
                        onChange={(e) =>
                          setNomenclatureTemplate(prev => ({ ...prev, ad: e.target.value }))
                        }
                        style={{ ...inp, marginTop: "2px", fontSize: "11px" }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt("Nom du template:");
                        if (name) {
                          const newTemplates = [...savedTemplates, { name, template: nomenclatureTemplate }];
                          setSavedTemplates(newTemplates);
                          localStorage.setItem("nomenclatureTemplates", JSON.stringify(newTemplates));
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(34,197,94,0.3)",
                        background: "rgba(34,197,94,0.1)",
                        color: "#22c55e",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      💾 Sauvegarder ce template
                    </button>
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
                      {!(budgetType === "cbo" && (cboMode === "existing_new_adset" || cboMode === "existing_adset")) && (
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "#71717a" }}>Campagne:</span>{" "}
                          <span style={{ color: "#6366f1", fontWeight: "500" }}>
                            {nomenclature.campaign}
                          </span>
                        </div>
                      )}
                      {!(budgetType === "cbo" && cboMode === "existing_adset") && (
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "#71717a" }}>Adset:</span>{" "}
                          <span style={{ color: "#22c55e", fontWeight: "500" }}>
                            {nomenclature.adset}
                          </span>
                        </div>
                      )}
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
            {/* Import Zone */}
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
                background: isDragging ? "rgba(99,102,241,0.15)" : "rgba(17,24,39,0.6)",
                borderRadius: "16px",
                border: `2px dashed ${isDragging ? "#818cf8" : "rgba(255,255,255,0.15)"}`,
                padding: "32px",
                marginBottom: "24px",
                transition: "all 0.2s",
                textAlign: "center",
              }}
            >
              {isProcessing ? (
                <div style={{ color: "#a5b4fc", fontSize: "14px" }}>
                  <div style={{ marginBottom: "8px", fontSize: "24px" }}>⏳</div>
                  Analyse en cours...
                </div>
              ) : (
                <>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    background: "rgba(99,102,241,0.15)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    margin: "0 auto 16px"
                  }}>
                    📤
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: "500", color: "#fafafa", margin: "0 0 8px" }}>
                    Glissez vos fichiers ici
                  </p>
                  <p style={{ fontSize: "13px", color: "#71717a", margin: "0 0 20px" }}>
                    ou importez depuis
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                    <label style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.3)";
                    }}
                    >
                      <span>💻</span> Mon ordinateur
                      <input type="file" multiple accept="image/*,video/*" style={{ display: "none" }}
                        onChange={(e) => processFiles([...e.target.files])}
                      />
                    </label>
                    <button disabled style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#52525b",
                      cursor: "not-allowed",
                      position: "relative",
                    }}>
                      <span style={{ filter: "grayscale(1)" }}>📦</span> Dropbox
                      <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        fontSize: "10px",
                        padding: "2px 8px",
                        background: "#1f2937",
                        border: "1px solid rgba(251,146,60,0.3)",
                        color: "#fb923c",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}>Bientôt</span>
                    </button>
                    <button disabled style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#52525b",
                      cursor: "not-allowed",
                      position: "relative",
                    }}>
                      <span style={{ filter: "grayscale(1)" }}>🔷</span> Google Drive
                      <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        fontSize: "10px",
                        padding: "2px 8px",
                        background: "#1f2937",
                        border: "1px solid rgba(251,146,60,0.3)",
                        color: "#fb923c",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}>Bientôt</span>
                    </button>
                  </div>
                </>
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

            {/* Ad Type Tabs */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  display: "flex",
                  gap: "8px",
                  padding: "4px",
                  background: "rgba(17,24,39,0.6)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  width: "fit-content",
                }}>
                  {[
                    { id: "single", name: "Ads", count: uploadedFiles.length },
                    { id: "carousel", name: "Carousel", count: 0, disabled: true, soon: true },
                    { id: "multi", name: "Multi-Placement", count: multiGroups.length, disabled: !hasRealInstagramAccount, requiresInstagram: !hasRealInstagramAccount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => !tab.disabled && setAdType(tab.id)}
                      disabled={tab.disabled}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: adType === tab.id
                          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          : "transparent",
                        color: tab.disabled ? "#52525b" : adType === tab.id ? "#fff" : "#a1a1aa",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: tab.disabled ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {tab.name}
                      {tab.count > 0 && (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: adType === tab.id ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.2)",
                          fontSize: "11px",
                          color: adType === tab.id ? "#fff" : "#818cf8",
                        }}>
                          {tab.count}
                        </span>
                      )}
                      {tab.soon && (
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(251,146,60,0.2)",
                          fontSize: "9px",
                          color: "#fb923c",
                          textTransform: "uppercase",
                        }}>
                          Soon
                        </span>
                      )}
                      {tab.requiresInstagram && (
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(239,68,68,0.2)",
                          fontSize: "9px",
                          color: "#ef4444",
                        }}>
                          Instagram requis
                        </span>
                      )}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Multi-Placement Mode - New Drag & Drop UI */}
            {uploadedFiles.length > 0 && adType === "multi" && (
              <div style={{ marginBottom: "24px" }}>
                {/* File Pool - All uploaded files */}
                <div style={{
                  marginBottom: "20px",
                  padding: "16px",
                  background: "rgba(17,24,39,0.4)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#fafafa" }}>
                      📂 Fichiers ({uploadedFiles.filter(f => !multiGroups.some(g => g.feed === f.id || g.story === f.id)).length})
                    </span>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>Glissez les fichiers vers les zones ci-dessous</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {uploadedFiles.filter(f => !multiGroups.some(g => g.feed === f.id || g.story === f.id)).map(file => (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={() => setDraggedFileId(file.id)}
                        onDragEnd={() => setDraggedFileId(null)}
                        style={{
                          width: "80px",
                          padding: "8px",
                          background: draggedFileId === file.id ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                          borderRadius: "8px",
                          cursor: "grab",
                          border: draggedFileId === file.id ? "2px solid #6366f1" : "2px solid transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ width: "64px", height: "64px", borderRadius: "6px", overflow: "hidden", marginBottom: "4px" }}>
                          {file.type === "video" ? (
                            <video src={file.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <img src={file.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ fontSize: "9px", color: "#a1a1aa", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name}
                        </div>
                        <div style={{
                          marginTop: "4px",
                          padding: "2px 4px",
                          background: file.format === "story" ? "rgba(168,85,247,0.2)" : "rgba(34,197,94,0.2)",
                          borderRadius: "4px",
                          fontSize: "8px",
                          textAlign: "center",
                          color: file.format === "story" ? "#a855f7" : "#22c55e",
                        }}>
                          {file.format === "story" ? "9:16" : "1:1"}
                        </div>
                      </div>
                    ))}
                    {uploadedFiles.filter(f => !multiGroups.some(g => g.feed === f.id || g.story === f.id)).length === 0 && (
                      <div style={{ padding: "20px", color: "#71717a", fontSize: "13px", textAlign: "center", width: "100%" }}>
                        Tous les fichiers sont assignés aux groupes
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Placement Groups */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#fafafa" }}>
                    🎯 Multi-Placement Ads ({multiGroups.length})
                  </span>
                  <button
                    onClick={() => setMultiGroups(prev => [...prev, { id: Date.now(), name: `Ad ${prev.length + 1}`, feed: null, story: null }])}
                    style={{
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>+</span> Nouveau groupe
                  </button>
                </div>

                {multiGroups.length === 0 ? (
                  <div style={{
                    padding: "40px",
                    background: "rgba(17,24,39,0.4)",
                    borderRadius: "12px",
                    border: "2px dashed rgba(255,255,255,0.2)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎨</div>
                    <div style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "8px" }}>Aucun groupe créé</div>
                    <div style={{ fontSize: "12px", color: "#71717a" }}>Cliquez sur "Nouveau groupe" pour créer une pub multi-placement</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {multiGroups.map((group, idx) => {
                      const feedFile = uploadedFiles.find(f => f.id === group.feed);
                      const storyFile = uploadedFiles.find(f => f.id === group.story);
                      return (
                        <div key={group.id} style={{
                          padding: "16px",
                          background: "rgba(17,24,39,0.6)",
                          borderRadius: "12px",
                          border: "1px solid rgba(99,102,241,0.3)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <input
                              value={group.name}
                              onChange={(e) => setMultiGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                              style={{
                                background: "transparent",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#fafafa",
                                outline: "none",
                              }}
                            />
                            <button
                              onClick={() => setMultiGroups(prev => prev.filter(g => g.id !== group.id))}
                              style={{
                                background: "rgba(239,68,68,0.2)",
                                border: "none",
                                borderRadius: "6px",
                                color: "#ef4444",
                                padding: "4px 8px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {/* Feed Zone */}
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedFileId) {
                                  setMultiGroups(prev => prev.map(g => g.id === group.id ? { ...g, feed: draggedFileId } : g));
                                  setDraggedFileId(null);
                                }
                              }}
                              style={{
                                padding: "12px",
                                background: feedFile ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "8px",
                                border: feedFile ? "2px solid rgba(34,197,94,0.5)" : "2px dashed rgba(255,255,255,0.2)",
                                minHeight: "100px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600", marginBottom: "8px" }}>
                                📱 Feed (1:1 / 4:5)
                              </div>
                              {feedFile ? (
                                <div style={{ position: "relative" }}>
                                  <div style={{ width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden" }}>
                                    {feedFile.type === "video" ? (
                                      <video src={feedFile.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <img src={feedFile.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setMultiGroups(prev => prev.map(g => g.id === group.id ? { ...g, feed: null } : g))}
                                    style={{
                                      position: "absolute",
                                      top: "-8px",
                                      right: "-8px",
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      background: "#ef4444",
                                      border: "none",
                                      color: "#fff",
                                      fontSize: "12px",
                                      cursor: "pointer",
                                    }}
                                  >×</button>
                                </div>
                              ) : (
                                <div style={{ fontSize: "11px", color: "#71717a" }}>Glissez ici</div>
                              )}
                            </div>
                            {/* Story Zone */}
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedFileId) {
                                  setMultiGroups(prev => prev.map(g => g.id === group.id ? { ...g, story: draggedFileId } : g));
                                  setDraggedFileId(null);
                                }
                              }}
                              style={{
                                padding: "12px",
                                background: storyFile ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
                                borderRadius: "8px",
                                border: storyFile ? "2px solid rgba(168,85,247,0.5)" : "2px dashed rgba(255,255,255,0.2)",
                                minHeight: "100px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div style={{ fontSize: "11px", color: "#a855f7", fontWeight: "600", marginBottom: "8px" }}>
                                📲 Story (9:16)
                              </div>
                              {storyFile ? (
                                <div style={{ position: "relative" }}>
                                  <div style={{ width: "40px", height: "70px", borderRadius: "6px", overflow: "hidden" }}>
                                    {storyFile.type === "video" ? (
                                      <video src={storyFile.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <img src={storyFile.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setMultiGroups(prev => prev.map(g => g.id === group.id ? { ...g, story: null } : g))}
                                    style={{
                                      position: "absolute",
                                      top: "-8px",
                                      right: "-8px",
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      background: "#ef4444",
                                      border: "none",
                                      color: "#fff",
                                      fontSize: "12px",
                                      cursor: "pointer",
                                    }}
                                  >×</button>
                                </div>
                              ) : (
                                <div style={{ fontSize: "11px", color: "#71717a" }}>Glissez ici</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Single Ads Mode - Original grouped display */}
            {uploadedFiles.length > 0 && adType === "single" && (
              <div style={{ marginBottom: "24px" }}>
                {Object.entries(groupedFiles).map(([key, group], groupIdx) => {
                  const p = META_PLACEMENTS[group.format] || {
                    name: "Mixed",
                    abbrev: "F",
                    color: "#71717a",
                    bgColor: "rgba(255,255,255,0.05)",
                  };
                  return (
                    <div key={key} style={{ marginBottom: "16px" }}>
                      <div style={{
                        padding: "12px 14px",
                        background: p.bgColor,
                        borderRadius: "8px",
                        marginBottom: "10px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: "600", color: p.color, fontSize: "14px" }}>{p.name}</span>
                          <span style={{ color: "#71717a", fontSize: "12px" }}>
                            {group.files.length} fichier{group.files.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                        gap: "8px",
                        paddingLeft: "12px",
                      }}>
                        {group.files.map((file) => (
                          <div key={file.id} style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "8px",
                            padding: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden" }}>
                              {file.type === "video" ? (
                                <video src={file.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <img src={file.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                value={file.adName}
                                onChange={(e) => setUploadedFiles((p) => p.map((x) => x.id === file.id ? { ...x, adName: e.target.value } : x))}
                                style={{ ...inp, fontSize: "11px", padding: "6px" }}
                              />
                            </div>
                            <button
                              onClick={() => setUploadedFiles((p) => p.filter((x) => x.id !== file.id))}
                              style={{
                                background: "rgba(239,68,68,0.2)",
                                color: "#ef4444",
                                border: "none",
                                borderRadius: "6px",
                                width: "28px",
                                height: "28px",
                                cursor: "pointer",
                              }}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


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
