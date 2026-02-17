# 🗺️ IOAMS Blockchain Integration Map

## Visual Guide to Where Blockchain Fits in Your Application

```
┌─────────────────────────────────────────────────────────────────────┐
│                     IOAMS APPLICATION LAYERS                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 1: USER INTERFACE (React Components)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📄 Document Upload                                                  │
│  └─→ DocumentUploader.tsx                                           │
│      • User selects file                                            │
│      • Metadata entered                                             │
│      • Approval chain defined                                       │
│      • [NEW] Document hash generated for blockchain                 │
│                                                                      │
│  ✍️  Digital Signature                                               │
│  └─→ DocumensoIntegration.tsx                                       │
│      • User draws/types signature                                   │
│      • AI finds signature placement                                 │
│      • Signature captured                                           │
│      • [NEW] 🔗 BLOCKCHAIN: Record signature hash                   │
│      • [NEW] Display blockchain TX hash                             │
│      • [NEW] Show "Verified on Blockchain" badge                    │
│                                                                      │
│  📊 Document Tracking                                                │
│  └─→ DocumentTracker.tsx                                            │
│      • View document status                                         │
│      • See approval progress                                        │
│      • [NEW] 🔗 BLOCKCHAIN: View blockchain proofs                  │
│      • [NEW] Export blockchain audit report                         │
│                                                                      │
│  🎓 Certificate Viewer                                               │
│  └─→ [NEW] CertificateViewer.tsx (to be created)                   │
│      • View NFT certificate                                         │
│      • Download certificate                                         │
│      • [NEW] 🔗 BLOCKCHAIN: Verify NFT on-chain                     │
│      • Share verification link                                      │
│                                                                      │
│  🔐 Wallet Connection                                                │
│  └─→ [NEW] WalletConnectButton.tsx (to be created)                 │
│      • Connect MetaMask                                             │
│      • Show wallet address                                          │
│      • Display MATIC balance                                        │
│      • Network switcher                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 2: BUSINESS LOGIC (Contexts & Hooks)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📝 Signature Hook                                                   │
│  └─→ useDocumensoAPI.ts                                             │
│      CURRENT:                                                        │
│      • Call Documenso API                                           │
│      • Generate mock blockchain hash                                │
│      • Return signature response                                    │
│                                                                      │
│      [NEW] BLOCKCHAIN INTEGRATION:                                   │
│      • ✅ Import BlockchainSignatureService                         │
│      • ✅ Connect wallet                                            │
│      • ✅ Call recordSignature(docId, signature, signer)            │
│      • ✅ Get real blockchain TX hash                               │
│      • ✅ Return blockchain proof                                   │
│      • ✅ Fallback to mock if blockchain fails                      │
│                                                                      │
│  🔄 Workflow Context                                                 │
│  └─→ DocumentWorkflowContext.tsx                                    │
│      CURRENT:                                                        │
│      • Track workflow state                                         │
│      • Update approval steps                                        │
│      • Save to localStorage                                         │
│                                                                      │
│      [NEW] BLOCKCHAIN INTEGRATION:                                   │
│      • ✅ Import BlockchainAuditService                             │
│      • ✅ Record each workflow event on-chain                       │
│      • ✅ Events: created, submitted, approved, rejected            │
│      • ✅ Store TX hashes for audit trail                           │
│      • ✅ Enable blockchain audit export                            │
│                                                                      │
│  🎨 Watermark Hook                                                   │
│  └─→ WatermarkFeature.tsx                                           │
│      CURRENT:                                                        │
│      • Generate watermark                                           │
│      • Calculate hash                                               │
│      • Apply to PDF                                                 │
│                                                                      │
│      [NEW] BLOCKCHAIN INTEGRATION:                                   │
│      • ✅ Store watermark hash on blockchain                        │
│      • ✅ Enable public verification                                │
│      • ✅ QR code with blockchain proof                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 3: BLOCKCHAIN SERVICES (New Layer!)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔐 Signature Service                                                │
│  └─→ blockchainSignatureService.ts ✅ CREATED                       │
│      • recordSignature(docId, signature, signer)                    │
│      • verifySignature(docId, signatureHash)                        │
│      • getSignatureDetails(docId)                                   │
│      • getAllSignatures(docId)                                      │
│      • getExplorerUrl(txHash)                                       │
│                                                                      │
│  📜 Audit Service                                                    │
│  └─→ blockchainAuditService.ts (to be created)                     │
│      • recordEvent(eventType, docId, actor, role)                   │
│      • getAuditTrail(docId)                                         │
│      • exportAuditReport(docId)                                     │
│      • verifyAuditChain(docId)                                      │
│                                                                      │
│  🎓 Certificate Service                                              │
│  └─→ blockchainCertificateService.ts (to be created)               │
│      • issueCertificate(metadata)                                   │
│      • verifyCertificate(tokenId)                                   │
│      • uploadToIPFS(metadata)                                       │
│      • getCertificateMetadata(tokenId)                              │
│                                                                      │
│  🔍 Watermark Verification Service                                   │
│  └─→ blockchainWatermarkService.ts (to be created)                 │
│      • recordWatermark(docId, watermarkHash)                        │
│      • verifyWatermark(docId, watermark)                            │
│      • getVerificationQR(docId)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 4: WEB3 INFRASTRUCTURE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚡ Ethers.js                                                        │
│  └─→ Blockchain interaction library                                 │
│      • Connect to Polygon RPC                                       │
│      • Sign transactions                                            │
│      • Call smart contracts                                         │
│      • Read blockchain data                                         │
│                                                                      │
│  🔌 Wagmi / Viem                                                     │
│  └─→ React hooks for Web3                                           │
│      • useAccount() - Get wallet info                               │
│      • useWalletClient() - Sign transactions                        │
│      • useBalance() - Check MATIC balance                           │
│      • useNetwork() - Check network                                 │
│                                                                      │
│  🌈 RainbowKit                                                       │
│  └─→ Wallet connection UI                                           │
│      • Beautiful connect button                                     │
│      • Multiple wallet support                                      │
│      • Network switching                                            │
│      • Account management                                           │
│                                                                      │
│  📁 IPFS Client                                                      │
│  └─→ Decentralized file storage                                     │
│      • Upload certificate metadata                                  │
│      • Pin files permanently                                        │
│      • Generate IPFS URIs                                           │
│      • Retrieve certificate data                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 5: BLOCKCHAIN NETWORKS                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🧪 Polygon Mumbai (Testnet)                                         │
│  └─→ For development and testing                                    │
│      • Free test MATIC from faucet                                  │
│      • Same as mainnet but no real cost                             │
│      • Explorer: mumbai.polygonscan.com                             │
│                                                                      │
│  🚀 Polygon Mainnet (Production)                                     │
│  └─→ For real institutional use                                     │
│      • Extremely low costs (~$0.00004 per tx)                       │
│      • Fast finality (~2 seconds)                                   │
│      • Explorer: polygonscan.com                                    │
│      • Ethereum-compatible                                          │
│                                                                      │
│  📦 Smart Contracts (Deployed)                                       │
│  └─→ DocumentSignatureRegistry.sol ✅ CREATED                       │
│      Contract Address: 0x...                                        │
│      • recordSignature(docHash, sigHash, name, role)                │
│      • verifySignature(docHash, sigHash) → bool                     │
│      • getSignature(docHash) → SignatureRecord                      │
│      • getDocumentSignatures(docHash) → SignatureRecord[]           │
│                                                                      │
│  └─→ CertificateNFT.sol (to be created)                            │
│      Contract Address: 0x...                                        │
│      • mintCertificate(recipient, ipfsUri, docHash)                 │
│      • verifyCertificate(tokenId) → bool                            │
│      • ownerOf(tokenId) → address                                   │
│      • tokenURI(tokenId) → ipfsUri                                  │
│                                                                      │
│  🌐 IPFS Network                                                     │
│  └─→ Decentralized storage                                          │
│      • Store certificate PDFs                                       │
│      • Store metadata JSON                                          │
│      • Permanent, immutable storage                                 │
│      • Access via ipfs:// or gateway                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Signing a Document with Blockchain

```
USER ACTION                    SYSTEM RESPONSE
═══════════════════════════════════════════════════════════════

