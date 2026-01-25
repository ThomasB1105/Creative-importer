import { useState, useEffect, useCallback } from "react";
import { META_APP, createMetaApi } from "./config";

export default function MediaBuyerPro({ accessToken, user, onLogout, onBack }) {
  // Account selection
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");

  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [adsets, setAdsets] = useState([]);
  const [ads, setAds] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter states
  const [currentView, setCurrentView] = useState("campaigns"); // "campaigns" | "adsets" | "ads"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "ACTIVE" | "PAUSED"

  // Load ad accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const api = createMetaApi(accessToken);
        const accounts = await api.fetchAdAccounts();
        setAdAccounts(accounts.filter((a) => a.account_status === 1));
      } catch (error) {
        console.error("Error loading accounts:", error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [accessToken]);

  // Load campaigns, adsets, and ads when account is selected
  const loadData = useCallback(async () => {
    if (!selectedAccount) return;

    setIsLoadingData(true);
    try {
      const fields = {
        campaigns: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
        adsets: 'id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event,created_time,updated_time',
        ads: 'id,name,status,adset_id,campaign_id,creative{id,name},created_time,updated_time'
      };

      // Load campaigns
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/campaigns?fields=${fields.campaigns}&limit=100&access_token=${accessToken}`
      );
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.data) {
        setCampaigns(campaignsData.data);
      }

      // Load adsets
      const adsetsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/adsets?fields=${fields.adsets}&limit=100&access_token=${accessToken}`
      );
      const adsetsData = await adsetsResponse.json();
      if (adsetsData.data) {
        setAdsets(adsetsData.data);
      }

      // Load ads
      const adsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/ads?fields=${fields.ads}&limit=100&access_token=${accessToken}`
      );
      const adsData = await adsResponse.json();
      if (adsData.data) {
        setAds(adsData.data);
      }

      console.log('✅ Media Buyer data loaded:', {
        campaigns: campaignsData.data?.length || 0,
        adsets: adsetsData.data?.length || 0,
        ads: adsData.data?.length || 0,
      });
    } catch (error) {
      console.error('❌ Error loading Media Buyer data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedAccount, accessToken]);

  useEffect(() => {
    if (selectedAccount) {
      loadData();
    }
  }, [selectedAccount, loadData]);

  // Filter data by status
  const getFilteredCampaigns = () => {
    if (statusFilter === "all") return campaigns;
    return campaigns.filter(c => c.status === statusFilter);
  };

  const getFilteredAdsets = () => {
    if (statusFilter === "all") return adsets;
    return adsets.filter(a => a.status === statusFilter);
  };

  const getFilteredAds = () => {
    if (statusFilter === "all") return ads;
    return ads.filter(a => a.status === statusFilter);
  };

  // Styles
  const box = {
    background: "rgba(15,23,42,0.6)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(71,85,105,0.3)",
  };

  const button = {
    padding: "10px 20px",
    background: "rgba(30,41,59,0.4)",
    border: "1px solid rgba(71,85,105,0.3)",
    borderRadius: "8px",
    color: "#71717a",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const activeButton = {
    ...button,
    background: "rgba(99,102,241,0.3)",
    border: "1px solid rgba(99,102,241,0.5)",
    color: "#a5b4fc",
  };

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
        {/* Account Selection */}
        {!selectedAccount && (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "24px", color: "#a5b4fc" }}>
              🔐 Sélection du compte
            </h2>
            {isLoadingAccounts ? (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                <p>Chargement des comptes...</p>
              </div>
            ) : (
              <div style={box}>
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "#a5b4fc" }}>
                    📊 Compte Publicitaire ({adAccounts.length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(30,41,59,0.5)",
                      border: "1px solid rgba(71,85,105,0.3)",
                      borderRadius: "8px",
                      color: "#e4e4e7",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {adAccounts
                    .filter((acc) =>
                      acc.name.toLowerCase().includes(accountSearch.toLowerCase())
                    )
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        style={{
                          width: "100%",
                          padding: "16px",
                          marginBottom: "8px",
                          background: "rgba(30,41,59,0.4)",
                          border: "1px solid rgba(71,85,105,0.2)",
                          borderRadius: "8px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "rgba(99,102,241,0.2)";
                          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(30,41,59,0.4)";
                          e.currentTarget.style.borderColor = "rgba(71,85,105,0.2)";
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#e4e4e7", marginBottom: "4px" }}>
                          {account.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#71717a" }}>
                          {account.id}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard */}
        {selectedAccount && (
          <div>
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", margin: 0, color: "#a5b4fc" }}>
                📊 {selectedAccount.name}
              </h2>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  padding: "6px 12px",
                  background: "rgba(71,85,105,0.2)",
                  border: "1px solid rgba(71,85,105,0.3)",
                  borderRadius: "6px",
                  color: "#71717a",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                ← Changer de compte
              </button>
            </div>

            {/* View Navigation */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <button
                onClick={() => setCurrentView("campaigns")}
                style={currentView === "campaigns" ? activeButton : button}
              >
                🎯 Campagnes ({campaigns.length})
              </button>
              <button
                onClick={() => setCurrentView("adsets")}
                style={currentView === "adsets" ? activeButton : button}
              >
                📦 Adsets ({adsets.length})
              </button>
              <button
                onClick={() => setCurrentView("ads")}
                style={currentView === "ads" ? activeButton : button}
              >
                🎨 Ads ({ads.length})
              </button>
            </div>

            {/* Status Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  padding: "8px 16px",
                  background: statusFilter === "all" ? "rgba(99,102,241,0.3)" : "rgba(30,41,59,0.4)",
                  border: statusFilter === "all" ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(71,85,105,0.3)",
                  borderRadius: "6px",
                  color: statusFilter === "all" ? "#a5b4fc" : "#71717a",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Tous
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                style={{
                  padding: "8px 16px",
                  background: statusFilter === "ACTIVE" ? "rgba(34,197,94,0.3)" : "rgba(30,41,59,0.4)",
                  border: statusFilter === "ACTIVE" ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(71,85,105,0.3)",
                  borderRadius: "6px",
                  color: statusFilter === "ACTIVE" ? "#22c55e" : "#71717a",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🟢 Actif
              </button>
              <button
                onClick={() => setStatusFilter("PAUSED")}
                style={{
                  padding: "8px 16px",
                  background: statusFilter === "PAUSED" ? "rgba(245,158,11,0.3)" : "rgba(30,41,59,0.4)",
                  border: statusFilter === "PAUSED" ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(71,85,105,0.3)",
                  borderRadius: "6px",
                  color: statusFilter === "PAUSED" ? "#f59e0b" : "#71717a",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ⏸️ Inactif
              </button>
            </div>

            {/* Data Tables */}
            {isLoadingData ? (
              <div style={{ ...box, textAlign: "center", padding: "60px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                <p>Chargement des données...</p>
              </div>
            ) : (
              <div style={{ ...box, padding: 0, overflow: "hidden" }}>
                {/* CAMPAIGNS TABLE */}
                {currentView === "campaigns" && (
                  <>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(71,85,105,0.3)" }}>
                      <h3 style={{ margin: 0, fontSize: "14px", color: "#a5b4fc" }}>
                        🎯 Campagnes ({getFilteredCampaigns().length})
                      </h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(30,41,59,0.4)" }}>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Nom</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Objectif</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Budget</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredCampaigns().map((campaign, index) => (
                            <tr
                              key={campaign.id}
                              style={{
                                borderTop: index > 0 ? "1px solid rgba(71,85,105,0.2)" : "none",
                                transition: "background 0.2s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7" }}>{campaign.name}</td>
                              <td style={{ padding: "16px 24px" }}>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background: campaign.status === 'ACTIVE' ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                                    color: campaign.status === 'ACTIVE' ? "#22c55e" : "#f59e0b",
                                  }}
                                >
                                  {campaign.status === 'ACTIVE' ? '🟢 Actif' : '⏸️ Inactif'}
                                </span>
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "12px", color: "#71717a" }}>{campaign.objective || 'N/A'}</td>
                              <td style={{ padding: "16px 24px", fontSize: "12px", color: "#71717a" }}>
                                {campaign.daily_budget ? `${(campaign.daily_budget / 100).toFixed(2)}€/j` : campaign.lifetime_budget ? `${(campaign.lifetime_budget / 100).toFixed(2)}€ total` : 'N/A'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{campaign.id}</td>
                            </tr>
                          ))}
                          {getFilteredCampaigns().length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
                                Aucune campagne trouvée
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ADSETS TABLE */}
                {currentView === "adsets" && (
                  <>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(71,85,105,0.3)" }}>
                      <h3 style={{ margin: 0, fontSize: "14px", color: "#a5b4fc" }}>
                        📦 Adsets ({getFilteredAdsets().length})
                      </h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(30,41,59,0.4)" }}>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Nom</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Optimisation</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Budget</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAdsets().map((adset, index) => (
                            <tr
                              key={adset.id}
                              style={{
                                borderTop: index > 0 ? "1px solid rgba(71,85,105,0.2)" : "none",
                                transition: "background 0.2s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7" }}>{adset.name}</td>
                              <td style={{ padding: "16px 24px" }}>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background: adset.status === 'ACTIVE' ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                                    color: adset.status === 'ACTIVE' ? "#22c55e" : "#f59e0b",
                                  }}
                                >
                                  {adset.status === 'ACTIVE' ? '🟢 Actif' : '⏸️ Inactif'}
                                </span>
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "12px", color: "#71717a" }}>{adset.optimization_goal || 'N/A'}</td>
                              <td style={{ padding: "16px 24px", fontSize: "12px", color: "#71717a" }}>
                                {adset.daily_budget ? `${(adset.daily_budget / 100).toFixed(2)}€/j` : adset.lifetime_budget ? `${(adset.lifetime_budget / 100).toFixed(2)}€ total` : 'N/A'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{adset.id}</td>
                            </tr>
                          ))}
                          {getFilteredAdsets().length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
                                Aucun adset trouvé
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ADS TABLE */}
                {currentView === "ads" && (
                  <>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(71,85,105,0.3)" }}>
                      <h3 style={{ margin: 0, fontSize: "14px", color: "#a5b4fc" }}>
                        🎨 Ads ({getFilteredAds().length})
                      </h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(30,41,59,0.4)" }}>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Nom</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Creative</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAds().map((ad, index) => (
                            <tr
                              key={ad.id}
                              style={{
                                borderTop: index > 0 ? "1px solid rgba(71,85,105,0.2)" : "none",
                                transition: "background 0.2s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7" }}>{ad.name}</td>
                              <td style={{ padding: "16px 24px" }}>
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background: ad.status === 'ACTIVE' ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                                    color: ad.status === 'ACTIVE' ? "#22c55e" : "#f59e0b",
                                  }}
                                >
                                  {ad.status === 'ACTIVE' ? '🟢 Actif' : '⏸️ Inactif'}
                                </span>
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "12px", color: "#71717a" }}>{ad.creative?.name || ad.creative?.id || 'N/A'}</td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{ad.id}</td>
                            </tr>
                          ))}
                          {getFilteredAds().length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
                                Aucune publicité trouvée
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
