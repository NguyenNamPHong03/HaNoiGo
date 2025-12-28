import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon/Icon';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';
import styles from "./Authentication.module.css";

const Register = () => {
    const navigate = useNavigate();
    const { login } = useUser();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        setLoading(true);

        try {
            // Send only required fields to API
            const { displayName, email, password } = formData;
            const response = await authAPI.register({ displayName, email, password });

            if (response.success) {
                const { user, token } = response.data;
                login(user, token);
                toast.success('Register successfully!');
                navigate('/');
            }
        } catch (error) {
            console.error('Register failed:', error);
            const message = error.response?.data?.message || 'Register failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        try {
            const response = await authAPI.getGoogleAuthUrl();
            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                toast.error('Failed to initialize Google sign up');
            }
        } catch (error) {
            console.error('Google sign up error:', error);
            toast.error('Failed to initialize Google sign up');
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
                        <h2>“Experience Hanoi like never before.”</h2>
                        <div className={styles.author}>
                            Join our community
                            <span>Discover the best places, foods, and culture.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.rightSide}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>Create your account</h2>
                        <p>Unlock all features and personalized recommendations.</p>
                    </div>

                    <form className={styles.inputGroup} onSubmit={handleRegister}>
                        <div className={styles.inputWrapper}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputWrapper}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputWrapper}>
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className={styles.inputWrapper}>
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? 'Signing up...' : 'Sign up'}
                        </button>
                    </form>

                    <div className={styles.divider}>OR</div>

                    <button type="button" className={styles.googleBtn} onClick={handleGoogleRegister}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                        Continue with Google
                    </button>

                    <p className={styles.footer}>
                        Already have an account? <Link to="/login" className={styles.signUp}>Log in</Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Register;
