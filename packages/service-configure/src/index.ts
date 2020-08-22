import { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import connection from "./connection";
import { PriceDetail, Price, PriceModel } from "./models/price";

declare module "fastify" {
  interface FastifyInstance {
    /**
     * Returns the rides types and respective prices of the requested area
     * @param area1
     * @param area2
     */
    getPrice(area: string, subArea?: string): PriceDetail[];
  }
}

const configure: FastifyPluginAsync = async (instance, _options) => {
  await connection;

  /**
   * Catch and store all prices in a local object
   */
  const prices = await PriceModel.find().lean();

  if (!prices.length) {
    throw new Error("Empty prices list");
  }

  const pricesAreas: { [area: string]: Price } = {};

  prices.forEach((price) => {
    pricesAreas[price.area] = price;
  });

  /**
   * Watch prices update
   */
  PriceModel.watch().on("change", (data) => {
    switch (data.operationType) {
      case "update":
      case "insert":
        const { fullDocument } = data;
        pricesAreas[fullDocument.area] = fullDocument;
        break;
      case "delete":
        // It's okay to use delete here, this snippet will rarely be executed
        delete pricesAreas[fullDocument.area];
        break;
    }
  });

  /**
   * Decorates the method that returns the rides types prices list
   */
  instance.decorate("ridesPrices", (area: string, subArea?: string):
    | PriceDetail[]
    | undefined => {
    if (!(area in pricesAreas) || !pricesAreas[area]) {
      return;
    }

    if (subArea) {
      return pricesAreas[area].subAreas[subArea] || pricesAreas[area].general;
    }

    return pricesAreas[area].general;
  });
};

export default fastifyPlugin(configure);
