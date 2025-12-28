import styles from "./Introduction.module.css";
import TitleSection from "../../../components/common/TitleSection/TitleSection";
import Grid from "../../../components/common/Grid/Grid";

const Introduction = () => {
    return (
        <section className={styles.introduction}>
            <TitleSection>
               Trải nghiệm vẻ đẹp của Hà Nội với các tour du lịch được thiết kế tỉ mỉ của chúng tôi, khám phá nền văn hóa phong phú, các địa danh nổi tiếng và cuộc sống địa phương sôi động.
            </TitleSection>
            <Grid />
        </section>
    );
};

export default Introduction;