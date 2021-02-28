export enum AccountVerificationMode {
  FederalIDApiCall = "federal-id-api-call",
  //DocumentUpload = "document-upload"
}

export interface IAccountVerification {
  _id: string;
  mode: AccountVerificationMode;
  created: Date;
  status: boolean;
}