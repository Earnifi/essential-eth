/**
 * A trimmed version of https://chainid.network/chains.json
 */
export interface Network {
  chainId: number;
  ensAddress: string | null; // ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
  name: string;
}

export type Networkish = Network | string | number;
