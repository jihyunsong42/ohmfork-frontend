import Card from './Card';
import styles from './style.module.scss';
import HowBibimWorks01 from './how_bibim_works_01.png';
import HowBibimWorks02 from './how_bibim_works_02.png';
import HowBibimWorks03 from './how_bibim_works_03.png';
import { useTranslation } from 'react-i18next';

function SecondSection() {
  const { t, i18n } = useTranslation();
  return (
    <section className={styles.main}>
      <h2 className={styles.title}>{t('landing.splashPage.howBibimbapWorks')}</h2>
      <div className={styles.body}>
        <Card
          num={1}
          title={t('landing.splashPage.treasuryRevenue')}
          subtitle={t('landing.splashPage.bondsLPFees')}
          desc={t('landing.splashPage.bondSales')}
          img={HowBibimWorks01}
        />
        <Card
          num={2}
          title={t('landing.splashPage.treasuryGrowth')}
          subtitle={t('landing.splashPage.bibimbapTreasury')}
          desc={t('landing.splashPage.treasuryInflow')}
          img={HowBibimWorks02}
          reverse
        />
        <Card
          num={3}
          title={t('landing.splashPage.stakingRewards')}
          subtitle={t('landing.splashPage.bbbToken')}
          desc={t('landing.splashPage.compounds')}
          img={HowBibimWorks03}
        />
      </div>
    </section>
  );
}

export default SecondSection;
