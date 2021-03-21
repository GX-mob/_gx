export enum EVerificationType {
  FederalID = "federal-id",
  DriverAccess = "driver-access",
  Vehicle = "vehicle",
}

export enum EVerificationStatus {
  Verified = "verified",
  Analyzing = "analyzing",
  Requested = "requested",
}

export interface IVerificationHistory {
  authorId: string;
  date: Date;
  status: EVerificationStatus
}

export interface IVerification {
  _id: any;
  userId: string;
  type: EVerificationType;
  createdAt: Date;
  updatedAt?: Date;
  lastStatus: EVerificationStatus;
  documentsIds: string[];
  history: IVerificationHistory[];
}

export type TVerificationCreate = Pick<IVerification, "type" | "documentsIds">;
