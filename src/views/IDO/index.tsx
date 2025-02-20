import { Button } from '@material-ui/core';
import { BigNumber, ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { IDOContract, MAIContract, StakingContract } from 'src/abi';
import LandingHeader from 'src/components/LandingHeader';
import { getAddresses } from 'src/constants';
import { useWeb3Context } from 'src/hooks';
import { MediumLink } from '../../constants';
import tokenIcon from '../IDO/images/icon_token.svg';
import maiIcon from '../IDO/images/mai-icon.png';
import happyOtter from '../IDO/images/otter_happy.png';
import Countdown from '../Landing/components/Countdown';
import Footer from '../Landing/components/Footer';
import styles from './ido.module.scss';
import { FormControl, InputLabel, OutlinedInput, InputAdornment } from '@material-ui/core';
import { selectionSetMatchesResult } from '@apollo/client/cache/inmemory/helpers';

interface State {
  loading: boolean;
  txPending: boolean;
  connected: boolean;
  finalized: boolean;
  whitelisted: boolean;
  walletMAIBalance?: string;
  walletMAIAllowance?: string;
  allotment?: string;
  idoMAIAmount?: string;
  purchasedAmount?: string;
  stakingAmount?: string;
  error?: Error;
  totalRaised?: string;
}

export type Action =
  | {
      type: 'load-details-complete';
      walletMAIBalance: string;
      walletMAIAllowance: string;
      whitelisted: boolean;
      allotment: string;
      idoMAIAmount: string;
      purchasedAmount: string;
      connected: boolean;
      stakingAmount: string;
      finalized: boolean;
      totalRaised: string;
    }
  | {
      type: 'approve';
    }
  | {
      type: 'approved';
      walletMAIAllowance: string;
    }
  | {
      type: 'purchasing';
    }
  | {
      type: 'purchased';
    }
  | {
      type: 'error';
      error: Error;
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load-details-complete':
      let { type, connected, ...rest } = action;
      if (state.connected && !connected) {
        return state;
      }
      return {
        ...state,
        ...rest,
        loading: false,
        error: undefined,
      };
    case 'approve': {
      return { ...state, txPending: true, error: undefined };
    }
    case 'approved': {
      return {
        ...state,
        txPending: false,
        walletMAIAllowance: action.walletMAIAllowance,
      };
    }
    case 'purchasing': {
      return { ...state, txPending: true, error: undefined };
    }
    case 'purchased': {
      return { ...state, txPending: false };
    }
    case 'error': {
      return { ...state, error: action.error, loading: false, txPending: false };
    }
  }
}

