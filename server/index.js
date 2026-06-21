const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'office_app_secret_key';

// دالة مساعدة لإرسال إشعار
const sendNotification = (userId, message) => {
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
};

// middleware للتحقق من التوكن
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'غير مصرح' });
  
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'توكن غير صالح' });
  }
};

// ------------------- المصادقة -------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.password_hash, r.name as role 
    FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?
  `).get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ------------------- المستخدمين -------------------
app.get('/api/users', authMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, name FROM users').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح لك بإنشاء حسابات' });

  const { name, email, password, role_id } = req.body;
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) return res.status(400).json({ message: 'البريد الإلكتروني مسجل مسبقاً' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role_id || 2);
  res.json({ id: result.lastInsertRowid, message: 'تم إنشاء الحساب بنجاح' });
});

// ------------------- المهام -------------------
// جلب المهام (المدير يرى الكل، والموظف يرى المسندة له أو التي أنشأها فقط)
app.get('/api/tasks', authMiddleware, (req, res) => {
  let query = `SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id`;
  let params = [];
  
  if (req.user.role !== 'admin') {
    query += ` WHERE t.assigned_to = ? OR t.created_by = ?`;
    params.push(req.user.id, req.user.id);
  }
  
  query += ` ORDER BY t.created_at DESC`;
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});


app.post('/api/tasks', authMiddleware, (req, res) => {
  const { title, description, assigned_to } = req.body;
  const result = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, created_by) VALUES (?, ?, ?, ?)
  `).run(title, description, assigned_to || null, req.user.id);

  // إرسال إشعار للموظف إذا تم تعيينه
  if (assigned_to) {
    sendNotification(assigned_to, `تم تعيين مهمة جديدة لك: ${title}`);
  }

  res.json({ id: result.lastInsertRowid, message: 'تمت إضافة المهمة بنجاح' });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const { title, description, status, assigned_to } = req.body;
  db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?')
    .run(title, description, status, assigned_to || null, req.params.id);
  res.json({ message: 'تم تحديث المهمة' });
});

// ------------------- الإجازات -------------------
app.post('/api/leaves', authMiddleware, (req, res) => {
  const { start_date, end_date, reason } = req.body;
  
  // إرسال إشعار للمدير بوجود طلب جديد
  const admins = db.prepare("SELECT id FROM users WHERE role_id = 1").all();
  admins.forEach(admin => {
    sendNotification(admin.id, `قام ${req.user.name} بتقديم طلب إجازة جديد`);
  });

  const result = db.prepare('INSERT INTO leaves (user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)')
    .run(req.user.id, start_date, end_date, reason);
  res.json({ id: result.lastInsertRowid, message: 'تم تقديم طلب الإجازة' });
});

// جلب الإجازات (المدير يرى الكل، والموظف يرى طلباته فقط)
app.get('/api/leaves', authMiddleware, (req, res) => {
  let query = `SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id`;
  let params = [];
  
  if (req.user.role !== 'admin') {
    query += ` WHERE l.user_id = ?`;
    params.push(req.user.id);
  }
  
  query += ` ORDER BY l.created_at DESC`;
  const leaves = db.prepare(query).all(...params);
  res.json(leaves);
});

app.put('/api/leaves/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'حالة غير صالحة' });
  }
  
  db.prepare('UPDATE leaves SET status = ? WHERE id = ?').run(status, req.params.id);
  
  // جلب بيانات الطلب لإرسال إشعار لصاحبه
  const leaveData = db.prepare('SELECT user_id, start_date FROM leaves WHERE id = ?').get(req.params.id);
  if (leaveData) {
    const statusMsg = status === 'approved' ? 'تم قبول' : 'تم رفض';
    sendNotification(leaveData.user_id, `${statusMsg} طلب إجازتك بتاريخ ${leaveData.start_date}`);
  }

  res.json({ message: 'تم تحديث حالة الطلب' });
});

// ------------------- الأصول -------------------
app.get('/api/assets', authMiddleware, (req, res) => {
  const assets = db.prepare(`
    SELECT a.*, u.name as assignee_name FROM assets a 
    LEFT JOIN users u ON a.assigned_to = u.id ORDER BY a.id DESC
  `).all();
  res.json(assets);
});

app.post('/api/assets', authMiddleware, (req, res) => {
  const { name, serial_number, status, assigned_to, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO assets (name, serial_number, status, assigned_to, notes) VALUES (?, ?, ?, ?, ?)
  `).run(name, serial_number || null, status || 'available', assigned_to || null, notes || null);
  res.json({ id: result.lastInsertRowid, message: 'تمت إضافة الأصل بنجاح' });
});

app.put('/api/assets/:id', authMiddleware, (req, res) => {
  const { name, serial_number, status, assigned_to, notes } = req.body;
  db.prepare('UPDATE assets SET name = ?, serial_number = ?, status = ?, assigned_to = ?, notes = ? WHERE id = ?')
    .run(name, serial_number, status, assigned_to || null, notes || null, req.params.id);
  res.json({ message: 'تم تحديث الأصل' });
});

// ------------------- الغرف والحجوزات -------------------
app.get('/api/rooms', authMiddleware, (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms').all();
  res.json(rooms);
});

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { room_id, date, start_time, end_time, purpose } = req.body;
  
  const conflict = db.prepare(`
    SELECT * FROM bookings WHERE room_id = ? AND date = ? AND (start_time < ? AND end_time > ?)
  `).get(room_id, date, end_time, start_time);

  if (conflict) return res.status(400).json({ message: 'يوجد تعارض في الحجز، هذه الغرفة محجوزة في هذا الوقت' });

  const result = db.prepare(`
    INSERT INTO bookings (room_id, user_id, date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?)
  `).run(room_id, req.user.id, date, start_time, end_time, purpose);
  res.json({ id: result.lastInsertRowid, message: 'تم حجز الغرفة بنجاح' });
});

// جلب الحجوزات (المدير يرى الكل، والموظف يرى حجوزاته فقط)
app.get('/api/bookings', authMiddleware, (req, res) => {
  let query = `SELECT b.*, r.name as room_name, u.name as user_name FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN users u ON b.user_id = u.id`;
  let params = [];
  
  if (req.user.role !== 'admin') {
    query += ` WHERE b.user_id = ?`;
    params.push(req.user.id);
  }
  
  query += ` ORDER BY b.date ASC, b.start_time ASC`;
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// ------------------- الإحصائيات -------------------
app.get('/api/stats', authMiddleware, (req, res) => {
  const employees = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const tasks = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done, SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress, SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo FROM tasks`).get();
  const leaves = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending FROM leaves`).get();
  const assets = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available, SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned FROM assets`).get();
  res.json({ employees, tasks, leaves, assets });
});

// ------------------- الإشعارات -------------------
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json(notifications);
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'تم القراءة' });
});

// ------------------- تشغيل السيرفر -------------------
app.listen(5000, () => console.log('Server running on http://localhost:5000'));