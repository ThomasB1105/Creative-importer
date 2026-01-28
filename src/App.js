import { useState, useEffect } from "react";
import { authHelpers, createMetaApi } from "./config";
import CreativeImporterPro from "./CreativeImporterPro";
import MediaBuyerPro from "./MediaBuyerPro";

export default function App() {
  const [activeModule, setActiveModule] = useState(null); // null | 'creative-importer' | 'media-buyer'
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);

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

  const handleLogin = () => {
    window.location.href = authHelpers.getOAuthUrl();
  };

  const handleLogout = () => {
    authHelpers.clearToken();
    setAccessToken(null);
    setUser(null);
    setActiveModule(null);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  // Loading screen
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

  // Login screen
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
              Meta Ads Tools
            </h1>
            <p style={{ color: "#71717a", margin: 0 }}>
              Creative Importer Pro & Media Buyer Pro
            </p>
          </div>

          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid rgba(71,85,105,0.3)",
              textAlign: "center",
            }}
          >
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
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  color: "#ef4444",
                  fontSize: "12px",
                }}
              >
                {authError}
              </div>
            )}

            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg,#1877f2,#0c63d4)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📘</span>
              Se connecter avec Facebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Module already selected - render it
  if (activeModule === 'creative-importer') {
    return <CreativeImporterPro accessToken={accessToken} user={user} onLogout={handleLogout} onBack={handleBack} />;
  }

  if (activeModule === 'media-buyer') {
    return <MediaBuyerPro accessToken={accessToken} user={user} onLogout={handleLogout} onBack={handleBack} />;
  }

  // Module selection screen
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0a0f,#1a1a2e,#16213e)",
        fontFamily: "system-ui",
        color: "#e4e4e7",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with user info */}
      <header
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#fff" }}>
            Meta Ads Tools
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#71717a" }}>
            Choisissez votre outil
          </p>
        </div>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: "#e4e4e7" }}>{user.name}</div>
              <div style={{ fontSize: "10px", color: "#71717a" }}>Connecté</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
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
      </header>

      {/* Module cards */}
      <main
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          {/* Creative Importer Pro */}
          <button
            onClick={() => setActiveModule('creative-importer')}
            style={{
              padding: "40px",
              background: "rgba(15,23,42,0.8)",
              border: "2px solid rgba(99,102,241,0.3)",
              borderRadius: "20px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                background: "linear-gradient(135deg,#6366f1,#d946ef)",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                marginBottom: "24px",
              }}
            >
              ⚡
            </div>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "24px",
                color: "#fff",
                fontWeight: "700",
              }}
            >
              Creative Importer Pro
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#71717a",
                lineHeight: "1.6",
              }}
            >
              Créez et lancez vos campagnes Meta Ads en quelques clics. Importez vos créatives, configurez votre ciblage et générez automatiquement toutes vos publicités.
            </p>
          </button>

          {/* Media Buyer Pro */}
          <button
            onClick={() => setActiveModule('media-buyer')}
            style={{
              padding: "40px",
              background: "rgba(15,23,42,0.8)",
              border: "2px solid rgba(245,158,11,0.3)",
              borderRadius: "20px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#f59e0b";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(245,158,11,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                background: "linear-gradient(135deg,#f59e0b,#ef4444)",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                marginBottom: "24px",
              }}
            >
              📊
            </div>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "24px",
                color: "#fff",
                fontWeight: "700",
              }}
            >
              Media Buyer Pro
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#71717a",
                lineHeight: "1.6",
              }}
            >
              Gérez et optimisez vos campagnes Meta Ads existantes. Analysez les performances, consultez vos campagnes, adsets et publicités en un coup d'œil.
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
