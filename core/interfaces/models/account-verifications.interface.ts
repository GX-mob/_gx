export enum EAccountVerificationType {
  FederalID = "federal-id",
  DriverAccess = "driver-access"
}

export enum EAccountVerificationStatus {
  Verified = "verified",
  Analyzing = "analyzing",
  Requested = "requested"
}

export interface IAccountVerification {
  _id: any;
  userId: string;
  type: EAccountVerificationType;
  createdAt: Date;
  updatedAt?: Date;
  status: EAccountVerificationStatus;
  documentsIds: string[]
}