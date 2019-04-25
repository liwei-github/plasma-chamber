import { INetworkClient } from '../../src/client'

export class MockNetworkClient implements INetworkClient {
  public request(methodName: string, args: any) {
    return Promise.resolve({})
  }
}