1. User uploads document
   └─→ DocumentUploader.tsx
       │
       ├─→ Generate document hash
       │   SHA256(document content)
       │   Result: 0xabc123...
       │
       └─→ Store in state
           documentId: "DOC-001"
           documentHash: 0xabc123...

2. User draws signature
   └─→ DocumensoIntegration.tsx
       │
       ├─→ Capture signature image
       │   Base64: data:image/png;base64,iVBORw0...
       │
       └─→ Generate signature hash
           SHA256(signature data)
           Result: 0xdef456...

3. User clicks "Sign Document"
   └─→ useDocumensoAPI.ts
       │
       ├─→ [EXISTING] Call Documenso API
       │   POST /documents/DOC-001/sign
       │   Response: { signatureId: "sig_abc" }
       │
       ├─→ [NEW] Call Blockchain Service
       │   blockchainService.recordSignature(
       │     documentId: "DOC-001",
       │     signatureData: "data:image...",
       │     signerInfo: {
       │       name: "Dr. Smith",
       │       email: "smith@hitam.edu",
       │       role: "Principal"
       │     }
       │   )
       │
       │   ↓ Blockchain Service Processing ↓
       │
       │   1. Hash document ID
       │      docHash = SHA256("DOC-001")
       │      = 0xabc123...
       │
       │   2. Hash signature
       │      sigHash = SHA256(signatureData)
       │      = 0xdef456...
       │
       │   3. Connect wallet
       │      Signer address: 0x789ghi...
       │
       │   4. Call smart contract
       │      contract.recordSignature(
       │        docHash: 0xabc123...,
       │        sigHash: 0xdef456...,
       │        signerName: "Dr. Smith",
       │        signerRole: "Principal"
       │      )
       │
       │   5. Sign transaction
       │      User approves in MetaMask
       │      Gas: ~50,000 units
       │      Cost: $0.00004
       │
       │   6. Wait for confirmation
       │      TX submitted to Polygon
       │      Block mined in ~2 seconds
       │      Confirmation received
       │
       │   7. Return blockchain record
       │      {
       │        documentHash: "0xabc123...",
       │        signatureHash: "0xdef456...",
       │        signerAddress: "0x789ghi...",
       │        signerName: "Dr. Smith",
       │        signerRole: "Principal",
       │        timestamp: 1698765432,
       │        transactionHash: "0x1a2b3c...",
       │        blockNumber: 35678901,
       │        chainId: 137
       │      }
       │
       └─→ Return to component
           {
             success: true,
             signatureId: "sig_abc",
             certificateUrl: "https://...",
             auditTrailUrl: "https://...",
             timestamp: "2025-10-21T10:30:45Z",
             blockchainHash: "0x1a2b3c...",  // REAL TX HASH!
             blockNumber: 35678901,
             verificationUrl: "https://polygonscan.com/tx/0x1a2b3c..."
           }

