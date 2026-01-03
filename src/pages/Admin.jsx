import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { BureauAtmosphere, BureauFooter } from '@/components/bureau';
import SEO from '@/components/SEO';
import {
  Users,
  MessageSquare,
  HandHelping,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  UserPlus,
  Activity,
  BarChart3,
  Eye,
  Trash2,
  Shield,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  Loader2
} from 'lucide-react';

// ============================================
// ADMIN ACCESS CHECK
// ============================================
const ADMIN_EMAILS = [
  'admin@test.chistartuphub.com',
  'hello@chistartuphub.com',
  // Add more admin emails as needed
];

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Analytics data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFounders: 0,
    totalHelpers: 0,
    newUsersThisWeek: 0,
    totalAsks: 0,
    activeAsks: 0,
    totalConnections: 0,
    pendingConnections: 0,
    acceptedConnections: 0,
    declinedConnections: 0,
  });

  // Data lists
  const [users, setUsers] = useState([]);
  const [asks, setAsks] = useState([]);
  const [connections, setConnections] = useState([]);

  // Filters
  const [userFilter, setUserFilter] = useState('all');
  const [askFilter, setAskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      toast.error('Access denied', { description: 'Admin privileges required' });
      navigate('/');
      return;
    }

    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchAsks(),
        fetchConnections(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalFounders } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'founder');

    // Get asks counts
    const { count: totalAsks } = await supabase
      .from('founder_asks')
      .select('*', { count: 'exact', head: true });

    const { count: activeAsks } = await supabase
      .from('founder_asks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get connection counts
    const { count: totalConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: acceptedConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted');

    const { count: declinedConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'declined');

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    setStats({
      totalUsers: totalUsers || 0,
      totalFounders: totalFounders || 0,
      totalHelpers: (totalUsers || 0) - (totalFounders || 0),
      newUsersThisWeek: newUsersThisWeek || 0,
      totalAsks: totalAsks || 0,
      activeAsks: activeAsks || 0,
      totalConnections: totalConnections || 0,
      pendingConnections: pendingConnections || 0,
      acceptedConnections: acceptedConnections || 0,
      declinedConnections: declinedConnections || 0,
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setUsers(data || []);
  };

  const fetchAsks = async () => {
    const { data, error } = await supabase
      .from('founder_asks')
      .select(`
        *,
        user_profiles (full_name, email, company_name),
        connection_requests (count)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setAsks(data || []);
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        founder_asks (description, sector, category)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setConnections(data || []);
  };

  // Admin actions
  const handleDeactivateAsk = async (askId) => {
    if (!confirm('Deactivate this ask?')) return;

    const { error } = await supabase
      .from('founder_asks')
      .update({ is_active: false })
      .eq('id', askId);

    if (error) {
      toast.error('Failed to deactivate ask');
    } else {
      toast.success('Ask deactivated');
      fetchAsks();
      fetchStats();
    }
  };

  const handleDeleteAsk = async (askId) => {
    if (!confirm('Permanently delete this ask? This cannot be undone.')) return;

    const { error } = await supabase
      .from('founder_asks')
      .delete()
      .eq('id', askId);

    if (error) {
      toast.error('Failed to delete ask');
    } else {
      toast.success('Ask deleted');
      fetchAsks();
      fetchStats();
    }
  };

  // Filter data
  const filteredUsers = users.filter(u => {
    if (userFilter === 'founders' && u.role !== 'founder') return false;
    if (userFilter === 'helpers' && u.role === 'founder') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.company_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredAsks = asks.filter(a => {
    if (askFilter === 'active' && !a.is_active) return false;
    if (askFilter === 'inactive' && a.is_active) return false;
    if (askFilter === 'fundraising' && a.category !== 'fundraising') return false;
    if (askFilter === 'cofounder' && a.category !== 'cofounder') return false;
    if (askFilter === 'advice' && a.category !== 'general_advice') return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050A14]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // Category breakdown for asks
  const asksByCategory = {
    fundraising: asks.filter(a => a.category === 'fundraising').length,
    cofounder: asks.filter(a => a.category === 'cofounder').length,
    general_advice: asks.filter(a => a.category === 'general_advice').length,
  };

  return (
    <div className="min-h-screen relative" data-page="admin">
      <SEO title="Admin Dashboard | ChiStartup Hub" description="Admin controls and analytics" />
      <BureauAtmosphere />

      <div className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-white/50" strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [ADMIN: DASHBOARD]
              </span>
            </div>
            <h1 className="font-serif text-4xl text-white">Platform Controls</h1>
            <p className="text-white/50 mt-2">Monitor, moderate, and manage the ecosystem</p>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
              Refresh Data
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'asks', label: 'Asks', icon: MessageSquare },
              { id: 'connections', label: 'Connections', icon: HandHelping },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-5 py-3 border transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Users */}
                <div className="border border-white/10 p-6 bg-black/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
                      Total Users
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-green-400 mt-1">
                    +{stats.newUsersThisWeek} this week
                  </div>
                </div>

                {/* Founders */}
                <div className="border border-white/10 p-6 bg-black/40">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
                      Founders
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalFounders}</div>
                  <div className="text-xs text-white/30 mt-1">
                    {stats.totalHelpers} helpers
                  </div>
                </div>

                {/* Active Asks */}
                <div className="border border-white/10 p-6 bg-black/40">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
                      Active Asks
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.activeAsks}</div>
                  <div className="text-xs text-white/30 mt-1">
                    of {stats.totalAsks} total
                  </div>
                </div>

                {/* Connections */}
                <div className="border border-white/10 p-6 bg-black/40">
                  <div className="flex items-center gap-2 mb-3">
                    <HandHelping className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
                      Connections
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalConnections}</div>
                  <div className="text-xs text-yellow-400 mt-1">
                    {stats.pendingConnections} pending
                  </div>
                </div>
              </div>

              {/* Ask Categories Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-white/10 p-6 bg-black/40">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-4">
                    Asks by Category
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60">Fundraising</span>
                        <span className="text-emerald-400">{asksByCategory.fundraising}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${(asksByCategory.fundraising / (stats.totalAsks || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60">Co-founder</span>
                        <span className="text-blue-400">{asksByCategory.cofounder}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400"
                          style={{ width: `${(asksByCategory.cofounder / (stats.totalAsks || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60">General Advice</span>
                        <span className="text-purple-400">{asksByCategory.general_advice}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400"
                          style={{ width: `${(asksByCategory.general_advice / (stats.totalAsks || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Status Breakdown */}
                <div className="border border-white/10 p-6 bg-black/40">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-4">
                    Connection Requests Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" strokeWidth={1.5} />
                        <span className="text-white/60">Pending</span>
                      </div>
                      <span className="text-yellow-400 font-mono">{stats.pendingConnections}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                        <span className="text-white/60">Accepted</span>
                      </div>
                      <span className="text-green-400 font-mono">{stats.acceptedConnections}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                        <span className="text-white/60">Declined</span>
                      </div>
                      <span className="text-red-400 font-mono">{stats.declinedConnections}</span>
                    </div>
                  </div>

                  {/* Conversion rate */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-sm">Acceptance Rate</span>
                      <span className="text-lg font-bold text-white">
                        {stats.totalConnections > 0
                          ? Math.round((stats.acceptedConnections / stats.totalConnections) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attention Needed */}
              <div className="mt-6 border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber-400">
                    Needs Attention
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {stats.pendingConnections > 5 && (
                    <li className="flex items-center gap-2 text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {stats.pendingConnections} connection requests pending response
                    </li>
                  )}
                  {stats.activeAsks === 0 && (
                    <li className="flex items-center gap-2 text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      No active asks - encourage founders to post
                    </li>
                  )}
                  {stats.newUsersThisWeek === 0 && (
                    <li className="flex items-center gap-2 text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      No new signups this week - review acquisition
                    </li>
                  )}
                  {stats.pendingConnections <= 5 && stats.activeAsks > 0 && stats.newUsersThisWeek > 0 && (
                    <li className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
                      All metrics healthy - no immediate action needed
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 py-2 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="founders">Founders Only</option>
                  <option value="helpers">Helpers Only</option>
                </select>
              </div>

              {/* Users List */}
              <div className="border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">User</th>
                      <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Role</th>
                      <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Company</th>
                      <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div>
                            <span className="text-white text-sm">{u.full_name || 'No name'}</span>
                            <span className="text-white/30 text-xs block">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            u.role === 'founder'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {u.role || 'explorer'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white/50">{u.company_name || '-'}</td>
                        <td className="p-4 text-sm text-white/30">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-white/30 mt-2">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </motion.div>
          )}

          {/* ASKS TAB */}
          {activeTab === 'asks' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                  { id: 'fundraising', label: 'Fundraising' },
                  { id: 'cofounder', label: 'Co-founder' },
                  { id: 'advice', label: 'Advice' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAskFilter(f.id)}
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors ${
                      askFilter === f.id
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Asks List */}
              <div className="space-y-4">
                {filteredAsks.map((ask) => (
                  <div key={ask.id} className="border border-white/10 p-6 bg-black/40">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          ask.is_active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {ask.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-white/40 uppercase">
                          {ask.category === 'fundraising' ? 'Fundraising' :
                           ask.category === 'cofounder' ? 'Co-founder' : 'Advice'}
                        </span>
                        <span className="text-xs text-white/30">• {ask.sector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ask.is_active && (
                          <button
                            onClick={() => handleDeactivateAsk(ask.id)}
                            className="p-2 text-white/30 hover:text-yellow-400 transition-colors"
                            title="Deactivate"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAsk(ask.id)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    <p className="text-white/70 text-sm mb-3">{ask.description}</p>

                    <div className="flex items-center justify-between text-xs text-white/40">
                      <div>
                        By: {ask.user_profiles?.full_name || 'Anonymous'}
                        {ask.user_profiles?.company_name && ` (${ask.user_profiles.company_name})`}
                      </div>
                      <div className="flex items-center gap-4">
                        {ask.amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                            {ask.amount}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <HandHelping className="w-3 h-3" strokeWidth={1.5} />
                          {ask.connection_requests?.[0]?.count || 0} offers
                        </span>
                        <span>{new Date(ask.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/30 mt-4">
                Showing {filteredAsks.length} of {asks.length} asks
              </div>
            </motion.div>
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-4">
                {connections.map((conn) => (
                  <div key={conn.id} className="border border-white/10 p-6 bg-black/40">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        conn.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : conn.status === 'accepted'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {conn.status}
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(conn.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/40 text-xs block mb-1">Requester</span>
                        <span className="text-white">{conn.requester_name || 'Unknown'}</span>
                        <span className="text-white/30 text-xs block">{conn.requester_email}</span>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs block mb-1">Ask</span>
                        <span className="text-white/60 line-clamp-1">
                          {conn.founder_asks?.description || 'Ask not available'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-white/5 border border-white/5">
                      <span className="text-white/30 text-xs block mb-1">Message</span>
                      <p className="text-white/50 text-sm">{conn.requester_context}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/30 mt-4">
                Showing {connections.length} connection requests
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <BureauFooter />
    </div>
  );
}
