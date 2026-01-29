import { useState, useEffect } from "react";
import { authHelpers, createMetaApi } from "./config";
import CreativeImporterPro from "./CreativeImporterPro";
import MediaBuyerPro from "./MediaBuyerPro";

// Navigation items configuration - Premium design without emojis
const navItems = [
  {
    id: "creative-importer",
    name: "Creative Importer",
    abbrev: "CI",
    description: "Import & launch ads",
    color: "#818cf8",
    bgColor: "rgba(129,140,248,0.12)",
    status: "active",
  },
  {
    id: "media-buyer",
    name: "Media Buyer",
    abbrev: "MB",
    description: "Optimize campaigns",
    color: "#fb923c",
    bgColor: "rgba(251,146,60,0.12)",
    status: "active",
  },
  {
    id: "creative-strategist",
    name: "Creative Strategist",
    abbrev: "CS",
    description: "AI creative insights",
    color: "#22d3ee",
    bgColor: "rgba(34,211,238,0.12)",
    status: "coming-soon",
  },
  {
    id: "ad-creator",
    name: "Ad Creator",
    abbrev: "AC",
    description: "Generate creatives",
    color: "#f472b6",
    bgColor: "rgba(244,114,182,0.12)",
    status: "coming-soon",
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    abbrev: "DA",
    description: "Advanced analytics",
    color: "#4ade80",
    bgColor: "rgba(74,222,128,0.12)",
    status: "coming-soon",
  },
];

