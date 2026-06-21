import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
          const userData = res.data.user || res.data;
          setUser(userData);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      alert("خطأ: " + (err.response?.data?.message || 'تأكد أن خادم Node يعمل على بورت 5000'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>جاري التحميل...</div>;
  if (!user) return <LoginForm onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('123456');

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>تسجيل الدخول - نظام المكتب</h2>
      <form onSubmit={(e) => onLogin(e, email, password)}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor:'pointer' }}>دخول</button>
      </form>
    </div>
  );
}

export default App;