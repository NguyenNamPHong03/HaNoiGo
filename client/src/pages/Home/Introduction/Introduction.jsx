import { useState, useEffect, useRef } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    Plus,
    MapPin,
    BedDouble,
    Bath,
    Maximize2
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import styles from "./Introduction.module.css";
import { placesAPI } from "../../../services/api";

const FALLBACK_DATA = [
    {
        id: 1,
        src: "https://images.unsplash.com/photo-1499678329028-101435549a4e",
        title: "Tây Hồ Villa",
        description: "5500 SQFT",
        price: "$6,359,000",
        address: "435 Au Co, Tay Ho, Hanoi",
        tag: "For Sale",
        beds: 4,
        baths: 4,
        sqft: 5500
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1562323150-c3f486a6f185",
        title: "Old Quarter House",
        description: "Historic charm",
        price: "$3,950,000",
        address: "Hang Gai, Hoan Kiem, Hanoi",
        tag: "For Rent",
        beds: 3,
        baths: 2,
        sqft: 2200
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4",
        title: "Garden Villa Ecopark",
        description: "Green living",
        price: "$7,850,000",
        address: "Ecopark Urban Area, Hung Yen",
        tag: "For Sale",
        beds: 5,
        baths: 4,
        sqft: 6000
    },
    {
        id: 4,
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7",
        title: "Modern Apartment",
        description: "City View",
        price: "$2,150,000",
        address: "Cau Giay, Hanoi",
        tag: "For Rent",
        beds: 2,
        baths: 2,
        sqft: 1200
    }
];

const Introduction = () => {
    const [gridData, setGridData] = useState(FALLBACK_DATA);
    const [loading, setLoading] = useState(true);
    const swiperRef = useRef(null);

    useEffect(() => {
        const fetchLatestPlaces = async () => {
            try {
                const response = await placesAPI.getLatest(6); // Fetch more for slider

                if (response.success && response.data && response.data.length > 0) {
                    const transformedData = response.data.map((place, index) => ({
                        id: place._id,
                        src: place.images?.[0] || FALLBACK_DATA[index % FALLBACK_DATA.length].src,
                        title: place.name,
                        description: place.description,
                        price: ["$6,359,000", "$4,200,000", "$7,850,000", "$2,100,000"][index % 4],
                        address: place.address || "Hanoi, Vietnam",
                        tag: index % 2 === 0 ? "For Sale" : "For Rent",
                        beds: 3 + (index % 3),
                        baths: 2 + (index % 2),
                        sqft: 2000 + (index * 500)
                    }));

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
                            <div className={styles.card}>
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
                                            <BedDouble size={18} className={styles.statIcon} />
                                            <span>{item.beds} Bed</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <Bath size={18} className={styles.statIcon} />
                                            <span>{item.baths} Bath</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <Maximize2 size={18} className={styles.statIcon} />
                                            <span>{item.sqft} Sqft</span>
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