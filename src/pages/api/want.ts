// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import type { Card } from "@/classes/Card";

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
    warnConnection("want");
    db = client.db(dbName);
    collection = db.collection("want");
  }

  const { method, query, body } = req;

  const handleGet = async () => {
    warnConnection("want/handleGet");
    const cards: Card[] = [];

    await collection
      .find({})
      .limit(100)
      .forEach((card: Card) => cards.push(card));

    return res.status(200).json(cards);
  };

  const handleAdd = async (id: string) => {
    warnConnection("want/add");
    if (!id) return res.status(404).json({ message: "BAD REQUEST" });

    const response = await collection.insertOne(id);
    console.log({ response });

    return res.status(200).json({ message: "ok" });
  };

  switch (method) {
    case "GET":
      return handleGet();
    case "POST":
      return handleAdd(body.id as string);
  }
}
