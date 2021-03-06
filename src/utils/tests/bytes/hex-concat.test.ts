import { utils as ethers } from 'ethers';
import { hexConcat } from '../../bytes';

describe('utils.hexConcat', () => {
  it('should match ethers.js - hex values', () => {
    const values = ['0x2048', '0x6917', '0x85616379'];
    expect(hexConcat(values)).toBe(ethers.hexConcat(values));
  });
  it('should match ethers.js - UInt8Array values', () => {
    const values = [
      [5, 10, 247, 22],
      [50, 255, 3],
      [59, 36, 18, 46, 198, 234],
    ];
    expect(hexConcat(values)).toBe(ethers.hexConcat(values));
  });
  it('should match ethers.js - hex & UInt8Array values', () => {
    const values = [
      '0x2048',
      [5, 10, 247, 22],
      '0x6917',
      [50, 255, 3],
      '0x85616379',
      [59, 36, 18, 46, 198, 234],
    ];
    expect(hexConcat(values)).toBe(ethers.hexConcat(values));
  });
});
