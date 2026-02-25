import { ethers } from 'ethers';

interface BlockchainSignature {
  documentHash: string;
  signatureHash: string;
  signerAddress: string;
  signerName: string;
  signerRole: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
  chainId: number;
}

interface SignatureRecord {
  documentHash: string;
  signatureHash: string;
  signer: string;
  signerName: string;
  signerRole: string;
  timestamp: number;
  isValid: boolean;
}

const BLOCKCHAIN_CONFIG = {
  testnet: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000'
  },
  mainnet: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000'
  }
};

const SIGNATURE_CONTRACT_ABI = [
  "function recordSignature(bytes32 documentHash, bytes32 signatureHash, string signerName, string signerRole) external returns (uint256)",
  "function verifySignature(bytes32 documentHash, bytes32 signatureHash) external view returns (bool)",
  "function getSignature(bytes32 documentHash) external view returns (tuple(bytes32 signatureHash, address signer, string signerName, string signerRole, uint256 timestamp, bool isValid))",
  "function getDocumentSignatures(bytes32 documentHash) external view returns (tuple(bytes32 signatureHash, address signer, string signerName, string signerRole, uint256 timestamp, bool isValid)[])",
  "event SignatureRecorded(bytes32 indexed documentHash, bytes32 indexed signatureHash, address indexed signer, string signerName, uint256 timestamp)"
];

export class BlockchainSignatureService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private config: typeof BLOCKCHAIN_CONFIG.testnet;

  constructor(useTestnet: boolean = true) {
    this.config = useTestnet ? BLOCKCHAIN_CONFIG.testnet : BLOCKCHAIN_CONFIG.mainnet;
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      SIGNATURE_CONTRACT_ABI,
      this.provider
    );
  }

  async connectWallet(walletClient?: any) {
    if (walletClient) {
      this.signer = await walletClient.getSigner();
    } else if (typeof window !== 'undefined' && (window as any).ethereum) {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await browserProvider.getSigner();
    } else {
      throw new Error('No wallet found. Please install MetaMask or connect a wallet.');
    }

    this.contract = this.contract.connect(this.signer);
  }

  async recordSignature(
    documentId: string,
    signatureData: string,
    signerInfo: { name: string; email: string; role: string }
  ): Promise<BlockchainSignature> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    try {
      const documentHash = ethers.keccak256(
        ethers.toUtf8Bytes(documentId)
      );

      const signatureHash = ethers.keccak256(
        ethers.toUtf8Bytes(signatureData)
      );

      console.log('Recording signature on blockchain...', {
        documentHash: documentHash.slice(0, 10) + '...',
        signatureHash: signatureHash.slice(0, 10) + '...',
        signer: signerInfo.name,
        role: signerInfo.role
      });

      const gasEstimate = await this.contract.recordSignature.estimateGas(
        documentHash,
        signatureHash,
        signerInfo.name,
        signerInfo.role
      );

      console.log('Gas estimate:', gasEstimate.toString());

      const tx = await this.contract.recordSignature(
        documentHash,
        signatureHash,
        signerInfo.name,
        signerInfo.role,
        {
          gasLimit: gasEstimate * 120n / 100n
        }
      );

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');

      const receipt = await tx.wait();

      console.log('Signature recorded on blockchain!', {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      const signerAddress = await this.signer.getAddress();

      return {
        documentHash,
        signatureHash,
        signerAddress,
        signerName: signerInfo.name,
        signerRole: signerInfo.role,
        timestamp: Math.floor(Date.now() / 1000),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        chainId: this.config.chainId
      };

    } catch (error) {
      console.error('Blockchain signature recording failed:', error);
      throw new Error(`Failed to record signature on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifySignature(
    documentId: string,
    signatureHash: string
  ): Promise<boolean> {
    try {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentId));
      
      const sigHashBytes32 = signatureHash.startsWith('0x') 
        ? signatureHash 
        : ethers.keccak256(ethers.toUtf8Bytes(signatureHash));

      const isValid = await this.contract.verifySignature(
        documentHash,
        sigHashBytes32
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async getSignatureDetails(documentId: string): Promise<SignatureRecord | null> {
    try {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentId));
      
      const record = await this.contract.getSignature(documentHash);

      return {
        documentHash,
        signatureHash: record.signatureHash,
        signer: record.signer,
        signerName: record.signerName,
        signerRole: record.signerRole,
        timestamp: record.timestamp.toNumber(),
        isValid: record.isValid
      };
    } catch (error) {
      console.error('Failed to get signature details:', error);
      return null;
    }
  }

  async getAllSignatures(documentId: string): Promise<SignatureRecord[]> {
    try {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentId));
      
      const records = await this.contract.getDocumentSignatures(documentHash);

      return records.map((record: any) => ({
        documentHash,
        signatureHash: record.signatureHash,
        signer: record.signer,
        signerName: record.signerName,
        signerRole: record.signerRole,
        timestamp: record.timestamp.toNumber(),
        isValid: record.isValid
      }));
    } catch (error) {
      console.error('Failed to get signatures:', error);
      return [];
    }
  }

  getExplorerUrl(transactionHash: string): string {
    return `${this.config.explorerUrl}/tx/${transactionHash}`;
  }

  getNetworkConfig() {
    return {
      chainId: this.config.chainId,
      name: this.config.name,
      explorerUrl: this.config.explorerUrl,
      contractAddress: this.config.contractAddress
    };
  }

  isWalletConnected(): boolean {
    return this.signer !== undefined;
  }

  async getWalletAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

let blockchainServiceInstance: BlockchainSignatureService | null = null;

export function getBlockchainService(useTestnet: boolean = true): BlockchainSignatureService {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainSignatureService(useTestnet);
  }
  return blockchainServiceInstance;
}

export default BlockchainSignatureService;
