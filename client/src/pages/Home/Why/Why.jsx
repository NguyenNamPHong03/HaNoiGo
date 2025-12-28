import { useState } from "react";
import TitleSection from "../../../components/common/TitleSection/TitleSection";
import { useCursor } from "../../../contexts/CursorContext";
import styles from "./Why.module.css";

const WHY_ITEMS = [
    {
        id: 1,
        title: "Dịch vụ đưa đón",
        description: "Dịch vụ đưa đón thoải mái giữa khách sạn và các điểm tham quan chính, giúp bạn tiết kiệm thời gian di chuyển và có nhiều thời gian khám phá hơn.",
        image: "https://images.unsplash.com/photo-1561842951-2f960156a061?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 2,
        title: "Đặt chỗ dễ dàng",
        description: "Đặt chỗ nhanh chóng và linh hoạt cho các tour và hoạt động chỉ với vài cú nhấp chuột, với các tùy chọn phù hợp với kế hoạch của bạn.",
        image: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 3,
        title: "Hướng dẫn viên địa phương",
        description: "Những chuyên gia địa phương thân thiện, hiểu rõ vùng miền và sẵn sàng giới thiệu cho bạn những điểm ngắm cảnh đẹp nhất, những địa điểm bí mật và những câu chuyện thú vị.",
        image: "https://images.unsplash.com/photo-1570559120097-e6c3388329e6?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 4,
        title: "Ưu đãi độc quyền",
        description: "Giá đặc biệt cho vé trượt tuyết, chalet ấm cúng và các chuyến tham quan được chọn chỉ dành riêng cho khách du lịch của chúng tôi.",
        image: "https://images.unsplash.com/photo-1603269231725-4ea1da7d02fd?q=80&w=2531&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
];

const Why = () => {
    const cursorRef = useCursor();
    const [activeImage, setActiveImage] = useState(WHY_ITEMS[0].image);

    const handleMouseEnter = () => {
        cursorRef?.current?.enter();
    };

    const handleMouseLeave = () => {
        cursorRef?.current?.leave();
    };

    return (
        <section className={styles.why}>
            <div className={styles.title}>
                <TitleSection>
                    Đi du lịch cùng chúng tôi nghĩa là bạn không cần phải lo lắng về các chi tiết.
Chúng tôi lo liệu việc đưa đón, đặt chỗ và sắp xếp tại chỗ để bạn có thể thư giãn và tận hưởng kỳ nghỉ của mình ngay từ ngày đầu tiên.
                </TitleSection>
            </div>

            <div className={styles.whyContent}>
                <div className={styles.leftColumn}>
                    {WHY_ITEMS.map((item) => (
                        <div
                            className={styles.item}
                            key={item.id}
                            onMouseEnter={() => {
                                handleMouseEnter();
                                setActiveImage(item.image);
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className={styles.count}>
                                <div className={styles.countBox}>
                                    <p>0{item.id}</p>
                                </div>
                                <div className={styles.content}>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.imageWrapper}>
                        <img src={activeImage} alt="Feature" className={styles.featureImage} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Why;