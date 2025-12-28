import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon/Icon';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';
import styles from "./Authentication.module.css";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useUser();
    const [isChecked, setIsChecked] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });

            if (response.success) {
                const { user, token, role } = response.data;
                login(user, token);
                toast.success('Login successfully!');
                
                // Redirect to admin panel if user is admin
                if (role === 'admin' || user.role === 'admin') {
                    window.location.href = 'http://localhost:3001';
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('Login failed:', error);
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const response = await authAPI.getGoogleAuthUrl();
            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                toast.error('Failed to initialize Google login');
            }
        } catch (error) {
            console.error('Google login error:', error);
            toast.error('Failed to initialize Google login');
        }
    };

    return (
        <section className={styles.authentication}>
            <div className={styles.leftSide}>
                <div className={styles.leftContent}>
                    <div className={styles.logo}>
                        <Icon height={30} fill="#fff" />
                        HanoiGo
                    </div>

                    <div className={styles.quote}>
                        <h2>“Simply all the tools that my team and I need.”</h2>
                        <div className={styles.author}>
                            Karen Yue
                            <span>Director of Digital Marketing Technology</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.rightSide}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>Welcome back to HanoiGo</h2>
                        <p>Build your design system effortlessly with our powerful component library.</p>
                    </div>

                    <form className={styles.inputGroup} onSubmit={handleLogin}>
                        <div className={styles.inputWrapper}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.inputWrapper}>
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className={styles.actions}>
                            <span className={styles.forgot}>Forgot password?</span>
                            <div className={styles.remember}>
                                <span>Remember sign in details</span>
                                <label className={styles.rememberLabel}>
                                    <input
                                        type="checkbox"
                                        className={styles.toggleCheckbox}
                                        checked={isChecked}
                                        onChange={() => setIsChecked(!isChecked)}
                                    />
                                    <div className={styles.toggleSwitch}></div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className={styles.loginBtn}>
                            Log in
                        </button>
                    </form>

                    <div className={styles.divider}>OR</div>

                    <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                        Continue with Google
                    </button>

                    <p className={styles.footer}>
                        Don't have an account? <Link to="/register" className={styles.signUp}>Sign up</Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Login;