export default function IDO() {
  const { address: wallet, connect, connected, provider, chainID } = useWeb3Context();
  const addresses = getAddresses(chainID);
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    txPending: false,
    whitelisted: false,
    connected: false,
    finalized: false,
  });

  const [amount, setAmount] = useState<string>('0');
  const [buttonText, setButtonText] = useState<string>('approve');
  const [maiBalance, setMaiBalance] = useState<string>();
  const [salePrice, setSalePrice] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const mai = new ethers.Contract(addresses.MAI_ADDRESS, MAIContract, provider);
  const ido = new ethers.Contract(addresses.IDO, IDOContract, provider);
  const staking = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    const idoMAIAmount = ethers.utils.formatEther(await mai.balanceOf(ido.address));
    let walletMAIBalance = connected ? await mai.balanceOf(wallet) : BigNumber.from(0);
    walletMAIBalance = walletMAIBalance.lt('1000000000') ? '0' : ethers.utils.formatEther(walletMAIBalance);
    const walletMAIAllowance = connected ? ethers.utils.formatEther(await mai.allowance(wallet, ido.address)) : '0';
    const whiteListEnabled = await ido.whiteListEnabled();
    const whitelisted = connected ? !whiteListEnabled || (await ido.whiteListed(wallet)) : false;
    let allotment = '0';
    try {
      allotment = whitelisted ? ethers.utils.formatUnits(await ido.getAllotmentPerBuyer(), 9) : '0';
    } catch (error) {}
    const purchasedAmount = connected ? ethers.utils.formatUnits(await ido.purchasedAmounts(wallet), 9) : '0';
    const warmupInfo = connected ? await staking.warmupInfo(wallet) : { deposit: BigNumber.from(0) };
    const stakingAmount = ethers.utils.formatUnits(warmupInfo.deposit, 9);
    const finalized = await ido.finalized();
    const totalRaised = Number(ethers.utils.formatUnits(await mai.balanceOf(addresses.IDO), 18)).toLocaleString(
      'en-US',
    );
    console.log('sale price : ' + Number(ethers.utils.formatUnits(await ido.salePrice(), 18)));
    setSalePrice(ethers.utils.formatUnits(await ido.salePrice(), 18));
    console.log(totalRaised);

    if (connected) {
      const balance = ethers.utils.formatUnits(await mai.connect(provider.getSigner()).balanceOf(wallet));
      setMaiBalance(balance);
    } else setMaiBalance('0');

    setLoading(false);

    dispatch({
      type: 'load-details-complete',
      walletMAIBalance,
      walletMAIAllowance,
      whitelisted,
      allotment,
      idoMAIAmount,
      purchasedAmount,
      connected: Boolean(connected),
      stakingAmount,
      finalized,
      totalRaised,
    });
  }, [wallet, provider, connected]);

  const approve = useCallback(async () => {
    dispatch({ type: 'approve' });
    try {
      const tx = await mai.connect(provider.getSigner()).approve(addresses.IDO, ethers.constants.MaxUint256);
      await tx.wait(1);
      loadDetails();
      setButtonText('deposit');
    } catch (error) {
      console.error(error);
      dispatch({ type: 'error', error: error as Error });
      setButtonText('approve');
    } finally {
      dispatch({ type: 'approved', walletMAIAllowance: ethers.constants.MaxUint256.toString() });
    }
  }, [provider, ido]);

  const deposit = useCallback(async () => {
    dispatch({ type: 'purchasing' });
    try {
      // window.alert(Number(ethers.utils.parseUnits(amount, 'gwei')));
      const tx = await ido.connect(provider.getSigner()).purchaseCLAM(ethers.utils.parseEther(amount));
      console.log(tx);
      await tx.wait(1);
      loadDetails();
    } catch (error) {
      console.error(error);
      dispatch({ type: 'error', error: error as Error });
    } finally {
      dispatch({ type: 'purchased' });
    }
  }, [provider, ido]);

  const claim = useCallback(async () => {
    dispatch({ type: 'purchasing' });
    try {
      const tx = await ido.connect(provider.getSigner()).claim(wallet);
      await tx.wait(3);
      loadDetails();
    } catch (error) {
      console.error(error);
      dispatch({ type: 'error', error: error as Error });
    } finally {
      dispatch({ type: 'purchased' });
    }
  }, [provider, ido]);

  useEffect(() => {
    loadDetails();
  }, [connected]);

  useEffect(() => {
    loadDetails();
  }, [connected]);

  const NotConnectedBox = () => (
    <div className={styles.notConnectedBox}>
      <p className={styles.title}>
        Claim your <span className={styles.highlight}>BBB</span> to join the Bibimbap Land now!
      </p>
      <div className={styles.button}>
        <Button variant="contained" color="primary" size="large" disableElevation onClick={connect}>
          Connect Your Wallet
        </Button>
      </div>
      <div>
        <p className={styles.learnMore}>
          <a href={MediumLink}>Learn more</a>
        </p>
      </div>
    </div>
  );

  const SuccessBox = () => (
    <>
      <div className={styles.presale_header_success}>
        <h1 className={styles.successTitle}>You’ve claimed your BBB!</h1>
        <h1 className={styles.successSubTitle}>Welcome to the Bibimbap Land</h1>
      </div>
      <div className={styles.presale_success_content}>
        <div className={styles.balance_icon}>
          <img src={tokenIcon} className={styles.tokenIcon} />
        </div>
        {state.purchasedAmount != '0.0' && (
          <div className={styles.balance_stats}>
            <p>Your current balance</p>
            <div className={styles.tokenAmounts}>
              <p className={styles.tokenAmount}>
                {Intl.NumberFormat('en').format(Number(state.purchasedAmount || 0))}
                <span className={styles.tokenTitle}>CLAM</span>
              </p>
            </div>
          </div>
        )}
        {state.purchasedAmount != '0.0' && (
          <div className={styles.contribution}>
            <p>Your contribution</p>
            <div className={styles.tokenAmounts}>
              <p className={styles.tokenAmount}>
                {Intl.NumberFormat('en').format(Number(state.purchasedAmount || 0) * 5)}
                <span className={styles.tokenTitle}>MAI</span>
              </p>
              <p className={styles.tokenSubTitle}>5 MAI = 1 CLAM</p>
            </div>
          </div>
        )}
        {state.purchasedAmount != '0.0' && (
          <div className={styles.contribution}>
            <p>Your Staking</p>
            <div className={styles.tokenAmounts}>
              <p className={styles.tokenAmount}>
                {Intl.NumberFormat('en').format(Number(state.stakingAmount || 0))}
                <span className={styles.tokenTitle}>CLAM</span>
              </p>
            </div>
          </div>
        )}
      </div>
      <div className={styles.learnMoreArea}>
        {ethers.utils.parseUnits(state.stakingAmount || '0', 9).eq(0) && (
          <div className={styles.claimButton}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disableElevation
              onClick={claim}
              disabled={!state.finalized || state.txPending}
            >
              Claim & Stake
            </Button>
            {!state.finalized && <p>Stake & Claim will be available after 2021/11/3 0:00 UTC</p>}
            {state.error && <p>{state.error.message}</p>}
          </div>
        )}
        <div className={styles.claimButton}>
          <a style={{ textDecoration: 'none' }} href="https://app.otterclam.finance">
            <Button variant="contained" color="primary" size="medium" disableElevation>
              Enter app
            </Button>
          </a>
        </div>
        <p className={styles.learnMore}>
          <a href={MediumLink}>Learn more</a>
        </p>
      </div>
    </>
  );

  return (
    <div className={styles.body}>
      <LandingHeader />
      <div className={styles.hero_section}>
        <h1 className={styles.title}>Claim your BBB</h1>
        <p className={styles.desc}>
          The IDO will be held from Dec 17, 2021 0:00 UTC to Nov 2, 2021 23:59 UTC. Join the Bibimbap Land now!🦦
        </p>
      </div>
      <Countdown />
      <div className={styles.mainBox}>
        <div className={styles.happyOtterBox}>
          <img src={happyOtter} className={styles.happyOtter} />
        </div>

        <div className={styles.currentMaiBox}>
          {/* <img src={polygon} className={styles.polygon} /> */}
          <h1>Total Raised (MAI)</h1>
          <h2>${state.totalRaised}</h2>
          {/* <h2>${Intl.NumberFormat('en').format(1001140)}</h2> */}
        </div>
      </div>
      <div className={styles.claimClamBox}>
        {connected ? (
          <div className={styles.connectedBox}>
            {loading ? (
              <p className={styles.soldOut}>loading...</p>
            ) : !state.whitelisted ? (
              <p className={styles.soldOut}>Sorry, you are not in whitelist!</p>
            ) : (Number(state.purchasedAmount || '0') > 0 || Number(state.stakingAmount || '0')) > 0 ? (
              <SuccessBox />
            ) : (
              <div className={styles.presale_content}>
                <div className={styles.flexRow}>
                  <h2>Deposit amount</h2>
                  <div className={styles.button}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => setAmount((Number(salePrice) * Number(state.allotment)).toString() || '')}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
                <FormControl variant="outlined" color="primary" fullWidth>
                  <InputLabel htmlFor="outlined-adornment-amount"></InputLabel>
                  <OutlinedInput
                    placeholder="Amount"
                    id="outlined-adornment-amount"
                    type="number"
                    onChange={e => {
                      if (Number(e.target.value) > Number(salePrice) * Number(state.allotment)) {
                        window.alert('cannot purchase more than allotment!');
                      } else setAmount(e.target.value || '');
                    }}
                    labelWidth={0}
                    value={amount}
                    endAdornment={
                      <InputAdornment position="end">
                        <div className="stake-input-btn">
                          <p>MAI</p>
                        </div>
                      </InputAdornment>
                    }
                  />
                </FormControl>
                <div>
                  <h2>Your current balance: {maiBalance} MAI</h2>
                  <h4>
                    Max deposit amount allowed: {(Number(salePrice) * Number(state.allotment)).toLocaleString('en-US')}{' '}
                    MAI
                  </h4>
                </div>
                <div>
                  <h3>You will claim</h3>
                  <h2>{Number(amount) / 5} BBB</h2>
                  <h4>5 MAI = 1 BBB</h4>
                  <p>
                    Hereby I acknowledge that one wallet can only deposit once during IDO and agree to the token
                    purchase agreement and token sale term.
                  </p>
                </div>
                <div className={styles.button}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => {
                      if (buttonText === 'approve') approve();
                      else deposit();
                    }}
                    disabled={state.txPending}
                  >
                    {buttonText}
                  </Button>
                </div>
              </div>
              // <div className={styles.soldOutContainer}>
              //   <p className={styles.soldOut}>Sold Out!</p>
              //   <a style={{ textDecoration: 'none' }} href="https://app.otterclam.finance">
              //     <Button variant="contained" color="primary" size="large" disableElevation>
              //       Open App
              //     </Button>
              //   </a>
              // </div>
            )}
          </div>
        ) : (
          <NotConnectedBox />
        )}
      </div>
      <Footer backgroundColor="#f7f9fb" />
    </div>
  );
}
