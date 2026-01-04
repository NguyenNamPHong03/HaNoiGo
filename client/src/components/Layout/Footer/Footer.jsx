import {
    Mail,
    MapPin,
    Phone
} from "lucide-react";
import { memo } from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
    return (
        <div className={styles.footerContainer}>
            <footer className={styles.footerWrapper}>
                {/* Main Links Section */}
                <div className={styles.linksContainer}>
                    {/* Contact Column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Liên hệ</h3>
                        <div className={styles.infoItem}>
                            <div className={styles.iconCircle}>
                                <Phone size={20} />
                            </div>
                            <span>0988642538</span>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.iconCircle}>
                                <MapPin size={20} />
                            </div>
                            <span>Đại Học Xây Dựng, Hà Nội, Việt Nam</span>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.iconCircle}>
                                <Mail size={20} />
                            </div>
                            <span>support@hanoigo.com</span>
                        </div>
                    </div>

                    {/* Navigate Column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Điều hướng</h3>
                        <div className={styles.linkList}>
                            <Link to="/services" className={styles.linkItem}>Dịch vụ</Link>
                            <Link to="/stories" className={styles.linkItem}>Câu chuyện</Link>
                            <Link to="/blog" className={styles.linkItem}>Blog du lịch</Link>
                            <Link to="/events" className={styles.linkItem}>Sự kiện</Link>
                        </div>
                    </div>

                    {/* Solution Column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Giải pháp</h3>
                        <div className={styles.linkList}>
                            <Link to="/for-business" className={styles.linkItem}>Cho doanh nghiệp</Link>
                            <Link to="/partners" className={styles.linkItem}>Đối tác</Link>
                            <Link to="/advertising" className={styles.linkItem}>Quảng cáo</Link>
                            <Link to="/tech" className={styles.linkItem}>Công nghệ AI</Link>
                        </div>
                    </div>

                    {/* Discover Column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Khám phá</h3>
                        <div className={styles.linkList}>
                            <Link to="/new" className={styles.linkItem}>Địa điểm mới</Link>
                            <Link to="/trending" className={styles.linkItem}>Xu hướng</Link>
                            <Link to="/categories" className={styles.linkItem}>Danh mục</Link>
                            <Link to="/map" className={styles.linkItem}>Bản đồ</Link>
                        </div>
                    </div>

                    {/* Follow Us Column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Theo dõi</h3>
                        <div className={styles.linkList}>
                            <a href="#" className={styles.linkItem}>Facebook</a>
                            <a href="#" className={styles.linkItem}>Instagram</a>
                            <a href="#" className={styles.linkItem}>LinkedIn</a>
                            <a href="#" className={styles.linkItem}>Twitter</a>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className={styles.bottomBar}>
                    <div className={styles.copyright}>
                        © Copyright HaNoiGo 2024. All rights reserved.
                    </div>
                    <div className={styles.policyLinks}>
                        <Link to="/privacy">Chính sách bảo mật</Link>
                        <Link to="/terms">Điều khoản sử dụng</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default memo(Footer);
