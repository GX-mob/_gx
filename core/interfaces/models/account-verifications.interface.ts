export enum EAccountVerificationMode {
  FederalID = "federal-id",
  DriverAccess = "driver-access"
  //DocumentUpload = "document-upload"
}

export enum EAccountVerificationStatus {
  Verified = "verified",
  NotVerified = "not-verified",
  Analyzing = "analyzing"
}

export interface IAccountVerification {
  _id: any;
  mode: EAccountVerificationMode;
  createdAt: Date;
  updatedAt?: Date;
  status: EAccountVerificationStatus;
  documentsURI: string[]
}