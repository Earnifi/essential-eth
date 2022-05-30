import { cleanBlock } from '../classes/utils/clean-block';
import { cleanLog } from '../classes/utils/clean-log';
import { cleanTransaction } from '../classes/utils/clean-transaction';
import { cleanTransactionReceipt } from '../classes/utils/clean-transaction-receipt';
import { buildRPCPostBody, post } from '../classes/utils/fetchers';
import { hexToDecimal } from '../classes/utils/hex-to-decimal';
import { TinyBig, tinyBig } from '../shared/tiny-big/tiny-big';
import { BlockResponse, BlockTag, RPCBlock } from '../types/Block.types';
import { Filter, FilterByBlockHash } from '../types/Filter.types';
import { Network } from '../types/Network.types';
import {
  Log,
  RPCLog,
  RPCTransaction,
  RPCTransactionReceipt,
  TransactionReceipt,
  TransactionResponse,
} from '../types/Transaction.types';
import { TransactionRequest } from './types';
import chainsInfo from './utils/chains-info';

/**
 * Converts a block tag into the right format when needed
 *
 * @param blockTag the block tag to convert/return as a hex string
 * @returns the specified block tag formatted as a hex string
 * @example
 * ```javascript
 * prepBlockTag(14848183);
 * // '0xe290b7'
 * ```
 * @example
 * ```javascript
 * prepBlockTag('0xe290b7');
 * // '0xe290b7'
 * ```
 */
function prepBlockTag(blockTag: BlockTag): string {
  return typeof blockTag === 'number'
    ? tinyBig(blockTag).toHexString()
    : blockTag;
}

export abstract class BaseProvider {
  /**
   * ignore
   */
  abstract selectRpcUrl(): string;
  abstract post(body: Record<string, unknown>): Promise<any>;

  /**
   * @ignore
   */
  readonly _rpcUrls: string[] = [];
  /**
   * @ignore
   */
  protected _post = (body: Record<string, unknown>) =>
    post(this.selectRpcUrl(), body);

  /**
   * @param rpcUrls The URL(s) to your Eth node(s). Consider POKT or Infura
   * @example
   * `https://free-eth-node.com/api/eth`
   * @example
   * `https://mainnet.infura.io/v3/YOUR-PROJECT-ID`
   */
  constructor(rpcUrls: string[]) {
    this._rpcUrls = rpcUrls;
  }

  /**
   * Gets information (name, chainId, and ensAddress when applicable) about the network the provider is connected to
   *
   * @returns information about the network this provider is currently connected to
   * @example
   * ```javascript
   * jsonRpcProvider('https://free-eth-node.com/api/eth').getNetwork();
   * // { chainId: 1, name: 'eth', ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' }
   * ```
   * @example
   * ```javascript
   * jsonRpcProvider('https://free-eth-node.com/api/MATIC').getNetwork();
   * // { chainId: 137, name: 'MATIC', ensAddress: null }
   * ```
   */
  public async getNetwork(): Promise<Network> {
    const hexChainId = (await this.post(
      buildRPCPostBody('eth_chainId', []),
    )) as string;

    const chainId = hexToDecimal(hexChainId);
    const info = (chainsInfo as any)[chainId];
    return {
      chainId: Number(chainId),
      name: info[0] || 'unknown',
      ensAddress: info[1] || null, // only send ensAddress if it exists
    };
  }

  /**
   * Gets the number of the most recently mined block on the network the provider is connected to
   *
   * Identical to [`ethers.provider.getBlockNumber`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBlockNumber)
   * Identical to [`web3.eth.getBlockNumber`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getblocknumber)
   *
   * @returns the number of the most recently mined block
   * @example
   * ```javascript
   * await provider.getBlockNumber();
   * // 1053312
   * ```
   */
  public async getBlockNumber(): Promise<number> {
    const currentBlockNumber = (await this.post(
      buildRPCPostBody('eth_blockNumber', []),
    )) as string;
    return Number(hexToDecimal(currentBlockNumber));
  }

