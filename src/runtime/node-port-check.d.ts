declare module 'node-port-check' {
  interface NodePortCheck {
    nextAvailable: (from: number, ipAddr: string) => Promise<number>;
  }

  const NodePortCheck: NodePortCheck;

  export = NodePortCheck;
}
