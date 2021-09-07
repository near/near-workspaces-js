import {Buffer} from 'buffer';
import * as borsh from 'borsh';

export class ContractState {
  private readonly data: Map<string, Buffer>;
  constructor(dataArray: Array<{key: Buffer; value: Buffer}>) {
    this.data = new Map();
    for (const {key, value} of dataArray) {
      this.data.set(key.toString(), value);
    }
  }

  get_raw(key: string): Buffer {
    return this.data.get(key) ?? Buffer.from('');
  }

  get(key: string, borshSchema?: {type: any; schema: any}): any {
    const value = this.get_raw(key);
    if (borshSchema) {
      return borsh.deserialize(borshSchema.schema, borshSchema.type, value);
    }

    return value.toJSON();
  }
}

// Need to fill out all record types
export interface Data {
  Data: {account_id: string; data_key: string; value: string};
}

export type RecordType = Data;
export interface Records {
  records: RecordType[];
}