  /**
   * Similar to [`ethers.provider.getTransaction`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransaction), some information not included
   *
   * @param transactionHash the hash of the transaction to get information about
   * @returns information about the specified transaction
   * @example
   * ```javascript
   * await provider.getTransaction('0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789');
   *  {
   *    accessList: [],
   *    blockHash: '0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d',
   *    blockNumber: 14578286,
   *    chainId: 1,
   *    from: '0xdfD9dE5f6FA60BD70636c0900752E93a6144AEd4',
   *    gas: Big {
   *    s: 1,
   *    e: 5,
   *    c: [ 1, 1, 2, 1, 6, 3 ],
   *    constructor: <ref *1> [Function: Big] {
   *    DP: 20,
   *    RM: 1,
   *    NE: -7,
   *    PE: 21,
   *    strict: false,
   *    roundDown: 0,
   *    roundHalfUp: 1,
   *    roundHalfEven: 2,
   *    roundUp: 3,
   *    Big: [Circular *1],
   *    default: [Circular *1]
   *    }
   *    },
   *    gasPrice: Big {
   *    s: 1,
   *    e: 10,
   *    c: [
   *    4, 8, 5, 9, 2,
   *    4, 2, 6, 8, 5,
   *    8
   *    ],
   *    constructor: <ref *1> [Function: Big] {
   *    DP: 20,
   *    RM: 1,
   *    NE: -7,
   *    PE: 21,
   *    strict: false,
   *    roundDown: 0,
   *    roundHalfUp: 1,
   *    roundHalfEven: 2,
   *    roundUp: 3,
   *    Big: [Circular *1],
   *    default: [Circular *1]
   *    }
   *    },
   *    hash: '0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789',
   *    input: '0x83259f170000000000000000000000000000000000000000000000000000000000000080000000000000000000000000dfd9de5f6fa60bd70636c0900752e93a6144aed400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009e99ad11a214fd016b19dc3648678c5944859ae292b21c24ca94f857836c4596f1950c82dd0c23dd621af4763edc2f66466e63c5df9de0c1107b1cd16bf460fe93e43fd308e3444bc79c3d88a4cb961dc8367ab6ad048867afc76d193bca99cf3a068864ed4a7df1dbf1d4c52238eced3e5e05644b4040fc2b3ccb8557b0e99fff6131305a0ea2b8061b90bd418db5bbdd2e92129f52d93f90531465e309c4caec5b85285822b6196398d36f16f511811b61bbda6461e80e29210cd303118bdcee8df6fa0505ffbe8642094fd2ba4dd458496fe3b459ac880bbf71877c713e969ccf5ed7efab8a84ebc07e3939901371ca427e1192e455a8f35a6a1d7ad09e1475dd1758b36fa631dab5d70e99316b23c4c43094188d360cd9c3457355904e07c00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000162074a7047f',
   *    maxFeePerGas: Big {
   *    s: 1,
   *    e: 10,
   *    c: [
   *    6, 7, 6, 8, 1,
   *    2, 6, 1, 6, 1,
   *    8
   *    ],
   *    constructor: <ref *1> [Function: Big] {
   *    DP: 20,
   *    RM: 1,
   *    NE: -7,
   *    PE: 21,
   *    strict: false,
   *    roundDown: 0,
   *    roundHalfUp: 1,
   *    roundHalfEven: 2,
   *    roundUp: 3,
   *    Big: [Circular *1],
   *    default: [Circular *1]
   *    }
   *    },
   *    maxPriorityFeePerGas: Big {
   *    s: 1,
   *    e: 9,
   *    c: [ 1, 5 ],
   *    constructor: <ref *1> [Function: Big] {
   *    DP: 20,
   *    RM: 1,
   *    NE: -7,
   *    PE: 21,
   *    strict: false,
   *    roundDown: 0,
   *    roundHalfUp: 1,
   *    roundHalfEven: 2,
   *    roundUp: 3,
   *    Big: [Circular *1],
   *    default: [Circular *1]
   *    }
   *    },
   *    nonce: 129,
   *    r: '0x59a7c15b12c18cd68d6c440963d959bff3e73831ffc938e75ecad07f7ee43fbc',
   *    s: '0x1ebaf05f0d9273b16c2a7748b150a79d22533a8cd74552611cbe620fee3dcf1c',
   *    to: '0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B',
   *    transactionIndex: 29,
   *    type: 2,
   *    v: 0,
   *    value: Big {
   *    s: 1,
   *    e: 0,
   *    c: [ 0 ],
   *    constructor: <ref *1> [Function: Big] {
   *    DP: 20,
   *    RM: 1,
   *    NE: -7,
   *    PE: 21,
   *    strict: false,
   *    roundDown: 0,
   *    roundHalfUp: 1,
   *    roundHalfEven: 2,
   *    roundUp: 3,
   *    Big: [Circular *1],
   *    default: [Circular *1]
   *    }
   *    },
   *    confirmations: 1210
   *    }
   * ```
   */
  public async getTransaction(
    transactionHash: string,
  ): Promise<TransactionResponse> {
    const [rpcTransaction, blockNumber] = await Promise.all([
      this.post(
        buildRPCPostBody('eth_getTransactionByHash', [transactionHash]),
      ) as Promise<RPCTransaction>,
      this.getBlock('latest'),
    ]);
    const cleanedTransaction = cleanTransaction(rpcTransaction);
    // https://ethereum.stackexchange.com/questions/2881/how-to-get-the-transaction-confirmations-using-the-json-rpc
    cleanedTransaction.confirmations =
      blockNumber.number - cleanedTransaction.blockNumber + 1;
    return cleanedTransaction;
  }

