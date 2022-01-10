import { JsonRpcProvider } from '@ethersproject/providers';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';
import _ from 'lodash';
import { contractForReserve } from 'src/helpers';
import { BBBTokenContract, BBBTokenMigrator, StakedBBBContract, StakingContract } from '../../abi';
import { getAddresses } from '../../constants';
import { fetchAccountSuccess } from './account-slice';
import { loadAppDetails } from './app-slice';
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from './pending-txns-slice';

interface IChangeApproval {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

interface IState {
  [key: string]: any;
}

const initialState: IState = {
  loading: true,
};

export interface MigrationState extends IState {
  oldBBB: string;
  oldsBBB: string;
  oldWarmup: string;
  canClaimWarmup: boolean;
  BBBAllowance: number;
  sBBBAllowance: number;
  oldBBBTotalSupply: number;
  oldTreasuryBalance: number;
  migrateProgress: number;
}

export interface LoadMigrationActionPayload {
  address: string;
  networkID: number;
  provider: JsonRpcProvider;
}

export const loadMigrationDetails = createAsyncThunk(
  'migration/loadMigrationDetails',
  async ({ networkID, provider, address }: LoadMigrationActionPayload): Promise<MigrationState> => {
    const addresses = getAddresses(networkID);
    const oldBBBContract = new ethers.Contract(addresses.OLD_BBB_ADDRESS, BBBTokenContract, provider);
    const oldSBBBContract = new ethers.Contract(addresses.OLD_SBBB_ADDRESS, StakedBBBContract, provider);
    const oldStakingContract = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, provider);
    const stakingContract = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);
    const migrator = new ethers.Contract(addresses.MIGRATOR, BBBTokenMigrator, provider);
    const mai = contractForReserve('mai', networkID, provider);

    const [oldBBBBalance, oldSBBBBalance, oldWarmup, oldSBBBAllowance, BBBMigratorAllowance, epoch] = await Promise.all(
      [
        oldBBBContract.balanceOf(address),
        oldSBBBContract.balanceOf(address),
        oldStakingContract.warmupInfo(address),
        oldSBBBContract.allowance(address, addresses.OLD_STAKING_ADDRESS),
        oldBBBContract.allowance(address, addresses.MIGRATOR),
        stakingContract.epoch(),
      ],
    );
    const oldBBBTotalSupply = (await oldBBBContract.totalSupply()) / 1e9;
    const oldTreasuryBalance = (await mai.balanceOf(addresses.OLD_TREASURY)) / 1e18;
    const oldTotalSupply = (await migrator.oldSupply()) / 1e9;
    const migrateProgress = 1 - oldBBBTotalSupply / oldTotalSupply;

    const oldGons = oldWarmup[1];
    const oldWarmupBalance = await oldSBBBContract.balanceForGons(oldGons);

    return {
      oldBBB: ethers.utils.formatUnits(oldBBBBalance, 9),
      oldsBBB: ethers.utils.formatUnits(oldSBBBBalance, 9),
      oldWarmup: ethers.utils.formatUnits(oldWarmupBalance, 9),
      canClaimWarmup: oldWarmup[0].gt(0) && epoch[1].gte(oldWarmup[2]),
      sBBBAllowance: +oldSBBBAllowance,
      BBBAllowance: +BBBMigratorAllowance,
      oldBBBTotalSupply,
      oldTreasuryBalance,
      migrateProgress,
    };
  },
);

export const approveUnstaking = createAsyncThunk(
  'migration/approve-unstaking',
  async ({ provider, address, networkID }: IChangeApproval, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const sBBBContract = new ethers.Contract(addresses.OLD_SBBB_ADDRESS, StakedBBBContract, signer);

    let approveTx;
    try {
      approveTx = await sBBBContract.approve(addresses.OLD_STAKING_ADDRESS, ethers.constants.MaxUint256);

      const text = 'Approve Unstaking';
      const pendingTxnType = 'approve_unstaking';

      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    const sBBBAllowance = await sBBBContract.allowance(address, addresses.OLD_STAKING_ADDRESS);

    return dispatch(
      fetchAccountSuccess({
        migration: {
          sBBBAllowance: +sBBBAllowance,
        },
      }),
    );
  },
);

export const approveMigration = createAsyncThunk(
  'migration/approve-migration',
  async ({ provider, address, networkID }: IChangeApproval, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);

    const signer = provider.getSigner();
    const BBBContract = new ethers.Contract(addresses.OLD_BBB_ADDRESS, BBBTokenContract, signer);

    let approveTx;
    try {
      approveTx = await BBBContract.approve(addresses.MIGRATOR, ethers.constants.MaxUint256);

      const text = 'Approve Migration';
      const pendingTxnType = 'approve_migration';

      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    const BBBAllowance = await BBBContract.allowance(address, addresses.MIGRATOR);

    return dispatch(
      fetchAccountSuccess({
        migration: {
          BBBAllowance: +BBBAllowance,
        },
      }),
    );
  },
);

export interface MigrateAction {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const migrate = createAsyncThunk(
  'migration/migrate',
  async ({ provider, address, networkID }: MigrateAction, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const migrator = new ethers.Contract(addresses.MIGRATOR, BBBTokenMigrator, signer);

    let tx;
    try {
      tx = await migrator.migrate();
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'Migrating', type: 'migrating' }));
      await tx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
    dispatch(loadAppDetails({ networkID, provider }));
  },
);

interface UnstakeAction {
  value: string;
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const unstake = createAsyncThunk(
  'migration/unstake',
  async ({ value, provider, address, networkID }: UnstakeAction, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;

    try {
      tx = await staking.unstake(ethers.utils.parseUnits(value, 'gwei'), false);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: getStakingTypeText('unstake'), type: 'unstaking' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

interface ClaimWarmupPayload {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const claimWarmup = createAsyncThunk(
  'migration/claimWarmup',
  async ({ provider, address, networkID }: ClaimWarmupPayload, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;
    try {
      tx = await staking.claim(address);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'CLAIMING', type: 'claimWarmup' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

export const clearWarmup = createAsyncThunk(
  'migration/clear-warmup',
  async ({ provider, address, networkID }: ClaimWarmupPayload, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;
    try {
      tx = await staking.claim(address);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'CLAIMING', type: 'claimWarmup' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

const migrateSlice = createSlice({
  name: 'migrate',
  initialState,
  reducers: {
    fetchMigrationSuccess(state, action) {
      _.merge(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMigrationDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadMigrationDetails.fulfilled, (state, action) => {
        _.merge(state, action.payload);
        state.loading = false;
      })
      .addCase(loadMigrationDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default migrateSlice.reducer;

export const { fetchMigrationSuccess } = migrateSlice.actions;

const baseInfo = (state: { migrate: MigrationState }) => state.migrate;

export const getMigrationState = createSelector(baseInfo, migrate => migrate);
