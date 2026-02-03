import { useState, useEffect, useCallback } from "react";
import { authHelpers, createMetaApi, GOOGLE_DRIVE_CONFIG } from "./config";
import CreativeImporterPro from "./CreativeImporterPro";
import MediaBuyerPro from "./MediaBuyerPro";

// TOOL Section items
const toolItems = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "📊",
    description: "Vue d'ensemble",
    status: "active",
    badge: "NEW",
    badgeColor: "#22c55e",
  },
  {
    id: "creative-importer",
    name: "Upload",
    icon: "⬆️",
    description: "Import & launch ads",
    status: "active",
    badge: "NEW",
    badgeColor: "#22c55e",
  },
  {
    id: "media-library",
    name: "Media Library",
    icon: "🖼️",
    description: "Manage creatives",
    status: "coming-soon",
    badge: "SOON",
    badgeColor: "#fb923c",
  },
  {
    id: "media-buyer",
    name: "Media Buyer",
    icon: "📈",
    description: "Optimize campaigns",
    status: "active",
    badge: "NEW",
    badgeColor: "#22c55e",
  },
  {
    id: "creative-strategist",
    name: "Creative",
    icon: "🎨",
    description: "AI creative insights",
    status: "coming-soon",
    badge: "SOON",
    badgeColor: "#fb923c",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: "📉",
    description: "Advanced analytics",
    status: "coming-soon",
    badge: "SOON",
    badgeColor: "#fb923c",
  },
  {
    id: "automation",
    name: "Automation",
    icon: "⚡",
    description: "Automate workflows",
    status: "coming-soon",
    badge: "SOON",
    badgeColor: "#fb923c",
  },
];

// COMMUNITY Section items
const communityItems = [
  {
    id: "affiliate",
    name: "Affiliate",
    icon: "👥",
    description: "Earn rewards",
    badge: "EARN $",
    badgeColor: "#22c55e",
  },
  {
    id: "discord",
    name: "Join Community",
    icon: "💬",
    description: "Discord community",
    badge: "JOIN",
    badgeColor: "#22c55e",
  },
];

// SETTINGS Section items
const settingsItems = [
  {
    id: "settings-ad-config",
    name: "Ad Configuration",
    icon: "⚙️",
    description: "Default ad settings",
  },
  {
    id: "settings-account",
    name: "Account",
    icon: "👤",
    description: "Connected accounts",
  },
  {
    id: "settings-billing",
    name: "Billing",
    icon: "💳",
    description: "Plan & usage",
  },
  {
    id: "settings-history",
    name: "History",
    icon: "📜",
    description: "Upload history",
  },
  {
    id: "settings-integrations",
    name: "Integration",
    icon: "🔗",
    description: "Connect services",
  },
];

// Combined nav items for display (legacy)
const navItems = toolItems;

