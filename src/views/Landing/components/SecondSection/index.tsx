import Card from './Card';
import styles from './style.module.scss';
import HowBibimWorks01 from './how_bibim_works_01.png';
import HowBibimWorks02 from './how_bibim_works_02.png';
import HowBibimWorks03 from './how_bibim_works_03.png';

function SecondSection() {
  return (
    <section className={styles.main}>
      <h2 className={styles.title}>How Bibimbap Works</h2>
      <div className={styles.body}>
        <Card
          num={1}
          title="Treasury Revenue"
          subtitle="Bonds & LP fees"
          desc="Bond Sales and LP Fees are the major source of Bibimbap Treasury Revenue and lock in liquidity. They help BBB supply control."
          img={HowBibimWorks01}
        />
        <Card
          num={2}
          title="Treasury Growth"
          subtitle="Bibimbap Treasury"
          desc="Treasury inflow backs outstanding BBB tokens as it increases Bibimbap Treasury Balance. Treasury inflow is a factor when regulating staking APY."
          img={HowBibimWorks02}
          reverse
        />
        <Card
          num={3}
          title="Staking Rewards"
          subtitle="BBB Token"
          desc="Staking reward is our way of rewarding the participants of the protocol. The matrix of (비빔, 비빔) is designed to maximize stakers' profit. "
          img={HowBibimWorks03}
        />
      </div>
    </section>
  );
}

export default SecondSection;
