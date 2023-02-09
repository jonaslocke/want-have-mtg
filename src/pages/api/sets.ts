// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import type { Card, CardSet } from "@/classes/Card";
import { getCardByName } from "./cards";

type Data = {};

const isMocked = false;

const warnConnection = (endPoint: string) =>
  console.warn(`/api/${endPoint} => Connected successfully to server`);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let collection: any;
  let db: any;

  if (!isMocked) {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI);
    const dbName = "Cluster0";

    await client.connect();
    warnConnection("sets");
    db = client.db(dbName);
    collection = db.collection("sets");
  }

  const { method, query, body } = req;

  const handleGet = async () => {
    warnConnection("sets/handleGet");
    const sets: CardSet[] = [];

    await collection.find({}).forEach((set: CardSet) => sets.push(set));

    return res.status(200).json(sets);
  };

  const handleGetCardSets = async (cardName: string) => {
    const cards = await getCardByName(
      cardName,
      "false",
      res,
      db.collection("cards")
    );

    if (cards && !!cards.length) {
      const setIds = cards.map(({ set_id }) => set_id);

      const sets: CardSet[] = [];

      await collection
        .find({ id: { $in: setIds } })
        .forEach((set: CardSet) => sets.push(set));

      return res.status(200).json(sets);
    }

    return res.status(500).json({ message: "Internal Server Error - 1001" });
  };

  switch (method) {
    case "GET":
      return query.cardName
        ? handleGetCardSets(query.cardName as string)
        : handleGet();
  }
}