export default function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Section expansion states
  const [toolExpanded, setToolExpanded] = useState(true);
  const [communityExpanded, setCommunityExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

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

  // Instagram accounts state
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [isLoadingInstagramAccounts, setIsLoadingInstagramAccounts] = useState(false);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Google Drive state
  const [googleDriveToken, setGoogleDriveToken] = useState(null);
  const [googleDriveUser, setGoogleDriveUser] = useState(null);
  const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState(false);
  const [googleDriveFolders, setGoogleDriveFolders] = useState([]);
  const [driveFolderPickerOpen, setDriveFolderPickerOpen] = useState(false);
  const [currentDrivePath, setCurrentDrivePath] = useState([{ id: 'root', name: 'Mon Drive' }]);

  // Load Google Drive token from localStorage
  useEffect(() => {
    const savedGoogleToken = localStorage.getItem('google_drive_token');
    const savedGoogleUser = localStorage.getItem('google_drive_user');
    if (savedGoogleToken) {
      setGoogleDriveToken(savedGoogleToken);
      if (savedGoogleUser) {
        setGoogleDriveUser(JSON.parse(savedGoogleUser));
      }
    }
  }, []);

  // Google Drive OAuth handler
  const handleGoogleDriveConnect = useCallback(() => {
    if (!GOOGLE_DRIVE_CONFIG.clientId) {
      alert("Google Drive n'est pas configuré. Ajoutez REACT_APP_GOOGLE_CLIENT_ID dans les variables d'environnement.");
      return;
    }

    setIsGoogleDriveLoading(true);

    // Load Google API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // eslint-disable-next-line no-undef
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: GOOGLE_DRIVE_CONFIG.scopes,
        callback: async (response) => {
          if (response.access_token) {
            setGoogleDriveToken(response.access_token);
            localStorage.setItem('google_drive_token', response.access_token);

            // Fetch user info
            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const userData = await userRes.json();
              setGoogleDriveUser(userData);
              localStorage.setItem('google_drive_user', JSON.stringify(userData));
            } catch (err) {
              console.error('Error fetching Google user:', err);
            }
          }
          setIsGoogleDriveLoading(false);
        },
        error_callback: (error) => {
          console.error('Google OAuth error:', error);
          setIsGoogleDriveLoading(false);
        }
      });
      client.requestAccessToken();
    };
    document.body.appendChild(script);
  }, []);

  // Disconnect Google Drive
  const handleGoogleDriveDisconnect = useCallback(() => {
    setGoogleDriveToken(null);
    setGoogleDriveUser(null);
    setGoogleDriveFolders([]);
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_user');
  }, []);

  // Fetch Google Drive folders
  const fetchDriveFolders = useCallback(async (folderId = 'root') => {
    if (!googleDriveToken) return;

    setIsGoogleDriveLoading(true);
    try {
      const query = folderId === 'root'
        ? "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        : `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&orderBy=name`,
        { headers: { Authorization: `Bearer ${googleDriveToken}` } }
      );

      if (!res.ok) {
        if (res.status === 401) {
          handleGoogleDriveDisconnect();
          return;
        }
        throw new Error('Failed to fetch folders');
      }

      const data = await res.json();
      setGoogleDriveFolders(data.files || []);
    } catch (err) {
      console.error('Error fetching Drive folders:', err);
    } finally {
      setIsGoogleDriveLoading(false);
    }
  }, [googleDriveToken, handleGoogleDriveDisconnect]);

  // Fetch files from a Drive folder (images and videos)
  const fetchDriveFiles = useCallback(async (folderId) => {
    if (!googleDriveToken) return [];

    try {
      const mimeTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"
      ].map(m => `mimeType='${m}'`).join(' or ');

      const query = `'${folderId}' in parents and (${mimeTypes}) and trashed=false`;

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink,webContentLink)&orderBy=name`,
        { headers: { Authorization: `Bearer ${googleDriveToken}` } }
      );

      if (!res.ok) throw new Error('Failed to fetch files');

      const data = await res.json();
      return data.files || [];
    } catch (err) {
      console.error('Error fetching Drive files:', err);
      return [];
    }
  }, [googleDriveToken]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('meta_ads_projects');
    const savedSelectedProject = localStorage.getItem('meta_ads_selected_project');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed);
      if (savedSelectedProject) {
        const project = parsed.find(p => p.id === savedSelectedProject);
        if (project) setSelectedProject(project);
      }
    }
  }, []);

  // Save projects to localStorage when changed
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('meta_ads_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Save selected project to localStorage
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('meta_ads_selected_project', selectedProject.id);
    }
  }, [selectedProject]);

  // Apply project settings when project is selected and data is loaded
  useEffect(() => {
    if (!selectedProject || adAccounts.length === 0 || pages.length === 0) return;

    // Apply ad account
    if (selectedProject.adAccountId) {
      const account = adAccounts.find(a => a.id === selectedProject.adAccountId);
      if (account && (!selectedAdAccount || selectedAdAccount.id !== account.id)) {
        setSelectedAdAccount(account);
      }
    }

    // Apply page
    if (selectedProject.pageId) {
      const page = pages.find(p => p.id === selectedProject.pageId);
      if (page && (!selectedPage || selectedPage.id !== page.id)) {
        setSelectedPage(page);
      }
    }
  }, [selectedProject, adAccounts, pages]);

  // Apply pixel when pixels are loaded and project is selected
  useEffect(() => {
    if (!selectedProject || pixels.length === 0) return;

    if (selectedProject.pixelId) {
      const pixel = pixels.find(p => p.id === selectedProject.pixelId);
      if (pixel && (!selectedPixel || selectedPixel.id !== pixel.id)) {
        setSelectedPixel(pixel);
      }
    }
  }, [selectedProject, pixels]);

  // Project management functions
  const createProject = (projectData) => {
    const newProject = {
      id: `project_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...projectData
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setShowProjectSettings(false);
    setEditingProject(null);
  };

  const updateProject = (projectId, projectData) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, ...projectData, updatedAt: new Date().toISOString() } : p
    ));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => ({ ...prev, ...projectData }));
    }
    setShowProjectSettings(false);
    setEditingProject(null);
  };

  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      localStorage.removeItem('meta_ads_selected_project');
    }
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    setProjectSelectorOpen(false);
  };

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

  // Load Instagram accounts when account is selected
  useEffect(() => {
    if (!accessToken || !selectedAdAccount) {
      setInstagramAccounts([]);
      return;
    }

    const loadInstagramAccounts = async () => {
      try {
        setIsLoadingInstagramAccounts(true);
        const api = createMetaApi(accessToken);
        let igAccounts = await api.fetchInstagramAccounts(selectedAdAccount.id);

        // If selected page has an Instagram account, try to assign it to the ad account
        if (selectedPage?.instagram_business_account?.id) {
          const pageIgId = selectedPage.instagram_business_account.id;
          const isAlreadyAssigned = igAccounts?.some(ig => ig.id === pageIgId);

          if (!isAlreadyAssigned) {
            console.log("🔄 Assigning page's Instagram account to ad account...", pageIgId);
            await api.assignInstagramAccountToAdAccount(selectedAdAccount.id, pageIgId);
            // Reload the list after assignment
            igAccounts = await api.fetchInstagramAccounts(selectedAdAccount.id);
          }
        }

        // Also try to assign PBIA if available
        const pbiaId = selectedPage?.page_backed_instagram_accounts?.data?.[0]?.id;
        if (pbiaId && !igAccounts?.some(ig => ig.id === pbiaId)) {
          console.log("🔄 Assigning PBIA to ad account...", pbiaId);
          await api.assignInstagramAccountToAdAccount(selectedAdAccount.id, pbiaId);
          igAccounts = await api.fetchInstagramAccounts(selectedAdAccount.id);
        }

        console.log("🔍 DEBUG Ad Account Instagram accounts:", {
          adAccountId: selectedAdAccount.id,
          adAccountName: selectedAdAccount.name,
          instagramAccounts: igAccounts,
        });
        setInstagramAccounts(igAccounts || []);
      } catch (error) {
        console.error("Error loading Instagram accounts:", error);
        setInstagramAccounts([]);
      } finally {
        setIsLoadingInstagramAccounts(false);
      }
    };

    loadInstagramAccounts();
  }, [accessToken, selectedAdAccount, selectedPage]);

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
    // Check in tools
    const tool = toolItems.find((n) => n.id === moduleId);
    if (tool && tool.status === "active") {
      setActiveModule(moduleId);
      return;
    }
    // Check in settings
    const setting = settingsItems.find((n) => n.id === moduleId);
    if (setting) {
      setActiveModule(moduleId);
      return;
    }
  };

  // Styles - Premium SaaS Design
  const styles = {
    // Layout
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 50%, #16213e 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      color: "#fafafa",
      display: "flex",
    },
    // Sidebar
    sidebar: {
      width: sidebarCollapsed ? "64px" : "260px",
      minHeight: "100vh",
      background: "rgba(10,10,15,0.95)",
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
    // Project selector section
    projectSection: {
      padding: sidebarCollapsed ? "12px 16px" : "12px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    projectSelectorBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: "10px 12px",
      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.15s ease",
      textAlign: "left",
    },
    projectIcon: {
      width: "32px",
      height: "32px",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: "700",
      color: "#fff",
      flexShrink: 0,
    },
    projectInfo: {
      display: sidebarCollapsed ? "none" : "block",
      flex: 1,
      minWidth: 0,
    },
    projectName: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#fafafa",
      marginBottom: "2px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    projectMeta: {
      fontSize: "11px",
      color: "#71717a",
    },
    projectDropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: "#18181b",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      zIndex: 200,
      maxHeight: "300px",
      overflow: "auto",
    },
    projectListItem: (isSelected) => ({
      padding: "10px 12px",
      cursor: "pointer",
      background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      transition: "background 0.1s ease",
    }),
    projectListItemName: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#fafafa",
      marginBottom: "2px",
    },
    projectListItemMeta: {
      fontSize: "11px",
      color: "#71717a",
    },
    projectAddBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      background: "transparent",
      color: "#818cf8",
      fontSize: "13px",
      fontWeight: "500",
      borderTop: "1px solid rgba(255,255,255,0.05)",
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
      width: "100%",
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
      // Compute Instagram ID to pass (real IG or PBIA fallback)
      const igId = selectedPage?.instagram_business_account?.id ||
        selectedPage?.page_backed_instagram_accounts?.data?.[0]?.id ||
        null;
      console.log("🔍 Passing Instagram ID to CreativeImporterPro:", {
        igId,
        pageName: selectedPage?.name,
        hasRealIG: !!selectedPage?.instagram_business_account?.id,
        hasPBIA: !!selectedPage?.page_backed_instagram_accounts?.data?.[0]?.id,
      });
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
          sharedInstagramAccountId={igId}
          usePageForInstagram={selectedProject?.usePageForInstagram ?? true}
          googleDriveToken={googleDriveToken}
          projectDriveFolderId={selectedProject?.driveFolderId}
          projectDriveFolderName={selectedProject?.driveFolderName}
          fetchDriveFiles={fetchDriveFiles}
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

    if (activeModule === "integrations" || activeModule === "settings-integrations") {
      const integrations = [
        {
          id: "meta",
          name: "Meta Ads Manager",
          description: "Your Facebook Ads account for campaigns and analytics",
          abbrev: "MA",
          color: "#1877f2",
          bgColor: "rgba(24,119,242,0.12)",
          connected: !!accessToken,
          available: true,
          user: user?.name,
        },
        {
          id: "google-drive",
          name: "Google Drive",
          description: "Import creative assets from Google Drive folders",
          abbrev: "GD",
          color: "#34a853",
          bgColor: "rgba(52,168,83,0.12)",
          connected: !!googleDriveToken,
          available: true,
          user: googleDriveUser?.email,
          onConnect: handleGoogleDriveConnect,
          onDisconnect: handleGoogleDriveDisconnect,
          loading: isGoogleDriveLoading,
        },
        {
          id: "dropbox",
          name: "Dropbox",
          description: "Import creative assets from Dropbox",
          abbrev: "DB",
          color: "#0061fe",
          bgColor: "rgba(0,97,254,0.12)",
          connected: false,
          available: false,
        },
        {
          id: "frame-io",
          name: "Frame.io",
          description: "Import video assets from Frame.io projects",
          abbrev: "FR",
          color: "#8b5cf6",
          bgColor: "rgba(139,92,246,0.12)",
          connected: false,
          available: false,
        },
        {
          id: "slack",
          name: "Slack",
          description: "Receive upload notifications in Slack channels",
          abbrev: "SL",
          color: "#e01e5a",
          bgColor: "rgba(224,30,90,0.12)",
          connected: false,
          available: false,
        },
        {
          id: "discord",
          name: "Discord",
          description: "Receive upload notifications in Discord channels",
          abbrev: "DC",
          color: "#5865f2",
          bgColor: "rgba(88,101,242,0.12)",
          connected: false,
          available: false,
        },
      ];

      return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fafafa", margin: "0 0 8px" }}>
              Intégrations
            </h1>
            <p style={{ fontSize: "14px", color: "#71717a", margin: 0 }}>
              Connectez vos outils et services pour optimiser votre workflow
            </p>
          </div>

          {/* Available integrations */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#a5b4fc", marginBottom: "16px" }}>
              Disponibles
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "20px",
            }}>
              {integrations.filter(i => i.available).map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    padding: "24px",
                    background: integration.connected ? "rgba(34,197,94,0.05)" : "rgba(15,15,20,0.6)",
                    border: integration.connected ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      background: integration.bgColor,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: integration.color,
                      flexShrink: 0,
                    }}>
                      {integration.abbrev}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fafafa", margin: "0 0 4px" }}>
                        {integration.name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "#71717a", margin: 0, lineHeight: "1.5" }}>
                        {integration.description}
                      </p>
                      {integration.connected && integration.user && (
                        <p style={{ fontSize: "12px", color: "#22c55e", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%" }}></span>
                          Connecté: {integration.user}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    {integration.connected ? (
                      <>
                        <span style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.2)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#22c55e",
                        }}>
                          <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%" }}></span>
                          Connecté
                        </span>
                        {integration.onDisconnect && (
                          <button
                            onClick={integration.onDisconnect}
                            style={{
                              padding: "6px 12px",
                              background: "transparent",
                              border: "1px solid rgba(239,68,68,0.3)",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#ef4444",
                              cursor: "pointer",
                            }}
                          >
                            Déconnecter
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={integration.onConnect}
                        disabled={integration.loading}
                        style={{
                          padding: "8px 16px",
                          background: integration.loading ? "rgba(255,255,255,0.05)" : `${integration.color}20`,
                          border: `1px solid ${integration.color}40`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: integration.color,
                          cursor: integration.loading ? "wait" : "pointer",
                          transition: "all 0.15s ease",
                          opacity: integration.loading ? 0.7 : 1,
                        }}
                      >
                        {integration.loading ? "Connexion..." : "Connecter"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming soon integrations */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#71717a", marginBottom: "16px" }}>
              Bientôt disponibles
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "20px",
            }}>
              {integrations.filter(i => !i.available).map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    padding: "24px",
                    background: "rgba(15,15,20,0.4)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "12px",
                    opacity: 0.7,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      background: integration.bgColor,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: integration.color,
                      flexShrink: 0,
                      filter: "grayscale(30%)",
                    }}>
                      {integration.abbrev}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#a1a1aa", margin: "0 0 4px" }}>
                        {integration.name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "#52525b", margin: 0, lineHeight: "1.5" }}>
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{
                      padding: "6px 12px",
                      background: "rgba(251,146,60,0.1)",
                      border: "1px solid rgba(251,146,60,0.2)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#fb923c",
                    }}>
                      SOON
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                {item.id === "integrations" &&
                  "Connectez vos outils préférés : Google Drive, Dropbox, Frame.io, Discord, Slack et plus encore."}
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
              <p style={styles.logoSubtitle}>
                by <span style={{
                  background: "linear-gradient(135deg, #ec4899, #d946ef)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  color: "#fff",
                  fontWeight: "600",
                }}>A New Growth</span>
              </p>
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

        {/* Project Selector - AdManage.ai style */}
        {user && (
          <div style={{
            padding: sidebarCollapsed ? "8px" : "12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ position: "relative" }}>
              {/* Current Project Button */}
              <button
                style={{
                  width: "100%",
                  padding: sidebarCollapsed ? "10px 8px" : "12px",
                  background: selectedProject ? "rgba(99,102,241,0.1)" : "transparent",
                  border: selectedProject ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  color: "#fafafa",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  setProjectSelectorOpen(!projectSelectorOpen);
                  setAccountSelectorOpen(false);
                  setPageSelectorOpen(false);
                  setPixelSelectorOpen(false);
                }}
                onMouseOver={(e) => e.currentTarget.style.background = selectedProject ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)"}
                onMouseOut={(e) => e.currentTarget.style.background = selectedProject ? "rgba(99,102,241,0.1)" : "transparent"}
              >
                <div style={{
                  width: sidebarCollapsed ? "32px" : "40px",
                  height: sidebarCollapsed ? "32px" : "40px",
                  background: selectedProject
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: sidebarCollapsed ? "11px" : "13px",
                  fontWeight: "700",
                  color: "#fff",
                  flexShrink: 0,
                }}>
                  {selectedProject ? selectedProject.name.substring(0, 2).toUpperCase() : "+"}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>
                        {selectedProject ? selectedProject.name : "Nouveau projet"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#71717a" }}>
                        {selectedProject
                          ? `${projects.length} projet${projects.length > 1 ? 's' : ''}`
                          : "Cliquez pour créer"}
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", color: "#71717a" }}>
                      {projectSelectorOpen ? "▲" : "▼"}
                    </span>
                  </>
                )}
              </button>

              {/* Project Dropdown */}
              {projectSelectorOpen && !sidebarCollapsed && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  background: "#1f1f23",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  zIndex: 100,
                  maxHeight: "300px",
                  overflow: "auto",
                }}>
                  {/* Project List - Simple */}
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: selectedProject?.id === project.id
                          ? "rgba(99,102,241,0.15)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderLeft: selectedProject?.id === project.id
                          ? "3px solid #6366f1"
                          : "3px solid transparent",
                      }}
                      onClick={() => selectProject(project)}
                      onMouseOver={(e) => {
                        if (selectedProject?.id !== project.id) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedProject?.id !== project.id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{
                        fontSize: "13px",
                        fontWeight: selectedProject?.id === project.id ? "600" : "500",
                        color: selectedProject?.id === project.id ? "#fafafa" : "#a1a1aa",
                      }}>
                        {project.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setShowProjectSettings(true);
                          setProjectSelectorOpen(false);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#52525b",
                          cursor: "pointer",
                          padding: "4px",
                          fontSize: "10px",
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = "#fafafa"}
                        onMouseOut={(e) => e.currentTarget.style.color = "#52525b"}
                      >
                        ✏️
                      </button>
                    </div>
                  ))}

                  {/* Create Project Button */}
                  <div
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#22c55e",
                    }}
                    onClick={() => {
                      setEditingProject(null);
                      setShowProjectSettings(true);
                      setProjectSelectorOpen(false);
                    }}
                  >
                    <span>+</span>
                    <span>Créer un projet</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account, Page, Pixel Selectors - Now moved to Project Settings */}

        {/* Navigation with Collapsible Sections */}
        <nav style={styles.nav}>
          {/* Home Button */}
          {!sidebarCollapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                background: activeModule === null ? "rgba(99,102,241,0.15)" : "transparent",
                border: activeModule === null ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
              onClick={() => setActiveModule(null)}
              onMouseOver={(e) => {
                if (activeModule !== null) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseOut={(e) => {
                if (activeModule !== null) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "18px" }}>🏠</span>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#fafafa" }}>Home</span>
            </div>
          )}

          {/* TOOL Section */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
              onClick={() => setToolExpanded(!toolExpanded)}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px" }}>🛠️</span>
                {!sidebarCollapsed && (
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    TOOL
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span style={{ fontSize: "10px", color: "#52525b" }}>{toolExpanded ? "▲" : "▼"}</span>
              )}
            </div>
            {toolExpanded && (
              <div style={{ paddingLeft: sidebarCollapsed ? "0" : "8px" }}>
                {toolItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                      marginBottom: "2px",
                      borderRadius: "8px",
                      cursor: item.status === "active" ? "pointer" : "default",
                      background: activeModule === item.id ? "rgba(99,102,241,0.15)" : "transparent",
                      opacity: item.status === "coming-soon" ? 0.6 : 1,
                    }}
                    onClick={() => item.status === "active" && handleModuleSelect(item.id)}
                    onMouseOver={(e) => {
                      if (item.status === "active" && activeModule !== item.id) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeModule !== item.id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: "#e4e4e7" }}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "9px",
                            fontWeight: "700",
                            background: `${item.badgeColor}20`,
                            color: item.badgeColor,
                            textTransform: "uppercase",
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMMUNITY Section */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
              onClick={() => setCommunityExpanded(!communityExpanded)}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px" }}>🌐</span>
                {!sidebarCollapsed && (
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    COMMUNITY
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span style={{ fontSize: "10px", color: "#52525b" }}>{communityExpanded ? "▲" : "▼"}</span>
              )}
            </div>
            {communityExpanded && (
              <div style={{ paddingLeft: sidebarCollapsed ? "0" : "8px" }}>
                {communityItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                      marginBottom: "2px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: "#e4e4e7" }}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "9px",
                            fontWeight: "700",
                            background: `${item.badgeColor}20`,
                            color: item.badgeColor,
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SETTINGS Section */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                cursor: "pointer",
                borderRadius: "6px",
              }}
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px" }}>⚙️</span>
                {!sidebarCollapsed && (
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    SETTINGS
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span style={{ fontSize: "10px", color: "#52525b" }}>{settingsExpanded ? "▲" : "▼"}</span>
              )}
            </div>
            {settingsExpanded && (
              <div style={{ paddingLeft: sidebarCollapsed ? "0" : "8px" }}>
                {settingsItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: sidebarCollapsed ? "10px 8px" : "10px 12px",
                      marginBottom: "2px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: activeModule === item.id ? "rgba(99,102,241,0.15)" : "transparent",
                    }}
                    onClick={() => handleModuleSelect(item.id)}
                    onMouseOver={(e) => {
                      if (activeModule !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseOut={(e) => {
                      if (activeModule !== item.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span style={{ fontSize: "13px", fontWeight: "500", color: "#e4e4e7" }}>
                        {item.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          {!sidebarCollapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                marginTop: "auto",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: "16px" }}>💬</span>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#71717a" }}>Feedback</span>
            </div>
          )}
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

      {/* Project Settings Modal */}
      {showProjectSettings && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflow: "auto",
          }}>
            <h2 style={{
              margin: "0 0 20px",
              fontSize: "18px",
              fontWeight: "600",
              color: "#fafafa",
            }}>
              {editingProject ? "Modifier le projet" : "Nouveau projet"}
            </h2>

            <ProjectSettingsForm
              project={editingProject}
              adAccounts={adAccounts}
              pages={pages}
              pixels={pixels}
              instagramAccounts={instagramAccounts}
              selectedAdAccount={selectedAdAccount}
              accessToken={accessToken}
              googleDriveToken={googleDriveToken}
              googleDriveUser={googleDriveUser}
              fetchDriveFolders={fetchDriveFolders}
              googleDriveFolders={googleDriveFolders}
              isGoogleDriveLoading={isGoogleDriveLoading}
              onSave={(data) => {
                if (editingProject) {
                  updateProject(editingProject.id, data);
                } else {
                  createProject(data);
                }
              }}
              onDelete={editingProject ? () => {
                if (window.confirm("Supprimer ce projet ?")) {
                  deleteProject(editingProject.id);
                  setShowProjectSettings(false);
                  setEditingProject(null);
                }
              } : null}
              onCancel={() => {
                setShowProjectSettings(false);
                setEditingProject(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Project Settings Form Component
function ProjectSettingsForm({ project, adAccounts, pages, pixels, instagramAccounts, selectedAdAccount, accessToken, googleDriveToken, googleDriveUser, fetchDriveFolders, googleDriveFolders, isGoogleDriveLoading, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(project?.name || "");
  const [adAccountId, setAdAccountId] = useState(project?.adAccountId || selectedAdAccount?.id || "");
  const [pageId, setPageId] = useState(project?.pageId || "");
  const [instagramAccountId, setInstagramAccountId] = useState(project?.instagramAccountId || "");
  const [usePageForInstagram, setUsePageForInstagram] = useState(project?.usePageForInstagram ?? true);
  const [pixelId, setPixelId] = useState(project?.pixelId || "");

  // Google Drive folder selection
  const [driveFolderId, setDriveFolderId] = useState(project?.driveFolderId || "");
  const [driveFolderName, setDriveFolderName] = useState(project?.driveFolderName || "");
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [drivePath, setDrivePath] = useState([{ id: 'root', name: 'Mon Drive' }]);

  const selectedPage = pages.find(p => p.id === pageId);

  // Get Instagram from page (via instagram_business_account)
  const pageInstagramAccount = selectedPage?.instagram_business_account;
  // Find matching Instagram account in ad account's instagram_accounts list
  // This is CRITICAL: we must use the ID from the ad account's list, not from the page
  const matchingAdAccountInstagram = instagramAccounts?.find(ig =>
    ig.id === pageInstagramAccount?.id ||
    ig.username?.toLowerCase() === pageInstagramAccount?.username?.toLowerCase()
  );
  const selectedInstagramAccount = instagramAccounts?.find(ig => ig.id === instagramAccountId);

  // Get Page-Backed Instagram Account (PBIA) - used when no real IG account is linked
  const pageBackedInstagramAccount = selectedPage?.page_backed_instagram_accounts?.data?.[0];

  // DEBUG: Log Instagram matching
  console.log("🔍 DEBUG Instagram matching:", {
    pageInstagramAccount,
    instagramAccounts,
    matchingAdAccountInstagram,
    selectedInstagramAccount,
  });

  // ONLY use Instagram from ad account's list - page's instagram_business_account ID doesn't work for ads!
  const effectiveInstagramAccount = matchingAdAccountInstagram || selectedInstagramAccount || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Le nom du projet est requis");
      return;
    }

    const selectedAcc = adAccounts.find(a => a.id === adAccountId);
    const selectedPg = pages.find(p => p.id === pageId);
    const selectedPx = pixels.find(p => p.id === pixelId);

    onSave({
      name: name.trim(),
      adAccountId,
      adAccountName: selectedAcc?.name || "",
      pageId,
      pageName: selectedPg?.name || "",
      instagramAccountId: effectiveInstagramAccount?.id || instagramAccountId || null,
      instagramAccountName: effectiveInstagramAccount?.username || "",
      usePageForInstagram,
      pixelId,
      pixelName: selectedPx?.name || "",
      driveFolderId,
      driveFolderName,
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "#27272a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: "#fafafa",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#a1a1aa",
  };

  const fieldStyle = {
    marginBottom: "16px",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Nom du projet *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Neoweed, Client ABC..."
          style={inputStyle}
          autoFocus
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Compte Publicitaire</label>
        <select
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">-- Sélectionner --</option>
          {adAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Page Facebook</label>
        <select
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">-- Sélectionner --</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Compte Instagram</label>
        {pageInstagramAccount ? (
          <div style={{
            padding: "10px 12px",
            background: "#27272a",
            borderRadius: "6px",
            color: "#fafafa",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#e879f9" }}>@{pageInstagramAccount.username}</span>
            <span style={{ color: "#22c55e", fontSize: "11px" }}>✓ Lié à la page</span>
          </div>
        ) : (
          <>
            <select
              value={instagramAccountId}
              onChange={(e) => setInstagramAccountId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">-- Utiliser la Page Facebook --</option>
              {instagramAccounts?.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  @{ig.username}
                </option>
              ))}
            </select>
            {(!instagramAccounts || instagramAccounts.length === 0) && pageId && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#71717a" }}>
                Aucun compte Instagram lié à cette page
              </p>
            )}
          </>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Pixel</label>
        <select
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">-- Sélectionner --</option>
          {pixels.map((pixel) => (
            <option key={pixel.id} value={pixel.id}>
              {pixel.name}
            </option>
          ))}
        </select>
        {pixels.length === 0 && adAccountId && (
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#71717a" }}>
            Sélectionnez un compte pub pour voir les pixels
          </p>
        )}
      </div>

      {/* Integrations Section */}
      <div style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}>
        <label style={{ ...labelStyle, fontSize: "14px", fontWeight: "600", color: "#fafafa" }}>
          Intégrations
        </label>
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Google Drive */}
          <div style={{
            padding: "12px",
            background: googleDriveToken ? "rgba(52,168,83,0.1)" : "#27272a",
            border: googleDriveToken ? "1px solid rgba(52,168,83,0.2)" : "1px solid transparent",
            borderRadius: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: driveFolderId ? "12px" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>📁</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "#fafafa" }}>Google Drive</div>
                  <div style={{ fontSize: "11px", color: googleDriveToken ? "#34a853" : "#71717a" }}>
                    {googleDriveToken ? `Connecté: ${googleDriveUser?.email || ""}` : "Non connecté"}
                  </div>
                </div>
              </div>
              {googleDriveToken ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowDrivePicker(true);
                    fetchDriveFolders('root');
                    setDrivePath([{ id: 'root', name: 'Mon Drive' }]);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(52,168,83,0.2)",
                    border: "1px solid rgba(52,168,83,0.3)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#34a853",
                    cursor: "pointer",
                  }}
                >
                  {driveFolderId ? "Changer de dossier" : "Sélectionner un dossier"}
                </button>
              ) : (
                <span style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "600",
                  background: "rgba(113,113,122,0.2)",
                  color: "#71717a",
                }}>
                  Connectez Drive dans Intégrations
                </span>
              )}
            </div>

            {/* Selected folder display */}
            {driveFolderId && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "rgba(52,168,83,0.15)",
                borderRadius: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>📂</span>
                  <span style={{ fontSize: "12px", color: "#fafafa" }}>{driveFolderName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDriveFolderId("");
                    setDriveFolderName("");
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "transparent",
                    border: "none",
                    fontSize: "11px",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  ✕ Retirer
                </button>
              </div>
            )}

            {/* Drive folder picker modal */}
            {showDrivePicker && (
              <div style={{
                marginTop: "12px",
                padding: "12px",
                background: "#1f1f23",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {/* Breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {drivePath.map((item, index) => (
                    <span key={item.id} style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const newPath = drivePath.slice(0, index + 1);
                          setDrivePath(newPath);
                          fetchDriveFolders(item.id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: index === drivePath.length - 1 ? "#fafafa" : "#71717a",
                          fontSize: "12px",
                          cursor: "pointer",
                          padding: "2px 4px",
                        }}
                      >
                        {item.name}
                      </button>
                      {index < drivePath.length - 1 && <span style={{ color: "#52525b", fontSize: "12px" }}>/</span>}
                    </span>
                  ))}
                </div>

                {/* Folder list */}
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {isGoogleDriveLoading ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#71717a", fontSize: "12px" }}>
                      Chargement...
                    </div>
                  ) : googleDriveFolders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#71717a", fontSize: "12px" }}>
                      Aucun sous-dossier
                    </div>
                  ) : (
                    googleDriveFolders.map(folder => (
                      <div
                        key={folder.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          marginBottom: "4px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setDrivePath([...drivePath, { id: folder.id, name: folder.name }]);
                          fetchDriveFolders(folder.id);
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px" }}>📁</span>
                          <span style={{ fontSize: "12px", color: "#fafafa" }}>{folder.name}</span>
                        </div>
                        <span style={{ color: "#52525b", fontSize: "12px" }}>→</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const currentFolder = drivePath[drivePath.length - 1];
                      setDriveFolderId(currentFolder.id);
                      setDriveFolderName(drivePath.map(p => p.name).join(' / '));
                      setShowDrivePicker(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "linear-gradient(135deg, #34a853, #2d8f47)",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Sélectionner ce dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDrivePicker(false)}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#71717a",
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dropbox */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: "#27272a",
            borderRadius: "8px",
            opacity: 0.6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📦</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#fafafa" }}>Dropbox</div>
                <div style={{ fontSize: "11px", color: "#71717a" }}>Import automatique</div>
              </div>
            </div>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "600",
              background: "rgba(251,146,60,0.2)",
              color: "#fb923c",
            }}>
              SOON
            </span>
          </div>

          {/* Slack */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: "#27272a",
            borderRadius: "8px",
            opacity: 0.6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#fafafa" }}>Slack</div>
                <div style={{ fontSize: "11px", color: "#71717a" }}>Notifications</div>
              </div>
            </div>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: "600",
              background: "rgba(251,146,60,0.2)",
              color: "#fb923c",
            }}>
              SOON
            </span>
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "24px",
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            color: "#a1a1aa",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: "10px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "6px",
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        )}
        <button
          type="submit"
          style={{
            flex: 1,
            padding: "10px 16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          {project ? "Enregistrer" : "Créer le projet"}
        </button>
      </div>
    </form>
  );
}
