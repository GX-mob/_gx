export interface ISignUpDto {
  firstName: string;
  lastName: string;
  cpf: string;
  birth: string;
  terms: boolean;
  credential?: string;
}

export interface ISignUpSuccessResponseDto {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
