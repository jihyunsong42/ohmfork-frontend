import { getAddresses } from '.';

export type BondKey = 'mai' | 'mai44' | 'mai_clam44' | 'mai_clam' | 'mai-v1' | 'mai_clam_v2-v1' | 'mai_clam-v1';

export const BondKeys: BondKey[] = [
  'mai',
  'mai44',
  'mai_clam',
  'mai_clam44',
  'mai-v1',
  'mai_clam-v1',
  'mai_clam_v2-v1',
];

export const ReserveKeys: BondKey[] = ['mai'];

export enum BondAction {
  Bond = 'bond',
  Redeem = 'redeem',
}

export interface Bond {
  key: BondKey;
  name: string;
  address: string;
  reserve: string;
  reserveUnit: string;
  type: 'token' | 'lp';
  dexUrl: string;
  deprecated: boolean;
  autostake: boolean;
}

type BondMap = {
  [key in BondKey]: Bond;
};

export function listBonds(chainId: number): BondMap {
  const { BONDS, RESERVES, MAI_ADDRESS, CLAM_ADDRESS } = getAddresses(chainId);
  return {
    mai: {
      key: 'mai',
      name: 'MAI v2',
      address: BONDS.MAI,
      reserve: RESERVES.MAI,
      reserveUnit: 'MAI',
      type: 'token',
      dexUrl: `https://quickswap.exchange/#/swap?outputCurrency=${MAI_ADDRESS}`,
      deprecated: true,
      autostake: false,
    },
    mai44: {
      key: 'mai44',
      name: 'MAI (4,4)',
      address: '0x779CB532e289CbaA3d0692Ae989C63C2B4fBd4d0',
      reserve: RESERVES.MAI,
      reserveUnit: 'MAI',
      type: 'token',
      dexUrl: `https://quickswap.exchange/#/swap?outputCurrency=${MAI_ADDRESS}`,
      deprecated: false,
      autostake: true,
    },
    mai_clam: {
      key: 'mai_clam',
      name: 'MAI-CLAM2 LP',
      address: BONDS.MAI_CLAM,
      reserve: RESERVES.MAI_CLAM,
      reserveUnit: 'LP',
      type: 'lp',
      dexUrl: `https://quickswap.exchange/#/add/${MAI_ADDRESS}/${CLAM_ADDRESS}`,
      deprecated: true,
      autostake: false,
    },
    mai_clam44: {
      key: 'mai_clam44',
      name: 'MAI-CLAM2 (4,4)',
      address: '0xda0d7c3d751d00a1ec1c495eF7Cf3db1a202B0B9',
      reserve: RESERVES.MAI_CLAM,
      reserveUnit: 'LP',
      type: 'lp',
      dexUrl: `https://quickswap.exchange/#/add/${MAI_ADDRESS}/${CLAM_ADDRESS}`,
      deprecated: false,
      autostake: true,
    },
    'mai-v1': {
      key: 'mai-v1',
      name: 'MAI v1',
      address: BONDS.OLD_MAI,
      reserve: RESERVES.MAI,
      reserveUnit: 'MAI',
      type: 'token',
      dexUrl: '',
      deprecated: true,
      autostake: false,
    },
    'mai_clam-v1': {
      key: 'mai_clam-v1',
      name: 'MAI-CLAM v1-legacy',
      address: BONDS.OLD_MAI_CLAM,
      reserve: RESERVES.OLD_MAI_CLAM,
      reserveUnit: 'LP',
      type: 'lp',
      dexUrl: `https://quickswap.exchange/#/add/${MAI_ADDRESS}/${CLAM_ADDRESS}`,
      deprecated: true,
      autostake: false,
    },
    'mai_clam_v2-v1': {
      key: 'mai_clam_v2-v1',
      name: 'MAI-CLAM v1',
      address: BONDS.OLD_MAI_CLAM_V2,
      reserve: RESERVES.OLD_MAI_CLAM,
      reserveUnit: 'LP',
      type: 'lp',
      dexUrl: `https://quickswap.exchange/#/add/${MAI_ADDRESS}/${CLAM_ADDRESS}`,
      deprecated: true,
      autostake: false,
    },
  };
}

export function getBond(bondKey: BondKey, chainId: number): Bond {
  return listBonds(chainId)[bondKey];
}