  /**
   * Gives information about a transaction that has already been mined. Includes additional information beyond what's provided by {@link getTransaction}
   *
   * Similar to [`ethers.provider.getTransactionReceipt`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransactionReceipt), some information not included
   *
   * @param transactionHash the hash of the transaction to get information about
   * @returns information about the specified transaction that has already been mined
   * @example
   * ```javascript
   *
   * ```
   */
  public async getTransactionReceipt(
    transactionHash: string,
  ): Promise<TransactionReceipt> {
    const [rpcTransaction, blockNumber] = await Promise.all([
      this.post(
        buildRPCPostBody('eth_getTransactionReceipt', [transactionHash]),
      ) as Promise<RPCTransactionReceipt>,
      this.getBlock('latest'),
    ]);
    const cleanedTransactionReceipt = cleanTransactionReceipt(rpcTransaction);
    cleanedTransactionReceipt.confirmations =
      blockNumber.number - cleanedTransactionReceipt.blockNumber + 1;
    return cleanedTransactionReceipt;
  }

  /**
   * Returns the number of sent transactions by an address, from genesis (or as far back as a provider looks) up to specified blockTag
   *
   * Same as `ethers.provider.getTransactionCount`
   * Same as `web3.eth.getTransactionCount`
   *
   * @param address the address to count number of sent transactions
   * @param blockTag the block to count transactions up to, inclusive
   * @returns the number of transactions sent by the specified address
   * @example
   * ```javascript
   * const address = '0x71660c4005ba85c37ccec55d0c4493e66fe775d3';
   *  await provider
   *   .getTransactionCount(address, 'latest')
   * // 1060000
   * ```
   * @example
   * ```javascript
   *  await provider
   *   .getTransactionCount(address)
   * // 1053312
   * ```
   * @example
   * ```javascript
   *  await provider
   *   .getTransactionCount(address, 14649390)
   * // 1053312
   * ```
   */
  public async getTransactionCount(
    address: string,
    blockTag: BlockTag = 'latest',
  ): Promise<number> {
    blockTag = prepBlockTag(blockTag);
    const transactionCount = (await this.post(
      buildRPCPostBody('eth_getTransactionCount', [address, blockTag]),
    )) as string;
    return Number(hexToDecimal(transactionCount));
  }

