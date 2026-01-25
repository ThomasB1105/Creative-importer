import { useState } from "react";

export default function MediaBuyerPro({ accessToken, user, onLogout, onBack }) {
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
          <button
            onClick={onBack}
            style={{
              padding: "8px 12px",
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "8px",
              color: "#a5b4fc",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ← Changer de module
          </button>

          <div
            style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            📊
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#fff" }}>
              Media Buyer Pro
            </h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#71717a" }}>
              Connected to Meta Ads API
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", color: "#e4e4e7" }}>{user.name}</div>
                <div style={{ fontSize: "10px", color: "#71717a" }}>Connecté</div>
              </div>
              <button
                onClick={onLogout}
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
        <div
          style={{
            padding: "60px 24px",
            background: "rgba(15,23,42,0.6)",
            borderRadius: "12px",
            border: "1px solid rgba(71,85,105,0.3)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>📊</div>
          <h2 style={{ margin: "0 0 16px", fontSize: "24px", color: "#fff" }}>
            Media Buyer Pro
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#71717a", maxWidth: "600px", marginInline: "auto" }}>
            Cette section est en cours de développement. Vous pourrez bientôt gérer et optimiser vos campagnes Meta Ads existantes.
          </p>
        </div>
      </main>
    </div>
  );
}
