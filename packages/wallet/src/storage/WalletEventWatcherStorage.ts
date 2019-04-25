import { IStorage } from './IStorage'
import { IEventWatcherStorage } from '@layer2/events-watcher'

export class WalletEventWatcherStorage implements IEventWatcherStorage {
  public storage: IStorage
  private seen: { [key: string]: boolean } = {}

  constructor(storage: IStorage) {
    this.storage = storage
  }

  public async getLoaded(initialBlock: number) {
    try {
      const loaded = await this.storage.get('loaded')
      return parseInt(loaded, 10)
    } catch (e) {
      return initialBlock
    }
  }

  public async setLoaded(loaded: number) {
    this.storage.set('loaded', loaded.toString())
  }

  public addSeen(event: string) {
    this.seen[event] = true
  }

  public getSeen(event: string) {
    return this.seen[event]
  }
}
