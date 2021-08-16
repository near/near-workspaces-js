declare module 'node-port-check' {
  class PortChecker {
    nextAvailable(from: number, ipAddr: string): number;
  }

  export interface NodePortCheck {
    portCheck: PortChecker;
  }
}
