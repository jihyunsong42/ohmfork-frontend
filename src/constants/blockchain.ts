export const TOKEN_DECIMALS = 9;

export enum Networks {
  UNKNOW = 0,
  POLYGON_MAINNET = 137,
  POLYGON_MUMBAI = 80001,
  HARDHAT = 31337,
}

export const RPCURL = {
  [Networks.POLYGON_MAINNET]: 'https://polygon-rpc.com',
  [Networks.POLYGON_MUMBAI]: 'https://rpc-mumbai.maticvigil.com/',
  [Networks.HARDHAT]: 'http://localhost:8545',
};

// export const DEFAULT_NETWORK = Networks.POLYGON_MAINNET;
export const DEFAULT_NETWORK = Networks.POLYGON_MUMBAI;
// export const DEFAULT_NETWORK = Networks.HARDHAT;