4. Display to user
   └─→ DocumensoIntegration.tsx
       │
       ├─→ Show success message
       │   "✅ Signature recorded on blockchain"
       │
       ├─→ Display TX hash
       │   "Transaction: 0x1a2b...3c4d"
       │
       ├─→ Show verification link
       │   "View on Polygonscan →"
       │   Links to: polygonscan.com/tx/0x1a2b3c...
       │
       └─→ Update workflow state
           Document status: Signed
           Blockchain verified: true
           TX hash: 0x1a2b3c...

5. Anyone can verify
   └─→ Public Verification Portal
       │
       ├─→ Enter document ID: "DOC-001"
       │
       ├─→ Query blockchain
       │   contract.getSignature(SHA256("DOC-001"))
       │
       ├─→ Return signature details
       │   {
       │     signer: "Dr. Smith",
       │     role: "Principal",
       │     timestamp: "Oct 21, 2025 10:30 AM",
       │     isValid: true,
       │     blockNumber: 35678901
       │   }
       │
       └─→ Display verification result
           "✅ Signature verified on blockchain"
           "Signed by: Dr. Smith (Principal)"
           "Date: Oct 21, 2025 10:30 AM"
           "Block: 35,678,901"
           "View proof →"
```

---

## 📊 Current vs. Future State

### BEFORE Blockchain Integration

```
Document Upload → Documenso API → Database → Email Notification
                                     ↓
                           (Can be altered)
                           (No public verification)
                           (Trust required)
