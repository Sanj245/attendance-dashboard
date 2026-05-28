'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Chart from 'chart.js/auto';
import {
  LayoutDashboard,
  Calendar,
  History,
  Sliders,
  Database,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Check,
  X,
  Slash,
  Download,
  Upload,
  RefreshCw,
  BarChart2,
  PieChart,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Percent,
  CheckCircle2,
  XCircle,
  Target
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  // --- States ---
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);
  
  const [activeUser, setActiveUser] = useState({ username: 'User' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal displays
  const [modals, setModals] = useState({
    subject: false,
    timetable: false,
    backup: false
  });

  // Form details
  const [subjectForm, setSubjectForm] = useState({
    id: null,
    name: '',
    present: 0,
    absent: 0,
    target: 75
  });

  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    subjectName: '',
    time: ''
  });

  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Simulator state
  const [simSubjectName, setSimSubjectName] = useState('');
  const [simAttendVal, setSimAttendVal] = useState(0);
  const [simBunkVal, setSimBunkVal] = useState(0);

  // References for Charts DOM
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);

  // --- Initial Data Load & Session Hydration ---
  useEffect(() => {
    // Check local storage for theme
    const cachedTheme = localStorage.getItem('planner_theme') || 'light';
    setTheme(cachedTheme);
    if (cachedTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    hydrateSession();
    fetchDatabase();
  }, []);

  const hydrateSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setActiveUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    }
  };

  const fetchDatabase = async () => {
    try {
      const subRes = await fetch('/api/subjects');
      const subjectsData = await subRes.json();
      if (Array.isArray(subjectsData)) {
        setSubjects(subjectsData);
      } else {
        setSubjects([]);
      }

      const ttRes = await fetch('/api/timetable');
      const timetableData = await ttRes.json();
      if (Array.isArray(timetableData)) {
        setTimetable(timetableData);
      } else {
        setTimetable([]);
      }

      const logRes = await fetch('/api/logs');
      const logsData = await logRes.json();
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      } else {
        setLogs([]);
      }
    } catch (e) {
      showToast('Failed to connect to full-stack database.', 'danger');
      setSubjects([]);
      setTimetable([]);
      setLogs([]);
    }
  };

  // --- Chart.js Rendering hooks ---
  useEffect(() => {
    if (currentTab === 'dashboard' && subjects.length > 0) {
      renderCharts();
    }
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
        doughnutChartInstance.current = null;
      }
    };
  }, [currentTab, subjects, theme]);

  const renderCharts = () => {
    const isDark = theme === 'dark';
    const textMainColor = isDark ? '#f8fafc' : '#0f172a';
    const gridBorderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    // Bar Chart
    const ctxBar = barChartRef.current;
    if (ctxBar) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const barContext = ctxBar.getContext('2d');
      const barGradient = barContext.createLinearGradient(0, 0, 0, 300);
      barGradient.addColorStop(0, '#6366f1');
      barGradient.addColorStop(1, '#8b5cf6');

      const labels = subjects.map(sub => sub.name);
      const percentages = subjects.map(sub => {
        const total = sub.present + sub.absent;
        return total > 0 ? parseFloat(((sub.present / total) * 100).toFixed(1)) : 0;
      });
      const targets = subjects.map(sub => sub.target);

      barChartInstance.current = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Current Attendance %',
              data: percentages,
              backgroundColor: barGradient,
              borderRadius: 8,
              maxBarThickness: 45
            },
            {
              label: 'Target Goal %',
              data: targets,
              type: 'line',
              borderColor: '#ff9f43',
              borderWidth: 2.5,
              borderDash: [5, 5],
              pointRadius: 4,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: textMainColor,
                font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 }
              }
            },
            tooltip: {
              padding: 12,
              backgroundColor: isDark ? '#1e1b4b' : '#ffffff',
              titleColor: textMainColor,
              bodyColor: textMainColor,
              borderColor: 'rgba(99, 102, 241, 0.2)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: textMainColor,
                font: { family: 'Plus Jakarta Sans', size: 10, weight: 500 }
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: gridBorderColor },
              ticks: {
                color: textMainColor,
                font: { family: 'Plus Jakarta Sans', size: 10 }
              }
            }
          }
        }
      });
    }

    // Doughnut distribution
    const ctxDoughnut = doughnutChartRef.current;
    if (ctxDoughnut) {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }

      let safeCount = 0;
      let dangerCount = 0;

      subjects.forEach(sub => {
        const total = sub.present + sub.absent;
        const percentage = total > 0 ? (sub.present / total) * 100 : 0;
        if (percentage >= sub.target) {
          safeCount++;
        } else {
          dangerCount++;
        }
      });

      doughnutChartInstance.current = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Safe Goals', 'Low / Warning'],
          datasets: [
            {
              data: [safeCount, dangerCount],
              backgroundColor: ['#10b981', '#ef4444'],
              borderWidth: isDark ? 2 : 1,
              borderColor: isDark ? '#0f0e21' : '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textMainColor,
                boxWidth: 12,
                font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 }
              }
            }
          }
        }
      });
    }
  };

  // --- Theme Toggle ---
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('planner_theme', nextTheme);

    if (nextTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  // --- Logout API trigger ---
  const handleLogout = async () => {
    if (!confirm('Do you want to log out of your session?')) return;
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 600);
      }
    } catch (e) {
      showToast('Logout failed.', 'danger');
    }
  };

  // --- Toast Manager ---
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // --- Math calculations ---
  const totalAttended = subjects.reduce((sum, s) => sum + s.present, 0);
  const totalMissed = subjects.reduce((sum, s) => sum + s.absent, 0);
  const overallTotal = totalAttended + totalMissed;
  const overallPct = overallTotal > 0 ? (totalAttended / overallTotal) * 100 : 0;
  
  const weightedTarget = subjects.reduce((sum, s) => sum + s.target, 0);
  const overallTargetPct = subjects.length > 0 ? Math.round(weightedTarget / subjects.length) : 75;

  // --- Timetable checklist calculations ---
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = days[new Date().getDay()];
  const todaySchedule = timetable.filter(slot => slot.day === currentDayName);

  const getTodayLogStatus = (subjectName) => {
    const today = new Date().toDateString();
    const matched = logs.find(log => {
      return log.subject.name === subjectName && new Date(log.timestamp).toDateString() === today;
    });
    return matched ? matched.status : null;
  };

  // --- Subject Actions ---
  const handleOpenSubjectModal = (sub = null) => {
    if (sub) {
      setSubjectForm({
        id: sub.id,
        name: sub.name,
        present: sub.present,
        absent: sub.absent,
        target: sub.target
      });
    } else {
      setSubjectForm({
        id: null,
        name: '',
        present: 0,
        absent: 0,
        target: 75
      });
    }
    setModals(prev => ({ ...prev, subject: true }));
  };

  const handleSaveSubject = async () => {
    const { id, name, present, absent, target } = subjectForm;

    if (!name.trim()) {
      showToast('Subject Name is required!', 'warning');
      return;
    }
    if (present < 0 || absent < 0) {
      showToast('Counters cannot be negative!', 'warning');
      return;
    }
    if (target < 50 || target > 100) {
      showToast('Target threshold must be between 50% and 100%!', 'warning');
      return;
    }

    try {
      if (!id) {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), present, absent, target })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast(`Subject "${name.trim()}" added to directory!`, 'success');
      } else {
        const res = await fetch(`/api/subjects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), present, absent, target })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast(`Subject details updated!`, 'success');
      }

      setModals(prev => ({ ...prev, subject: false }));
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error saving subject.', 'danger');
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will permanently delete its schedules and logs.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Subject "${name}" deleted.`, 'warning');
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error deleting subject.', 'danger');
    }
  };

  // --- Timetable Schedulers ---
  const handleSaveTimetableSlot = async () => {
    const { day, subjectName, time } = timetableForm;

    if (!subjectName) {
      showToast('Please select a registered subject!', 'warning');
      return;
    }
    if (!time.trim()) {
      showToast('Please specify a class hour time slot!', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, subjectName, time: time.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Scheduled class registered!`, 'success');
      setModals(prev => ({ ...prev, timetable: false }));
      setTimetableForm(prev => ({ ...prev, time: '' }));
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error saving scheduled class.', 'danger');
    }
  };

  const handleDeleteTimetableSlot = async (id) => {
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Scheduled class deleted.', 'warning');
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error deleting slot.', 'danger');
    }
  };

  // --- Checklist attendance check-ins ---
  const handleCheckInAttendance = async (subjectName, status) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Logged checklist check-in for "${subjectName}" as ${status}!`, 'success');

      // Trigger Confetti if safe present checkin
      const matchedSub = subjects.find(s => s.name === subjectName);
      if (matchedSub && status === 'attended') {
        const total = matchedSub.present + matchedSub.absent + 1;
        const newPct = ((matchedSub.present + 1) / total) * 100;
        if (newPct >= matchedSub.target) {
          triggerConfetti();
        }
      }

      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error log checkin.', 'danger');
    }
  };

  const handleDeleteHistoryLog = async (id) => {
    if (!confirm('Do you want to delete this checkin log? This will revert the attendance counters.')) {
      return;
    }

    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Log entry removed and subject totals recalculated.', 'warning');
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error deleting log.', 'danger');
    }
  };

  const handleWipeHistoryOnly = async () => {
    if (!confirm('Are you sure you want to clear your checklist log? This does NOT affect subject totals.')) {
      return;
    }

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wipe' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Cleared checklist timeline history successfully.', 'danger');
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error wiping history.', 'danger');
    }
  };

  // --- Database seeding resets ---
  const handleResetAndSeed = async (action = 'seed') => {
    const confirmationMsg = action === 'seed'
      ? 'This will seed default mock planner details (4 subjects, weekly schedules, and initial checklist logs) into your account database. Proceed?'
      : 'WARNING: This will permanently erase ALL your subjects, timetables, and logs! Proceed?';
      
    if (!confirm(confirmationMsg)) return;

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Action executed successfully.', action === 'seed' ? 'success' : 'danger');
      setModals({ subject: false, timetable: false, backup: false });
      fetchDatabase();
    } catch (e) {
      showToast(e.message || 'Error resetting/seeding database.', 'danger');
    }
  };

  // --- What-If Simulator math ---
  const simSubject = subjects.find(s => s.name === simSubjectName);
  let simCurrentPct = '--%';
  let simProjectedPct = '--%';
  let simStatus = 'Select Subject';
  let simStatusClass = 'empty';
  let simConclusionText = 'Select adjustments above to see potential class options.';

  if (simSubject) {
    const currentTotal = simSubject.present + simSubject.absent;
    const currentPct = currentTotal > 0 ? (simSubject.present / currentTotal) * 100 : 0;
    simCurrentPct = currentTotal > 0 ? `${currentPct.toFixed(1)}%` : '--%';

    const simulatedAttended = simSubject.present + simAttendVal;
    const simulatedMissed = simSubject.absent + simBunkVal;
    const simulatedTotal = simulatedAttended + simulatedMissed;
    const simulatedPct = simulatedTotal > 0 ? (simulatedAttended / simulatedTotal) * 100 : 0;
    simProjectedPct = simulatedTotal > 0 ? `${simulatedPct.toFixed(1)}%` : '--%';

    if (simulatedPct >= simSubject.target) {
      simStatus = 'Safe 😎';
      simStatusClass = 'safe';
      let extraBunks = 0;
      while ((simulatedAttended * 100) / (simulatedTotal + extraBunks + 1) >= simSubject.target) {
        extraBunks++;
      }
      simConclusionText = `Great! In this scenario, you would exceed your target. You could safely bunk ${extraBunks} additional classes!`;
    } else {
      simStatusClass = simulatedPct >= (simSubject.target - 5) ? 'warning' : 'danger';
      simStatus = simulatedPct >= (simSubject.target - 5) ? 'Critical ⚠️' : 'Low 🚨';

      let extraNeeded = 0;
      while (((simulatedAttended + extraNeeded) * 100) / (simulatedTotal + extraNeeded) < simSubject.target) {
        extraNeeded++;
      }
      simConclusionText = `Warning! You would fall below your goal. You would need to attend ${extraNeeded} consecutive sessions to recover!`;
    }
  }

  // --- Filtered logs ---
  const filteredLogs = logs.filter(log => {
    const matchSub = filterSubject ? log.subject.name.toLowerCase() === filterSubject.toLowerCase() : true;
    const matchStatus = filterStatus ? log.status === filterStatus : true;
    return matchSub && matchStatus;
  });

  // --- Backup File operations ---
  const handleExportData = () => {
    const payload = { subjects, timetable, logs };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `planner_database_backup_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
    showToast('JSON backup file downloaded successfully!', 'success');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload.subjects || !payload.timetable) {
          showToast('Invalid backup file configuration!', 'danger');
          return;
        }

        const resetRes = await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'wipe' })
        });
        if (!resetRes.ok) throw new Error('Wipe failed');

        for (const sub of payload.subjects) {
          await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sub.name, present: sub.present, absent: sub.absent, target: sub.target })
          });
        }
        for (const slot of payload.timetable) {
          await fetch('/api/timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day: slot.day, subjectName: slot.subject.name, time: slot.time })
          });
        }
        
        showToast('Backup restored successfully!', 'success');
        setModals(prev => ({ ...prev, backup: false }));
        fetchDatabase();
      } catch (err) {
        showToast('Error uploading database backup file.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  const triggerConfetti = () => {
    const end = Date.now() + 1500;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.65 }
      });
    }, 200);
  };

  const handleSwitchTab = (tabName) => {
    setCurrentTab(tabName);
    setMobileMenuOpen(false); // Auto collapse on mobile selection
  };

  return (
    <div className="app-layout">
      
      {/* Toast Alert Popups */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <span className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>&times;</span>
          </div>
        ))}
      </div>

      {/* Mobile Sticky header */}
      <header className="mobile-header">
        <h2>Planner Pro</h2>
        <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={20} />
        </button>
      </header>

      {/* Desktop Sticky Left Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Sliders size={18} color="white" />
            </div>
            <h2>Planner Pro</h2>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleSwitchTab('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className={`nav-link ${currentTab === 'timetable' ? 'active' : ''}`} onClick={() => handleSwitchTab('timetable')}>
              <Calendar size={16} /> Weekly Planner
            </button>
            <button className={`nav-link ${currentTab === 'history' ? 'active' : ''}`} onClick={() => handleSwitchTab('history')}>
              <History size={16} /> Logs & Timeline
            </button>
            <button className={`nav-link ${currentTab === 'simulator' ? 'active' : ''}`} onClick={() => handleSwitchTab('simulator')}>
              <Sliders size={16} /> What-If Simulator
            </button>
          </nav>
        </div>

        {/* User profile card & logout at sidebar bottom */}
        <div className="profile-card">
          <div className="profile-avatar">
            {activeUser.username.substring(0, 1).toUpperCase()}
          </div>
          <div className="profile-info">
            <span className="profile-name" title={activeUser.username}>{activeUser.username}</span>
            <button className="profile-logout-btn" onClick={handleLogout}>
              <LogOut size={11} /> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content panel viewports */}
      <main className="main-content">
        
        {/* Top welcome greeting bar */}
        <div className="greeting-row">
          <div className="greeting-info">
            <h2>Hello, {activeUser.username}! 👋</h2>
            <p>Welcome back to your dashboard planning suite.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setModals(prev => ({ ...prev, backup: true }))}>
              <Database size={13} /> Database settings
            </button>
            <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }} onClick={handleToggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        <div className={`tab-content ${currentTab === 'dashboard' ? 'active' : ''}`}>
          
          {/* Quick overall numbers */}
          <div className="stats-grid">
            <div className="stat-card overall-pct">
              <div className="stat-card-icon">
                <Percent size={20} />
              </div>
              <div className="stat-card-info">
                <p>Overall Attendance</p>
                <h2>{overallTotal > 0 ? `${overallPct.toFixed(1)}%` : '--%'}</h2>
              </div>
            </div>
            <div className="stat-card attended">
              <div className="stat-card-icon">
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card-info">
                <p>Classes Attended</p>
                <h2>{totalAttended}</h2>
              </div>
            </div>
            <div className="stat-card missed">
              <div className="stat-card-icon">
                <XCircle size={20} />
              </div>
              <div className="stat-card-info">
                <p>Classes Missed</p>
                <h2>{totalMissed}</h2>
              </div>
            </div>
            <div className="stat-card target-goal">
              <div className="stat-card-icon">
                <Target size={20} />
              </div>
              <div className="stat-card-info">
                <p>Overall Target Goal</p>
                <h2>{overallTargetPct}%</h2>
              </div>
            </div>
          </div>

          {/* Target progress panel */}
          <div className="glass-card progress-container">
            <div className="progress-header">
              <span>Overall Attendance Target Progress</span>
              <span>{overallPct.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(overallPct, 100)}%`,
                  background: overallTotal === 0 ? 'var(--primary-gradient)' : overallPct >= overallTargetPct ? 'var(--safe)' : overallPct >= (overallTargetPct - 5) ? 'var(--warning)' : 'var(--danger)'
                }}
              ></div>
            </div>
            <div
              id="statusMessage"
              style={{
                color: overallTotal === 0 ? 'var(--text-muted)' : overallPct >= overallTargetPct ? 'var(--safe)' : overallPct >= (overallTargetPct - 5) ? 'var(--warning)' : 'var(--danger)'
              }}
            >
              {overallTotal === 0
                ? 'Welcome! Seed or add some subjects directory and record checklist class logs below!'
                : overallPct >= overallTargetPct
                ? 'Awesome work! You are comfortably exceeding your target goals! 🎉'
                : overallPct >= (overallTargetPct - 5)
                ? 'Caution: You are running slightly below target attendance. Attend a few more sessions!'
                : 'Warning: Attendance levels are critically low. Focus on attending upcoming classes!'}
            </div>
          </div>

          {/* Today's Schedule Agenda Checklist (shown prominently first!) */}
          <div className="glass-card">
            <div className="card-title-row">
              <h3><Clock size={16} /> Today's Agenda Checklist</h3>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{currentDayName}</span>
            </div>
            <div className="agenda-list">
              {todaySchedule.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <div className="empty-state-icon" style={{ fontSize: '24px' }}>🏖️</div>
                  <p style={{ fontSize: '13px' }}>No classes scheduled for today! Enjoy your free time or configure classes in the <strong>Weekly Planner</strong> tab.</p>
                </div>
              ) : (
                todaySchedule.map(slot => {
                  const todayStatus = getTodayLogStatus(slot.subject.name);
                  return (
                    <div key={slot.id} className="agenda-item">
                      <div className="agenda-details">
                        <span className="agenda-subject">{slot.subject.name}</span>
                        <span className="agenda-time"><Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {slot.time}</span>
                      </div>
                      <div className="agenda-actions">
                        {todayStatus ? (
                          <div className={`agenda-status-capsule ${todayStatus}`}>
                            {todayStatus === 'attended' && <><Check size={12} /> Attended Today</>}
                            {todayStatus === 'missed' && <><X size={12} /> Missed Today</>}
                            {todayStatus === 'cancelled' && <><Slash size={12} /> Cancelled Today</>}
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleCheckInAttendance(slot.subject.name, 'attended')}>
                              <Check size={13} /> Present
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCheckInAttendance(slot.subject.name, 'missed')}>
                              <X size={13} /> Absent
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCheckInAttendance(slot.subject.name, 'cancelled')}>
                              <Slash size={13} /> Cancelled
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Double charts wrappers */}
          <div className="charts-wrapper">
            <div className="glass-card" style={{ marginBottom: 0 }}>
              <div className="card-title-row">
                <h3><BarChart2 size={16} /> Attendance by Subject</h3>
              </div>
              <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                {subjects.length > 0 ? (
                  <canvas ref={barChartRef}></canvas>
                ) : (
                  <div className="empty-state">
                    <p>Add subjects directory below to draw analytics.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: 0 }}>
              <h3><PieChart size={16} /> Distribution</h3>
              <div style={{ position: 'relative', height: '180px', width: '100%', marginTop: '15px' }}>
                {subjects.length > 0 ? (
                  <canvas ref={doughnutChartRef}></canvas>
                ) : (
                  <div className="empty-state">
                    <p>Distribution details</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subjects Directory grid listing */}
          <div className="glass-card" style={{ marginTop: '25px' }}>
            <div className="card-title-row">
              <h3>📚 Subjects Directory</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenSubjectModal()}>
                <Plus size={14} /> Add Subject
              </button>
            </div>
            <div className="subject-grid">
              {subjects.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: 'span 3' }}>
                  <div className="empty-state-icon">📚</div>
                  <p>No subjects added yet. Click the "Add Subject" button above to get started.</p>
                </div>
              ) : (
                subjects.map(sub => {
                  const total = sub.present + sub.absent;
                  const percentage = total > 0 ? (sub.present / total) * 100 : 0;
                  let statusClass = 'safe';
                  let statusDetail = '';

                  if (percentage >= sub.target) {
                    let bunkable = 0;
                    while ((sub.present * 100) / (total + bunkable + 1) >= sub.target) {
                      bunkable++;
                    }
                    statusClass = 'safe';
                    statusDetail = bunkable > 0 ? `Can bunk ${bunkable} more classes safely` : `Cannot bunk any classes`;
                  } else {
                    let needed = 0;
                    while (((sub.present + needed) * 100) / (total + needed) < sub.target) {
                      needed++;
                    }
                    statusClass = percentage >= (sub.target - 5) ? 'warning' : 'danger';
                    statusDetail = `Need to attend ${needed} consecutive sessions`;
                  }

                  return (
                    <div key={sub.id} className="subject-item-card">
                      <div className="subject-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0 }}>{sub.name}</h4>
                          <span className={`status-badge ${statusClass}`}>
                            {statusClass === 'safe' ? 'Safe 😎' : statusClass === 'warning' ? 'Warning ⚠️' : 'Critical 🚨'}
                          </span>
                        </div>
                        <span>Goal target: {sub.target}%</span>
                      </div>

                      <div className="subject-stats-row">
                        <div>Attended: <strong>{sub.present}</strong></div>
                        <div>Missed: <strong>{sub.absent}</strong></div>
                        <div>Total: <strong>{total}</strong></div>
                      </div>

                      <div className="subject-progress-container">
                        <div className="subject-progress-header">
                          <span>Current Attendance</span>
                          <strong className={statusClass}>{percentage.toFixed(1)}%</strong>
                        </div>
                        <div className="subject-progress-bar">
                          <div
                            className={`subject-progress-fill ${statusClass}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>
                          {statusDetail}
                        </div>
                      </div>

                      <div className="subject-actions" style={{ marginTop: '5px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenSubjectModal(sub)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubject(sub.id, sub.name)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* TAB 2: WEEKLY PLANNER TIMETABLE */}
        <div className={`tab-content ${currentTab === 'timetable' ? 'active' : ''}`}>
          <div className="glass-card">
            <div className="card-title-row">
              <h3><Calendar size={16} /> Weekly Class Timetable</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setModals(prev => ({ ...prev, timetable: true }))}>
                <Plus size={14} /> Add Class Slot
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Define your weekly class schedule here. Classes configured here will automatically appear in your **Today's Agenda Checklist** on the Dashboard for easy tracking! Click a scheduled slot to delete it.
            </p>

            <div className="timetable-grid-wrapper" style={{ overflowX: 'auto' }}>
              <div className="timetable-grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const slots = timetable.filter(s => s.day === day);
                  return (
                    <div key={day} style={{ display: 'contents' }}>
                      <div className="day-header">{day}</div>
                      <div className="day-slots">
                        {slots.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No slots scheduled</span>
                        ) : (
                          slots.map(slot => (
                            <div key={slot.id} className="timetable-slot" title="Click delete icon to remove class hour">
                              <span><strong>{slot.subject.name}</strong> ({slot.time})</span>
                              <span className="timetable-slot-del" onClick={(e) => { e.stopPropagation(); handleDeleteTimetableSlot(slot.id); }} title="Remove this scheduled hour">
                                <Trash2 size={12} />
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TAB 3: LOGS & HISTORY */}
      <div className={`tab-content ${currentTab === 'history' ? 'active' : ''}`}>
        <div className="glass-card">
          <div className="card-title-row">
            <h3><History size={16} /> Historical Attendance Log</h3>
            <button className="btn btn-danger btn-sm" onClick={handleWipeHistoryOnly}>
              <Trash2 size={13} /> Reset History Only
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            A complete historical log of all class attendance markings. You can remove individual entries if you made a mistake, which will instantly recalculate your metrics.
          </p>

          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Filter by Subject</label>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Filter by Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="attended">Attended</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="timeline-container">
            {filteredLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No logged attendance found matching filter selections.</p>
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className={`timeline-item ${log.status}`}>
                  <div className="timeline-desc">
                    <span className="timeline-title">{log.subject.name}</span>
                    <span className="timeline-date">{new Date(log.timestamp).toLocaleString("en-US", {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                    <span className={`timeline-tag ${log.status}`}>{log.status}</span>
                  </div>
                  <div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHistoryLog(log.id)}>
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* TAB 4: WHAT-IF SIMULATOR */}
      <div className={`tab-content ${currentTab === 'simulator' ? 'active' : ''}`}>
        <div className="glass-card">
          <h3><Sliders size={16} /> "What-If" Attendance Simulator</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Simulate future class decisions to see exactly how your choices will impact your metrics. Pick a subject to start playing with the parameters!
          </p>

          <div className="form-group" style={{ maxWidth: '300px', marginBottom: '25px' }}>
            <label>Select Subject to Simulate</label>
            <select value={simSubjectName} onChange={e => { setSimSubjectName(e.target.value); setSimAttendVal(0); setSimBunkVal(0); }}>
              <option value="">Select Subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {simSubject ? (
            <div className="simulator-layout">
              <div className="stats-grid">
                <div className="stat-card overall-pct">
                  <div className="stat-card-icon">
                    <Percent size={20} />
                  </div>
                  <div className="stat-card-info">
                    <p>Current Percentage</p>
                    <h2>{simCurrentPct}</h2>
                  </div>
                </div>
                <div className={`stat-card ${simStatusClass === 'safe' ? 'attended' : simStatusClass === 'warning' ? 'target-goal' : 'missed'}`}>
                  <div className="stat-card-icon">
                    <BarChart2 size={20} />
                  </div>
                  <div className="stat-card-info">
                    <p>Projected Percentage</p>
                    <h2>{simProjectedPct}</h2>
                  </div>
                </div>
                <div className={`stat-card ${simStatusClass === 'safe' ? 'attended' : simStatusClass === 'warning' ? 'target-goal' : 'missed'}`}>
                  <div className="stat-card-icon">
                    {simStatusClass === 'safe' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="stat-card-info">
                    <p>Projected Status</p>
                    <h2 style={{ color: simStatusClass === 'safe' ? 'var(--safe)' : simStatusClass === 'warning' ? 'var(--warning)' : 'var(--danger)' }}>{simStatus}</h2>
                  </div>
                </div>
              </div>

              <div className="sim-slider-group">
                <div className="sim-slider-header">
                  <span>Simulate Attending Future Classes</span>
                  <span className="sim-slider-val">{simAttendVal}</span>
                </div>
                <input type="range" min="0" max="30" value={simAttendVal} onChange={e => setSimAttendVal(parseInt(e.target.value))} />
              </div>

              <div className="sim-slider-group">
                <div className="sim-slider-header">
                  <span>Simulate Bunking Future Classes</span>
                  <span className="sim-slider-val">{simBunkVal}</span>
                </div>
                <input type="range" min="0" max="30" value={simBunkVal} onChange={e => setSimBunkVal(parseInt(e.target.value))} />
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--border-color)' }}>
                {simConclusionText}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎛️</div>
              <p>Please select a subject from the dropdown above to launch the interactive simulator.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Subject Modal */}
      {modals.subject && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{subjectForm.id ? `Edit ${subjectForm.name}` : 'Add New Subject'}</h3>
              <button className="close-btn" onClick={() => setModals(prev => ({ ...prev, subject: false }))}>&times;</button>
            </div>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems, Computer Networks"
                  value={subjectForm.name}
                  onChange={e => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Classes Attended</label>
                <input
                  type="number"
                  min="0"
                  value={subjectForm.present}
                  onChange={e => setSubjectForm(prev => ({ ...prev, present: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Classes Missed</label>
                <input
                  type="number"
                  min="0"
                  value={subjectForm.absent}
                  onChange={e => setSubjectForm(prev => ({ ...prev, absent: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Target Attendance Goal (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={subjectForm.target}
                  onChange={e => setSubjectForm(prev => ({ ...prev, target: parseInt(e.target.value) || 75 }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, subject: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSubject}>Save Subject</button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable slot Modal */}
      {modals.timetable && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Scheduled Class</h3>
              <button className="close-btn" onClick={() => setModals(prev => ({ ...prev, timetable: false }))}>&times;</button>
            </div>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Day of the Week</label>
                <select value={timetableForm.day} onChange={e => setTimetableForm(prev => ({ ...prev, day: e.target.value }))}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Select Registered Subject</label>
                <select value={timetableForm.subjectName} onChange={e => setTimetableForm(prev => ({ ...prev, subjectName: e.target.value }))}>
                  <option value="">Choose subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Time Slot / Hour</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM - 10:00 AM"
                  value={timetableForm.time}
                  onChange={e => setTimetableForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, timetable: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTimetableSlot}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Backup / Database settings Modal */}
      {modals.backup && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Backup & SQLite Database Control</h3>
              <button className="close-btn" onClick={() => setModals(prev => ({ ...prev, backup: false }))}>&times;</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              All records are stored dynamically inside a secure, private full-stack **SQLite database** mapped to your profile.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleExportData} style={{ width: '100%' }}>
                <Download size={14} /> Download Local JSON Backup
              </button>
              
              <div style={{ position: 'relative', width: '100%' }}>
                <button className="btn btn-secondary" onClick={() => document.getElementById('importFile').click()} style={{ width: '100%' }}>
                  <Upload size={14} /> Upload JSON Backup File
                </button>
                <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => handleResetAndSeed('seed')} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <RefreshCw size={14} /> Load Demo Mock Dataset
                </button>

                <button className="btn btn-danger" onClick={() => handleResetAndSeed('wipe')} style={{ width: '100%' }}>
                  <Trash2 size={14} /> Factory Reset Database
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, backup: false }))}>Close</button>
            </div>
          </div>
        </div>
      )}

    </main>
  </div>
);
}
