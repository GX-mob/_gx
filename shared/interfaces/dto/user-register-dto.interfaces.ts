export interface IUserRegisterDto {
  firstName: string;
  lastName: string;
  cpf: string;
  birth: string;
  terms: boolean;
  password?: string;
}

export interface IUserRegisterSuccessDto {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
