export interface ISignUpDto {
  firstName: string;
  lastName: string;
  cpf: string;
  birth: string;
  terms: boolean;
  credential?: string;
}

export interface ISignUpSuccessResponse {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
