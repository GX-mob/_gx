import { Injectable } from "@nestjs/common";
import { DatabaseService, Price, PriceDetail, Ride } from "@app/database";
import { util } from "@app/helpers";

@Injectable()
export class RidesService {
  private areas: { [area: string]: Price } = {};

  constructor(readonly database: DatabaseService) {
    this.init();
  }

  private async init() {
    const priceModel = this.database.priceModel;

    /**
     * Get and store all rides types and prices
     */
    const prices = await priceModel.find().lean();

    if (!prices.length) {
      throw new Error("Empty rides types list");
    }
    prices.forEach((price) => {
      this.areas[price.area] = price;
    });

    /**
     * Watch prices update
     */
    priceModel.watch().on("change", (data) => {
      switch (data.operationType) {
        case "update":
        case "insert":
          const { fullDocument } = data;
          this.areas[fullDocument.area] = fullDocument;
          break;
        case "delete":
          delete this.areas[fullDocument.area];
          break;
      }
    });
  }

  /**
   * Returns the rides types and respective prices of the requested area
   * or the price for the respective area for the ride type, if provided a type
   * fallback to $area if not have results for $area.$subArea
   * @param area
   * @param subArea
   * @returns {PriceDetail[] | PriceDetail | undefined} Price list, price for provided ride type or undefined
   */
  getPrice(
    area: string,
    subArea?: string,
    rideType?: Ride["type"],
  ): PriceDetail[] | PriceDetail | undefined {
    if (!util.hasProp(this.areas, area) || !this.areas[area]) {
      return;
    }

    const areaPrices = this.areas[area];

    const response =
      subArea && areaPrices.subAreas[subArea]
        ? areaPrices.subAreas[subArea]
        : areaPrices.general;

    if (!response) return;

    if (typeof rideType !== "undefined") {
      return response.find((price) => price.type === rideType);
    }

    return response;
  }
}
