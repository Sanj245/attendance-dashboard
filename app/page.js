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
    backup: false,
    editTimePeriod: false
  });

  // Period Columns state & Editor state
  const [customPeriodColumns, setCustomPeriodColumns] = useState([
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:35 PM - 01:30 PM',
    '01:30 PM - 02:25 PM',
    '02:25 PM - 03:20 PM',
    '03:20 PM - 04:15 PM'
  ]);
  const [editingPeriodIndex, setEditingPeriodIndex] = useState(null);
  const [editingPeriodValue, setEditingPeriodValue] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [markedAttendance, setMarkedAttendance] = useState({}); // { [subjectName]: 'attended' | 'missed' }
  const [wipeArmed, setWipeArmed] = useState(false);

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
  const [simTotalFuture, setSimTotalFuture] = useState(10);
  const [simAttendVal, setSimAttendVal] = useState(0);
  const [simBunkVal, setSimBunkVal] = useState(0);
  const [simMode, setSimMode] = useState('calculator'); // 'calculator' | 'slider'
  const [simulatedBunks, setSimulatedBunks] = useState({});

  // References for Charts DOM and Main Scroll Container
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);
  const mainContentRef = useRef(null);

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

    try {
      const cachedCols = localStorage.getItem('planner_period_columns');
      if (cachedCols) {
        const parsed = JSON.parse(cachedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomPeriodColumns(parsed);
        }
      }
    } catch (e) {}

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

  // --- Standardized Time Formatter ---
  const formatStandardTime = (rawTime) => {
    if (!rawTime || typeof rawTime !== 'string') return '09:00 AM';
    let str = rawTime.trim();
    if (!str) return '09:00 AM';

    const formatSingle = (token, defaultPeriod = null) => {
      let raw = token.trim();
      let isPM = /pm/i.test(raw);
      let isAM = /am/i.test(raw);
      let clean = raw.replace(/(am|pm)/gi, '').trim();

      let hours = 9;
      let minutes = 0;

      if (clean.includes(':') || clean.includes('.')) {
        const parts = clean.split(/[:.]/);
        hours = parseInt(parts[0], 10) || 9;
        minutes = parseInt(parts[1], 10) || 0;
      } else {
        hours = parseInt(clean, 10) || 9;
      }

      if (isPM) {
        if (hours < 12) hours += 12;
      } else if (isAM) {
        if (hours === 12) hours = 0;
      } else if (defaultPeriod === 'pm') {
        if (hours < 12 && hours !== 11 && hours !== 10 && hours !== 9 && hours !== 8) hours += 12;
      } else if (defaultPeriod === 'am') {
        if (hours === 12) hours = 0;
      } else {
        if (hours >= 1 && hours <= 6) hours += 12;
      }

      let period = hours >= 12 ? 'PM' : 'AM';
      let displayHour = hours % 12;
      if (displayHour === 0) displayHour = 12;

      const formattedHour = String(displayHour).padStart(2, '0');
      const formattedMin = String(minutes).padStart(2, '0');
      return `${formattedHour}:${formattedMin} ${period}`;
    };

    if (/[-–to]/i.test(str)) {
      const parts = str.split(/[-–]|(?:\s+to\s+)/i);
      if (parts.length >= 2) {
        let startStr = parts[0].trim();
        let endStr = parts[1].trim();

        let endPeriod = /pm/i.test(endStr) ? 'pm' : /am/i.test(endStr) ? 'am' : null;
        let startPeriod = /pm/i.test(startStr) ? 'pm' : /am/i.test(startStr) ? 'am' : null;

        if (!startPeriod && endPeriod) {
          startPeriod = endPeriod;
          const startH = parseInt(startStr.split(/[:.]/)[0], 10);
          const endH = parseInt(endStr.split(/[:.]/)[0], 10);
          if (startH === 11 || startH === 10 || startH === 9 || startH === 8) {
            startPeriod = 'am';
          }
        }

        return `${formatSingle(startStr, startPeriod)} - ${formatSingle(endStr, endPeriod)}`;
      }
    }

    return formatSingle(str);
  };

  const getGridTimeColumns = () => {
    const columns = [...customPeriodColumns];
    timetable.forEach(s => {
      if (s.time) {
        const formatted = formatStandardTime(s.time);
        if (!columns.includes(formatted)) {
          columns.push(formatted);
        }
      }
    });
    return columns;
  };

  const handleOpenEditPeriodModal = (index, currentVal) => {
    setEditingPeriodIndex(index);
    setEditingPeriodValue(currentVal);
    setModals(prev => ({ ...prev, editTimePeriod: true }));
  };

  const handleSavePeriodTimeEdit = async () => {
    if (editingPeriodIndex === null || !editingPeriodValue.trim()) return;

    const formattedNew = formatStandardTime(editingPeriodValue.trim());
    const gridCols = getGridTimeColumns();
    const oldVal = gridCols[editingPeriodIndex];

    const updatedCols = [...customPeriodColumns];
    if (editingPeriodIndex < updatedCols.length) {
      updatedCols[editingPeriodIndex] = formattedNew;
    } else {
      updatedCols.push(formattedNew);
    }
    setCustomPeriodColumns(updatedCols);
    try {
      localStorage.setItem('planner_period_columns', JSON.stringify(updatedCols));
    } catch (e) {}

    try {
      const matchingSlots = timetable.filter(s => {
        const formatted = formatStandardTime(s.time);
        return formatted === oldVal || (oldVal && formatted.startsWith(oldVal.split(' - ')[0]));
      });
      for (const slot of matchingSlots) {
        await fetch(`/api/timetable/${slot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day: slot.day, subjectName: slot.subject.name, time: formattedNew })
        });
      }
      showToast(`Updated period timing to ${formattedNew}!`, 'success');
      setModals(prev => ({ ...prev, editTimePeriod: false }));
      fetchDatabase();
    } catch (e) {
      showToast(`Updated period timing to ${formattedNew}`, 'info');
      setModals(prev => ({ ...prev, editTimePeriod: false }));
    }
  };

  const handleDeletePeriodColumn = async (colIndex, colTime) => {
    const gridCols = getGridTimeColumns();
    const targetTime = colTime || gridCols[colIndex];

    const currentCols = customPeriodColumns.length > 0 ? customPeriodColumns : gridCols;
    const updatedCols = currentCols.filter((_, i) => i !== colIndex);
    setCustomPeriodColumns(updatedCols);
    try {
      localStorage.setItem('planner_period_columns', JSON.stringify(updatedCols));
    } catch (e) {}

    try {
      const matchingSlots = timetable.filter(s => {
        const formatted = formatStandardTime(s.time);
        return formatted === targetTime || (targetTime && formatted.startsWith(targetTime.split(' - ')[0]));
      });
      for (const slot of matchingSlots) {
        await fetch(`/api/timetable/${slot.id}`, { method: 'DELETE' });
      }
      showToast(`Removed period column (${targetTime})`, 'info');
      fetchDatabase();
    } catch (e) {
      showToast(`Removed period column (${targetTime})`, 'info');
    }
  };

  const handleAddPeriodColumn = () => {
    const gridCols = getGridTimeColumns();
    handleOpenEditPeriodModal(gridCols.length, '04:15 PM - 05:10 PM');
  };




  const getBunkSafetyInfo = (subjectName) => {
    const sub = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (!sub) return null;

    const total = sub.present + sub.absent;
    const currentPct = total > 0 ? (sub.present / total) * 100 : 0;

    // Check what happens if we bunk 1 class right now
    const ifBunkPct = total > 0 ? ((sub.present) / (total + 1)) * 100 : 0;

    let maxBunks = 0;
    while (((sub.present) / (total + maxBunks + 1)) * 100 >= sub.target) {
      maxBunks++;
    }

    if (currentPct < sub.target) {
      let needed = 0;
      while (((sub.present + needed) * 100) / (total + needed) < sub.target) {
        needed++;
      }
      return {
        status: 'danger',
        label: `🚨 Must Attend! (Short by ${needed} class${needed > 1 ? 'es' : ''})`,
        badgeText: `🚨 Must Attend`,
        bunkAllowed: false,
        maxBunks: 0,
        needed,
        currentPct: currentPct.toFixed(1)
      };
    }

    if (ifBunkPct >= sub.target) {
      return {
        status: 'safe',
        label: `🟢 Safe to Bunk! (${maxBunks} bunk${maxBunks !== 1 ? 's' : ''} left)`,
        badgeText: `🟢 Bunk OK (${maxBunks})`,
        bunkAllowed: true,
        maxBunks,
        currentPct: currentPct.toFixed(1)
      };
    } else {
      return {
        status: 'warning',
        label: `⚠️ Caution (bunking drops to ${ifBunkPct.toFixed(1)}%)`,
        badgeText: `⚠️ Caution`,
        bunkAllowed: false,
        maxBunks: 0,
        currentPct: currentPct.toFixed(1)
      };
    }
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
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      showToast(`Subject "${name}" deleted successfully.`, 'warning');
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
      const formattedTime = formatStandardTime(time);
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, subjectName, time: formattedTime })
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

      // Track marked state so card transforms immediately
      setMarkedAttendance(prev => ({ ...prev, [subjectName]: status }));

      showToast(`"${subjectName}" marked as ${status === 'attended' ? 'Attended ✅' : 'Not Attended ❌'}`, status === 'attended' ? 'success' : 'danger');

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

  const handleUndoAttendance = async (subjectName) => {
    // Find the most recent log entry for this subject and delete it
    const recentLog = [...logs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .find(l => l.subject.name === subjectName);

    if (!recentLog) {
      setMarkedAttendance(prev => { const n = { ...prev }; delete n[subjectName]; return n; });
      return;
    }

    try {
      const res = await fetch(`/api/logs/${recentLog.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to undo');
      setMarkedAttendance(prev => { const n = { ...prev }; delete n[subjectName]; return n; });
      showToast(`Undone mark for "${subjectName}".`, 'warning');
      fetchDatabase();
    } catch (e) {
      showToast('Could not undo. Please try again.', 'danger');
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
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Action executed successfully.', action === 'seed' ? 'success' : 'danger');
      setModals(prev => ({ ...prev, backup: false }));
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

  let calcData = null;

  if (simSubject) {
    const present = simSubject.present;
    const absent = simSubject.absent;
    const currentTotal = present + absent;
    const currentPct = currentTotal > 0 ? (present / currentTotal) * 100 : 0;
    simCurrentPct = currentTotal > 0 ? `${currentPct.toFixed(1)}%` : '--%';

    // --- Future Bunk Calculator Mode Math ---
    const futureN = Math.max(1, parseInt(simTotalFuture) || 0);
    const target = simSubject.target;
    const finalTotal = currentTotal + futureN;
    const requiredTotalAttended = Math.ceil(finalTotal * (target / 100));
    const minMustAttend = Math.max(0, requiredTotalAttended - present);
    let maxCanBunk = futureN - minMustAttend;
    let isAttainable = true;

    if (minMustAttend > futureN) {
      isAttainable = false;
      maxCanBunk = 0;
    }

    const safeBunkPct = isAttainable ? ((present + minMustAttend) / finalTotal) * 100 : ((present + futureN) / finalTotal) * 100;

    calcData = {
      present,
      absent,
      currentTotal,
      currentPct: currentPct.toFixed(1),
      target,
      futureN,
      finalTotal,
      requiredTotalAttended,
      minMustAttend,
      maxCanBunk,
      isAttainable,
      safeBunkPct: safeBunkPct.toFixed(1),
      maxPossiblePct: (((present + futureN) / finalTotal) * 100).toFixed(1)
    };

    // --- Custom Sliders Mode Math ---
    const simulatedAttended = present + simAttendVal;
    const simulatedMissed = absent + simBunkVal;
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
    dlAnchorElem.setAttribute('download', `planner_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
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
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
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

      {/* Sidebar overlay for mobile - click outside to close */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

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
      <main className="main-content" ref={mainContentRef}>

        {/* Top contextual page header bar */}
        <div className="greeting-row">
          <div className="greeting-info">
            <h2>
              {currentTab === 'dashboard' && <>Hello, {activeUser.username}! 👋</>}
              {currentTab === 'timetable' && <>Weekly Planner 📅</>}
              {currentTab === 'history' && <>Logs & Timeline 📋</>}
              {currentTab === 'simulator' && <>What-If Simulator 🎛️</>}
            </h2>
            <p>
              {currentTab === 'dashboard' && 'Welcome back to your attendance dashboard.'}
              {currentTab === 'timetable' && 'Manage your weekly class schedule here.'}
              {currentTab === 'history' && 'Browse and manage all your attendance check-in logs.'}
              {currentTab === 'simulator' && 'Simulate future class decisions to project your attendance.'}
            </p>
          </div>
          <div className="header-actions">
            {wipeArmed ? (
              <button
                className="btn btn-danger btn-sm"
                style={{ outline: '2px solid #ef4444', animation: 'pulse 0.4s ease' }}
                onClick={() => { setWipeArmed(false); handleResetAndSeed('wipe'); }}
                onBlur={() => setTimeout(() => setWipeArmed(false), 200)}
              >
                <Trash2 size={13} /> Confirm Delete All?
              </button>
            ) : (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setWipeArmed(true)}
                title="Wipe all subjects, timetable and logs"
              >
                <Trash2 size={13} /> Delete Everything
              </button>
            )}
            <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }} onClick={handleToggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        <div className={`tab-content ${currentTab === 'dashboard' ? 'active' : ''}`}>

          {/* Subjects Directory grid listing — shown first so user sees all subjects immediately */}
          <div className="glass-card">
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
                        {confirmingDeleteId === sub.id ? (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ outline: '2px solid #ef4444', animation: 'pulse 0.5s ease' }}
                            onClick={() => { setConfirmingDeleteId(null); handleDeleteSubject(sub.id, sub.name); }}
                            onBlur={() => setTimeout(() => setConfirmingDeleteId(null), 200)}
                          >
                            <Trash2 size={13} /> Confirm?
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmingDeleteId(sub.id)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Schedule Agenda Checklist */}
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
                  const safetyInfo = getBunkSafetyInfo(slot.subject.name);
                  return (
                    <div key={slot.id} className="agenda-item">
                      <div className="agenda-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="agenda-subject">{slot.subject.name}</span>
                          {safetyInfo && (
                            <span className={`status-badge ${safetyInfo.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {safetyInfo.label}
                            </span>
                          )}
                        </div>
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

          {/* Charts */}
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
                    <p>Add subjects to draw analytics.</p>
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

        </div>
        {/* END TAB 1 */}


        {/* TAB 2: WEEKLY PLANNER TIMETABLE */}
        <div className={`tab-content ${currentTab === 'timetable' ? 'active' : ''}`}>
          <div className="glass-card">
            <div className="card-title-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3><Calendar size={16} /> Weekly Class Timetable</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total {timetable.length} scheduled class hours across the week (Click ✏️ icon on any period header to edit timing)
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Define your weekly class schedule in this <strong>Timetable Matrix Grid</strong>. Click the ✏️ icon on any time period header to edit timing, or click <strong>+ Add</strong> in any cell to schedule a class!
            </p>

            <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              {(() => {
                const gridTimeCols = getGridTimeColumns();
                return (
                  <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '14px 16px', width: '130px', textAlign: 'left', fontWeight: 800, color: 'var(--primary)', borderRight: '1px solid var(--border-color)' }}>
                          Day / Period
                        </th>
                        {gridTimeCols.map((colTime, i) => (
                          <th
                            key={i}
                            className="timetable-period-th"
                            style={{
                              padding: '12px 10px',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              borderRight: '1px solid var(--border-color)',
                              minWidth: '155px',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                                <Clock size={12} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                                <span>{colTime}</span>
                              </div>
                              
                              {/* Hover Action Bar */}
                              <div className="period-th-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <button
                                  onClick={() => handleOpenEditPeriodModal(i, colTime)}
                                  title="Edit Period Timing"
                                  className="period-action-btn edit"
                                >
                                  <Edit2 size={10} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePeriodColumn(i, colTime)}
                                  title="Remove Column"
                                  className="period-action-btn delete"
                                >
                                  <X size={10} />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                        {/* Integrated Add Period Column Header */}
                        <th
                          onClick={handleAddPeriodColumn}
                          title="Add new period column"
                          className="add-period-header-th"
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            borderRight: 'none',
                            cursor: 'pointer',
                            background: 'rgba(99, 102, 241, 0.04)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '12px',
                            userSelect: 'none',
                            minWidth: '110px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Plus size={14} />
                            <span>Add Period</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                        const isToday = currentDayName === day;
                        return (
                          <tr key={day} style={{ borderBottom: '1px solid var(--border-color)', background: isToday ? 'rgba(99, 102, 241, 0.04)' : 'transparent' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 700, borderRight: '1px solid var(--border-color)', background: isToday ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.01)', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{day}</span>
                                {isToday && (
                                  <span className="status-badge safe" style={{ fontSize: '9px', padding: '1px 6px', width: 'fit-content' }}>
                                    Today
                                  </span>
                                )}
                              </div>
                            </td>

                            {gridTimeCols.map((colTime, idx) => {
                              const matchedSlots = timetable.filter(s => {
                                if (s.day !== day) return false;
                                const formatted = formatStandardTime(s.time);
                                return formatted === colTime || formatted.startsWith(colTime.split(' - ')[0]);
                              });

                              return (
                                <td key={idx} style={{ padding: '8px', borderRight: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                                  {matchedSlots.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {matchedSlots.map(slot => {
                                        const safetyInfo = getBunkSafetyInfo(slot.subject.name);
                                        return (
                                          <div
                                            key={slot.id}
                                            style={{
                                              padding: '8px 10px',
                                              borderRadius: '8px',
                                              background: 'var(--input-bg)',
                                              border: '1px solid var(--border-color)',
                                              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '4px'
                                            }}
                                          >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                                              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>
                                                {slot.subject.name}
                                              </span>
                                              <button
                                                onClick={() => handleDeleteTimetableSlot(slot.id)}
                                                title="Delete class slot"
                                                style={{
                                                  border: 'none',
                                                  background: 'rgba(239, 68, 68, 0.1)',
                                                  color: '#ef4444',
                                                  borderRadius: '4px',
                                                  padding: '2px 4px',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>

                                            {safetyInfo && (
                                              <span className={`status-badge ${safetyInfo.status}`} style={{ fontSize: '8px', padding: '1px 5px', width: 'fit-content' }}>
                                                {safetyInfo.badgeText}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setTimetableForm({ day, subjectName: subjects[0]?.name || '', time: colTime });
                                        setModals(prev => ({ ...prev, timetable: true }));
                                      }}
                                      style={{
                                        width: '100%',
                                        height: '42px',
                                        border: '1px dashed var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        opacity: 0.6,
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <Plus size={11} /> Add
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>

        {/* TAB 3: LOGS & TIMELINE */}
        <div className={`tab-content ${currentTab === 'history' ? 'active' : ''}`}>

          {/* Mark Attendance Card View */}
          <div className="glass-card">
            <div className="card-title-row">
              <div>
                <h3><History size={16} /> Mark Attendance</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mark each subject as Attended or Not Attended. Your attendance updates instantly.</span>
              </div>
              {Object.keys(markedAttendance).length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMarkedAttendance({})}
                >
                  Reset All Marks
                </button>
              )}
            </div>

            {subjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No subjects registered. Add subjects on the Dashboard tab first.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
                {subjects.map(sub => {
                  const safety = getBunkSafetyInfo(sub.name);
                  const total = sub.present + sub.absent;
                  const pct = total > 0 ? ((sub.present / total) * 100).toFixed(1) : '0.0';
                  const marked = markedAttendance[sub.name];
                  const isAttended = marked === 'attended';
                  const isMissed = marked === 'missed';

                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: marked
                          ? isAttended ? 'rgba(16, 185, 129, 0.07)' : 'rgba(239, 68, 68, 0.07)'
                          : 'var(--input-bg)',
                        border: marked
                          ? `1.5px solid ${isAttended ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                          : '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Subject Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{sub.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {sub.present}P / {sub.absent}A &nbsp;•&nbsp; <strong style={{ color: parseFloat(pct) >= sub.target ? 'var(--safe)' : 'var(--danger)' }}>{pct}%</strong>
                          </div>
                        </div>
                        {safety && (
                          <span className={`status-badge ${safety.status}`} style={{ fontSize: '10px', padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {safety.badgeText}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ height: '4px', borderRadius: '99px', background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(parseFloat(pct), 100)}%`, background: parseFloat(pct) >= sub.target ? 'var(--safe)' : parseFloat(pct) >= sub.target - 5 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.4s ease' }} />
                      </div>

                      {/* Action Area: transforms after marking */}
                      {marked ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: isAttended ? 'var(--safe)' : 'var(--danger)'
                          }}>
                            {isAttended ? <Check size={16} /> : <X size={16} />}
                            {isAttended ? 'Attended' : 'Not Attended'}
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUndoAttendance(sub.name)}
                          >
                            ↩ Undo
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
                            onClick={() => handleCheckInAttendance(sub.name, 'attended')}
                          >
                            <Check size={13} /> Attended
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
                            onClick={() => handleCheckInAttendance(sub.name, 'missed')}
                          >
                            <X size={13} /> Not Attended
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>



        {/* TAB 4: WHAT-IF SIMULATOR */}
        <div className={`tab-content ${currentTab === 'simulator' ? 'active' : ''}`}>

          {/* Subject Bunk Safety Overview */}
          <div className="glass-card" style={{ marginBottom: '20px' }}>
            <div className="card-title-row">
              <div>
                <h3><Sliders size={16} /> What-If Bunk Calculator</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select a subject, enter future class count, and instantly know how many you can safely skip or must attend.</span>
              </div>
            </div>

            {/* Subject Selector + Future Count Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Select Subject</label>
                <select
                  value={simSubjectName}
                  onChange={e => {
                    const name = e.target.value;
                    setSimSubjectName(name);
                    if (name) {
                      const count = timetable.filter(s => s.subject.name === name).length;
                      setSimTotalFuture(count > 0 ? count : 10);
                    }
                  }}
                >
                  <option value="">-- Choose a subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  Future Classes
                  {simSubjectName && (() => {
                    const count = timetable.filter(s => s.subject.name === simSubjectName).length;
                    return count > 0 ? (
                      <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600, marginLeft: '6px' }}>
                        ({count} slots/week from timetable)
                      </span>
                    ) : null;
                  })()}
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={simTotalFuture}
                  onChange={e => setSimTotalFuture(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            {/* Result Card */}
            {!simSubjectName ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(99,102,241,0.04)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎯</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Pick a subject above to see your bunk forecast</div>
              </div>
            ) : calcData && (() => {
              const { present, absent, currentTotal, currentPct, target, futureN, finalTotal, minMustAttend, maxCanBunk, isAttainable, safeBunkPct, maxPossiblePct } = calcData;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Status Banner */}
                  <div style={{
                    padding: '20px 24px',
                    borderRadius: '16px',
                    background: isAttainable && maxCanBunk > 0 ? 'rgba(16, 185, 129, 0.08)' : isAttainable ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${isAttainable && maxCanBunk > 0 ? 'rgba(16,185,129,0.25)' : isAttainable ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: isAttainable && maxCanBunk > 0 ? 'var(--safe)' : isAttainable ? 'var(--warning)' : 'var(--danger)', marginBottom: '4px' }}>
                        {isAttainable && maxCanBunk > 0
                          ? `😎 You can skip ${maxCanBunk} class${maxCanBunk !== 1 ? 'es' : ''}!`
                          : isAttainable
                            ? `⚠️ You must attend all ${futureN} classes`
                            : `🚨 Even all ${futureN} classes won't be enough`}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {simSubjectName} &nbsp;•&nbsp; Target: <strong>{target}%</strong> &nbsp;•&nbsp; Over next <strong>{futureN}</strong> classes
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>IF YOU ATTEND {minMustAttend}/{futureN}</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: isAttainable ? 'var(--safe)' : 'var(--danger)' }}>{safeBunkPct}%</div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                    {[{
                      label: 'Current Attendance',
                      value: `${currentPct}%`,
                      sub: `${present} attended / ${absent} missed`,
                      color: parseFloat(currentPct) >= target ? 'var(--safe)' : 'var(--danger)'
                    }, {
                      label: 'Must Attend (min)',
                      value: `${minMustAttend}`,
                      sub: `out of ${futureN} future classes`,
                      color: 'var(--primary)'
                    }, {
                      label: 'Can Safely Skip',
                      value: maxCanBunk > 0 ? `${maxCanBunk}` : '0',
                      sub: maxCanBunk > 0 ? `class${maxCanBunk !== 1 ? 'es' : ''} safe to bunk` : 'no bunks allowed',
                      color: maxCanBunk > 0 ? 'var(--safe)' : 'var(--danger)'
                    }, {
                      label: 'Best Case %',
                      value: `${maxPossiblePct}%`,
                      sub: 'if you attend all future',
                      color: 'var(--text-main)'
                    }].map((item, i) => (
                      <div key={i} style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    📊 <strong style={{ color: 'var(--text-main)' }}>How this works:</strong> You currently have {present} attended out of {currentTotal} total classes ({currentPct}%). Over the next {futureN} future classes, you need at least {minMustAttend} attendances to maintain your {target}% target.
                    {isAttainable && maxCanBunk > 0 ? ` That leaves you free to skip up to ${maxCanBunk} class${maxCanBunk !== 1 ? 'es' : ''} without falling below your goal.` : isAttainable ? ` You must attend all upcoming classes to just meet your target.` : ` Even attending all ${futureN} classes won't be enough — consider speaking to your institution about your situation.`}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Per-Subject Bunk Summary */}
          <div className="glass-card">
            <div className="card-title-row">
              <h3 style={{ fontSize: '14px' }}>📚 All Subjects — Current Bunk Safety</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {subjects.length === 0 ? (
                <div className="empty-state"><p>No subjects added yet.</p></div>
              ) : subjects.map(sub => {
                const safety = getBunkSafetyInfo(sub.name);
                const total = sub.present + sub.absent;
                const pct = total > 0 ? ((sub.present / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={sub.id} style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--input-bg)',
                    border: `1px solid ${safety?.status === 'safe' ? 'rgba(16,185,129,0.25)' : safety?.status === 'warning' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setSimSubjectName(sub.name);
                    const count = timetable.filter(s => s.subject.name === sub.name).length;
                    setSimTotalFuture(count > 0 ? count : 10);
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>{sub.name}</span>
                      <span className={`status-badge ${safety?.status || 'safe'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{safety?.badgeText || '—'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {pct}% &nbsp;•&nbsp; Target: {sub.target}%
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: safety?.status === 'safe' ? 'var(--safe)' : safety?.status === 'warning' ? 'var(--warning)' : 'var(--danger)' }}>
                      {safety?.status === 'safe' ? `Can skip ${safety.maxBunks} more class${safety.maxBunks !== 1 ? 'es' : ''}` : safety?.status === 'warning' ? 'Next skip drops below target' : `Need ${safety?.needed} more class${safety?.needed !== 1 ? 'es' : ''}`}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--primary)', fontWeight: 600 }}>Click to simulate →</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* END TAB 4 */}


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

        {/* Edit Period Timing Modal */}
        {modals.editTimePeriod && (
          <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ color: 'var(--primary)', marginRight: '6px' }} /> Edit Period Timing
                </h3>
                <button className="close-btn" onClick={() => setModals(prev => ({ ...prev, editTimePeriod: false }))}>&times;</button>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Period Slot Timing
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 09:00 AM - 10:00 AM"
                  value={editingPeriodValue}
                  onChange={e => setEditingPeriodValue(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Formats like <code>9 to 10</code>, <code>09:00-10:00</code>, or <code>9am - 10am</code> will automatically be standard-formatted!
                </span>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, editTimePeriod: false }))}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSavePeriodTimeEdit}>Save Timing</button>
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

