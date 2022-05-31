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
 * Converts a block tag into the right format when needed.
 *
 * * No equivalent in ethers.js
 * * No equivalent in web3.js
 *
 * @internal
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
   * Gets information (name, chainId, and ensAddress when applicable) about the network the provider is connected to.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getNetwork`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getNetwork) in ethers.js
   * * [Similar](/docs/api#isd) to [`web3.eth.getChainId`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getchainid) in web3.js, returns more than just the `chainId`
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
   * Gets the number of the most recently mined block on the network the provider is connected to.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getBlockNumber`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBlockNumber) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.getBlockNumber`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getblocknumber) in web3.js
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
   * Gets information about a specified transaction, even if it hasn't been mined yet.
   *
   * * [Similar](/docs/api#isd) to [`ethers.provider.getTransaction`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransaction) in ethers.js, does not have `wait` method that waits until the transaction has been mined
   * * [Similar](/docs/api#isd) to [`web3.eth.getTransaction`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransaction) in web3.js, some information returned using different types
   *
   * @param transactionHash the hash of the transaction to get information about
   * @returns information about the specified transaction
   * @example
   * ```javascript
   * await provider.getTransaction('0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789');
   * // {
   * //   accessList: [],
   * //   blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
   * //   blockNumber: 14578286,
   * //   chainId: 1,
   * //   from: "0xdfD9dE5f6FA60BD70636c0900752E93a6144AEd4",
   * //   gas: { TinyBig: 112163 },
   * //   gasPrice: { TinyBig: 48592426858 },
   * //   hash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
   * //   input: "0x83259f17000000000000000000000000000000000000000000...",
   * //   maxFeePerGas: { TinyBig: 67681261618 },
   * //   maxPriorityFeePerGas: { TinyBig: 1500000000 },
   * //   nonce: { TinyBig: 129 },
   * //   r: "0x59a7c15b12c18cd68d6c440963d959bff3e73831ffc938e75ecad07f7ee43fbc",
   * //   s: "0x1ebaf05f0d9273b16c2a7748b150a79d22533a8cd74552611cbe620fee3dcf1c",
   * //   to: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
   * //   transactionIndex: 29,
   * //   type: 2,
   * //   v: 0,
   * //   value: { TinyBig: 0 },
   * //   confirmations: 298140,
   * // }
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
   * Gives information about a transaction that has already been mined. Includes additional information beyond what's provided by [`getTransaction`](/docs/api/modules#gettransaction).
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getTransactionReceipt`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransactionReceipt) in ethers.js
   * * [Similar](/docs/api#isd) to [`web3.eth.getTransactionReceipt`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransactionreceipt) in web3.js, some information returned using different types
   *
   * @param transactionHash the hash of the transaction to get information about
   * @returns information about the specified transaction that has already been mined
   * @example
   * ```javascript
   * await provider.getTransactionReceipt('0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789');
   * // {
   * //   blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
   * //   blockNumber: 14578286,
   * //   contractAddress: null,
   * //   cumulativeGasUsed: { TinyBig: 3067973 },
   * //   effectiveGasPrice: { TinyBig: 48592426858 },
   * //   from: "0xdfD9dE5f6FA60BD70636c0900752E93a6144AEd4",
   * //   gasUsed: { TinyBig: 112163 },
   * //   logs: [
   * //     {
   * //       address: "0x0eDF9bc41Bbc1354c70e2107F80C42caE7FBBcA8",
   * //       blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
   * //       blockNumber: 14578286,
   * //       data: "0x0000000000000000000000000000000000000000000003a12ec797b5484968c1",
   * //       logIndex: 42,
   * //       topics: [
   * //         "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
   * //         "0x00000000000000000000000039b72d136ba3e4cef35f48cd09587ffab754dd8b",
   * //         "0x000000000000000000000000dfd9de5f6fa60bd70636c0900752e93a6144aed4",
   * //       ],
   * //       transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
   * //       transactionIndex: 29,
   * //     },
   * //     {
   * //       address: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
   * //       blockHash: "0x876810a013dbcd140f6fd6048c1dc33abbb901f1f96b394c2fa63aef3cb40b5d",
   * //       blockNumber: 14578286,
   * //       data: "0x0000000000000000000000000000000000000000000003a12ec797b5484968c1",
   * //       logIndex: 43,
   * //       topics: [
   * //         "0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7",
   * //         "0x000000000000000000000000dfd9de5f6fa60bd70636c0900752e93a6144aed4",
   * //         "0x0000000000000000000000000000000000000000000000000000000000000003",
   * //       ],
   * //       transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
   * //       transactionIndex: 29,
   * //     },
   * //   ],
   * //   logsBloom: "0x00000000000000000000000000000...",
   * //   status: 1,
   * //   to: "0x39B72d136ba3e4ceF35F48CD09587ffaB754DD8B",
   * //   transactionHash: "0x9014ae6ef92464338355a79e5150e542ff9a83e2323318b21f40d6a3e65b4789",
   * //   transactionIndex: 29,
   * //   type: 2,
   * //   byzantium: true,
   * //   confirmations: 298171,
   * // }
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
   * Returns the number of sent transactions by an address, from genesis (or as far back as a provider looks) up to specified block.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getTransactionCount`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getTransactionCount) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.getTransactionCount`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#gettransactioncount) in web3.js
   *
   * @param address the address to count number of sent transactions
   * @param blockTag the block to count transactions up to, inclusive
   * @returns the number of transactions sent by the specified address
   * @example
   * ```javascript
   * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3');
   * // 1060000
   * ```
   * @example
   * ```javascript
   * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3', 'latest');
   * // 1060000
   * ```
   * @example
   * ```javascript
   * await provider.getTransactionCount('0x71660c4005ba85c37ccec55d0c4493e66fe775d3', 14649390);
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
   * Gives an estimate of the current gas price in wei.
   *
   * * [Similar](/docs/api#isd) to [`ethers.provider.getGasPrice`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getGasPrice) in ethers.js, does not have a parameter specifying what unit you'd like to return. See also [`weiToEther`](/docs/api/modules#weitoether) and [`etherToGwei`](/docs/api/modules#ethertogwei)
   * * [Identical](/docs/api#isd) to [`web3.eth.getGasPrice`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getgasprice) in web3.js, returns a number (TinyBig) instead of a string
   *
   * @returns an estimate of the current gas price in wei
   * @example
   * ```javascript
   * await provider.getGasPrice();
   * // 52493941856
   * ```
   */
  public async getGasPrice(): Promise<TinyBig> {
    const hexGasPrice = (await this.post(
      buildRPCPostBody('eth_gasPrice', []),
    )) as string;
    return tinyBig(hexToDecimal(hexGasPrice));
  }

  /**
   * Returns the balance of the account in wei.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getBalance`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.getBalance`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getbalance) in web3.js, returns a number (TinyBig) instead of a string
   *
   * @param address the address to check the balance of
   * @param blockTag the block to check the specified address' balance on
   * @returns the balance of the network's native token for the specified address on the specified block
   * @example
   * ```javascript
   *  await provider.getBalance('0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8');
   * // 28798127851528138
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
   * Gets the code of a contract on a specified block.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getCode`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getCode) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.getCode`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getcode) in web3.js
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
   * An estimate may not be accurate since there could be another transaction on the network that was not accounted for.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.estimateGas`](https://docs.ethers.io/v5/api/providers/provider/#Provider-estimateGas) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.estimateGas`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#estimateGas) in web3.js
   *
   * @param transaction the transaction to check the estimated gas cost for
   * @returns the estimated amount of gas charged for submitting the specified transaction to the blockchain
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
   * May return `[]` if parameters are too broad, even if logs exist.
   *
   * * [Identical](/docs/api#isd) to [`ethers.provider.getLogs`](https://docs.ethers.io/v5/api/providers/provider/#Provider-getLogs) in ethers.js
   * * [Identical](/docs/api#isd) to [`web3.eth.getPastLogs`](https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#getpastlogs) in web3.js
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
