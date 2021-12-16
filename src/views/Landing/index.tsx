import './landing.scss';
import { useState } from 'react';
import Header from '../../components/LandingHeader';
import Stat from './components/Stat';
import { Backdrop, Button, Link, Paper } from '@material-ui/core';
import Shell from './shell.png';
import SecondSection from './components/SecondSection';
import Footer from './components/Footer';
import { DiscordLink, GithubLink, TwitterLink } from 'src/constants';
import TwitterIcon from './images/twitter.svg';
import DiscordIcon from './images/icon_discord.svg';
import GithubIcon from './images/icon_github.svg';
import Bibim01 from './images/bibim_01.png';
import CloseIcon from './images/icon_24x24_close.svg';
import Countdown from './components/Countdown';
import WhiteList from '../WhiteList';

function Landing() {
  const [open, setOpen] = useState(true);

  return (
    <div className="landing">
      <Header />
      <section className="landing__first-section">
        <div className="landing__first-section__title">
          <h1>
            Bibimbap<span style={{ color: '#C74b26' }}> Finance</span>
          </h1>
        </div>
        <div className="landing__first-section__subtitle">
          <p>
            From (3,3) to (<span style={{ color: '#C74b26' }}>비빔, 비빔</span>)
          </p>
        </div>
        <div className="landing__first-section__body">
          <div className="landing__first-section__body__left">
            <div className="landing__first-section__body__title">
              <p>Decentralized</p>
              <p>Meme Finance 2.0</p>
            </div>
            <div className="landing__first-section__body__subtitle">
              <p>Stake your tasty Bibimbap</p>
            </div>
            {/* <a className="landing__first-section__body__app-button" href="https://app.otterclam.finance">
              <Button variant="contained" color="primary" size="medium" disableElevation>
                Enter APP
              </Button>
            </a> */}
            <div className="landing__first-section__body__app-button">
              {/* <Button variant="contained" color="primary" size="medium" disabled>
                Coming Soon...
              </Button> */}
            </div>
            <div className="community-icons">
              <Link href={TwitterLink} className="community-icon-link">
                <img src={TwitterIcon} />
              </Link>
              <Link href={DiscordLink} className="community-icon-link">
                <img src={DiscordIcon} />
              </Link>
              {/* <Link href={GithubLink} className="community-icon-link">
                <img src={GithubIcon} />
              </Link> */}
            </div>
          </div>
          <div className="otter01">
            <img src={Bibim01} alt="bibim01" />
          </div>
        </div>
        <div className="landing__first-section__footer">
          <div className="landing__first-section__footer__wave" />
        </div>
      </section>
      {/* <h1>Coming Soon...</h1> */}
      {/* <Stat /> */}
      {/* <SecondSection /> */}
      <Footer />
      {/* <Backdrop open={open} className="whitelist-check">
        <div className="whitelist-container">
          <WhiteList />
          <div className="close-modal-button" onClick={() => setOpen(false)}>
            <img src={CloseIcon} />
          </div>
        </div>
      </Backdrop> */}
    </div>
  );
}

export default Landing;
