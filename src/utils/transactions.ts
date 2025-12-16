import { db } from '../config/database';

/**
 * Execute a function within a database transaction
 * @param callback - Function to execute within transaction
 * @returns Result of the callback function
 */
export const withTransaction = async <T>(
  callback: (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
  ) => Promise<T>
): Promise<T> => {
  return await db.transaction(async tx => {
    return await callback(tx);
  });
};
