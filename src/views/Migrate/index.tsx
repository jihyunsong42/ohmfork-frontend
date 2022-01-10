import { Box, Grid, makeStyles, Paper, TabsActions, Zoom } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SCLAM from 'src/assets/tokens/sCLAM.png';
import { formatCurrency, trim } from '../../helpers';
import { useWeb3Context } from '../../hooks';
import {
  approveMigration,
  approveUnstaking,
  claimWarmup,
  loadMigrationDetails,
  migrate,
  unstake,
} from '../../store/slices/migrate-slice';
import { IPendingTxn, isPendingTxn, txnButtonText } from '../../store/slices/pending-txns-slice';
import { IReduxState } from '../../store/slices/state.interface';
import './migrate.scss';

const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiOutlinedInput-root': {
      borderColor: 'transparent',
      backgroundColor: theme.palette.background.default,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
  },
}));

function Migrate() {
  const styles = useStyles();
  const dispatch = useDispatch();
  const { provider, readOnlyProvider, address, connect, connected, chainID } = useWeb3Context();
  const tabsActions = useRef<TabsActions>(null);

  const isAppLoading = useSelector<IReduxState, boolean>(state => state.migrate.loading);

  const oldBBBTotalSupply = useSelector<IReduxState, number>(state => state.migrate?.oldBBBTotalSupply);
  const oldTreasuryBalance = useSelector<IReduxState, number>(state => state.migrate?.oldTreasuryBalance);
  const migrateProgress = useSelector<IReduxState, number>(state => state.migrate?.migrateProgress);
  const BBBBalance = useSelector<IReduxState, string>(state => state.account.balances?.BBB);
  const oldBBBBalance = useSelector<IReduxState, string>(state => state.migrate?.oldBBB);
  const oldSBBBBalance = useSelector<IReduxState, string>(state => state.migrate?.oldSBBB);
  const oldWarmupBalance = useSelector<IReduxState, string>(state => state.migrate?.oldWarmup);
  const canClaimWarmup = useSelector<IReduxState, boolean>(state => state.migrate?.canClaimWarmup);
  const BBBAllowance = useSelector<IReduxState, number>(state => state.migrate?.BBBAllowance);
  const sBBBAllowance = useSelector<IReduxState, number>(state => state.migrate?.sBBBAllowance);
  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });

  const onMigrate = async () => {
    await dispatch(migrate({ address, provider, networkID: chainID }));
  };

  const onUnstake = async () => {
    await dispatch(unstake({ address, value: oldSBBBBalance, provider, networkID: chainID }));
  };

  const onClaimWarmup = async () => {
    await dispatch(claimWarmup({ address, provider, networkID: chainID }));
  };

  useEffect(() => {
    if (tabsActions.current) {
      setTimeout(() => tabsActions?.current?.updateIndicator(), 300);
    }
  }, [tabsActions]);
  useEffect(() => {
    if (connected) {
      dispatch(
        loadMigrationDetails({
          provider: readOnlyProvider,
          networkID: chainID,
          address,
        }),
      );
    }
  }, [connected, address]);

  return (
    <div id="stake-view" className={styles.root}>
      <Zoom in={true}>
        <Paper className="ohm-card">
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className="card-header">
                <p className="single-stake-title">
                  BBB → BBB2 Migration ({<img src={SCLAM} />},{<img src={SCLAM} />})
                </p>
              </div>
            </Grid>

            <Grid item>
              <div className="stake-top-metrics">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-apy">
                      <p className="single-stake-subtitle">Old BBB Supply</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldBBBTotalSupply ? trim(oldBBBTotalSupply, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-index">
                      <p className="single-stake-subtitle">Old Treasury Reserve</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldTreasuryBalance ? formatCurrency(oldTreasuryBalance, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-index">
                      <p className="single-stake-subtitle">Migration Progress</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {migrateProgress ? (
                          Intl.NumberFormat('en', { style: 'percent' }).format(migrateProgress)
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Box>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </Grid>

            <div className="staking-area">
              {!address ? (
                <div className="stake-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    <Box bgcolor="bibimbap.bibimbapBrown" className="app-otter-button" onClick={connect}>
                      <p>Connect Wallet</p>
                    </Box>
                  </div>
                  <p className="desc-text">Connect your wallet to migrate your BBB tokens!</p>
                </div>
              ) : (
                <div className="migrate-table">
                  <div className="data-row">
                    <div style={{ width: '24px' }} />
                    <div className="data-row-title">Steps</div>
                    <div className="data-row-title">Your amount</div>
                    <div className="data-row-action" />
                  </div>
                  <div className="data-row">
                    <div className="step">1</div>
                    <div className="data-row-name data-row-expand">Claim warmup</div>
                    <div className="data-row-value data-row-expand">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldWarmupBalance), 4)} sBBB</>}
                    </div>
                    <div className="data-row-action">
                      {Number(oldWarmupBalance) === 0 && <Box className="migrate-done">DONE</Box>}
                      {canClaimWarmup && (
                        <Box
                          className="migrate-btn"
                          bgcolor="bibimbap.bibimbapBrown"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'claimWarmup')) return;
                            onClaimWarmup();
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'claimWarmup', 'Claim Warmup')}</p>
                        </Box>
                      )}
                    </div>
                  </div>

                  <div className="data-row">
                    <div className="step">2</div>
                    <div className="data-row-name data-row-expand">Unstake BBB</div>
                    <div className="data-row-value data-row-expand">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldSBBBBalance), 4)} sBBB</>}
                    </div>
                    <div className="data-row-action">
                      {+oldSBBBBalance === 0 && <Box className="migrate-done">DONE</Box>}
                      {+oldSBBBBalance > 0 &&
                        (sBBBAllowance > 0 ? (
                          <Box
                            className="migrate-btn"
                            bgcolor="bibimbap.bibimbapBrown"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'unstaking')) return;
                              onUnstake();
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'unstaking', 'Unstake BBB')}</p>
                          </Box>
                        ) : (
                          <Box
                            className="migrate-btn"
                            bgcolor="bibimbap.bibimbapBrown"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'approve_unstaking')) return;
                              dispatch(approveUnstaking({ address, provider, networkID: chainID }));
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'approve_unstaking', 'Approve')}</p>
                          </Box>
                        ))}
                    </div>
                  </div>

                  <div className="data-row">
                    <div className="step">3</div>
                    <div className="data-row-name data-row-expand">
                      <div>Migrate BBB to BBB2</div>
                      <div className="estimated-BBB2">Estimated BBB2 </div>
                    </div>
                    <div className="data-row-value data-row-expand">
                      <div>{isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldBBBBalance), 4)} BBB</>}</div>
                      <div className="estimated-BBB2">
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldBBBBalance) / 5, 4)} BBB2</>}
                      </div>
                    </div>
                    <div className="data-row-action">
                      {+oldBBBBalance > 0 &&
                        (BBBAllowance >= +oldBBBBalance ? (
                          <Box
                            className="migrate-btn"
                            bgcolor="bibimbap.bibimbapBrown"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'migrating')) return;
                              onMigrate();
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'migrating', 'Migrate')}</p>
                          </Box>
                        ) : (
                          <Box
                            className="migrate-btn"
                            bgcolor="bibimbap.bibimbapBrown"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'approve_migration')) return;
                              dispatch(approveMigration({ address, provider, networkID: chainID }));
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'approve_migration', 'Approve')}</p>
                          </Box>
                        ))}
                    </div>
                  </div>

                  <Box className="data-row" bgcolor="mode.lightGray100">
                    <div />
                    <p className="data-row-name data-row-expand">Your BBB2 Balance</p>
                    <p />
                    <p className="data-row-value data-row-action">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(BBBBalance), 4)} BBB2</>}
                    </p>
                  </Box>
                </div>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>
    </div>
  );
}

export default Migrate;
