export { getOrCreateWallet, getBalance, getHistory, credit, debit, hasBalance, transfer } from './wallet.service'
export type { WalletDto, LedgerEntryDto } from './wallet.types'
export { transferBodySchema, type TransferBody } from './wallet.schema'