  /**
   * Gets information about a certain block.
   * Same as `web3.eth.getBlock` and `ethers.providers.getBlock`
   *
   * @param timeFrame The number, hash, or text-based description ('latest', 'earliest', or 'pending') of the block to collect information on.
   * @param returnTransactionObjects Whether to also return data about the transactions on the block.
   * @returns A BlockResponse object with information about the specified block
   * @example
   * ```javascript
   * await provider.getBlock(14645431);
   * ```
   * @example
   * ```javascript
   * await provider.getBlock('0x3e5cea9c2be7e0ab4b0aa04c24dafddc37571db2d2d345caf7f88b3366ece0cf');
   * ```
   * @example
   * ```javascript
   * await provider.getBlock('latest');
   * {
   *   number: 4232826,
   *   hash: '0x93211a1cd17e154b183565ec685254a03f844a8e34824a46ce1bdd6753dcb669',
   *   parentHash: '0x1b32bfcba1bb2a57f56e166a3bb06875a1978992999dfc8828397b4c1526f472',
   *   sha3Uncles: '0x0fb399c67bb5a071ec8a22549223215ab76b7d4009941c9c37aa3c3936010463',
   *   logsBloom: '0x00000000000000000000101000000000020000000000000000000000000000000000400000010000000000000000000000000000010000000008800000000800000000200000000000000000000000000000000000000000000002000000000000000000000000000040000000000040000000000000000000000000000000000000000000000001000000000004000000000010000000000000000020000000000000000200100020000000000000000080000000000080001000000000000000000001040000000000000000008000000020010100000000200000100000000000000000000000002000000080000000020400000000002000200000000000',
   *   transactionsRoot: '0xc43b3f13e1fe810e34d3a26ffe465b72c7063a5c70a02de2c78e91e4d10bd9fb',
   *   stateRoot: '0x04d7bc816537ea7ef3a16e76c9879d29f34f99d4154273c2e98e012a31bad745',
   *   receiptsRoot: '0x89c6f781ceac0bd49c4d9aa9115df4a5d4dd0e0220ff7668012f15bc04222c6b',
   *   miner: '0x31fe561eb2c628cD32Ec52573D7c4b7E4C278Bfa',
   *   difficulty: '1300907486001755331049',
   *   totalDifficulty: '5989929395521171616186006183',
   *   extraData: '0xce018c495249532d62613031656132',
   *   size: 5416,
   *   gasLimit: 6800000,
   *   gasUsed: 202955,
   *   timestamp: 1649884910,
   *   transactions: [
   *     '0x6b34a59c7b9aead24fa6dad782f8a3ad84ed4a23ee09bcbf0bcf880840fbbe20',
   *     '0x9a3851ca24d5336c6a0d48aba2c4b4769d7a672c9b01729c5eb9924efd1b19a7',
   *     '0xc3ed3d198b62f2f3427ebfa3bbd0fcada4e3c0c189e4464e7eeceb403c75981e'
   *   ],
   *   uncles: [
   *     '0x0c567c054e98153f10d651fbbc018891c1dd9d62a9ffd998e87678803e95b6ed',
   *     '0xb7d69389dbfb057c6fcb4bc0582d46a2ba01170703f0dadf8cd1462b83e88753',
   *     '0xd5f74ccd0ad4c58b3161e8c2c507c264231e5f28925061b809c02e5e4bb6db28'
   *   ],
   *   minimumGasPrice: '0x387ee40',
   *   bitcoinMergedMiningHeader: '0x04000020e8567ed3d2480e15a1dd1b4335e4732ae343c037e4fd03000000000000000000ed10a8340d163d3e813bdd430f902f4e5a56828dc62313b2e23797c0be6b8516eb3e576297d8091735884f42',
   *   bitcoinMergedMiningCoinbaseTransaction: '0x0000000000000140e910128fda7bac502dc5e0573bbaf12de8e2524f70c22f7bd160dedcb19a2521002b6a2952534b424c4f434b3ae493303f597fa368c0ccc4f8aceabf1c315bb7c9a07605c073a89f260040967aace6a7d9',
   *   bitcoinMergedMiningMerkleProof: '0xdf63a3d7eb6fbcfb301311faa46e9a15b0408bb1a04e284daee86c273c1dfd65ede23f3170f806e9e0f4cef7ba6b56aa37470d9c23f96ec8e43d08b58645919c5e10bcb892897a731f8f9ce79c72dc0e390896bcd6c67bb38c0bdb72982b6cf05519968d76673572c3f3ef3a08b0ddb464863f1788f7cdbaad3fe44a8a8af576d430ac282fe28852c16df198ca96cc5f71a50695912efe1a836e8442be69e31b6d6f973da2818bce9a3a1c2d9be0671aee9a7776e398d6a03d1e178e20d84646004a3d03c0501334e629d9146aa6a01316dcbaa289df6e6c5e3090cadaddff22699cfc7ff09512fc0d65c5062f17c98561ce3c9510de210d9d654cf99f8d756ff37c9fa21e7122ee8cadb923341690845d572921425f2bd7e044558b7e07983ac4df28928028b0c13c3624dc7a965af8091b0cecc845bf7da5308c03b2c97d607f6706a599f802025894435f1d76ea4e67cc2fc4e1559f1206f559a24633de0f',
   *   hashForMergedMining: '0xe493303f597fa368c0ccc4f8aceabf1c315bb7c9a07605c073a89f260040967a',
   *   paidFees: '0xc0744dcb7a0',
   *   cumulativeDifficulty: '0x1190930db285269e582'
   *   }
   *```
   */
  public async getBlock(
    timeFrame: BlockTag = 'latest',
    returnTransactionObjects = false,
  ): Promise<BlockResponse> {
    let type: 'Number' | 'Hash' = 'Number';
    if (typeof timeFrame === 'string' && timeFrame.length === 66) {
      // use endpoint that accepts string
      type = 'Hash';
    } else {
      timeFrame = prepBlockTag(timeFrame);
    }

    const rpcBlock = (await this.post(
      buildRPCPostBody(`eth_getBlockBy${type}`, [
        timeFrame,
        returnTransactionObjects,
      ]),
    )) as RPCBlock;

    return cleanBlock(rpcBlock, returnTransactionObjects);
  }

