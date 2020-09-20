import { StyledDiv } from "../modules/create-styled";

export const FlexColumn = StyledDiv(
  () => `
  flex-direction: column;
  height: 100%;
  display: flex;
  align-items: center;
`
);

export const FlexRow = StyledDiv(
  () => `
  display: flex;
  align-items: center;
  flex-direction: row;
  align-items: center;
`
);