export default function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Ad Account state
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  // Page state
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pageSelectorOpen, setPageSelectorOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState("");

  // Pixel state
  const [pixels, setPixels] = useState([]);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);
  const [pixelSelectorOpen, setPixelSelectorOpen] = useState(false);

  // Check for OAuth callback or saved token on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthenticating(true);

      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        const expiresIn = parseInt(params.get("expires_in") || "5184000");

        if (token) {
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
        const savedToken = authHelpers.getToken();

        if (savedToken) {
          try {
            const api = createMetaApi(savedToken);
            const userData = await api.fetchUser();
            setAccessToken(savedToken);
            setUser(userData);
            authHelpers.saveUser(userData);
          } catch (err) {
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

  // Load ad accounts and pages when authenticated
  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      try {
        setIsLoadingAccounts(true);
        setIsLoadingPages(true);
        const api = createMetaApi(accessToken);

        // Load accounts and pages in parallel
        const [accounts, pagesData] = await Promise.all([
          api.fetchAdAccounts(),
          api.fetchPages()
        ]);

        // Filter only active accounts
        const activeAccounts = accounts.filter((a) => a.account_status === 1);
        setAdAccounts(activeAccounts);
        setPages(pagesData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoadingAccounts(false);
        setIsLoadingPages(false);
      }
    };

    loadData();
  }, [accessToken]);

  // Load pixels when account is selected
  useEffect(() => {
    if (!accessToken || !selectedAdAccount) {
      setPixels([]);
      setSelectedPixel(null);
      return;
    }

    const loadPixels = async () => {
      try {
        setIsLoadingPixels(true);
        const api = createMetaApi(accessToken);
        const pixelsData = await api.fetchPixels(selectedAdAccount.id);
        setPixels(pixelsData || []);
        // Auto-select first pixel if available
        if (pixelsData && pixelsData.length > 0) {
          setSelectedPixel(pixelsData[0]);
        }
      } catch (error) {
        console.error("Error loading pixels:", error);
        setPixels([]);
      } finally {
        setIsLoadingPixels(false);
      }
    };

    loadPixels();
  }, [accessToken, selectedAdAccount]);

  // Filter accounts based on search
  const filteredAccounts = adAccounts.filter(
    (acc) =>
      acc.name?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.id?.includes(accountSearch)
  );

  // Filter pages based on search
  const filteredPages = pages.filter(
    (page) =>
      page.name?.toLowerCase().includes(pageSearch.toLowerCase()) ||
      page.id?.includes(pageSearch)
  );

  const handleLogin = () => {
    window.location.href = authHelpers.getOAuthUrl();
  };

  const handleLogout = () => {
    authHelpers.clearToken();
    setAccessToken(null);
    setUser(null);
    setActiveModule(null);
    setAdAccounts([]);
    setSelectedAdAccount(null);
    setPages([]);
    setSelectedPage(null);
    setPixels([]);
    setSelectedPixel(null);
  };

  const handleAccountSelect = (account) => {
    setSelectedAdAccount(account);
    setAccountSelectorOpen(false);
    setAccountSearch("");
    // Reset pixel when account changes
    setSelectedPixel(null);
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setPageSelectorOpen(false);
    setPageSearch("");
  };

  const handlePixelSelect = (pixel) => {
    setSelectedPixel(pixel);
    setPixelSelectorOpen(false);
  };

  const handleModuleSelect = (moduleId) => {
    const item = navItems.find((n) => n.id === moduleId);
    if (item && item.status === "active") {
      setActiveModule(moduleId);
    }
  };

  // Styles - Premium SaaS Design
  const styles = {
    // Layout
    container: {
      minHeight: "100vh",
      background: "#09090b",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      color: "#fafafa",
      display: "flex",
    },
    // Sidebar
    sidebar: {
      width: sidebarCollapsed ? "64px" : "260px",
      minHeight: "100vh",
      background: "#0a0a0b",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.2s ease",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    },
    sidebarHeader: {
      padding: sidebarCollapsed ? "20px 16px" : "20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logoIcon: {
      width: "32px",
      height: "32px",
      background: "#18181b",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: "700",
      color: "#818cf8",
      flexShrink: 0,
    },
    logoText: {
      display: sidebarCollapsed ? "none" : "block",
    },
    logoTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#fafafa",
      margin: 0,
      letterSpacing: "-0.02em",
    },
    logoSubtitle: {
      fontSize: "11px",
      color: "#52525b",
      margin: "2px 0 0",
    },
    // User section
    userSection: {
      padding: sidebarCollapsed ? "12px 16px" : "12px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    userCard: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: sidebarCollapsed ? "8px" : "8px 10px",
      background: "transparent",
      borderRadius: "6px",
    },
    userAvatar: {
      width: "32px",
      height: "32px",
      background: "#27272a",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: "600",
      color: "#a1a1aa",
      flexShrink: 0,
    },
    userInfo: {
      display: sidebarCollapsed ? "none" : "block",
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#fafafa",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    userStatus: {
      fontSize: "11px",
      color: "#52525b",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    // Account selector section
    accountSection: {
      padding: sidebarCollapsed ? "12px 16px" : "16px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    accountSelectorLabel: {
      fontSize: "11px",
      fontWeight: "500",
      color: "#52525b",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "8px",
      display: sidebarCollapsed ? "none" : "block",
    },
    accountSelector: {
      position: "relative",
    },
    accountSelectorBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: sidebarCollapsed ? "8px" : "8px 10px",
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.15s ease",
      textAlign: "left",
    },
    accountIcon: {
      width: "28px",
      height: "28px",
      background: "#18181b",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      fontWeight: "600",
      color: "#71717a",
      flexShrink: 0,
    },
    accountInfo: {
      display: sidebarCollapsed ? "none" : "block",
      flex: 1,
      minWidth: 0,
    },
    accountName: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#fafafa",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    accountId: {
      fontSize: "10px",
      color: "#71717a",
    },
    accountDropdownIcon: {
      color: "#71717a",
      fontSize: "12px",
      display: sidebarCollapsed ? "none" : "block",
    },
    accountDropdown: {
      position: "absolute",
      top: "calc(100% + 8px)",
      left: 0,
      right: sidebarCollapsed ? "auto" : 0,
      width: sidebarCollapsed ? "280px" : "100%",
      background: "rgba(15,15,20,0.98)",
      border: "1px solid rgba(71,85,105,0.4)",
      borderRadius: "12px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      zIndex: 1000,
      maxHeight: "320px",
      overflow: "hidden",
    },
    accountSearchWrapper: {
      padding: "12px",
      borderBottom: "1px solid rgba(71,85,105,0.2)",
    },
    accountSearchInput: {
      width: "100%",
      padding: "10px 12px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(71,85,105,0.3)",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "13px",
      outline: "none",
    },
    accountList: {
      maxHeight: "240px",
      overflowY: "auto",
    },
    accountListItem: (isSelected) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 14px",
      cursor: "pointer",
      background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
      borderLeft: isSelected ? "3px solid #6366f1" : "3px solid transparent",
      transition: "all 0.15s ease",
    }),
    accountListItemName: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#fff",
    },
    accountListItemId: {
      fontSize: "10px",
      color: "#71717a",
    },
    // Navigation
    nav: {
      flex: 1,
      padding: "16px 12px",
      overflowY: "auto",
    },
    navSection: {
      marginBottom: "24px",
    },
    navSectionTitle: {
      fontSize: "10px",
      fontWeight: "600",
      color: "#71717a",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      padding: sidebarCollapsed ? "0 8px 8px" : "0 8px 12px",
      display: sidebarCollapsed ? "none" : "block",
    },
    navItem: (isActive, item) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: sidebarCollapsed ? "12px" : "12px 12px",
      marginBottom: "4px",
      borderRadius: "10px",
      cursor: item.status === "active" ? "pointer" : "default",
      background: isActive
        ? "rgba(99,102,241,0.15)"
        : "transparent",
      border: isActive
        ? "1px solid rgba(99,102,241,0.3)"
        : "1px solid transparent",
      transition: "all 0.2s ease",
      opacity: item.status === "coming-soon" ? 0.6 : 1,
      position: "relative",
    }),
    navItemIcon: (item) => ({
      width: "36px",
      height: "36px",
      background: item.gradient,
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      flexShrink: 0,
    }),
    navItemContent: {
      display: sidebarCollapsed ? "none" : "block",
      flex: 1,
      minWidth: 0,
    },
    navItemName: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#fff",
      marginBottom: "2px",
    },
    navItemDesc: {
      fontSize: "11px",
      color: "#71717a",
    },
    comingSoonBadge: {
      display: sidebarCollapsed ? "none" : "inline-block",
      padding: "3px 8px",
      background: "linear-gradient(135deg,#f59e0b,#f97316)",
      borderRadius: "6px",
      fontSize: "9px",
      fontWeight: "700",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    },
    // Sidebar footer
    sidebarFooter: {
      padding: sidebarCollapsed ? "16px 12px" : "16px 20px",
      borderTop: "1px solid rgba(71,85,105,0.2)",
    },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: "12px",
      width: "100%",
      padding: "12px",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: "10px",
      color: "#ef4444",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    collapseBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      padding: "10px",
      background: "transparent",
      border: "1px solid rgba(71,85,105,0.2)",
      borderRadius: "8px",
      color: "#71717a",
      fontSize: "16px",
      cursor: "pointer",
      marginTop: "8px",
      transition: "all 0.2s ease",
    },
    // Main content
    main: {
      flex: 1,
      marginLeft: sidebarCollapsed ? "72px" : "280px",
      transition: "margin-left 0.3s ease",
      minHeight: "100vh",
    },
    welcomeContainer: {
      padding: "40px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    welcomeHeader: {
      marginBottom: "48px",
    },
    welcomeTitle: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#fff",
      margin: "0 0 8px",
    },
    welcomeSubtitle: {
      fontSize: "16px",
      color: "#71717a",
      margin: 0,
    },
    toolsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "24px",
    },
    toolCard: (item) => ({
      padding: "28px",
      background: "rgba(15,23,42,0.6)",
      border: `2px solid ${item.status === "active" ? `${item.borderColor}30` : "rgba(71,85,105,0.2)"}`,
      borderRadius: "16px",
      cursor: item.status === "active" ? "pointer" : "default",
      transition: "all 0.3s ease",
      opacity: item.status === "coming-soon" ? 0.7 : 1,
      position: "relative",
      overflow: "hidden",
    }),
    toolCardIcon: (item) => ({
      width: "56px",
      height: "56px",
      background: item.gradient,
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      marginBottom: "20px",
    }),
    toolCardTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#fff",
      margin: "0 0 8px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    toolCardDesc: {
      fontSize: "14px",
      color: "#71717a",
      margin: 0,
      lineHeight: "1.6",
    },
    toolCardBadge: {
      position: "absolute",
      top: "16px",
      right: "16px",
      padding: "6px 12px",
      background: "linear-gradient(135deg,#f59e0b,#f97316)",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: "700",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    // Login screen
    loginContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },
    loginBox: {
      maxWidth: "420px",
      width: "100%",
    },
    loginLogoSection: {
      textAlign: "center",
      marginBottom: "40px",
    },
    loginLogo: {
      width: "72px",
      height: "72px",
      background: "linear-gradient(135deg,#6366f1,#d946ef)",
      borderRadius: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "36px",
      margin: "0 auto 20px",
    },
    loginTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#fff",
      margin: "0 0 8px",
    },
    loginSubtitle: {
      fontSize: "14px",
      color: "#71717a",
      margin: 0,
    },
    loginCard: {
      background: "rgba(15,23,42,0.8)",
      borderRadius: "16px",
      padding: "32px",
      border: "1px solid rgba(71,85,105,0.3)",
    },
    loginCardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#a5b4fc",
      margin: "0 0 12px",
      textAlign: "center",
    },
    loginCardDesc: {
      fontSize: "13px",
      color: "#71717a",
      textAlign: "center",
      marginBottom: "24px",
      lineHeight: "1.6",
    },
    loginError: {
      padding: "12px 16px",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: "10px",
      color: "#ef4444",
      fontSize: "13px",
      marginBottom: "20px",
      textAlign: "center",
    },
    loginBtn: {
      width: "100%",
      padding: "16px",
      background: "linear-gradient(135deg,#1877f2,#0c63d4)",
      border: "none",
      borderRadius: "12px",
      color: "#fff",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      transition: "all 0.2s ease",
    },
  };

  // Loading screen
  if (isAuthenticating) {
    return (
      <div style={{ ...styles.container, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "700",
              color: "#818cf8",
              margin: "0 auto 20px",
            }}
          >
            MA
          </div>
          <p style={{ color: "#52525b", fontSize: "13px", fontWeight: "500" }}>Vérification de la connexion...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!accessToken) {
    return (
      <div style={styles.container}>
        <div style={styles.loginContainer}>
          <div style={styles.loginBox}>
            <div style={styles.loginLogoSection}>
              <div style={{
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
                margin: "0 auto 20px",
              }}>MA</div>
              <h1 style={styles.loginTitle}>Meta Ads Tools</h1>
              <p style={styles.loginSubtitle}>Suite complète pour les Media Buyers</p>
            </div>

            <div style={styles.loginCard}>
              <h2 style={styles.loginCardTitle}>Connexion requise</h2>
              <p style={styles.loginCardDesc}>
                Connectez-vous avec votre compte Facebook pour accéder à vos comptes publicitaires Meta et à tous nos outils.
              </p>

              {authError && <div style={styles.loginError}>{authError}</div>}

              <button
                onClick={handleLogin}
                style={styles.loginBtn}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(24,119,242,0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Se connecter avec Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render active module with sidebar
  const renderModule = () => {
    if (activeModule === "creative-importer") {
      return (
        <CreativeImporterPro
          accessToken={accessToken}
          user={user}
          onLogout={handleLogout}
          onBack={() => setActiveModule(null)}
          embedded={true}
          sharedAdAccount={selectedAdAccount}
          sharedPage={selectedPage}
          sharedPixel={selectedPixel}
        />
      );
    }

    if (activeModule === "media-buyer") {
      return (
        <MediaBuyerPro
          accessToken={accessToken}
          user={user}
          onLogout={handleLogout}
          onBack={() => setActiveModule(null)}
          embedded={true}
          sharedAdAccount={selectedAdAccount}
        />
      );
    }

    // Welcome/Dashboard view
    return (
      <div style={styles.welcomeContainer}>
        <div style={styles.welcomeHeader}>
          <h1 style={styles.welcomeTitle}>
            Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={styles.welcomeSubtitle}>
            Sélectionnez un outil pour commencer à optimiser vos campagnes Meta Ads
          </p>
        </div>

        <div style={styles.toolsGrid}>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "28px",
                background: "#0a0a0b",
                border: `1px solid ${item.status === "active" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: "12px",
                cursor: item.status === "active" ? "pointer" : "default",
                transition: "all 0.2s ease",
                opacity: item.status === "coming-soon" ? 0.6 : 1,
                position: "relative",
              }}
              onClick={() => handleModuleSelect(item.id)}
              onMouseOver={(e) => {
                if (item.status === "active") {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.background = "#111113";
                }
              }}
              onMouseOut={(e) => {
                if (item.status === "active") {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "#0a0a0b";
                }
              }}
            >
              {item.status === "coming-soon" && (
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  padding: "4px 10px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>Soon</div>
              )}
              <div style={{
                width: "44px",
                height: "44px",
                background: item.bgColor,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: "700",
                color: item.color,
                marginBottom: "20px",
              }}>{item.abbrev}</div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#fafafa",
                margin: "0 0 8px",
                letterSpacing: "-0.01em",
              }}>{item.name}</h3>
              <p style={{
                fontSize: "13px",
                color: "#71717a",
                margin: 0,
                lineHeight: "1.6",
              }}>
                {item.id === "creative-importer" &&
                  "Créez et lancez vos campagnes Meta Ads en quelques clics. Importez vos créatives, configurez votre ciblage et générez automatiquement toutes vos publicités."}
                {item.id === "media-buyer" &&
                  "Gérez et optimisez vos campagnes existantes. Analysez les performances et appliquez des optimisations intelligentes en un clic."}
                {item.id === "creative-strategist" &&
                  "Analysez vos créatives avec l'IA pour identifier les éléments performants et obtenir des recommandations stratégiques."}
                {item.id === "ad-creator" &&
                  "Générez des visuels et vidéos publicitaires optimisés grâce à l'intelligence artificielle."}
                {item.id === "data-analyst" &&
                  "Tableaux de bord avancés et rapports personnalisés pour une analyse approfondie de vos performances."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Main layout with sidebar
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>MA</div>
            <div style={styles.logoText}>
              <h1 style={styles.logoTitle}>Meta Ads Tools</h1>
              <p style={styles.logoSubtitle}>by Thomas</p>
            </div>
          </div>
        </div>

        {/* User section */}
        {user && (
          <div style={styles.userSection}>
            <div style={styles.userCard}>
              <div style={styles.userAvatar}>
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user.name}</div>
                <div style={styles.userStatus}>
                  <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%" }}></span>
                  Connecté
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account, Page, Pixel Selectors */}
        {user && (
          <div style={styles.accountSection}>
            {/* Account Selector */}
            <div style={styles.accountSelectorLabel}>Compte Publicitaire</div>
            <div style={styles.accountSelector}>
              <button
                style={{
                  ...styles.accountSelectorBtn,
                  borderColor: accountSelectorOpen ? "rgba(99,102,241,0.5)" : "rgba(71,85,105,0.3)",
                }}
                onClick={() => {
                  setAccountSelectorOpen(!accountSelectorOpen);
                  setPageSelectorOpen(false);
                  setPixelSelectorOpen(false);
                }}
              >
                <div style={{
                  ...styles.accountIcon,
                  color: isLoadingAccounts ? "#52525b" : "#818cf8",
                }}>
                  {isLoadingAccounts ? "..." : "AD"}
                </div>
                <div style={styles.accountInfo}>
                  <div style={styles.accountName}>
                    {isLoadingAccounts
                      ? "Chargement..."
                      : selectedAdAccount
                      ? selectedAdAccount.name
                      : "Sélectionner un compte"}
                  </div>
                  <div style={styles.accountId}>
                    {selectedAdAccount ? `act_${selectedAdAccount.account_id}` : `${adAccounts.length} comptes disponibles`}
                  </div>
                </div>
                <div style={styles.accountDropdownIcon}>{accountSelectorOpen ? "▲" : "▼"}</div>
              </button>

              {accountSelectorOpen && (
                <div style={styles.accountDropdown}>
                  <div style={styles.accountSearchWrapper}>
                    <input
                      type="text"
                      placeholder="Rechercher un compte..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      style={styles.accountSearchInput}
                      autoFocus
                    />
                  </div>
                  <div style={styles.accountList}>
                    {filteredAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        style={styles.accountListItem(selectedAdAccount?.id === acc.id)}
                        onClick={() => handleAccountSelect(acc)}
                        onMouseOver={(e) => {
                          if (selectedAdAccount?.id !== acc.id) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedAdAccount?.id !== acc.id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div>
                          <div style={styles.accountListItemName}>{acc.name}</div>
                          <div style={styles.accountListItemId}>act_{acc.account_id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Page Selector */}
            <div style={{ ...styles.accountSelectorLabel, marginTop: "16px" }}>Page Facebook</div>
            <div style={styles.accountSelector}>
              <button
                style={{
                  ...styles.accountSelectorBtn,
                  borderColor: pageSelectorOpen ? "rgba(99,102,241,0.5)" : "rgba(71,85,105,0.3)",
                }}
                onClick={() => {
                  setPageSelectorOpen(!pageSelectorOpen);
                  setAccountSelectorOpen(false);
                  setPixelSelectorOpen(false);
                }}
              >
                <div style={{
                  ...styles.accountIcon,
                  color: isLoadingPages ? "#52525b" : "#3b82f6",
                }}>
                  {isLoadingPages ? "..." : "PG"}
                </div>
                <div style={styles.accountInfo}>
                  <div style={styles.accountName}>
                    {isLoadingPages
                      ? "Chargement..."
                      : selectedPage
                      ? selectedPage.name
                      : "Sélectionner une page"}
                  </div>
                  <div style={styles.accountId}>
                    {selectedPage ? selectedPage.id : `${pages.length} pages disponibles`}
                  </div>
                </div>
                <div style={styles.accountDropdownIcon}>{pageSelectorOpen ? "▲" : "▼"}</div>
              </button>

              {pageSelectorOpen && (
                <div style={styles.accountDropdown}>
                  <div style={styles.accountSearchWrapper}>
                    <input
                      type="text"
                      placeholder="Rechercher une page..."
                      value={pageSearch}
                      onChange={(e) => setPageSearch(e.target.value)}
                      style={styles.accountSearchInput}
                      autoFocus
                    />
                  </div>
                  <div style={styles.accountList}>
                    {filteredPages.map((page) => (
                      <div
                        key={page.id}
                        style={styles.accountListItem(selectedPage?.id === page.id)}
                        onClick={() => handlePageSelect(page)}
                        onMouseOver={(e) => {
                          if (selectedPage?.id !== page.id) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedPage?.id !== page.id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div>
                          <div style={styles.accountListItemName}>{page.name}</div>
                          <div style={styles.accountListItemId}>{page.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pixel Selector - only show when account is selected */}
            {selectedAdAccount && (
              <>
                <div style={{ ...styles.accountSelectorLabel, marginTop: "16px" }}>Pixel</div>
                <div style={styles.accountSelector}>
                  <button
                    style={{
                      ...styles.accountSelectorBtn,
                      borderColor: pixelSelectorOpen ? "rgba(99,102,241,0.5)" : "rgba(71,85,105,0.3)",
                    }}
                    onClick={() => {
                      setPixelSelectorOpen(!pixelSelectorOpen);
                      setAccountSelectorOpen(false);
                      setPageSelectorOpen(false);
                    }}
                  >
                    <div style={{
                      ...styles.accountIcon,
                      color: isLoadingPixels ? "#52525b" : "#22c55e",
                    }}>
                      {isLoadingPixels ? "..." : "PX"}
                    </div>
                    <div style={styles.accountInfo}>
                      <div style={styles.accountName}>
                        {isLoadingPixels
                          ? "Chargement..."
                          : selectedPixel
                          ? selectedPixel.name
                          : pixels.length === 0
                          ? "Aucun pixel"
                          : "Sélectionner un pixel"}
                      </div>
                      <div style={styles.accountId}>
                        {selectedPixel ? selectedPixel.id : `${pixels.length} pixels disponibles`}
                      </div>
                    </div>
                    <div style={styles.accountDropdownIcon}>{pixelSelectorOpen ? "▲" : "▼"}</div>
                  </button>

                  {pixelSelectorOpen && pixels.length > 0 && (
                    <div style={styles.accountDropdown}>
                      <div style={styles.accountList}>
                        {pixels.map((pixel) => (
                          <div
                            key={pixel.id}
                            style={styles.accountListItem(selectedPixel?.id === pixel.id)}
                            onClick={() => handlePixelSelect(pixel)}
                            onMouseOver={(e) => {
                              if (selectedPixel?.id !== pixel.id) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              }
                            }}
                            onMouseOut={(e) => {
                              if (selectedPixel?.id !== pixel.id) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            <div>
                              <div style={styles.accountListItemName}>{pixel.name}</div>
                              <div style={styles.accountListItemId}>{pixel.id}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav style={styles.nav}>
          {/* Active Tools */}
          <div style={styles.navSection}>
            <div style={styles.navSectionTitle}>Outils</div>
            {navItems
              .filter((item) => item.status === "active")
              .map((item) => (
                <div
                  key={item.id}
                  style={styles.navItem(activeModule === item.id, item)}
                  onClick={() => handleModuleSelect(item.id)}
                  onMouseOver={(e) => {
                    if (activeModule !== item.id) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeModule !== item.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    background: item.bgColor,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: item.color,
                    flexShrink: 0,
                  }}>{item.abbrev}</div>
                  <div style={styles.navItemContent}>
                    <div style={styles.navItemName}>{item.name}</div>
                    <div style={styles.navItemDesc}>{item.description}</div>
                  </div>
                </div>
              ))}
          </div>

          {/* Coming Soon */}
          <div style={styles.navSection}>
            <div style={styles.navSectionTitle}>Prochainement</div>
            {navItems
              .filter((item) => item.status === "coming-soon")
              .map((item) => (
                <div key={item.id} style={styles.navItem(false, item)}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    background: item.bgColor,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: item.color,
                    flexShrink: 0,
                    opacity: 0.7,
                  }}>{item.abbrev}</div>
                  <div style={styles.navItemContent}>
                    <div style={styles.navItemName}>{item.name}</div>
                    <div style={styles.navItemDesc}>{item.description}</div>
                  </div>
                  <div style={{
                    padding: "3px 8px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontWeight: "600",
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>Soon</div>
                </div>
              ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={styles.sidebarFooter}>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
          <button
            style={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>{renderModule()}</main>
    </div>
  );
}