```

### AFTER Blockchain Integration

```
Document Upload → Documenso API → Database → Email Notification
                      ↓
                  Blockchain Service
                      ↓
              Polygon Smart Contract
                      ↓
           Immutable Blockchain Record
                      ↓
          Anyone Can Verify Anytime
```

---

## 🎯 Integration Points Summary

| Component | Current File | Blockchain Addition | Priority |
|-----------|--------------|---------------------|----------|
| **Signatures** | `useDocumensoAPI.ts` | `blockchainSignatureService.ts` | ⭐⭐⭐⭐⭐ |
| **Workflow** | `DocumentWorkflowContext.tsx` | `blockchainAuditService.ts` | ⭐⭐⭐⭐⭐ |
| **Certificates** | `useDocumensoAPI.ts` | `blockchainCertificateService.ts` | ⭐⭐⭐⭐ |
| **Watermarks** | `WatermarkFeature.tsx` | `blockchainWatermarkService.ts` | ⭐⭐⭐ |
| **Wallet UI** | — | `WalletConnectButton.tsx` | ⭐⭐⭐⭐⭐ |
| **Verification** | — | `VerificationPortal.tsx` | ⭐⭐⭐⭐ |

---

## 💡 Key Insights

### What Changes
- ✅ Add blockchain recording after successful signatures
- ✅ Display blockchain TX hashes in UI
- ✅ Enable wallet connection
- ✅ Show verification links

### What Doesn't Change
- ✅ User interface remains the same
- ✅ Existing Documenso workflow unchanged
- ✅ Document upload process identical
- ✅ Approval flow stays the same

### What Improves
- 🚀 Trust: Cryptographic proof instead of database trust
- 🚀 Verification: Anyone can verify, anytime
- 🚀 Immutability: Records cannot be altered
- 🚀 Transparency: Complete audit trail visible
- 🚀 Cost: 99.9% cheaper than traditional e-signature

---

## 🔗 Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ WagmiConfig                                       │  │
│  │   └─→ RainbowKitProvider                         │  │
│  │         └─→ App Components                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Dashboard Components                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Documents    │  │ Approvals    │  │ Profile      │  │
│  │ Page         │  │ Page         │  │ Page         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                  ↓                 ↓          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     WalletConnectButton (NEW)                    │  │
│  │     Shows: Address, Balance, Network            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│          Document Workflow Components                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DocumensoIntegration                             │  │
│  │  • Uses: useDocumensoAPI                         │  │
│  │  • Uses: useWalletClient (NEW)                   │  │
│  │  • Shows: Blockchain status (NEW)                │  │
│  │  • Displays: TX hash (NEW)                       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DocumentTracker                                  │  │
│  │  • Uses: DocumentWorkflowContext                 │  │
│  │  • Shows: Blockchain audit trail (NEW)           │  │
│  │  • Exports: Blockchain proof (NEW)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Blockchain Services (NEW LAYER)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BlockchainSignatureService                       │  │
│  │  • recordSignature()                             │  │
│  │  • verifySignature()                             │  │
│  │  • getSignatureDetails()                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BlockchainAuditService                           │  │
│  │  • recordEvent()                                 │  │
│  │  • getAuditTrail()                               │  │
│  │  • exportReport()                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Smart Contracts (Polygon)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DocumentSignatureRegistry                        │  │
│  │  Address: 0x...                                  │  │
│  │  Functions: recordSignature, verifySignature     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

**This map provides a complete visual understanding of where and how blockchain integrates into your IOAMS application!**

Ready to start? Follow the **BLOCKCHAIN_QUICK_START.md** guide! 🚀
