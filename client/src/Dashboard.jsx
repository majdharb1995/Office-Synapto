import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  
  // حالة الإشعارات الجديدة
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  // حالة المهام
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  // حالة الإجازات
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // حالة الأصول
  const [assets, setAssets] = useState([]);
  const [assetName, setAssetName] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetStatus, setAssetStatus] = useState('available');
  const [assetAssignedTo, setAssetAssignedTo] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  // حالة إدارة المستخدمين
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('2');

  // حالة غرف الاجتماعات والحجوزات
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookRoomId, setBookRoomId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookStartTime, setBookStartTime] = useState('');
  const [bookEndTime, setBookEndTime] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // إغلاق قائمة الإشعارات عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = () => {
    axios.get('http://localhost:5000/api/notifications', axiosConfig).then(res => setNotifications(res.data));
  };

  const exportTasks = () => {
    const dataToExport = tasks.map(t => ({ 'العنوان': t.title, 'الوصف': t.description, 'الحالة': t.status === 'todo' ? 'للتنفيذ' : t.status === 'in_progress' ? 'قيد التنفيذ' : 'مكتمل', 'مسندة إلى': t.assignee_name || 'غير مسندة' }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks_report.csv';
    link.click();
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/stats', axiosConfig).then(res => setStats(res.data));
    axios.get('http://localhost:5000/api/users', axiosConfig).then(res => setUsers(res.data));
    axios.get('http://localhost:5000/api/rooms', axiosConfig).then(res => setRooms(res.data));
    fetchNotifications(); // جلب الإشعارات مع تحميل التطبيق
  }, []);

  useEffect(() => {
    if (activeTab === 'tasks') axios.get('http://localhost:5000/api/tasks', axiosConfig).then(res => setTasks(res.data));
    else if (activeTab === 'leaves') axios.get('http://localhost:5000/api/leaves', axiosConfig).then(res => setLeaves(res.data));
    else if (activeTab === 'assets') axios.get('http://localhost:5000/api/assets', axiosConfig).then(res => setAssets(res.data));
    else if (activeTab === 'bookings') axios.get('http://localhost:5000/api/bookings', axiosConfig).then(res => setBookings(res.data));
  }, [activeTab]);

  const markAsRead = (notifId) => {
    axios.put(`http://localhost:5000/api/notifications/${notifId}/read`, {}, axiosConfig)
      .then(() => fetchNotifications());
  };

  const handleAddTask = (e) => { e.preventDefault(); if (!title) return; axios.post('http://localhost:5000/api/tasks', { title, description, assigned_to: assignedTo ? parseInt(assignedTo) : null }, axiosConfig).then(() => { setTitle(''); setDescription(''); setAssignedTo(''); axios.get('http://localhost:5000/api/tasks', axiosConfig).then(res => setTasks(res.data)); }); };
  const handleStatusChange = (taskId, newStatus) => { const task = tasks.find(t => t.id === taskId); axios.put(`http://localhost:5000/api/tasks/${taskId}`, { title: task.title, description: task.description, status: newStatus, assigned_to: task.assigned_to }, axiosConfig).then(() => axios.get('http://localhost:5000/api/tasks', axiosConfig).then(res => setTasks(res.data))); };
  const handleAddLeave = (e) => { e.preventDefault(); if (!startDate || !endDate) return; axios.post('http://localhost:5000/api/leaves', { start_date: startDate, end_date: endDate, reason: leaveReason }, axiosConfig).then(() => { setStartDate(''); setEndDate(''); setLeaveReason(''); axios.get('http://localhost:5000/api/leaves', axiosConfig).then(res => setLeaves(res.data)); }); };
  const handleLeaveAction = (leaveId, status) => { axios.put(`http://localhost:5000/api/leaves/${leaveId}/status`, { status }, axiosConfig).then(() => { axios.get('http://localhost:5000/api/leaves', axiosConfig).then(res => setLeaves(res.data)); fetchNotifications(); }); };
  const handleAddAsset = (e) => { e.preventDefault(); if (!assetName) return; axios.post('http://localhost:5000/api/assets', { name: assetName, serial_number: assetSerial, status: assetStatus, assigned_to: assetAssignedTo ? parseInt(assetAssignedTo) : null, notes: assetNotes }, axiosConfig).then(() => { setAssetName(''); setAssetSerial(''); setAssetStatus('available'); setAssetAssignedTo(''); setAssetNotes(''); axios.get('http://localhost:5000/api/assets', axiosConfig).then(res => setAssets(res.data)); }); };
  const handleAssetUpdate = (assetId, newStatus, newAssignee) => { const asset = assets.find(a => a.id === assetId); axios.put(`http://localhost:5000/api/assets/${assetId}`, { name: asset.name, serial_number: asset.serial_number, status: newStatus, assigned_to: newAssignee ? parseInt(newAssignee) : null, notes: asset.notes }, axiosConfig).then(() => axios.get('http://localhost:5000/api/assets', axiosConfig).then(res => setAssets(res.data))); };
  const handleAddUser = (e) => { e.preventDefault(); if (!newUserName || !newUserEmail || !newUserPassword) return; axios.post('http://localhost:5000/api/users', { name: newUserName, email: newUserEmail, password: newUserPassword, role_id: newUserRole }, axiosConfig).then(() => { setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('2'); axios.get('http://localhost:5000/api/users', axiosConfig).then(res => setUsers(res.data)); }).catch(err => alert(err.response?.data?.message)); };
  const handleAddBooking = (e) => { e.preventDefault(); if (!bookRoomId || !bookDate || !bookStartTime || !bookEndTime) return; axios.post('http://localhost:5000/api/bookings', { room_id: bookRoomId, date: bookDate, start_time: bookStartTime, end_time: bookEndTime, purpose: bookPurpose }, axiosConfig).then(() => { setBookRoomId(''); setBookDate(''); setBookStartTime(''); setBookEndTime(''); setBookPurpose(''); axios.get('http://localhost:5000/api/bookings', axiosConfig).then(res => setBookings(res.data)); }).catch(err => alert(err.response?.data?.message)); };

  const cardStyle = { backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px' };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <aside style={{ width: '250px', backgroundColor: '#333', color: '#fff', padding: '20px' }}>
        <h3>لوحة التحكم</h3>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.5' }}>
          <li onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer', color: activeTab === 'dashboard' ? '#4dabf7' : '#fff', fontWeight: 'bold' }}>الرئيسية</li>
          <li onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer', color: activeTab === 'tasks' ? '#4dabf7' : '#fff' }}>المهام</li>
          <li onClick={() => setActiveTab('leaves')} style={{ cursor: 'pointer', color: activeTab === 'leaves' ? '#4dabf7' : '#fff' }}>طلبات الإجازات</li>
          <li onClick={() => setActiveTab('assets')} style={{ cursor: 'pointer', color: activeTab === 'assets' ? '#4dabf7' : '#fff' }}>الأصول</li>
          <li onClick={() => setActiveTab('bookings')} style={{ cursor: 'pointer', color: activeTab === 'bookings' ? '#4dabf7' : '#fff' }}>حجز الغرف</li>
          {user.role === 'admin' && (
            <li onClick={() => setActiveTab('users')} style={{ cursor: 'pointer', color: activeTab === 'users' ? '#4dabf7' : '#fff', borderTop: '1px solid #555', marginTop: '10px', paddingTop: '10px' }}>
              إدارة المستخدمين
            </li>
          )}
        </ul>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ backgroundColor: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>مرحباً، {user.name} ({user.role === 'admin' ? 'مدير النظام' : 'موظف'})</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* أيقونة الإشعارات */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <div onClick={() => setShowNotifMenu(!showNotifMenu)} style={{ cursor: 'pointer', fontSize: '24px' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#dc3545', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              
              {showNotifMenu && (
                <div style={{ position: 'absolute', top: '40px', left: '-100px', width: '300px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ padding: '10px', borderBottom: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>الإشعارات</div>
                  {notifications.length === 0 ? <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>لا توجد إشعارات</div> : 
                    notifications.map(n => (
                      <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: '10px', borderBottom: '1px solid #eee', backgroundColor: n.is_read ? '#fff' : '#e7f5ff', cursor: 'pointer' }}>
                        <div style={{ fontSize: '14px' }}>{n.message}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>{new Date(n.created_at).toLocaleString('ar-EG')}</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <button onClick={onLogout} style={{ padding: '5px 15px', cursor: 'pointer' }}>تسجيل الخروج</button>
          </div>
        </header>

        <div style={{ padding: '20px' }}>
          
          {activeTab === 'dashboard' && stats && (
            <>
              <h2>نظرة عامة سريعة</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
                <div style={cardStyle}><span style={{ fontSize: '14px', color: '#666' }}>إجمالي الموظفين</span><span style={{ fontSize: '32px', fontWeight: 'bold', color: '#0d6efd' }}>{stats.employees}</span></div>
                <div style={cardStyle}><span style={{ fontSize: '14px', color: '#666' }}>المهام (للتنفيذ / جارية / مكتملة)</span><div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#dc3545', fontWeight: 'bold' }}>{stats.tasks.todo}</span><span style={{ color: '#ffc107', fontWeight: 'bold' }}>{stats.tasks.in_progress}</span><span style={{ color: '#198754', fontWeight: 'bold' }}>{stats.tasks.done}</span></div><span style={{ fontSize: '12px', color: '#888' }}>إجمالي: {stats.tasks.total}</span></div>
                <div style={cardStyle}><span style={{ fontSize: '14px', color: '#666' }}>طلبات إجازات معلقة</span><span style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.leaves.pending}</span><span style={{ fontSize: '12px', color: '#888' }}>إجمالي الطلبات: {stats.leaves.total}</span></div>
                <div style={cardStyle}><span style={{ fontSize: '14px', color: '#666' }}>الأصول (متاح / مسند)</span><div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#198754', fontWeight: 'bold' }}>{stats.assets.available} متاح</span><span style={{ color: '#0d6efd', fontWeight: 'bold' }}>{stats.assets.assigned} مسند</span></div><span style={{ fontSize: '12px', color: '#888' }}>إجمالي الأصول: {stats.assets.total}</span></div>
              </div>
            </>
          )}

          {activeTab === 'users' && user.role === 'admin' && (
            <>
              <h2>إنشاء حساب موظف جديد</h2>
              <form onSubmit={handleAddUser} style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الاسم *</label><input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>البريد *</label><input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>كلمة المرور *</label><input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الصلاحية</label><select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}><option value="1">مدير</option><option value="2">موظف</option></select></div>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>إنشاء</button>
              </form>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}><th style={{ padding: '10px', border: '1px solid #ddd' }}>الاسم</th><th style={{ padding: '10px', border: '1px solid #ddd' }}>البريد</th><th style={{ padding: '10px', border: '1px solid #ddd' }}>الصلاحية</th></tr></thead><tbody>{users.map(u => (<tr key={u.id}><td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.name}</td><td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.email}</td><td style={{ padding: '10px', border: '1px solid #ddd' }}><span style={{ backgroundColor: u.id === 1 ? '#ffc107' : '#198754', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>{u.id === 1 ? 'مدير أساسي' : u.role_id === 1 ? 'مدير' : 'موظف'}</span></td></tr>))}</tbody></table>
            </>
          )}

          {activeTab === 'tasks' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>إدارة المهام</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}><option value="all">الكل</option><option value="todo">للتنفيذ</option><option value="in_progress">قيد التنفيذ</option><option value="done">مكتمل</option></select>
                  <button onClick={exportTasks} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>تصدير CSV</button>
                </div>
              </div>
              <form onSubmit={handleAddTask} style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>عنوان المهمة *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: 2 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الوصف</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>مسندة إلى</label><select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}><option value="">بدون تعيين</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>إضافة</button>
              </form>
              {tasks.filter(t => taskFilter === 'all' || t.status === taskFilter).map(task => (<div key={task.id} style={{ border: '1px solid #ddd', padding: '10px 15px', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}><div><strong>{task.title}</strong><p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{task.description || 'بدون وصف'}</p></div><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}><option value="todo">للتنفيذ</option><option value="in_progress">قيد التنفيذ</option><option value="done">مكتمل</option></select>{task.assignee_name && <span style={{ fontSize: '12px', color: '#666' }}>{task.assignee_name}</span>}</div></div>))}
            </>
          )}

          {activeTab === 'leaves' && (
            <>
              <h2>طلبات الإجازات</h2>
              <form onSubmit={handleAddLeave} style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>من تاريخ *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>إلى تاريخ *</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: '2 1 200px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>السبب</label><input type="text" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>تقديم طلب</button>
              </form>
              {leaves.map(leave => (<div key={leave.id} style={{ border: '1px solid #ddd', padding: '10px 15px', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}><div><strong>{leave.user_name}</strong><p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{leave.start_date} إلى {leave.end_date} | {leave.reason || 'بدون سبب'}</p></div><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '10px', backgroundColor: leave.status === 'pending' ? '#fff3cd' : leave.status === 'approved' ? '#d1e7dd' : '#f8d7da' }}>{leave.status === 'pending' ? 'قيد المراجعة' : leave.status === 'approved' ? 'مقبولة' : 'مرفوضة'}</span>{user.role === 'admin' && leave.status === 'pending' && (<><button onClick={() => handleLeaveAction(leave.id, 'approved')} style={{ padding: '5px 10px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>قبول</button><button onClick={() => handleLeaveAction(leave.id, 'rejected')} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>رفض</button></>)}</div></div>))}
            </>
          )}

          {activeTab === 'assets' && (
            <>
              <h2>إدارة الأصول</h2>
              <form onSubmit={handleAddAsset} style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>اسم الأصل *</label><input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: '1 1 150px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الرقم التسلسلي</label><input type="text" value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                <div style={{ flex: '1 1 100px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الحالة</label><select value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}><option value="available">متاح</option><option value="assigned">مسند</option><option value="maintenance">صيانة</option></select></div>
                <div style={{ flex: '1 1 150px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>مسند إلى</label><select value={assetAssignedTo} onChange={(e) => setAssetAssignedTo(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}><option value="">بدون</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div style={{ flex: '2 1 200px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>ملاحظات</label><input type="text" value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>إضافة أصل</button>
              </form>
              {assets.map(asset => (<div key={asset.id} style={{ border: '1px solid #ddd', padding: '10px 15px', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong>{asset.name}</strong><p style={{ margin: '5px 0 0', color: '#666', fontSize: '13px' }}>سيريال: {asset.serial_number || 'غير محدد'} {asset.notes ? '| ' + asset.notes : ''}</p></div><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><select value={asset.status} onChange={(e) => handleAssetUpdate(asset.id, e.target.value, asset.assigned_to)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}><option value="available">متاح</option><option value="assigned">مسند</option><option value="maintenance">صيانة</option></select><select value={asset.assigned_to || ''} onChange={(e) => handleAssetUpdate(asset.id, asset.status, e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}><option value="">غير مسند</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div></div>))}
            </>
          )}

          {activeTab === 'bookings' && (
            <>
              <h2>حجز غرف الاجتماعات</h2>
              <form onSubmit={handleAddBooking} style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الغرفة *</label><select value={bookRoomId} onChange={(e) => setBookRoomId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required><option value="">اختر غرفة</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name} (سعة: {r.capacity})</option>)}</select></div>
                <div style={{ flex: '1 1 150px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>التاريخ *</label><input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: '1 1 100px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>من الساعة *</label><input type="time" value={bookStartTime} onChange={(e) => setBookStartTime(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: '1 1 100px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>إلى الساعة *</label><input type="time" value={bookEndTime} onChange={(e) => setBookEndTime(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required /></div>
                <div style={{ flex: '2 1 200px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>الغرض من الاجتماع</label><input type="text" value={bookPurpose} onChange={(e) => setBookPurpose(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>حجز</button>
              </form>
              {bookings.length === 0 ? <p>لا توجد حجوزات حالياً.</p> : bookings.map(book => (<div key={book.id} style={{ border: '1px solid #ddd', padding: '10px 15px', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong>{book.room_name}</strong><p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{book.date} | من {book.start_time} إلى {book.end_time}</p><p style={{ margin: '2px 0 0', color: '#888', fontSize: '12px' }}>بواسطة: {book.user_name} {book.purpose ? '| ' + book.purpose : ''}</p></div></div>))}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default Dashboard;