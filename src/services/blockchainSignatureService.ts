/**
 * Blockchain Signature Service for IOAMS
 * 
 * This service handles recording and verifying digital signatures on blockchain
 * Integrates with existing Documenso workflow
 * 
 * Features:
 * - Record signatures on Polygon blockchain
 * - Verify signature authenticity
 * - Generate immutable proof of signing
 * - Cost-effective (~$0.0001 per signature)
 */

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

/**
 * Blockchain configuration
 * Update these values based on your deployment
 */
const BLOCKCHAIN_CONFIG = {
  // Polygon Mumbai Testnet (for testing)
  testnet: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000' // Deploy your contract here
  },
  // Polygon Mainnet (for production)
  mainnet: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000' // Deploy your contract here
  }
};

/**
 * Smart Contract ABI for signature recording
 * Deploy the Solidity contract and update this ABI
 */
const SIGNATURE_CONTRACT_ABI = [
  // Record a signature
  "function recordSignature(bytes32 documentHash, bytes32 signatureHash, string signerName, string signerRole) external returns (uint256)",
  
  // Verify a signature
  "function verifySignature(bytes32 documentHash, bytes32 signatureHash) external view returns (bool)",
  
  // Get signature details
  "function getSignature(bytes32 documentHash) external view returns (tuple(bytes32 signatureHash, address signer, string signerName, string signerRole, uint256 timestamp, bool isValid))",
  
  // Get all signatures for a document
  "function getDocumentSignatures(bytes32 documentHash) external view returns (tuple(bytes32 signatureHash, address signer, string signerName, string signerRole, uint256 timestamp, bool isValid)[])",
  
  // Events
  "event SignatureRecorded(bytes32 indexed documentHash, bytes32 indexed signatureHash, address indexed signer, string signerName, uint256 timestamp)"
];

export class BlockchainSignatureService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private config: typeof BLOCKCHAIN_CONFIG.testnet;

  /**
   * Initialize the blockchain service
   * @param useTestnet - Use testnet (true) or mainnet (false)
   */
  constructor(useTestnet: boolean = true) {
    this.config = useTestnet ? BLOCKCHAIN_CONFIG.testnet : BLOCKCHAIN_CONFIG.mainnet;
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      SIGNATURE_CONTRACT_ABI,
      this.provider
    );
  }

  /**
   * Connect a wallet for signing transactions
   * @param walletClient - Wallet client from wagmi/viem
   */
  async connectWallet(walletClient?: any) {
    if (walletClient) {
      // If using wagmi/viem wallet
      this.signer = await walletClient.getSigner();
    } else if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Fallback to window.ethereum (MetaMask)
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await browserProvider.getSigner();
    } else {
      throw new Error('No wallet found. Please install MetaMask or connect a wallet.');
    }

    this.contract = this.contract.connect(this.signer);
  }

  /**
   * Record a signature on the blockchain
   * @param documentId - Unique document identifier
   * @param signatureData - Base64 signature image or signature text
   * @param signerInfo - Information about the signer
   * @returns Blockchain signature record with transaction hash
   */
  async recordSignature(
    documentId: string,
    signatureData: string,
    signerInfo: { name: string; email: string; role: string }
  ): Promise<BlockchainSignature> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    try {
      // 1. Create document hash (unique identifier)
      const documentHash = ethers.keccak256(
        ethers.toUtf8Bytes(documentId)
      );

      // 2. Create signature hash (proof of signature)
      const signatureHash = ethers.keccak256(
        ethers.toUtf8Bytes(signatureData)
      );

      console.log('Recording signature on blockchain...', {
        documentHash: documentHash.slice(0, 10) + '...',
        signatureHash: signatureHash.slice(0, 10) + '...',
        signer: signerInfo.name,
        role: signerInfo.role
      });

      // 3. Estimate gas to ensure transaction will succeed
      const gasEstimate = await this.contract.recordSignature.estimateGas(
        documentHash,
        signatureHash,
        signerInfo.name,
        signerInfo.role
      );

      console.log('Gas estimate:', gasEstimate.toString());

      // 4. Send transaction to blockchain
      const tx = await this.contract.recordSignature(
        documentHash,
        signatureHash,
        signerInfo.name,
        signerInfo.role,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');

      // 5. Wait for transaction to be mined
      const receipt = await tx.wait();

      console.log('✅ Signature recorded on blockchain!', {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      // 6. Return blockchain record
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

  /**
   * Verify a signature on the blockchain
   * @param documentId - Document identifier
   * @param signatureHash - Hash of the signature to verify
   * @returns True if signature is valid and exists on blockchain
   */
  async verifySignature(
    documentId: string,
    signatureHash: string
  ): Promise<boolean> {
    try {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentId));
      
      // Convert signature hash if it's not already a bytes32
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

  /**
   * Get signature details from blockchain
   * @param documentId - Document identifier
   * @returns Signature record with signer details
   */
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

  /**
   * Get all signatures for a document
   * @param documentId - Document identifier
   * @returns Array of signature records
   */
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

  /**
   * Get explorer URL for a transaction
   * @param transactionHash - Transaction hash
   * @returns URL to blockchain explorer
   */
  getExplorerUrl(transactionHash: string): string {
    return `${this.config.explorerUrl}/tx/${transactionHash}`;
  }

  /**
   * Get current network configuration
   */
  getNetworkConfig() {
    return {
      chainId: this.config.chainId,
      name: this.config.name,
      explorerUrl: this.config.explorerUrl,
      contractAddress: this.config.contractAddress
    };
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.signer !== undefined;
  }

  /**
   * Get connected wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

// Export singleton instance for easy use
let blockchainServiceInstance: BlockchainSignatureService | null = null;

export const getBlockchainService = (useTestnet: boolean = true): BlockchainSignatureService => {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainSignatureService(useTestnet);
  }
  return blockchainServiceInstance;
};

// Export for use in components
export default BlockchainSignatureService;
