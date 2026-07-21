import * as SecureStore from 'expo-secure-store';
import { CostLedgerEntry } from '../types';

const API_KEY_STORE = 'aero_openrouter_api_key';
const COST_LEDGER_STORE = 'aero_cost_ledger_v1';

// In-memory fallback if SecureStore is unlinked in certain dev runners
let memoryKeyStore: string | null = null;
let memoryLedgerStore: CostLedgerEntry[] = [];

export const getStoredApiKey = async (): Promise<string | null> => {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      const key = await SecureStore.getItemAsync(API_KEY_STORE);
      if (key) return key;
    }
  } catch (e) {
    console.warn('SecureStore item get error, using fallback:', e);
  }
  return memoryKeyStore;
};

export const saveStoredApiKey = async (apiKey: string): Promise<boolean> => {
  memoryKeyStore = apiKey;
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(API_KEY_STORE, apiKey);
      return true;
    }
  } catch (e) {
    console.warn('SecureStore item set error, stored in memory:', e);
  }
  return true;
};

export const deleteStoredApiKey = async (): Promise<void> => {
  memoryKeyStore = null;
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(API_KEY_STORE);
    }
  } catch (e) {
    console.warn('SecureStore delete error:', e);
  }
};

export const getStoredCostLedger = async (): Promise<CostLedgerEntry[]> => {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      const json = await SecureStore.getItemAsync(COST_LEDGER_STORE);
      if (json) {
        return JSON.parse(json);
      }
    }
  } catch (e) {
    console.warn('SecureStore ledger get error:', e);
  }
  return memoryLedgerStore;
};

export const saveStoredCostLedger = async (ledger: CostLedgerEntry[]): Promise<void> => {
  memoryLedgerStore = ledger;
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(COST_LEDGER_STORE, JSON.stringify(ledger.slice(0, 100)));
    }
  } catch (e) {
    console.warn('SecureStore ledger set error:', e);
  }
};
