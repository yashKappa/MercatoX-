import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // Ensure db is imported
import '../CSS/AuthPage.css';

const AuthPage = () => {
  const auth = getAuth(); // Get Auth instance
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Store user details in local storage
        localStorage.setItem('authUser', JSON.stringify(user));
        navigate('/home'); // Redirect to home if authenticated
      }
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, [auth, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Login logic
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        localStorage.setItem('authUser', JSON.stringify(user)); // Store user in local storage
        navigate('/home');
      } else {
        // Sign-up logic
        if (formData.password !== formData.confirmPassword) {
          setMessage('Passwords do not match');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Store user details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username: formData.username,
          email: formData.email,
          createdAt: new Date(),
        });

        localStorage.setItem('authUser', JSON.stringify(user)); // Store user in local storage
        navigate('/home');
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo">
        <img
          src="https://cts-tex.com/wp-content/uploads/2022/12/Comhome-Logo-e1677767236209.png"
          alt="logo"
        />
      </div>
      <div className="auth-form-container">
        <div className="form">
          <div className="auth-toggle">
            <button
              className={isLogin ? 'auth-toggle-btn active' : 'auth-toggle-btn'}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={!isLogin ? 'auth-toggle-btn active' : 'auth-toggle-btn'}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

            {!isLogin && (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            )}

            <button className="auth-submit-btn" type="submit">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {message && <p className="auth-message">{message}</p>}

          <div className="auth-social-buttons">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/768px-Facebook_Logo_%282019%29.png"
              alt="Facebook"
              className="auth-social-icon"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/640px-Instagram_icon.png"
              alt="Instagram"
              className="auth-social-icon"
            />
            <img
              src="https://png.pngtree.com/png-vector/20221018/ourmid/pngtree-twitter-social-media-icon-png-image_6315986.png"
              alt="Twitter"
              className="auth-social-icon"
            />
            <img
              src="https://png.pngtree.com/png-vector/20230817/ourmid/pngtree-google-internet-icon-vector-png-image_9183287.png"
              alt="Google"
              className="auth-social-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