  /**
   * Returns the current gas price in wei as TinyBig
   *
   * * Same as {@link https://docs.ethers.io/v5/api/providers/provider/#Provider-getGasPrice | `ethers.provider.getGasPrice`}
   *
   * @returns the current gas price in wei
   * @example
   * ```javascript
   * await provider.getGasPrice().then((price) => console.log(price.toString()));
   * // '52493941856'
   * ```
   */
  public async getGasPrice(): Promise<TinyBig> {
    const hexGasPrice = (await this.post(
      buildRPCPostBody('eth_gasPrice', []),
    )) as string;
    return tinyBig(hexToDecimal(hexGasPrice));
  }

  /**
   * Returns the balance of the account in wei as TinyBig
   * Same as [`ethers.provider.getBalance`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance)
   * Same as `web3.eth.getBalance`
   *
   * @param address the address to check the balance of
   * @param blockTag the block to check the specified address' balance on
   * @returns the balance of the network's native token for the specified address on the specified block
   * @example
   * ```javascript
   *  await provider
   *   .getBalance('0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8')
   *   .then((balance) => console.log(balance.toString()));
   * // "28798127851528138"
   * ```
   */
  public async getBalance(
    address: string,
    blockTag: BlockTag = 'latest',
  ): Promise<TinyBig> {
    blockTag = prepBlockTag(blockTag);
    const hexBalance = (await this.post(
      buildRPCPostBody('eth_getBalance', [address, blockTag]),
    )) as string;
    return tinyBig(hexToDecimal(hexBalance));
  }

