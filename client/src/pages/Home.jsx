import styles from '../styles/Home.module.css'

function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            Khám phá Hà Nội với AI thông minh
          </h1>
          <p className={styles.heroSubtitle}>
            Tìm kiếm địa điểm ẩm thực và vui chơi tại Hà Nội một cách dễ dàng và cá nhân hóa
          </p>
          <div className={styles.heroActions}>
            <a href="/places" className="btn btn-primary">
              Khám phá ngay
            </a>
            <a href="/chat" className="btn btn-secondary">
              Chat với AI
            </a>
          </div>
        </div>
      </section>
      
      <section className={styles.features}>
        <div className="container">
          <h2>Tính năng nổi bật</h2>
          <div className={styles.featuresGrid}>
            <div className="card">
              <h3>AI Chat thông minh</h3>
              <p>Hỏi AI bằng ngôn ngữ tự nhiên để tìm địa điểm phù hợp</p>
            </div>
            <div className="card">
              <h3>Tìm kiếm visual</h3>
              <p>Tìm địa điểm thông qua hình ảnh với công nghệ CLIP</p>
            </div>
            <div className="card">
              <h3>Cá nhân hóa</h3>
              <p>Gợi ý phù hợp với sở thích và ngân sách của bạn</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home