import { useState, useEffect } from "react";
import { authHelpers, createMetaApi } from "./config";
import CreativeImporterPro from "./CreativeImporterPro";
import MediaBuyerPro from "./MediaBuyerPro";

// Navigation items configuration
const navItems = [
  {
    id: "creative-importer",
    name: "Creative Importer Pro",
    icon: "⚡",
    description: "Import & launch ads",
    gradient: "linear-gradient(135deg,#6366f1,#d946ef)",
    borderColor: "#6366f1",
    status: "active",
  },
  {
    id: "media-buyer",
    name: "Media Buyer Pro",
    icon: "📊",
    description: "Optimize campaigns",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    borderColor: "#f59e0b",
    status: "active",
  },
  {
    id: "creative-strategist",
    name: "Creative Strategist Pro",
    icon: "🎯",
    description: "AI creative insights",
    gradient: "linear-gradient(135deg,#22d3ee,#6366f1)",
    borderColor: "#22d3ee",
    status: "coming-soon",
  },
  {
    id: "ad-creator",
    name: "Ad Creator Pro",
    icon: "🎨",
    description: "Generate ad creatives",
    gradient: "linear-gradient(135deg,#ec4899,#f43f5e)",
    borderColor: "#ec4899",
    status: "coming-soon",
  },
  {
    id: "data-analyst",
    name: "Data Analyst Pro",
    icon: "📈",
    description: "Advanced analytics",
    gradient: "linear-gradient(135deg,#22c55e,#14b8a6)",
    borderColor: "#22c55e",
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

  const handleLogin = () => {
    window.location.href = authHelpers.getOAuthUrl();
  };

  const handleLogout = () => {
    authHelpers.clearToken();
    setAccessToken(null);
    setUser(null);
    setActiveModule(null);
  };

  const handleModuleSelect = (moduleId) => {
    const item = navItems.find((n) => n.id === moduleId);
    if (item && item.status === "active") {
      setActiveModule(moduleId);
    }
  };

  // Styles
  const styles = {
    // Layout
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0a0a0f,#1a1a2e,#16213e)",
      fontFamily: "system-ui",
      color: "#e4e4e7",
      display: "flex",
    },
    // Sidebar
    sidebar: {
      width: sidebarCollapsed ? "72px" : "280px",
      minHeight: "100vh",
      background: "rgba(10,10,15,0.95)",
      borderRight: "1px solid rgba(71,85,105,0.3)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s ease",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    },
    sidebarHeader: {
      padding: sidebarCollapsed ? "20px 12px" : "24px 20px",
      borderBottom: "1px solid rgba(71,85,105,0.2)",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logoIcon: {
      width: "40px",
      height: "40px",
      background: "linear-gradient(135deg,#6366f1,#d946ef)",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      flexShrink: 0,
    },
    logoText: {
      display: sidebarCollapsed ? "none" : "block",
    },
    logoTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#fff",
      margin: 0,
    },
    logoSubtitle: {
      fontSize: "11px",
      color: "#71717a",
      margin: "2px 0 0",
    },
    // User section
    userSection: {
      padding: sidebarCollapsed ? "16px 12px" : "16px 20px",
      borderBottom: "1px solid rgba(71,85,105,0.2)",
    },
    userCard: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: sidebarCollapsed ? "8px" : "12px",
      background: "rgba(255,255,255,0.03)",
      borderRadius: "10px",
      cursor: "pointer",
    },
    userAvatar: {
      width: "36px",
      height: "36px",
      background: "linear-gradient(135deg,#6366f1,#a855f7)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "600",
      color: "#fff",
      flexShrink: 0,
    },
    userInfo: {
      display: sidebarCollapsed ? "none" : "block",
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#fff",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    userStatus: {
      fontSize: "11px",
      color: "#22c55e",
      display: "flex",
      alignItems: "center",
      gap: "4px",
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
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg,#6366f1,#d946ef)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 20px",
              animation: "pulse 2s infinite",
            }}
          >
            ⚡
          </div>
          <p style={{ color: "#71717a", fontSize: "14px" }}>Vérification de la connexion...</p>
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
              <div style={styles.loginLogo}>⚡</div>
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
                <span style={{ fontSize: "20px" }}>📘</span>
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
        />
      );
    }

    // Welcome/Dashboard view
    return (
      <div style={styles.welcomeContainer}>
        <div style={styles.welcomeHeader}>
          <h1 style={styles.welcomeTitle}>
            Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p style={styles.welcomeSubtitle}>
            Sélectionnez un outil pour commencer à optimiser vos campagnes Meta Ads
          </p>
        </div>

        <div style={styles.toolsGrid}>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={styles.toolCard(item)}
              onClick={() => handleModuleSelect(item.id)}
              onMouseOver={(e) => {
                if (item.status === "active") {
                  e.currentTarget.style.borderColor = item.borderColor;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 32px ${item.borderColor}20`;
                }
              }}
              onMouseOut={(e) => {
                if (item.status === "active") {
                  e.currentTarget.style.borderColor = `${item.borderColor}30`;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {item.status === "coming-soon" && (
                <div style={styles.toolCardBadge}>Coming Soon</div>
              )}
              <div style={styles.toolCardIcon(item)}>{item.icon}</div>
              <h3 style={styles.toolCardTitle}>{item.name}</h3>
              <p style={styles.toolCardDesc}>
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
            <div style={styles.logoIcon}>⚡</div>
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
                  <div style={styles.navItemIcon(item)}>{item.icon}</div>
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
                  <div style={styles.navItemIcon(item)}>{item.icon}</div>
                  <div style={styles.navItemContent}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={styles.navItemName}>{item.name}</span>
                    </div>
                    <div style={styles.navItemDesc}>{item.description}</div>
                  </div>
                  <div style={styles.comingSoonBadge}>Soon</div>
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
            <span>🚪</span>
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
