import styles from "./Introduction.module.css";
import TitleSection from "../../../components/common/TitleSection/TitleSection";
import Grid from "../../../components/common/Grid/Grid";

const Introduction = () => {
    return (
        <section className={styles.introduction}>
            <TitleSection>
                Extraordinary natural beauty, enjoy the rich culture, and experience the friendliness of the local people.
            </TitleSection>
            <Grid />
        </section>
    );
};

export default Introduction;