  /**
   * Gets the code of a contract on a specified block
   *
   * Identical to [`ethers.provider.getCode`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getCode)
   * Similar to [`web3.eth.getCode`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getcode); does not accept TinyBig/BN/BigNumber
   *
   * @param address the contract address to get the contract code from
   * @param blockTag the block height to search for the contract code from. Contract code can change, so this allows for checking a specific block
   * @returns the contract creation code for the specified address at the specified block height
   * @example
   * ```javascript
   * await jsonRpcProvider().getCode('0xaC6095720221C79C6E7C638d260A2eFBC5D8d880', 'latest');
   * // '0x608060405234801561001057600080fd5b506004361061...'
   * ```
   */
  public async getCode(
    address: string,
    blockTag: BlockTag = 'latest',
  ): Promise<string> {
    blockTag = prepBlockTag(blockTag);
    const contractCode = (await this.post(
      buildRPCPostBody('eth_getCode', [address, blockTag]),
    )) as string;
    return contractCode;
  }

  /**
   * Returns an estimate of the amount of gas that would be required to submit transaction to the network.
   * An estimate may not be accurate since there could be another transaction on the network that was not accounted for, but after being mined affected relevant state.
   *
   * Same as ["estimateGas" in ethers.js](https://docs.ethers.io/v5/api/providers/provider/#Provider-estimateGas)
   *
   * @param transaction the transaction to check the gas cost for
   * @returns the estimated amount of cost charged for submitting the specified transaction to the blockchain
   * @example
   * ```javascript
   * await provider.estimateGas({
   *   // Wrapped ETH address
   *   to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
   *   data: "0xd0e30db0",
   *   value: etherToWei('1.0').toHexString(),
   * });
   * // { TinyBig: "27938" }
   *
   * ```
   */
  public async estimateGas(transaction: TransactionRequest): Promise<TinyBig> {
    const gasUsed = (await this.post(
      buildRPCPostBody('eth_estimateGas', [transaction]),
    )) as string;
    return tinyBig(hexToDecimal(gasUsed));
  }

  /**
   * Returns transaction receipt event logs that match a specified filter.
   * 
   * May return `[]` if parameters are too broad, even if logs exist.
   *
   * * [Identical](/docs/api#isd) to [ethers.provider.getLogs](https://docs.ethers.io/v5/api/providers/provider/#Provider-getLogs) in ethers.js
   * * [Identical](/docs/api#isd) to [web3.eth.getPastLogs](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getpastlogs) in web3.js
   *
   * @param filter parameters to filter the logs by
   * @returns an array of logs matching the specified filter
   * @example
   * ```javascript
   * provider.getLogs({
   *   address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
   *   topics: [
   *     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
   *     "0x00000000000000000000000021b8065d10f73ee2e260e5b47d3344d3ced7596e",
   *   ],
   *   fromBlock: 14825027,
   *   toBlock: 14825039,
   * });
   *
   * [
   *   {
   *     address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
   *     blockHash: '0x8e0dfac2f704851960f866c8708b3bef2f66c0fee0329cf25ff0261b264ca6bc',
   *     blockNumber: 14825029,
   *     data: '0x000000000000000000000000000000000000000000000000005f862ee352a38a',
   *     logIndex: 384,
   *     removed: false,
   *     topics: [
   *       '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
   *       '0x00000000000000000000000021b8065d10f73ee2e260e5b47d3344d3ced7596e',
   *       '0x00000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45'
   *     ],
   *     transactionHash: '0xbd49031be16f8fd1775f4e0fe79b408ffd8ae9c65b2827ee47e3238e3f51f4c0',
   *     transactionIndex: 226
   *   }
   * ]
   * ```
   */
  public async getLogs(
    filter: Filter | FilterByBlockHash,
  ): Promise<Array<Log>> {
    const filterByRange = filter as Filter;
    if (filterByRange.fromBlock)
      filterByRange.fromBlock = prepBlockTag(filterByRange.fromBlock);
    if (filterByRange.toBlock)
      filterByRange.toBlock = prepBlockTag(filterByRange.toBlock);

    const rpcLogs = (await this.post(
      buildRPCPostBody('eth_getLogs', [filter]),
    )) as Array<RPCLog>;
    const logs = rpcLogs.map((log) => cleanLog(log, false));
    return logs;
  }
}
