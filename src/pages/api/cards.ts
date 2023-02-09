// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import type { Card } from "@/classes/Card";

type Data = {};

const isMocked = false;

const warnConnection = (endPoint: string) =>
  console.warn(`/api/${endPoint} => Connected successfully to server`);

export const getCardByName = async (
  name: string,
  like: "true" | "false",
  res: NextApiResponse<Data>,
  collection: any
) => {
  warnConnection("cards/handleGetByName");
  if (!name) return res.status(400).json({ message: "BAD REQUEST" });

  const isLike = like === "true";

  let cards: Card[] = [];

  if (isLike) {
    await collection
      .find({ name: { $regex: new RegExp(name, "i") } })
      .limit(50)
      .forEach((card: Card) => cards.push(card));

    cards = cards.reduce((acc: Card[], cur: Card, index: number) => {
      const alreadyAdded = acc.map(({ name }) => name).includes(cur.name);
      if (!alreadyAdded) {
        acc.push(cur);
      }
      return acc;
    }, [] as Card[]);

    cards = cards.slice(0, 10);
  } else {
    await collection.find({ name }).forEach((card: Card) => cards.push(card));
  }

  return cards;
};

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
    warnConnection("cards");
    db = client.db(dbName);
    collection = db.collection("cards");
  }

  const { method, query } = req;

  const handleGet = async () => {
    warnConnection("cards/handleGet");
    const cards: Card[] = [];

    await collection
      .find({})
      .limit(100)
      .forEach((card: Card) => cards.push(card));

    return res.status(200).json(cards);
  };
  const handleGetByName = async (name: string, like: "true" | "false") => {
    const cards = await getCardByName(name, like, res, collection);

    return res.status(200).json({ cards });
  };

  const handleGetOne = async (id: string) => {
    warnConnection("cards/handleGetOne");
    if (!id) return res.status(400).json({ message: "BAD REQUEST" });
    const card: Card = await collection.findOne({ id });
    if (!card) return res.status(404).json({ message: "NOT FOUND" });

    return res.status(200).json(card);
  };

  switch (method) {
    case "GET":
      return query.name
        ? handleGetByName(query.name as string, query.like as "true" | "false")
        : query.id
        ? handleGetOne(query.id as string)
        : handleGet();
  }
}
