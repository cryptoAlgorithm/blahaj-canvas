const hexToInt = (hex) => parseInt(hex.slice(1), 16);

const intToHex = (int) => `#${Number(int).toString(16).padStart(6, '0')}`;
