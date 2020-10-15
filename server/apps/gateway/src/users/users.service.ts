// Application Service
import { FastifyRequest } from "fastify";
import { Injectable } from "@nestjs/common";
import {
  UserRepository,
  UserCreateInterface,
  UserQueryInterface,
} from "@app/repositories";
import { ContactVerificationService } from "@app/contact-verification";
import { SessionService } from "@app/session";
import {
  UserNotFoundException,
  WrongPasswordException,
  WrongVerificationCodeException,
  InvalidCPFException,
  CPFRegistredException,
  TermsNotAcceptedException,
} from "./exceptions";
import { util } from "@app/helpers";
import { UserInterface } from "@shared/interfaces";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import validator from "validator";

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private contactVerificationService: ContactVerificationService,
    private sessionService: SessionService,
  ) {}

  /**
   * Find user by phone
   * @param phone
   * @throws [HTTP] UserNotFoundException
   * @returns <UserInterface> User
   */
  async findByPhone(phone: UserQueryInterface["phones"]) {
    const user = await this.userRepository.get({ phones: phone });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async assertPassword(user: UserInterface, password: string) {
    const result = await util.assertPassword(password, user.password as string);

    if (!result) {
      throw new WrongPasswordException();
    }

    return user;
  }

  /**
   * Requests a contact verification
   * @param target Target that will receive the code
   * @returns Hidded target
   */
  public async requestContactVerify(target: string): Promise<string> {
    await this.contactVerificationService.request(target);
    const isEmail = validator.isEmail(target);
    const hiddenTarget = isEmail
      ? util.hideEmail(target)
      : // Phone last 4 numbers
        target.slice(target.length - 4);

    return hiddenTarget;
  }

  public async verifyContact(target: string, code: string) {
    const valid = await this.contactVerificationService.verify(target, code);

    if (!valid) {
      throw new WrongVerificationCodeException();
    }
  }

  /**
   * Creates a session to user based on request
   * @param user
   * @param request FastifyRequest object
   */
  public createSession(user: UserInterface, request: FastifyRequest) {
    return this.sessionService.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );
  }

  public async create(
    user: UserCreateInterface,
    termsAccepted: boolean,
  ): Promise<UserInterface> {
    const { cpf } = user;

    /**
     * Terms acception
     */
    if (!termsAccepted) {
      throw new TermsNotAcceptedException();
    }

    /**
     * Validate CPF
     * * Only on the first ride the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new InvalidCPFException();
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.userRepository.get({ cpf });

    if (registredCPF) {
      throw new CPFRegistredException();
    }

    return this.userRepository.create(user);
  }
}
