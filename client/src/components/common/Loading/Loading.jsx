import { memo } from 'react';
import styles from "./Loading.module.css";

const Loading = memo(() => {
    return (
        <div className={styles.loading}>
            <div className={styles.loader}></div>
        </div>
    );
});

Loading.displayName = 'Loading';

export default Loading;