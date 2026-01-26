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

  // Sort states
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"

  // Optimization mode states
  const [optimizationMode, setOptimizationMode] = useState("manual"); // "manual" | "auto"
  const [roasBreakeven, setRoasBreakeven] = useState(1.5);
  const [roasTarget, setRoasTarget] = useState(3.0);
  const [maxDailyBudget, setMaxDailyBudget] = useState(1000);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Action cooldown - Track recent actions (24h cooldown)
  const [actionCooldowns, setActionCooldowns] = useState(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem('mediaBuyerActionCooldowns');
    return stored ? JSON.parse(stored) : {};
  });

  // Save cooldowns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mediaBuyerActionCooldowns', JSON.stringify(actionCooldowns));
  }, [actionCooldowns]);

  // SOP ABO - Paliers de scaling
  const SCALING_TIERS = [30, 50, 70, 90, 120, 150, 210, 270, 330, 390, 450, 550, 650, 750];

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

      const insightFields = 'spend,actions,action_values,cost_per_action_type,purchase_roas';

      // Calculate date ranges for 4 and 7 days
      const today = new Date();
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(today.getDate() - 3); // 4 days including today
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6); // 7 days including today

      const formatDate = (date) => date.toISOString().split('T')[0];
      const timeRange4d = `{"since":"${formatDate(fourDaysAgo)}","until":"${formatDate(today)}"}`;
      const timeRange7d = `{"since":"${formatDate(sevenDaysAgo)}","until":"${formatDate(today)}"}`;

      // Load campaigns with insights (7 days period by default)
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/campaigns?fields=${fields.campaigns},insights.date_preset(last_7d){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const campaignsData = await campaignsResponse.json();

      // Load campaigns insights for 4 days
      const campaigns4dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/campaigns?fields=id,insights.time_range(${timeRange4d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const campaigns4dData = await campaigns4dResponse.json();

      // Load campaigns insights for 7 days
      const campaigns7dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/campaigns?fields=id,insights.time_range(${timeRange7d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const campaigns7dData = await campaigns7dResponse.json();

      // Merge campaign data
      if (campaignsData.data) {
        const campaignsWithMetrics = campaignsData.data.map(campaign => {
          const campaign4d = campaigns4dData.data?.find(c => c.id === campaign.id);
          const campaign7d = campaigns7dData.data?.find(c => c.id === campaign.id);
          return {
            ...campaign,
            insights: campaign.insights?.data?.[0] || null,
            insights_4d: campaign4d?.insights?.data?.[0] || null,
            insights_7d: campaign7d?.insights?.data?.[0] || null
          };
        });
        setCampaigns(campaignsWithMetrics);
      }

      // Load adsets with insights (7 days period by default)
      const adsetsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/adsets?fields=${fields.adsets},insights.date_preset(last_7d){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const adsetsData = await adsetsResponse.json();

      // Load adsets insights for 4 days
      const adsets4dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/adsets?fields=id,insights.time_range(${timeRange4d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const adsets4dData = await adsets4dResponse.json();

      // Load adsets insights for 7 days
      const adsets7dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/adsets?fields=id,insights.time_range(${timeRange7d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const adsets7dData = await adsets7dResponse.json();

      // Merge adset data
      if (adsetsData.data) {
        const adsetsWithMetrics = adsetsData.data.map(adset => {
          const adset4d = adsets4dData.data?.find(a => a.id === adset.id);
          const adset7d = adsets7dData.data?.find(a => a.id === adset.id);
          return {
            ...adset,
            insights: adset.insights?.data?.[0] || null,
            insights_4d: adset4d?.insights?.data?.[0] || null,
            insights_7d: adset7d?.insights?.data?.[0] || null
          };
        });
        setAdsets(adsetsWithMetrics);
      }

      // Load ads with insights (7 days period by default)
      const adsResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/ads?fields=${fields.ads},insights.date_preset(last_7d){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const adsData = await adsResponse.json();

      // Load ads insights for 4 days
      const ads4dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/ads?fields=id,insights.time_range(${timeRange4d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const ads4dData = await ads4dResponse.json();

      // Load ads insights for 7 days
      const ads7dResponse = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${selectedAccount.id}/ads?fields=id,insights.time_range(${timeRange7d}){${insightFields}}&limit=100&access_token=${accessToken}`
      );
      const ads7dData = await ads7dResponse.json();

      // Merge ad data
      if (adsData.data) {
        const adsWithMetrics = adsData.data.map(ad => {
          const ad4d = ads4dData.data?.find(a => a.id === ad.id);
          const ad7d = ads7dData.data?.find(a => a.id === ad.id);
          return {
            ...ad,
            insights: ad.insights?.data?.[0] || null,
            insights_4d: ad4d?.insights?.data?.[0] || null,
            insights_7d: ad7d?.insights?.data?.[0] || null
          };
        });
        setAds(adsWithMetrics);
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

  // Helper functions to extract metrics from insights
  const getSpend = (insights) => {
    if (!insights || !insights.spend) return 0;
    return parseFloat(insights.spend);
  };

  const getResults = (insights, objective) => {
    if (!insights || !insights.actions) return 0;

    // Map objectives to action types
    const actionTypeMap = {
      'OUTCOME_SALES': 'purchase',
      'OUTCOME_LEADS': 'lead',
      'LINK_CLICKS': 'link_click',
      'OUTCOME_TRAFFIC': 'landing_page_view',
      'POST_ENGAGEMENT': 'post_engagement',
    };

    const actionType = actionTypeMap[objective] || 'purchase';
    const action = insights.actions?.find(a => a.action_type === actionType);
    return action ? parseInt(action.value) : 0;
  };

  const getCPA = (insights, objective) => {
    if (!insights || !insights.cost_per_action_type) return 0;

    const actionTypeMap = {
      'OUTCOME_SALES': 'purchase',
      'OUTCOME_LEADS': 'lead',
      'LINK_CLICKS': 'link_click',
      'OUTCOME_TRAFFIC': 'landing_page_view',
      'POST_ENGAGEMENT': 'post_engagement',
    };

    const actionType = actionTypeMap[objective] || 'purchase';
    const cpa = insights.cost_per_action_type?.find(c => c.action_type === actionType);
    return cpa ? parseFloat(cpa.value) : 0;
  };

  const getROAS = (insights) => {
    if (!insights) return 0;

    // Try purchase_roas first
    if (insights.purchase_roas && insights.purchase_roas.length > 0) {
      return parseFloat(insights.purchase_roas[0].value);
    }

    // Calculate from action_values if available
    const spend = parseFloat(insights.spend || 0);
    if (spend === 0) return 0;

    const purchaseValue = insights.action_values?.find(av => av.action_type === 'purchase');
    if (purchaseValue) {
      const revenue = parseFloat(purchaseValue.value);
      return revenue / spend;
    }

    return 0;
  };

  // Get ATC (Add to Cart) count from insights
  const getATC = (insights) => {
    if (!insights || !insights.actions) return 0;
    const atcAction = insights.actions?.find(a => a.action_type === 'add_to_cart');
    return atcAction ? parseInt(atcAction.value) : 0;
  };

  // Get next tier for scaling
  const getNextTier = (currentBudget) => {
    const budgetInEuros = currentBudget / 100;
    for (let tier of SCALING_TIERS) {
      if (tier > budgetInEuros) return tier;
    }
    return budgetInEuros + 100; // Continue scaling if beyond tiers
  };

  // Get previous tier for descaling
  const getPrevTier = (currentBudget) => {
    const budgetInEuros = currentBudget / 100;
    for (let i = SCALING_TIERS.length - 1; i >= 0; i--) {
      if (SCALING_TIERS[i] < budgetInEuros) return SCALING_TIERS[i];
    }
    return 30; // Minimum tier
  };

  // Get spend for 3 days (today included)
  const getSpend3d = (item) => {
    // We need to calculate 3 days from insights_4d data
    // For now, we'll use a proportion: spend_3d ≈ spend_4d * (3/4)
    // A more accurate way would be to fetch specific 3-day insights
    if (!item.insights_4d) return 0;
    const spend4d = getSpend(item.insights_4d);
    // Rough estimate: 3 days is about 75% of 4 days
    return spend4d * 0.75;
  };

  // Action cooldown functions (24h cooldown)
  const COOLDOWN_HOURS = 24;

  const isOnCooldown = (itemId) => {
    if (!actionCooldowns[itemId]) return false;
    const lastActionTime = actionCooldowns[itemId];
    const now = Date.now();
    const hoursPassed = (now - lastActionTime) / (1000 * 60 * 60);
    return hoursPassed < COOLDOWN_HOURS;
  };

  const getRemainingCooldown = (itemId) => {
    if (!actionCooldowns[itemId]) return 0;
    const lastActionTime = actionCooldowns[itemId];
    const now = Date.now();
    const hoursPassed = (now - lastActionTime) / (1000 * 60 * 60);
    const remaining = COOLDOWN_HOURS - hoursPassed;
    return remaining > 0 ? remaining : 0;
  };

  const recordAction = (itemId) => {
    setActionCooldowns(prev => ({
      ...prev,
      [itemId]: Date.now()
    }));
  };

  const formatCooldownTime = (hours) => {
    if (hours >= 1) {
      return `${Math.floor(hours)}h${Math.floor((hours % 1) * 60)}m`;
    }
    return `${Math.floor(hours * 60)}m`;
  };

  // Optimization functions based on SOP ABO
  const getRecommendation = (item, insights_4d, insights_7d, itemType, parentCampaign = null) => {
    const budget = (item.daily_budget || 0) / 100;

    // Check if recommendations should be shown based on budget type
    if (itemType === 'campaign') {
      // Pour les campagnes : recommandations seulement si CBO (campagne a un budget)
      if (!item.daily_budget) {
        return { action: 'none', reason: 'ABO - Pas de budget campagne', color: '#71717a' };
      }
    } else if (itemType === 'adset') {
      // Pour les adsets : recommandations seulement si ABO (adset a un budget ET campagne n'a PAS de budget)
      if (!item.daily_budget) {
        return { action: 'none', reason: 'Pas de budget adset', color: '#71717a' };
      }
      if (parentCampaign && parentCampaign.daily_budget) {
        return { action: 'none', reason: 'CBO - Budget au niveau campagne', color: '#71717a' };
      }
    }

    const roas4d = getROAS(insights_4d);
    const roas7d = getROAS(insights_7d);
    const spend4d = getSpend(insights_4d);
    const spend7d = getSpend(insights_7d);
    const atc4d = getATC(insights_4d);

    // ATTENTION : On ne touche pas au budget tant qu'il n'y a pas minimum 90€ de dépenses
    if (spend4d < 90) {
      return { action: 'wait', reason: `Attendre 90€ de dépenses (actuellement ${spend4d.toFixed(2)}€)`, color: '#71717a' };
    }

    // Critères d'ajustement après testing
    // Budget à 30 € et ROAS < ROAS BE → On cut
    if (budget <= 30 && roas4d < roasBreakeven) {
      return { action: 'cut', reason: `Budget à 30€ et ROAS 4j (${roas4d.toFixed(2)}) < Breakeven`, color: '#ef4444' };
    }

    // Budget à 30 € et ROAS entre ROAS BE et ROAS target → On laisse tourner
    if (budget <= 30 && roas4d >= roasBreakeven && roas4d < roasTarget) {
      return { action: 'hold', reason: `Budget à 30€, ROAS entre Breakeven et Target`, color: '#f59e0b' };
    }

    // ROAS ≤ ROAS BE → On descale
    if (roas4d <= roasBreakeven) {
      return { action: 'descale', reason: `ROAS 4j (${roas4d.toFixed(2)}) ≤ Breakeven (${roasBreakeven})`, color: '#ef4444' };
    }

    // ROAS dans la range ROAS target → Ne pas ajuster le budget
    if (roas4d >= roasTarget && roas4d < roasTarget + 0.10) {
      return { action: 'hold', reason: `ROAS 4j (${roas4d.toFixed(2)}) dans la range Target`, color: '#22c55e' };
    }

    // ROAS > ROAS target de 0,10 point → On scale
    if (roas4d >= roasTarget + 0.10) {
      if (roas4d > 4) {
        return { action: 'scale_jump', reason: `ROAS 4j (${roas4d.toFixed(2)}) > 4 → Sauter un palier`, color: '#10b981' };
      }
      return { action: 'scale', reason: `ROAS 4j (${roas4d.toFixed(2)}) > Target + 0.10`, color: '#22c55e' };
    }

    // ROAS > ROAS BE → On laisse tourner
    if (roas4d > roasBreakeven) {
      return { action: 'hold', reason: `ROAS 4j (${roas4d.toFixed(2)}) > Breakeven`, color: '#22c55e' };
    }

    return { action: 'none', reason: 'Pas de données suffisantes', color: '#71717a' };
  };

  const updateBudget = async (itemType, itemId, currentBudget, action) => {
    // Check cooldown
    if (isOnCooldown(itemId)) {
      const remaining = getRemainingCooldown(itemId);
      alert(`⏳ Action déjà prise sur cet élément. Prochaine action possible dans ${formatCooldownTime(remaining)}`);
      return { success: false, error: 'Cooldown actif' };
    }

    try {
      let newBudget = currentBudget;

      if (action === 'scale') {
        // Scale to next tier
        const nextTier = getNextTier(currentBudget);
        newBudget = Math.min(nextTier * 100, maxDailyBudget * 100);
      } else if (action === 'scale_jump') {
        // Skip a tier when ROAS > 4
        const nextTier = getNextTier(currentBudget);
        const tierIndex = SCALING_TIERS.indexOf(nextTier);
        const jumpTier = tierIndex < SCALING_TIERS.length - 1 ? SCALING_TIERS[tierIndex + 1] : nextTier + 100;
        newBudget = Math.min(jumpTier * 100, maxDailyBudget * 100);
      } else if (action === 'descale') {
        // Descale to previous tier
        const prevTier = getPrevTier(currentBudget);
        newBudget = prevTier * 100;
      }

      newBudget = Math.round(newBudget);

      // Update via Meta API
      const endpoint = itemType === 'campaign' ? 'campaigns' : 'adsets';
      const response = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${itemId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            daily_budget: newBudget,
            access_token: accessToken
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update budget');
      }

      console.log(`✅ Budget updated for ${itemType} ${itemId}: ${currentBudget/100}€ → ${newBudget/100}€`);

      // Record action for cooldown
      recordAction(itemId);

      // Reload data to reflect changes
      await loadData();

      return { success: true, newBudget };
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      return { success: false, error: error.message };
    }
  };

  const pauseItem = async (itemType, itemId) => {
    // Check cooldown
    if (isOnCooldown(itemId)) {
      const remaining = getRemainingCooldown(itemId);
      alert(`⏳ Action déjà prise sur cet élément. Prochaine action possible dans ${formatCooldownTime(remaining)}`);
      return { success: false, error: 'Cooldown actif' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${META_APP.apiVersion}/${itemId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PAUSED',
            access_token: accessToken
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to pause item');
      }

      console.log(`✅ ${itemType} ${itemId} paused`);

      // Record action for cooldown
      recordAction(itemId);

      // Reload data to reflect changes
      await loadData();

      return { success: true };
    } catch (error) {
      console.error('❌ Error pausing item:', error);
      return { success: false, error: error.message };
    }
  };

  const runAutoOptimization = async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    try {
      console.log('🤖 Starting automatic optimization...');

      // Optimize campaigns
      for (const campaign of campaigns) {
        if (!campaign.daily_budget || campaign.status !== 'ACTIVE') continue;

        const rec = getRecommendation(campaign, campaign.insights_4d, campaign.insights_7d, 'campaign');

        if (rec.action === 'scale' || rec.action === 'scale_jump') {
          console.log(`🚀 Scaling campaign ${campaign.name}`);
          await updateBudget('campaign', campaign.id, campaign.daily_budget, 'scale');
        } else if (rec.action === 'descale') {
          console.log(`🔻 Descaling campaign ${campaign.name}`);
          await updateBudget('campaign', campaign.id, campaign.daily_budget, 'descale');
        }
      }

      // Optimize adsets
      for (const adset of adsets) {
        if (!adset.daily_budget || adset.status !== 'ACTIVE') continue;

        const parentCampaign = campaigns.find(c => c.id === adset.campaign_id);
        const rec = getRecommendation(adset, adset.insights_4d, adset.insights_7d, 'adset', parentCampaign);

        if (rec.action === 'scale' || rec.action === 'scale_jump') {
          console.log(`🚀 Scaling adset ${adset.name}`);
          await updateBudget('adset', adset.id, adset.daily_budget, 'scale');
        } else if (rec.action === 'descale') {
          console.log(`🔻 Descaling adset ${adset.name}`);
          await updateBudget('adset', adset.id, adset.daily_budget, 'descale');
        }
      }

      console.log('✅ Automatic optimization completed');
      alert('✅ Optimisation automatique terminée !');
    } catch (error) {
      console.error('❌ Error during auto optimization:', error);
      alert('❌ Erreur lors de l\'optimisation automatique');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Filter data by status
  const getFilteredCampaigns = () => {
    let filtered = statusFilter === "all" ? campaigns : campaigns.filter(c => c.status === statusFilter);

    // Si filtre ACTIVE, masquer les campagnes sans spend sur 3 jours
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter(c => getSpend3d(c) > 0);
    }

    return sortData(filtered, 'campaign');
  };

  const getFilteredAdsets = () => {
    let filtered = statusFilter === "all" ? adsets : adsets.filter(a => a.status === statusFilter);

    // Si filtre ACTIVE, masquer les adsets sans spend sur 3 jours
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter(a => getSpend3d(a) > 0);
    }

    return sortData(filtered, 'adset');
  };

  const getFilteredAds = () => {
    let filtered = statusFilter === "all" ? ads : ads.filter(a => a.status === statusFilter);
    return sortData(filtered, 'ad');
  };

  // Sort data
  const sortData = (data, type) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'spend':
          aVal = getSpend(a.insights);
          bVal = getSpend(b.insights);
          break;
        case 'spend_4d':
          aVal = getSpend(a.insights_4d);
          bVal = getSpend(b.insights_4d);
          break;
        case 'results':
          const objectiveA = type === 'campaign' ? a.objective : campaigns.find(c => c.id === a.campaign_id)?.objective;
          const objectiveB = type === 'campaign' ? b.objective : campaigns.find(c => c.id === b.campaign_id)?.objective;
          aVal = getResults(a.insights, objectiveA);
          bVal = getResults(b.insights, objectiveB);
          break;
        case 'cpa':
          const objA = type === 'campaign' ? a.objective : campaigns.find(c => c.id === a.campaign_id)?.objective;
          const objB = type === 'campaign' ? b.objective : campaigns.find(c => c.id === b.campaign_id)?.objective;
          aVal = getCPA(a.insights, objA);
          bVal = getCPA(b.insights, objB);
          break;
        case 'roas':
          aVal = getROAS(a.insights);
          bVal = getROAS(b.insights);
          break;
        case 'roas_4d':
          aVal = getROAS(a.insights_4d);
          bVal = getROAS(b.insights_4d);
          break;
        case 'roas_7d':
          aVal = getROAS(a.insights_7d);
          bVal = getROAS(b.insights_7d);
          break;
        case 'budget':
          aVal = a.daily_budget || 0;
          bVal = b.daily_budget || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };

  // Handle column header click for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for numeric fields
    }
  };

  // Render sort arrow
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
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

            {/* Optimization Panel */}
            <div style={{ marginBottom: "24px" }}>
              <button
                onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: showOptimizationPanel ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.4)",
                  border: showOptimizationPanel ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(71,85,105,0.3)",
                  borderRadius: "8px",
                  color: "#a5b4fc",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
              >
                <span>⚡ Mode Optimisation</span>
                <span>{showOptimizationPanel ? "▼" : "▶"}</span>
              </button>

              {showOptimizationPanel && (
                <div style={{ ...box, marginTop: "12px", padding: "20px" }}>
                  {/* Mode Toggle */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "12px", color: "#71717a", display: "block", marginBottom: "8px" }}>
                      🤖 Mode
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setOptimizationMode("manual")}
                        style={{
                          padding: "8px 16px",
                          background: optimizationMode === "manual" ? "rgba(99,102,241,0.3)" : "rgba(30,41,59,0.4)",
                          border: optimizationMode === "manual" ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(71,85,105,0.3)",
                          borderRadius: "6px",
                          color: optimizationMode === "manual" ? "#a5b4fc" : "#71717a",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        ✋ Manuel
                      </button>
                      <button
                        onClick={() => setOptimizationMode("auto")}
                        style={{
                          padding: "8px 16px",
                          background: optimizationMode === "auto" ? "rgba(34,197,94,0.3)" : "rgba(30,41,59,0.4)",
                          border: optimizationMode === "auto" ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(71,85,105,0.3)",
                          borderRadius: "6px",
                          color: optimizationMode === "auto" ? "#22c55e" : "#71717a",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        🤖 Automatique
                      </button>
                    </div>
                    {optimizationMode === "auto" && (
                      <div style={{ marginTop: "12px" }}>
                        <button
                          onClick={runAutoOptimization}
                          disabled={isOptimizing}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: isOptimizing ? "rgba(71,85,105,0.2)" : "rgba(34,197,94,0.3)",
                            border: "1px solid rgba(34,197,94,0.5)",
                            borderRadius: "8px",
                            color: isOptimizing ? "#71717a" : "#22c55e",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: isOptimizing ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {isOptimizing ? "⏳ Optimisation en cours..." : "🚀 Lancer l'optimisation automatique"}
                        </button>
                        <p style={{ fontSize: "11px", color: "#f59e0b", marginTop: "8px", marginBottom: 0 }}>
                          ⚠️ Les budgets seront ajustés selon les recommandations
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Configuration Inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#71717a", display: "block", marginBottom: "8px" }}>
                        📉 ROAS Breakeven
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={roasBreakeven}
                        onChange={(e) => setRoasBreakeven(parseFloat(e.target.value))}
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

                    <div>
                      <label style={{ fontSize: "12px", color: "#71717a", display: "block", marginBottom: "8px" }}>
                        🎯 ROAS Target
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={roasTarget}
                        onChange={(e) => setRoasTarget(parseFloat(e.target.value))}
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

                    <div>
                      <label style={{ fontSize: "12px", color: "#71717a", display: "block", marginBottom: "8px" }}>
                        💰 Budget Max (€/jour)
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={maxDailyBudget}
                        onChange={(e) => setMaxDailyBudget(parseFloat(e.target.value))}
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
                  </div>

                  {/* Legend */}
                  <div style={{ padding: "12px", background: "rgba(30,41,59,0.3)", borderRadius: "8px", fontSize: "11px", color: "#71717a" }}>
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ color: "#ef4444" }}>🔻 Descale (-10%)</span>: ROAS 4j &lt; Breakeven
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ color: "#f59e0b" }}>⏸️ Hold</span>: Breakeven ≤ ROAS 4j &lt; Target
                    </div>
                    <div>
                      <span style={{ color: "#22c55e" }}>🚀 Scale (+10%)</span>: ROAS 4j ≥ Target
                    </div>
                  </div>
                </div>
              )}
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
                            <th onClick={() => handleSort('name')} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Nom{renderSortArrow('name')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Objectif</th>
                            <th onClick={() => handleSort('budget')} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Budget{renderSortArrow('budget')}</th>
                            <th onClick={() => handleSort('spend')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 7j{renderSortArrow('spend')}</th>
                            <th onClick={() => handleSort('spend_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 4j{renderSortArrow('spend_4d')}</th>
                            <th onClick={() => handleSort('results')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Résultats{renderSortArrow('results')}</th>
                            <th onClick={() => handleSort('cpa')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>CPA{renderSortArrow('cpa')}</th>
                            <th onClick={() => handleSort('roas')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 7j{renderSortArrow('roas')}</th>
                            <th onClick={() => handleSort('roas_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 4j{renderSortArrow('roas_4d')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Recommandation</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Actions</th>
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
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights ? `${getSpend(campaign.insights).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights_4d ? `${getSpend(campaign.insights_4d).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#22c55e", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights ? getResults(campaign.insights, campaign.objective) : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#a78bfa", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights && getCPA(campaign.insights, campaign.objective) > 0 ? `${getCPA(campaign.insights, campaign.objective).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights && getROAS(campaign.insights) > 0 ? `${getROAS(campaign.insights).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {campaign.insights_4d && getROAS(campaign.insights_4d) > 0 ? `${getROAS(campaign.insights_4d).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                {(() => {
                                  const rec = getRecommendation(campaign, campaign.insights_4d, campaign.insights_7d, 'campaign');
                                  if (rec.action === 'none' || rec.action === 'wait') return <span style={{ fontSize: "11px", color: rec.color }}>{rec.reason}</span>;
                                  return (
                                    <div style={{ fontSize: "11px", color: rec.color, fontWeight: "600" }} title={rec.reason}>
                                      {rec.action === 'scale' && '🚀 Scale'}
                                      {rec.action === 'scale_jump' && '🚀🚀 Scale +2'}
                                      {rec.action === 'descale' && '🔻 Descale'}
                                      {rec.action === 'hold' && '⏸️ Hold'}
                                      {rec.action === 'cut' && '✂️ CUT'}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "16px 24px" }}>
                                {(() => {
                                  const onCooldown = isOnCooldown(campaign.id);
                                  const remaining = onCooldown ? getRemainingCooldown(campaign.id) : 0;
                                  const isDisabled = optimizationMode === 'auto' || onCooldown;

                                  if (onCooldown) {
                                    return (
                                      <div style={{ fontSize: "10px", color: "#71717a", textAlign: "center" }} title={`Prochaine action dans ${formatCooldownTime(remaining)}`}>
                                        ⏳ {formatCooldownTime(remaining)}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                      {campaign.daily_budget && (
                                        <>
                                          <button
                                            onClick={() => updateBudget('campaign', campaign.id, campaign.daily_budget, 'scale')}
                                            disabled={isDisabled}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled ? "rgba(71,85,105,0.2)" : "rgba(34,197,94,0.2)",
                                              border: "1px solid rgba(34,197,94,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled ? "#71717a" : "#22c55e",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Scale +10%"
                                          >
                                            +10%
                                          </button>
                                          <button
                                            onClick={() => updateBudget('campaign', campaign.id, campaign.daily_budget, 'descale')}
                                            disabled={isDisabled}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled ? "rgba(71,85,105,0.2)" : "rgba(239,68,68,0.2)",
                                              border: "1px solid rgba(239,68,68,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled ? "#71717a" : "#ef4444",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Descale -10%"
                                          >
                                            -10%
                                          </button>
                                          <button
                                            onClick={() => pauseItem('campaign', campaign.id)}
                                            disabled={isDisabled || campaign.status !== 'ACTIVE'}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled || campaign.status !== 'ACTIVE' ? "rgba(71,85,105,0.2)" : "rgba(251,191,36,0.2)",
                                              border: "1px solid rgba(251,191,36,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled || campaign.status !== 'ACTIVE' ? "#71717a" : "#fbbf24",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled || campaign.status !== 'ACTIVE' ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Pause campaign"
                                          >
                                            CUT
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{campaign.id}</td>
                            </tr>
                          ))}
                          {getFilteredCampaigns().length === 0 && (
                            <tr>
                              <td colSpan="13" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
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
                            <th onClick={() => handleSort('name')} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Nom{renderSortArrow('name')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Optimisation</th>
                            <th onClick={() => handleSort('budget')} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Budget{renderSortArrow('budget')}</th>
                            <th onClick={() => handleSort('spend')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 7j{renderSortArrow('spend')}</th>
                            <th onClick={() => handleSort('spend_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 4j{renderSortArrow('spend_4d')}</th>
                            <th onClick={() => handleSort('results')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Résultats{renderSortArrow('results')}</th>
                            <th onClick={() => handleSort('cpa')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>CPA{renderSortArrow('cpa')}</th>
                            <th onClick={() => handleSort('roas')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 7j{renderSortArrow('roas')}</th>
                            <th onClick={() => handleSort('roas_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 4j{renderSortArrow('roas_4d')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Recommandation</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Actions</th>
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
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights ? `${getSpend(adset.insights).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights_4d ? `${getSpend(adset.insights_4d).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#22c55e", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights ? getResults(adset.insights, campaigns.find(c => c.id === adset.campaign_id)?.objective) : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#a78bfa", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights && getCPA(adset.insights, campaigns.find(c => c.id === adset.campaign_id)?.objective) > 0 ? `${getCPA(adset.insights, campaigns.find(c => c.id === adset.campaign_id)?.objective).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights && getROAS(adset.insights) > 0 ? `${getROAS(adset.insights).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {adset.insights_4d && getROAS(adset.insights_4d) > 0 ? `${getROAS(adset.insights_4d).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                {(() => {
                                  const parentCampaign = campaigns.find(c => c.id === adset.campaign_id);
                                  const rec = getRecommendation(adset, adset.insights_4d, adset.insights_7d, 'adset', parentCampaign);
                                  if (rec.action === 'none' || rec.action === 'wait') return <span style={{ fontSize: "11px", color: rec.color }}>{rec.reason}</span>;
                                  return (
                                    <div style={{ fontSize: "11px", color: rec.color, fontWeight: "600" }} title={rec.reason}>
                                      {rec.action === 'scale' && '🚀 Scale'}
                                      {rec.action === 'scale_jump' && '🚀🚀 Scale +2'}
                                      {rec.action === 'descale' && '🔻 Descale'}
                                      {rec.action === 'hold' && '⏸️ Hold'}
                                      {rec.action === 'cut' && '✂️ CUT'}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "16px 24px" }}>
                                {(() => {
                                  const onCooldown = isOnCooldown(adset.id);
                                  const remaining = onCooldown ? getRemainingCooldown(adset.id) : 0;
                                  const isDisabled = optimizationMode === 'auto' || onCooldown;

                                  if (onCooldown) {
                                    return (
                                      <div style={{ fontSize: "10px", color: "#71717a", textAlign: "center" }} title={`Prochaine action dans ${formatCooldownTime(remaining)}`}>
                                        ⏳ {formatCooldownTime(remaining)}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                      {adset.daily_budget && (
                                        <>
                                          <button
                                            onClick={() => updateBudget('adset', adset.id, adset.daily_budget, 'scale')}
                                            disabled={isDisabled}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled ? "rgba(71,85,105,0.2)" : "rgba(34,197,94,0.2)",
                                              border: "1px solid rgba(34,197,94,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled ? "#71717a" : "#22c55e",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Scale +10%"
                                          >
                                            +10%
                                          </button>
                                          <button
                                            onClick={() => updateBudget('adset', adset.id, adset.daily_budget, 'descale')}
                                            disabled={isDisabled}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled ? "rgba(71,85,105,0.2)" : "rgba(239,68,68,0.2)",
                                              border: "1px solid rgba(239,68,68,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled ? "#71717a" : "#ef4444",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Descale -10%"
                                          >
                                            -10%
                                          </button>
                                          <button
                                            onClick={() => pauseItem('adset', adset.id)}
                                            disabled={isDisabled || adset.status !== 'ACTIVE'}
                                            style={{
                                              padding: "4px 8px",
                                              background: isDisabled || adset.status !== 'ACTIVE' ? "rgba(71,85,105,0.2)" : "rgba(251,191,36,0.2)",
                                              border: "1px solid rgba(251,191,36,0.3)",
                                              borderRadius: "4px",
                                              color: isDisabled || adset.status !== 'ACTIVE' ? "#71717a" : "#fbbf24",
                                              fontSize: "10px",
                                              fontWeight: "600",
                                              cursor: isDisabled || adset.status !== 'ACTIVE' ? "not-allowed" : "pointer",
                                              transition: "all 0.2s",
                                            }}
                                            title="Pause adset"
                                          >
                                            CUT
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{adset.id}</td>
                            </tr>
                          ))}
                          {getFilteredAdsets().length === 0 && (
                            <tr>
                              <td colSpan="13" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
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
                            <th onClick={() => handleSort('name')} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Nom{renderSortArrow('name')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Statut</th>
                            <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Creative</th>
                            <th onClick={() => handleSort('spend')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 7j{renderSortArrow('spend')}</th>
                            <th onClick={() => handleSort('spend_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Dépenses 4j{renderSortArrow('spend_4d')}</th>
                            <th onClick={() => handleSort('results')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>Résultats{renderSortArrow('results')}</th>
                            <th onClick={() => handleSort('cpa')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>CPA{renderSortArrow('cpa')}</th>
                            <th onClick={() => handleSort('roas')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 7j{renderSortArrow('roas')}</th>
                            <th onClick={() => handleSort('roas_4d')} style={{ padding: "12px 24px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }}>ROAS 4j{renderSortArrow('roas_4d')}</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Recommandation</th>
                            <th style={{ padding: "12px 24px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase" }}>Actions</th>
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
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights ? `${getSpend(ad.insights).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#e4e4e7", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights_4d ? `${getSpend(ad.insights_4d).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#22c55e", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights ? getResults(ad.insights, campaigns.find(c => c.id === ad.campaign_id)?.objective) : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#a78bfa", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights && getCPA(ad.insights, campaigns.find(c => c.id === ad.campaign_id)?.objective) > 0 ? `${getCPA(ad.insights, campaigns.find(c => c.id === ad.campaign_id)?.objective).toFixed(2)}€` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights && getROAS(ad.insights) > 0 ? `${getROAS(ad.insights).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "13px", color: "#fbbf24", textAlign: "right", fontWeight: "600" }}>
                                {ad.insights_4d && getROAS(ad.insights_4d) > 0 ? `${getROAS(ad.insights_4d).toFixed(2)}x` : '-'}
                              </td>
                              <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                <span style={{ fontSize: "11px", color: "#71717a" }}>-</span>
                              </td>
                              <td style={{ padding: "16px 24px" }}>
                                {(() => {
                                  const onCooldown = isOnCooldown(ad.id);
                                  const remaining = onCooldown ? getRemainingCooldown(ad.id) : 0;
                                  const isDisabled = optimizationMode === 'auto' || onCooldown;

                                  if (onCooldown) {
                                    return (
                                      <div style={{ fontSize: "10px", color: "#71717a", textAlign: "center" }} title={`Prochaine action dans ${formatCooldownTime(remaining)}`}>
                                        ⏳ {formatCooldownTime(remaining)}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                      <button
                                        onClick={() => pauseItem('ad', ad.id)}
                                        disabled={isDisabled || ad.status !== 'ACTIVE'}
                                        style={{
                                          padding: "4px 8px",
                                          background: isDisabled || ad.status !== 'ACTIVE' ? "rgba(71,85,105,0.2)" : "rgba(251,191,36,0.2)",
                                          border: "1px solid rgba(251,191,36,0.3)",
                                          borderRadius: "4px",
                                          color: isDisabled || ad.status !== 'ACTIVE' ? "#71717a" : "#fbbf24",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          cursor: isDisabled || ad.status !== 'ACTIVE' ? "not-allowed" : "pointer",
                                          transition: "all 0.2s",
                                        }}
                                        title="Pause ad"
                                      >
                                        CUT
                                      </button>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "16px 24px", fontSize: "11px", color: "#52525b", fontFamily: "monospace" }}>{ad.id}</td>
                            </tr>
                          ))}
                          {getFilteredAds().length === 0 && (
                            <tr>
                              <td colSpan="12" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
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
