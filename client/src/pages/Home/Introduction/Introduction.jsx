import {
    ArrowLeft,
    ArrowRight,
    Heart,
    MapPin,
    MessageCircle,
    Plus,
    Star
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { placesAPI } from "../../../services/api";
import styles from "./Introduction.module.css";

const FALLBACK_DATA = [
    {
        id: 1,
        src: "https://images.unsplash.com/photo-1499678329028-101435549a4e",
        title: "Quán Cafe Hồ Tây",
        description: "Không gian view hồ thoáng mát",
        price: "50.000₫ - 150.000₫",
        address: "Tây Hồ, Hà Nội",
        tag: "Ăn uống",
        beds: 4,
        baths: 120,
        sqft: 150000
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1562323150-c3f486a6f185",
        title: "Phở Phố Cổ",
        description: "Hương vị truyền thống Hà Nội",
        price: "30.000₫ - 80.000₫",
        address: "Hoàn Kiếm, Hà Nội",
        tag: "Ăn uống",
        beds: 5,
        baths: 89,
        sqft: 80000
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4",
        title: "Bar Rooftop Cầu Giấy",
        description: "View thành phố tuyệt đẹp",
        price: "100.000₫ - 500.000₫",
        address: "Cầu Giấy, Hà Nội",
        tag: "Vui chơi",
        beds: 4,
        baths: 56,
        sqft: 500000
    },
    {
        id: 4,
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7",
        title: "Trà Sữa Đống Đa",
        description: "Đa dạng menu cho giới trẻ",
        price: "25.000₫ - 70.000₫",
        address: "Đống Đa, Hà Nội",
        tag: "Ăn uống",
        beds: 4,
        baths: 234,
        sqft: 70000
    }
];

const Introduction = () => {
    const [gridData, setGridData] = useState(FALLBACK_DATA);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const swiperRef = useRef(null);

    useEffect(() => {
        const fetchLatestPlaces = async () => {
            try {
                const response = await placesAPI.getLatest(6); // Fetch more for slider

                if (response.success && response.data && response.data.length > 0) {
                    const transformedData = response.data.map((place) => {
                        // Format price từ priceRange
                        const formatPrice = (min, max) => {
                            if (min === max) {
                                return `${min.toLocaleString('vi-VN')}₫`;
                            }
                            return `${min.toLocaleString('vi-VN')}₫ - ${max.toLocaleString('vi-VN')}₫`;
                        };

                        return {
                            id: place._id,
                            src: place.images?.[0] || FALLBACK_DATA[0].src,
                            title: place.name,
                            description: place.description,
                            price: place.priceRange 
                                ? formatPrice(place.priceRange.min, place.priceRange.max)
                                : 'Liên hệ',
                            address: `${place.district}, Hà Nội`,
                            tag: place.category || 'Ăn uống',
                            // Sử dụng avgRating làm "beds" và totalReviews làm "baths"
                            beds: Math.round(place.averageRating || 0),
                            baths: place.totalReviews || 0,
                            // Hiển thị priceRange.max làm "sqft"
                            sqft: place.priceRange?.max || 0
                        };
                    });

                    setGridData(transformedData);
                }
            } catch (error) {
                console.error('Error fetching places:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestPlaces();
    }, []);

    const handlePrev = () => {
        if (swiperRef.current) swiperRef.current.slidePrev();
    };

    const handleNext = () => {
        if (swiperRef.current) swiperRef.current.slideNext();
    };

    const handleCardClick = (placeId) => {
        navigate(`/places/${placeId}`);
    };

    if (loading) {
        return (
            <section className={styles.introduction}>
                <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>
            </section>
        );
    }

    return (
        <section className={styles.introduction}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.mainTitle}>Featured Properties</h2>
                    <p className={styles.subTitle}>
                        Khám phá danh sách các địa điểm nổi bật và được yêu thích nhất của chúng tôi,
                        được tuyển chọn kỹ lưỡng cho trải nghiệm tuyệt vời.
                    </p>
                </div>
                <div className={styles.navigationButtons}>
                    <button className={styles.navBtn} onClick={handlePrev}>
                        <ArrowLeft size={20} />
                    </button>
                    <button className={`${styles.navBtn} ${styles.active}`} onClick={handleNext}>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Swiper Slider */}
            <div className={styles.swiperContainer}>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={30}
                    slidesPerView={1}
                    onBeforeInit={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 2,
                        },
                        1024: {
                            slidesPerView: 3,
                        },
                    }}
                    loop={true}
                >
                    {gridData.map((item) => (
                        <SwiperSlide key={item.id}>
                            <div 
                                className={styles.card}
                                onClick={() => handleCardClick(item.id)}
                                style={{ cursor: 'pointer' }}
                                title="Click để xem chi tiết"
                            >
                                {/* Image Area */}
                                <div className={styles.imageContainer}>
                                    <img src={item.src} alt={item.title} className={styles.cardImage} />
                                    <div className={styles.tag}>{item.tag}</div>
                                    <div className={styles.cardActions}>
                                        <button className={styles.actionBtn}>
                                            <Heart size={18} />
                                        </button>
                                        <button className={styles.actionBtn}>
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className={styles.cardContent}>
                                    <span className={styles.price}>{item.price}</span>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <div className={styles.location}>
                                        <MapPin size={16} />
                                        <span>{item.address}</span>
                                    </div>

                                    <div className={styles.divider}></div>

                                    <div className={styles.statsRow}>
                                        <div className={styles.statItem}>
                                            <Star size={18} className={styles.statIcon} />
                                            <span>{item.beds}/5</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <MessageCircle size={18} className={styles.statIcon} />
                                            <span>{item.baths} Reviews</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default Introduction;