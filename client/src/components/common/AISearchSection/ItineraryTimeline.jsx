import React from 'react';
import styles from './ItineraryTimeline.module.css';

const ItineraryTimeline = ({ data }) => {
    if (!data || !data.schedule) return null;

    return (
        <div className={styles.timelineContainer}>
            <div className={styles.header}>
                <h3>{data.title}</h3>
                <span className={styles.badge}>Itinerary</span>
            </div>

            <div className={styles.timeline}>
                {data.schedule.map((item, index) => (
                    <div key={index} className={styles.timelineItem}>
                        <div className={styles.timeColumn}>
                            <span className={styles.time}>{item.time}</span>
                        </div>

                        <div className={styles.contentColumn}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.activityType}>{item.activity}</span>
                                    <h4 className={styles.placeName}>{item.placeName}</h4>
                                </div>
                                <p className={styles.reason}>{item.reason}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ItineraryTimeline;
