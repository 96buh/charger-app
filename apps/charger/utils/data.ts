export const generateRandomDataPoint = (time: number) => ({
  time,
  lowTmp: 20 + 10 * Math.random(),
  highTmp: 30 + 30 * Math.random(),
});

export type DataPoint = {
  time: number;
  lowTmp: number;
  highTmp: number;
};
