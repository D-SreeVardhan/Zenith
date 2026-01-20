import { init } from "@instantdb/react";
import schema from "../../instant.schema";
import { INSTANT_APP_ID } from "@/lib/config";

export const instantDb = init({
  appId: INSTANT_APP_ID,
  schema,
  useDateObjects: false,
});

