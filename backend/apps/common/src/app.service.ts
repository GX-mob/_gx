import { Injectable } from "@nestjs/common";

import { DataService } from "@app/data";

@Injectable()
export class AppService {
  constructor(private readonly dataService: DataService) {}

  async getHello(): Promise<string> {
    const foo = await this.dataService.users.get({
      _id: "3248092348230j42142",
    });

    return `Hello World Mono!${foo}@`;
  }
}
